-- =====================================================================
-- 002 — Níveis de acesso e consentimento para novidades
-- Rode no SQL Editor do Supabase DEPOIS do schema.sql e do permissoes.sql.
-- Pode ser executado de novo sem problemas.
--
-- Níveis de cada produto/ferramenta:
--   aberto   → qualquer pessoa
--   cadastro → quem criou conta (ferramentas gratuitas)
--   pago     → quem comprou o produto ou tem um plano (Fundador/Comunidade)
-- Para deixar algo gratuito no futuro, basta trocar o nível no Table Editor.
-- =====================================================================

-- ---------------------------------------------------------------- produtos
alter table public.produtos add column if not exists nivel text not null default 'pago';
do $$ begin
  alter table public.produtos
    add constraint produtos_nivel_valido check (nivel in ('aberto', 'cadastro', 'pago'));
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- clientes
-- LGPD: só mande campanhas para quem aceitou receber novidades.
alter table public.clientes
  add column if not exists aceita_novidades    boolean not null default false,
  add column if not exists aceita_novidades_em timestamptz,   -- quando a pessoa aceitou/recusou
  add column if not exists origem              text;          -- por onde a pessoa chegou

create or replace function public.registrar_consentimento()
returns trigger language plpgsql as $$
begin
  if new.aceita_novidades is distinct from old.aceita_novidades then
    new.aceita_novidades_em = now();
  end if;
  return new;
end $$;

drop trigger if exists consentimento_cliente on public.clientes;
create trigger consentimento_cliente
  before update on public.clientes
  for each row execute function public.registrar_consentimento();

-- Ao criar login: liga ao cadastro existente e guarda o consentimento
-- e a origem informados na tela de entrar.
create or replace function public.ligar_cliente_ao_login()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_aceita boolean := coalesce(new.raw_user_meta_data ->> 'aceita_novidades', '') = 'true';
  v_origem text    := nullif(left(coalesce(new.raw_user_meta_data ->> 'origem', ''), 60), '');
begin
  if new.email is null then
    return new;
  end if;
  insert into public.clientes (email, user_id, aceita_novidades, aceita_novidades_em, origem)
  values (lower(trim(new.email)), new.id, v_aceita, case when v_aceita then now() end, v_origem)
  on conflict (email) do update
    set user_id             = excluded.user_id,
        aceita_novidades    = public.clientes.aceita_novidades or excluded.aceita_novidades,
        aceita_novidades_em = coalesce(public.clientes.aceita_novidades_em, excluded.aceita_novidades_em),
        origem              = coalesce(public.clientes.origem, excluded.origem)
    where public.clientes.user_id is null;
  return new;
end $$;

-- ---------------------------------------------------------- regra de acesso
-- Produtos "aberto" e "cadastro" ficam liberados para qualquer cliente.
create or replace function public.tem_acesso(p_cliente uuid, p_produto uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (
      select 1 from public.produtos p
      where p.id = p_produto and p.nivel in ('aberto', 'cadastro')
    )
    or exists (
      select 1 from public.compras c
      where c.cliente_id = p_cliente and c.produto_id = p_produto and c.status = 'pago'
    )
    or exists (
      select 1
      from public.assinaturas a
      join public.planos pl on pl.id = a.plano_id
      where a.cliente_id = p_cliente
        and a.status = 'ativa'
        and a.inicio <= now()
        and (a.fim is null or a.fim > now())
        and (
          pl.inclui_todos_produtos
          or exists (select 1 from public.planos_produtos pp
                     where pp.plano_id = pl.id and pp.produto_id = p_produto)
        )
    );
$$;
revoke execute on function public.tem_acesso(uuid, uuid) from public, anon, authenticated;

-- "Meus produtos" agora informa o nível de cada item.
drop function if exists public.meus_produtos();
create function public.meus_produtos()
returns table (
  id uuid, slug text, nome text, descricao text, preco_centavos integer,
  link_pagamento text, link_acesso text, ordem integer, nivel text, liberado boolean
)
language sql stable security definer set search_path = public as $$
  select p.id, p.slug, p.nome, p.descricao, p.preco_centavos,
         p.link_pagamento, p.link_acesso, p.ordem, p.nivel,
         public.tem_acesso(c.id, p.id)
  from public.produtos p
  join public.clientes c on c.user_id = auth.uid()
  where p.ativo
  order by p.ordem, p.nome;
$$;
revoke execute on function public.meus_produtos() from public, anon;
grant  execute on function public.meus_produtos() to authenticated;

-- ------------------------------------------------- ferramentas gratuitas
-- Nomes provisórios: troque à vontade no Table Editor (coluna "nome").
-- "ativo = false" = ainda não aparece para os clientes.
insert into public.produtos (slug, nome, descricao, link_acesso, ordem, nivel, ativo) values
  ('mandala', 'Mandala com resumo',
   'Sua mandala com o resumo do seu Mapa da Vida.',
   'index.html?ferramenta=mandala#mapa', 20, 'cadastro', false),
  ('efemerides', 'Efemérides',
   'A posição dos astros dia a dia, mês a mês.',
   'index.html?ferramenta=1#efemerides', 30, 'cadastro', true),
  ('lua-fora-de-curso', 'Lua fora de curso',
   'Os períodos de Lua fora de curso do mês.',
   'index.html?ferramenta=1#lua', 40, 'cadastro', true),
  ('ascendente', 'Ascendente',
   'Descubra o seu ascendente.',
   null, 50, 'cadastro', false)
on conflict (slug) do nothing;
