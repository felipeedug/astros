-- =====================================================================
-- 008 — Pedidos (pagamento pela InfinitePay) e presentes
-- Rode no SQL Editor do Supabase depois do 007. Pode rodar de novo.
--
-- Fluxo: o site pede um pagamento (função criar-pagamento) → a InfinitePay
-- avisa quando foi pago (função aviso-infinitepay) → o banco libera sozinho:
--   * item para a própria pessoa → compra liberada na Minha jornada
--   * item de presente           → um código de presente para enviar
-- =====================================================================

-- Preços e regras de venda de cada produto
alter table public.produtos
  add column if not exists preco_presente_membro_centavos integer,   -- quanto o membro paga para presentear
  add column if not exists permite_presente boolean not null default false,
  add column if not exists extra_slug text,        -- produto oferecido como "leve também" no pagamento
  add column if not exists arquivo_caminho text,   -- para produtos em PDF (Storage privado)
  add column if not exists fora_dos_planos boolean not null default false;  -- true = só comprando (ex.: livro)

-- Regra de acesso: produtos "fora dos planos" não vêm com Fundador/Comunidade
create or replace function public.tem_acesso(p_cliente uuid, p_produto uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.produtos p where p.id = p_produto and p.nivel in ('aberto', 'cadastro'))
    or exists (select 1 from public.compras c
               where c.cliente_id = p_cliente and c.produto_id = p_produto and c.status = 'pago')
    or exists (
      select 1
      from public.assinaturas a
      join public.planos pl on pl.id = a.plano_id
      join public.produtos pr on pr.id = p_produto
      where a.cliente_id = p_cliente and a.status = 'ativa'
        and a.inicio <= now() and (a.fim is null or a.fim > now())
        and not pr.fora_dos_planos
        and (pl.inclui_todos_produtos
             or exists (select 1 from public.planos_produtos pp where pp.plano_id = pl.id and pp.produto_id = p_produto))
    );
$$;
revoke execute on function public.tem_acesso(uuid, uuid) from public, anon, authenticated;

-- Mapa da Vida: R$ 35,90 para quem é de fora; R$ 26,90 para o membro dar de presente
-- (preços em centavos; mude quando quiser no Table Editor → produtos)
update public.produtos
   set preco_centavos = 3590, preco_presente_membro_centavos = 2690, permite_presente = true
 where slug = 'mapa-da-vida';

-- Livro digital da Mara (PDF). Fica escondido (ativo = false) até ter preço e arquivo:
--   update public.produtos set preco_centavos = 0000, ativo = true where slug = 'livro-mara-digital';
insert into public.produtos (slug, nome, descricao, nivel, ordem, icone, ativo, arquivo_caminho, fora_dos_planos)
values ('livro-mara-digital', 'Astrologia e o Poder de Comer sem Culpa',
        'O livro de Mara Muniz em versão digital (PDF), para ler no celular, no computador ou no Kindle.',
        'pago', 30, 'livro', false, 'livros/astrologia-e-o-poder-de-comer-sem-culpa.pdf', true)
on conflict (slug) do nothing;
update public.produtos set fora_dos_planos = true where slug = 'livro-mara-digital';

-- No pagamento do Mapa da Vida, oferecer também o livro ("leve também")
update public.produtos set extra_slug = 'livro-mara-digital' where slug = 'mapa-da-vida';

create table if not exists public.pedidos (
  id               uuid primary key default gen_random_uuid(),   -- vai como order_nsu
  cliente_id       uuid not null references public.clientes (id) on delete cascade,
  status           text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  itens            jsonb not null,           -- [{produto_id, slug, nome, presente, preco_centavos}]
  total_centavos   integer not null,
  link_pagamento   text,
  transaction_nsu  text,
  invoice_slug     text,
  forma_pagamento  text,
  valor_pago_centavos integer,
  recibo_url       text,
  criado_em        timestamptz not null default now(),
  pago_em          timestamptz
);
create index if not exists pedidos_cliente on public.pedidos (cliente_id);

create table if not exists public.presentes (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,
  pedido_id       uuid references public.pedidos (id) on delete set null,
  produto_id      uuid not null references public.produtos (id),
  comprador_id    uuid not null references public.clientes (id) on delete cascade,
  destinatario_id uuid references public.clientes (id) on delete set null,
  resgatado_em    timestamptz,
  criado_em       timestamptz not null default now()
);

alter table public.pedidos   enable row level security;
alter table public.presentes enable row level security;

-- Cada pessoa vê os próprios pedidos e presentes; quem cria/libera é o servidor.
drop policy if exists pedidos_ler on public.pedidos;
create policy pedidos_ler on public.pedidos for select to authenticated
  using (cliente_id = public.meu_cliente_id() or public.sou_admin());
drop policy if exists presentes_ler on public.presentes;
create policy presentes_ler on public.presentes for select to authenticated
  using (comprador_id = public.meu_cliente_id() or destinatario_id = public.meu_cliente_id() or public.sou_admin());
grant select on public.pedidos, public.presentes to authenticated;

-- ---------------------------------------------------------------------
-- Libera um pedido pago (chamada só pelo servidor, com a chave de serviço)
-- ---------------------------------------------------------------------
create or replace function public.liberar_pedido(p_pedido uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_pedido public.pedidos;
  v_item   jsonb;
  v_codigo text;
begin
  select * into v_pedido from public.pedidos where id = p_pedido for update;
  if not found or v_pedido.status = 'pago' then
    return;  -- não existe ou já foi liberado (aviso repetido)
  end if;

  update public.pedidos set status = 'pago', pago_em = now() where id = p_pedido;

  for v_item in select * from jsonb_array_elements(v_pedido.itens) loop
    if coalesce((v_item ->> 'presente')::boolean, false) then
      v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      insert into public.presentes (codigo, pedido_id, produto_id, comprador_id)
      values (v_codigo, p_pedido, (v_item ->> 'produto_id')::uuid, v_pedido.cliente_id);
    else
      insert into public.compras (cliente_id, produto_id, valor_centavos, origem, referencia_externa)
      values (v_pedido.cliente_id, (v_item ->> 'produto_id')::uuid,
              (v_item ->> 'preco_centavos')::integer, 'pagamento', p_pedido::text);
    end if;
  end loop;
end $$;
revoke execute on function public.liberar_pedido(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Presentes: ver (antes de entrar) e resgatar (depois de entrar)
-- ---------------------------------------------------------------------
create or replace function public.ver_presente(p_codigo text)
returns table (produto_nome text, produto_descricao text, de_quem text, resgatado boolean)
language sql stable security definer set search_path = public as $$
  select pr.nome, pr.descricao,
         split_part(coalesce(c.nome, (select m.nome from public.mapas_nascimento m where m.cliente_id = c.id and m.proprio), 'Alguém especial'), ' ', 1),
         p.resgatado_em is not null
  from public.presentes p
  join public.produtos pr on pr.id = p.produto_id
  join public.clientes c on c.id = p.comprador_id
  where p.codigo = upper(trim(p_codigo));
$$;
grant execute on function public.ver_presente(text) to anon, authenticated;

create or replace function public.resgatar_presente(p_codigo text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := public.meu_cliente_id();
  v_presente public.presentes;
begin
  if v_eu is null then
    return 'entre_primeiro';
  end if;
  select * into v_presente from public.presentes where codigo = upper(trim(p_codigo)) for update;
  if not found then
    return 'codigo_invalido';
  end if;
  if v_presente.resgatado_em is not null then
    return case when v_presente.destinatario_id = v_eu then 'ja_e_seu' else 'ja_resgatado' end;
  end if;
  if v_presente.comprador_id = v_eu then
    return 'proprio_comprador';
  end if;
  update public.presentes set destinatario_id = v_eu, resgatado_em = now() where id = v_presente.id;
  insert into public.compras (cliente_id, produto_id, valor_centavos, origem, referencia_externa)
  values (v_eu, v_presente.produto_id, 0, 'presente', v_presente.codigo);
  return 'ok';
end $$;
revoke execute on function public.resgatar_presente(text) from public, anon;
grant  execute on function public.resgatar_presente(text) to authenticated;

-- ---------------------------------------------------------------------
-- Arquivos para baixar (livro em PDF): pasta privada "arquivos" no Storage.
-- Só quem tem acesso ao produto consegue gerar o link de download.
-- Envie o PDF em Storage → arquivos → livros/ com o nome do arquivo_caminho.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('arquivos', 'arquivos', false)
on conflict (id) do nothing;

drop policy if exists arquivos_de_quem_comprou on storage.objects;
create policy arquivos_de_quem_comprou on storage.objects for select to authenticated
  using (
    bucket_id = 'arquivos'
    and exists (select 1 from public.produtos p
                where p.arquivo_caminho = storage.objects.name
                  and (public.posso_acessar_produto(p.id) or public.sou_admin()))
  );

-- Meus presentes (para o comprador ver e enviar os links)
create or replace function public.meus_presentes()
returns table (codigo text, produto_nome text, criado_em timestamptz, resgatado boolean, para_quem text)
language sql stable security definer set search_path = public as $$
  select p.codigo, pr.nome, p.criado_em, p.resgatado_em is not null,
         split_part(coalesce(d.nome, d.email, ''), ' ', 1)
  from public.presentes p
  join public.produtos pr on pr.id = p.produto_id
  left join public.clientes d on d.id = p.destinatario_id
  where p.comprador_id = public.meu_cliente_id()
  order by p.criado_em desc;
$$;
revoke execute on function public.meus_presentes() from public, anon;
grant  execute on function public.meus_presentes() to authenticated;
