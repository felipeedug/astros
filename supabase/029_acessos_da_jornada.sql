-- =====================================================================
-- 029 — O que cada pessoa já abriu (para montar a "Minha jornada")
-- Quando a pessoa clica em "Acessar" ou "Experimentar" num conteúdo aberto
-- (Janelas de Pausa, Quem Você É...), fica registrado. Esse conteúdo passa a
-- aparecer na Minha jornada dela, junto com o que ela comprou e onde se inscreveu.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

create table if not exists public.acessos_conteudo (
  cliente_id     uuid not null references public.clientes (id) on delete cascade,
  produto_id     uuid not null references public.produtos (id) on delete cascade,
  primeiro_em    timestamptz not null default now(),
  ultimo_em      timestamptz not null default now(),
  vezes          integer not null default 1,
  primary key (cliente_id, produto_id)
);

alter table public.acessos_conteudo enable row level security;

drop policy if exists acessos_conteudo_ler on public.acessos_conteudo;
create policy acessos_conteudo_ler on public.acessos_conteudo for select to authenticated
  using (cliente_id = public.meu_cliente_id() or public.sou_admin());

grant select on public.acessos_conteudo to authenticated;

-- Registra um acesso (só o próprio cliente; a gravação passa por aqui)
create or replace function public.registrar_acesso(p_slug text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := public.meu_cliente_id();
  v_produto uuid;
begin
  if v_eu is null then return; end if;
  select id into v_produto from public.produtos where slug = p_slug;
  if v_produto is null then return; end if;
  insert into public.acessos_conteudo (cliente_id, produto_id)
  values (v_eu, v_produto)
  on conflict (cliente_id, produto_id)
  do update set ultimo_em = now(), vezes = public.acessos_conteudo.vezes + 1;
end $$;
revoke execute on function public.registrar_acesso(text) from public, anon;
grant  execute on function public.registrar_acesso(text) to authenticated;

notify pgrst, 'reload schema';

-- Conferência: deve mostrar a tabela vazia (0) na primeira vez
select count(*) as acessos_registrados from public.acessos_conteudo;
