-- =====================================================================
-- 030 — Nomes dos Membros Fundadores no "Quem somos"
-- O site mostra, para todos, o primeiro nome e o último sobrenome de cada
-- Membro Fundador ativo (ex.: "Maria da Silva Souza" aparece "Maria Souza").
-- Nada além do nome sai daqui: sem e-mail, WhatsApp ou nascimento.
-- Quem pedir para não aparecer: marque ocultar_no_site = true no
-- Table Editor → clientes.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

alter table public.clientes add column if not exists ocultar_no_site boolean not null default false;

create or replace function public.fundadores_publicos()
returns table (nome text)
language sql stable security definer set search_path = public as $$
  with partes as (
    select distinct c.id,
           regexp_split_to_array(trim(regexp_replace(c.nome, '\s+', ' ', 'g')), ' ') as p
      from public.clientes c
      join public.assinaturas a on a.cliente_id = c.id
     where a.plano_id = 'fundador' and a.status = 'ativa'
       and (a.fim is null or a.fim > now())
       and nullif(trim(c.nome), '') is not null
       and c.nome not like '%@%'
       and not c.ocultar_no_site
  )
  select initcap(lower(case when array_length(p, 1) > 1
                            then p[1] || ' ' || p[array_length(p, 1)]
                            else p[1] end))
    from partes
   order by 1;
$$;
revoke execute on function public.fundadores_publicos() from public;
grant  execute on function public.fundadores_publicos() to anon, authenticated;

notify pgrst, 'reload schema';

-- Conferência: primeiro, quem está SEM nome no cadastro (não aparece no site;
-- preencha o nome no Painel); depois, cada nome como vai aparecer no site.
select 'SEM NOME: ' || c.email as como_aparece_no_site
  from public.clientes c
  join public.assinaturas a on a.cliente_id = c.id
 where a.plano_id = 'fundador' and a.status = 'ativa'
   and (a.fim is null or a.fim > now())
   and (nullif(trim(c.nome), '') is null or c.nome like '%@%')
union all
select nome from public.fundadores_publicos();
