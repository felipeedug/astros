-- =====================================================================
-- 018 — "O que oferecemos": catálogo com calendário e votação aberta
-- • Nova categoria "vivencia" (Árvore de Natal com Raízes, Talismã...).
-- • votos_iniciais: ponto de partida vindo do formulário dos Fundadores.
-- • Tabela de votos: 1 voto por pessoa em cada lançamento "em breve".
--   A contagem é pública (aparece no site para todo mundo).
-- • Cadastra o calendário provisório (nomes, datas e textos são rascunho:
--   ajuste depois no Table Editor → produtos).
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

alter table public.produtos drop constraint if exists produtos_tipo_valido;
alter table public.produtos add constraint produtos_tipo_valido
  check (tipo in ('produto', 'vivencia', 'live', 'aula', 'ferramenta'));

alter table public.produtos add column if not exists votos_iniciais integer not null default 0;
-- Membros Fundadores testam antes: data antecipada só para eles (vazio = mesma data de todos)
alter table public.produtos add column if not exists previsao_fundadores date;

update public.produtos set tipo = 'vivencia' where slug = 'natal-2026';

-- ---------------------------------------------------------------------
-- Votos
-- ---------------------------------------------------------------------
create table if not exists public.votos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clientes (id) on delete cascade,
  produto_id  uuid not null references public.produtos (id) on delete cascade,
  criado_em   timestamptz not null default now(),
  unique (cliente_id, produto_id)
);
alter table public.votos enable row level security;

-- Pode votar neste lançamento? (em breve e ativo)
create or replace function public.posso_votar(p_produto uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.produtos p where p.id = p_produto and p.ativo and p.status = 'em_breve');
$$;
revoke execute on function public.posso_votar(uuid) from public, anon;
grant  execute on function public.posso_votar(uuid) to authenticated;

drop policy if exists votos_ler on public.votos;
create policy votos_ler on public.votos for select to authenticated
  using (cliente_id = public.meu_cliente_id() or public.sou_admin());
drop policy if exists votos_criar on public.votos;
create policy votos_criar on public.votos for insert to authenticated
  with check (cliente_id = public.meu_cliente_id() and public.posso_votar(produto_id));
drop policy if exists votos_cancelar on public.votos;
create policy votos_cancelar on public.votos for delete to authenticated
  using (cliente_id = public.meu_cliente_id() or public.sou_admin());
grant select, insert, delete on public.votos to authenticated;

-- Contagem pública: votos do formulário + votos no site
create or replace function public.contagem_votos()
returns table (produto_id uuid, votos integer)
language sql stable security definer set search_path = public as $$
  select p.id, p.votos_iniciais + (select count(*)::int from public.votos v where v.produto_id = p.id)
    from public.produtos p
   where p.ativo and p.status = 'em_breve';
$$;
revoke execute on function public.contagem_votos() from public;
grant  execute on function public.contagem_votos() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Calendário provisório (um lançamento por mês, na ordem dos votos)
-- Só cadastra se ainda não existir um com o mesmo slug ou nome parecido.
-- ---------------------------------------------------------------------
insert into public.produtos (slug, nome, descricao, tipo, status, previsao, votos_iniciais,
                             ativo, nivel, inscricoes_abertas, icone, ordem)
select v.slug, v.nome, v.descricao, v.tipo, 'em_breve', v.previsao::date, v.votos,
       true, 'pago', true, 'estrela', v.ordem
  from (values
    ('mapa-do-ano', 'Mapa do Ano 2027',
     'O que o seu ano pede: os temas, os ciclos e os melhores momentos para cada passo.',
     'produto', '2027-01-15', 21, 110),
    ('carreira-e-trabalho', 'Carreira e Trabalho',
     'Seus talentos no trabalho, o que te realiza e como usar melhor as suas habilidades.',
     'produto', '2027-02-15', 13, 120),
    ('compatibilidade', 'Compatibilidade nos Relacionamentos',
     'O que aproxima e o que desafia uma relação, com respeito e sem julgamento.',
     'produto', '2027-03-15', 7, 130),
    ('talisma', 'Talismã',
     'Uma vivência para criar o seu talismã pessoal, em sintonia com o seu mapa.',
     'vivencia', null, 0, 140),
    ('periodos-propicios', 'Períodos Propícios para Lançamentos e Eventos',
     'As melhores datas para lançar um projeto, abrir um negócio ou realizar um evento importante.',
     'produto', '2027-05-15', 2, 150),
    ('mudancas-no-trabalho', 'Período Propício para Mudanças no Trabalho',
     'O momento mais favorável para mudar de emprego, pedir aumento ou começar algo novo.',
     'produto', '2027-06-15', 1, 160),
    ('mapa-infantil', 'Mapa Infantil',
     'Como a criança é, brinca e aprende, para apoiar pais e escolhas de ensino.',
     'produto', '2027-07-15', 1, 170)
  ) as v(slug, nome, descricao, tipo, previsao, votos, ordem)
 where not exists (
   select 1 from public.produtos p
    where p.slug = v.slug
       or lower(p.nome) like '%' || lower(trim(split_part(v.nome, ' ', 1) || ' ' || split_part(v.nome, ' ', 2))) || '%'
 );

-- Mapa do Ano: Fundadores testam em dezembro, antes de abrir para todos em janeiro
update public.produtos set previsao_fundadores = '2026-12-15'
 where slug = 'mapa-do-ano' and previsao_fundadores is null;

notify pgrst, 'reload schema';
