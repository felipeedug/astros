-- =====================================================================
-- 011 — Preço da Árvore de Natal com Raízes e lançamentos pagos
-- • R$ 26,90 para quem compra (e para quem não é membro dar de presente)
-- • R$ 17,90 para membros darem de presente
-- • Fundadores continuam com acesso incluído e só se inscrevem.
-- • Em lançamento pago, só se inscreve quem tem acesso; quem compra
--   (ou recebe de presente) já fica inscrito sozinho.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

update public.produtos set
  preco_centavos                 = 2690,
  preco_presente_membro_centavos = 1790,
  permite_presente               = true,
  inscricoes_abertas             = true
where slug = 'natal-2026';

-- Inscrição em lançamento pago: só para quem tem acesso
drop policy if exists inscricoes_criar on public.inscricoes;
create policy inscricoes_criar on public.inscricoes for insert to authenticated
  with check (
    public.sou_admin()
    or (cliente_id = public.meu_cliente_id()
        and exists (select 1 from public.produtos p
                    where p.id = produto_id and p.ativo and p.inscricoes_abertas
                      and (coalesce(p.preco_centavos, 0) = 0 or public.tem_acesso(cliente_id, p.id))))
  );

-- Comprou (ou recebeu de presente) um lançamento: já fica inscrito(a)
create or replace function public.inscrever_ao_comprar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'pago' and exists (select 1 from public.produtos p where p.id = new.produto_id and p.status = 'em_breve') then
    insert into public.inscricoes (cliente_id, produto_id) values (new.cliente_id, new.produto_id)
    on conflict (cliente_id, produto_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists inscrever_ao_comprar on public.compras;
create trigger inscrever_ao_comprar after insert on public.compras
  for each row execute function public.inscrever_ao_comprar();

-- A página do presente precisa saber qual produto é (Mapa da Vida ou live)
drop function if exists public.ver_presente(text);
create function public.ver_presente(p_codigo text)
returns table (produto_nome text, produto_descricao text, de_quem text, resgatado boolean, produto_slug text)
language sql stable security definer set search_path = public as $$
  select pr.nome, pr.descricao,
         split_part(coalesce(c.nome, (select m.nome from public.mapas_nascimento m where m.cliente_id = c.id and m.proprio), 'Alguém especial'), ' ', 1),
         p.resgatado_em is not null,
         pr.slug
  from public.presentes p
  join public.produtos pr on pr.id = p.produto_id
  join public.clientes c on c.id = p.comprador_id
  where p.codigo = upper(trim(p_codigo));
$$;
revoke execute on function public.ver_presente(text) from public;
grant execute on function public.ver_presente(text) to anon, authenticated, service_role;
