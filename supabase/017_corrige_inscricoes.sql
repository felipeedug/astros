-- =====================================================================
-- 017 — Corrige as inscrições ("★ Quero participar")
-- Rode no SQL Editor do Supabase. Pode rodar de novo.
--
-- Dois problemas impediam quem não é admin de se inscrever:
-- • Lançamentos (011): a regra chamava tem_acesso() direto, e essa função
--   é bloqueada para os usuários → "permission denied for function tem_acesso".
-- • Eventos da Agenda (006): a regra consultava a tabela eventos, que só o
--   admin enxerga → a inscrição era sempre recusada.
-- Agora as duas regras usam funções próprias (security definer), que fazem a
-- checagem por dentro, sem depender das permissões de quem está logado.
-- =====================================================================

-- Pode se inscrever neste lançamento?
create or replace function public.posso_inscrever_lancamento(p_produto uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.produtos p
    where p.id = p_produto and p.ativo and p.inscricoes_abertas
      and (coalesce(p.preco_centavos, 0) = 0
           or public.tem_acesso(public.meu_cliente_id(), p.id))
  );
$$;
revoke execute on function public.posso_inscrever_lancamento(uuid) from public, anon;
grant  execute on function public.posso_inscrever_lancamento(uuid) to authenticated;

-- Pode se inscrever neste evento da Agenda?
create or replace function public.posso_inscrever_evento(p_evento uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.eventos e
    where e.id = p_evento and e.ativo and e.inscricoes_abertas
      and (e.publico = 'cadastro' or public.sou_membro() or public.sou_admin())
      and (e.produto_id is null
           or public.tem_acesso(public.meu_cliente_id(), e.produto_id)
           or public.sou_admin())
  );
$$;
revoke execute on function public.posso_inscrever_evento(uuid) from public, anon;
grant  execute on function public.posso_inscrever_evento(uuid) to authenticated;

drop policy if exists inscricoes_criar on public.inscricoes;
create policy inscricoes_criar on public.inscricoes for insert to authenticated
  with check (
    public.sou_admin()
    or (cliente_id = public.meu_cliente_id() and public.posso_inscrever_lancamento(produto_id))
  );

drop policy if exists insc_eventos_criar on public.inscricoes_eventos;
create policy insc_eventos_criar on public.inscricoes_eventos for insert to authenticated
  with check (
    public.sou_admin()
    or (cliente_id = public.meu_cliente_id() and public.posso_inscrever_evento(evento_id))
  );

notify pgrst, 'reload schema';
