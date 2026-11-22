-- =====================================================================
-- 004 — Lançamentos ("Em breve") e inscrições ("Quero participar")
-- Rode no SQL Editor do Supabase depois do 003. Pode rodar de novo.
--
-- Para anunciar um lançamento: Table Editor → produtos → Insert row com
--   status = em_breve, previsao = data prevista, tipo = produto / live / aula,
--   inscricoes_abertas = true. Quando lançar, mude status para disponivel.
-- =====================================================================

alter table public.produtos
  add column if not exists status             text not null default 'disponivel',
  add column if not exists tipo               text not null default 'produto',
  add column if not exists previsao           date,
  add column if not exists inscricoes_abertas boolean not null default false;

do $$ begin
  alter table public.produtos add constraint produtos_status_valido check (status in ('disponivel', 'em_breve'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.produtos add constraint produtos_tipo_valido check (tipo in ('produto', 'live', 'aula', 'ferramenta'));
exception when duplicate_object then null; end $$;

create table if not exists public.inscricoes (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clientes (id) on delete cascade,
  produto_id  uuid not null references public.produtos (id) on delete cascade,
  criado_em   timestamptz not null default now(),
  unique (cliente_id, produto_id)
);

alter table public.inscricoes enable row level security;

-- Cada pessoa vê, cria e cancela só as próprias inscrições (e só se estiverem abertas).
drop policy if exists inscricoes_ler on public.inscricoes;
create policy inscricoes_ler on public.inscricoes for select to authenticated
  using (cliente_id = public.meu_cliente_id() or public.sou_admin());
drop policy if exists inscricoes_criar on public.inscricoes;
create policy inscricoes_criar on public.inscricoes for insert to authenticated
  with check (
    public.sou_admin()
    or (cliente_id = public.meu_cliente_id()
        and exists (select 1 from public.produtos p where p.id = produto_id and p.ativo and p.inscricoes_abertas))
  );
drop policy if exists inscricoes_cancelar on public.inscricoes;
create policy inscricoes_cancelar on public.inscricoes for delete to authenticated
  using (cliente_id = public.meu_cliente_id() or public.sou_admin());

grant select, insert, delete on public.inscricoes to authenticated;

-- "Meus produtos" agora traz status, data prevista e se a pessoa já se inscreveu.
drop function if exists public.meus_produtos();
create function public.meus_produtos()
returns table (
  id uuid, slug text, nome text, descricao text, preco_centavos integer,
  link_pagamento text, link_acesso text, ordem integer, nivel text,
  icone text, versao text, versao_data date, novidades text, nova_versao boolean,
  status text, tipo text, previsao date, inscricoes_abertas boolean, inscrito boolean,
  liberado boolean
)
language sql stable security definer set search_path = public as $$
  select p.id, p.slug, p.nome, p.descricao, p.preco_centavos,
         p.link_pagamento, p.link_acesso, p.ordem, p.nivel,
         p.icone, p.versao, p.versao_data, p.novidades,
         coalesce(p.destaque_ate >= current_date, false),
         p.status, p.tipo, p.previsao, p.inscricoes_abertas,
         exists (select 1 from public.inscricoes i where i.cliente_id = c.id and i.produto_id = p.id),
         public.tem_acesso(c.id, p.id)
  from public.produtos p
  join public.clientes c on c.user_id = auth.uid()
  where p.ativo
  order by p.ordem, p.nome;
$$;
revoke execute on function public.meus_produtos() from public, anon;
grant  execute on function public.meus_produtos() to authenticated;
