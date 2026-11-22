-- =====================================================================
-- 007 — Eventos em destaque no "Em breve" do topo da Minha área
-- Rode no SQL Editor do Supabase depois do 006. Pode rodar de novo.
-- =====================================================================

alter table public.eventos add column if not exists destaque boolean not null default false;

drop function if exists public.minha_agenda(integer);
create function public.minha_agenda(p_dias integer default 14)
returns table (
  id uuid, titulo text, descricao text, tipo text, apresentadora text,
  inicio timestamptz, duracao_min integer, publico text, inscricoes_abertas boolean,
  inscrito boolean, pode_participar boolean, link_acesso text, link_gravacao text,
  produto_id uuid, produto_nome text, produto_link_pagamento text, destaque boolean
)
language sql stable security definer set search_path = public as $$
  with eu as (select public.meu_cliente_id() as cid, public.sou_membro() or public.sou_admin() as membro),
  base as (
    select e.*, p.nome as p_nome, p.link_pagamento as p_link,
           exists (select 1 from public.inscricoes_eventos i where i.evento_id = e.id and i.cliente_id = eu.cid) as ja_inscrito,
           ((e.publico = 'cadastro' or eu.membro)
            and (e.produto_id is null or public.tem_acesso(eu.cid, e.produto_id) or public.sou_admin())) as pode
    from public.eventos e
    cross join eu
    left join public.produtos p on p.id = e.produto_id
    where e.ativo and eu.cid is not null
      and (e.inicio between now() - interval '3 hours' and now() + make_interval(days => p_dias)
           or (e.destaque and e.inicio > now())
           or (e.link_gravacao is not null and e.inicio > now() - interval '90 days'))
  )
  select b.id, b.titulo, b.descricao, b.tipo, b.apresentadora, b.inicio, b.duracao_min, b.publico,
         b.inscricoes_abertas, b.ja_inscrito, b.pode,
         case when b.ja_inscrito and b.pode
                   and now() between b.inicio - interval '30 minutes' and b.inicio + make_interval(mins => b.duracao_min)
              then b.link_acesso end,
         case when b.pode then b.link_gravacao end,
         b.produto_id, b.p_nome, b.p_link, b.destaque
  from base b
  order by b.inicio;
$$;
revoke execute on function public.minha_agenda(integer) from public, anon;
grant  execute on function public.minha_agenda(integer) to authenticated;
