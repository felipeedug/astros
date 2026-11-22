-- =====================================================================
-- 005 — Agenda: lives, colunas com astrólogas, aulas e encontros
-- Rode no SQL Editor do Supabase depois do 004. Pode rodar de novo.
--
-- Eventos são criados pelo Painel (admin.html). Cada pessoa vê a agenda
-- das próximas semanas, se inscreve e, na hora, recebe o link da live.
-- O link da live só é entregue a quem se inscreveu (30 min antes até o fim).
-- =====================================================================

create table if not exists public.eventos (
  id                  uuid primary key default gen_random_uuid(),
  titulo              text not null,
  descricao           text,
  tipo                text not null default 'live' check (tipo in ('live', 'coluna', 'aula', 'encontro')),
  apresentadora       text,
  inicio              timestamptz not null,
  duracao_min         integer not null default 60,
  publico             text not null default 'cadastro' check (publico in ('cadastro', 'membros')),
  link_acesso         text,      -- link da live (só para inscritos, na hora)
  link_gravacao       text,      -- gravação (para quem pode participar)
  inscricoes_abertas  boolean not null default true,
  ativo               boolean not null default true,
  criado_em           timestamptz not null default now()
);

create table if not exists public.inscricoes_eventos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clientes (id) on delete cascade,
  evento_id   uuid not null references public.eventos (id) on delete cascade,
  criado_em   timestamptz not null default now(),
  unique (cliente_id, evento_id)
);

-- Membro = tem plano ativo (Fundador ou Comunidade)
create or replace function public.sou_membro()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.assinaturas a
    where a.cliente_id = public.meu_cliente_id() and a.status = 'ativa'
      and a.inicio <= now() and (a.fim is null or a.fim > now())
  );
$$;

alter table public.eventos            enable row level security;
alter table public.inscricoes_eventos enable row level security;

-- Eventos: só admin lê a tabela direto (a agenda das pessoas vem de minha_agenda()).
drop policy if exists eventos_admin on public.eventos;
create policy eventos_admin on public.eventos for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

drop policy if exists insc_eventos_ler on public.inscricoes_eventos;
create policy insc_eventos_ler on public.inscricoes_eventos for select to authenticated
  using (cliente_id = public.meu_cliente_id() or public.sou_admin());
drop policy if exists insc_eventos_criar on public.inscricoes_eventos;
create policy insc_eventos_criar on public.inscricoes_eventos for insert to authenticated
  with check (
    public.sou_admin()
    or (cliente_id = public.meu_cliente_id()
        and exists (select 1 from public.eventos e
                    where e.id = evento_id and e.ativo and e.inscricoes_abertas
                      and (e.publico = 'cadastro' or public.sou_membro())))
  );
drop policy if exists insc_eventos_cancelar on public.inscricoes_eventos;
create policy insc_eventos_cancelar on public.inscricoes_eventos for delete to authenticated
  using (cliente_id = public.meu_cliente_id() or public.sou_admin());

grant select, insert, update, delete on public.eventos to authenticated;
grant select, insert, delete on public.inscricoes_eventos to authenticated;
grant execute on function public.sou_membro() to authenticated;

-- Agenda da pessoa logada: próximos dias + eventos recentes com gravação.
create or replace function public.minha_agenda(p_dias integer default 14)
returns table (
  id uuid, titulo text, descricao text, tipo text, apresentadora text,
  inicio timestamptz, duracao_min integer, publico text, inscricoes_abertas boolean,
  inscrito boolean, pode_participar boolean, link_acesso text, link_gravacao text
)
language sql stable security definer set search_path = public as $$
  with eu as (select public.meu_cliente_id() as cid, public.sou_membro() or public.sou_admin() as membro)
  select e.id, e.titulo, e.descricao, e.tipo, e.apresentadora, e.inicio, e.duracao_min, e.publico,
         e.inscricoes_abertas,
         exists (select 1 from public.inscricoes_eventos i where i.evento_id = e.id and i.cliente_id = eu.cid),
         (e.publico = 'cadastro' or eu.membro),
         case when exists (select 1 from public.inscricoes_eventos i where i.evento_id = e.id and i.cliente_id = eu.cid)
                   and (e.publico = 'cadastro' or eu.membro)
                   and now() between e.inicio - interval '30 minutes' and e.inicio + make_interval(mins => e.duracao_min)
              then e.link_acesso end,
         case when (e.publico = 'cadastro' or eu.membro) then e.link_gravacao end
  from public.eventos e, eu
  where e.ativo and eu.cid is not null
    and (e.inicio between now() - interval '3 hours' and now() + make_interval(days => p_dias)
         or (e.link_gravacao is not null and e.inicio > now() - interval '90 days'))
  order by e.inicio;
$$;
revoke execute on function public.minha_agenda(integer) from public, anon;
grant  execute on function public.minha_agenda(integer) to authenticated;
