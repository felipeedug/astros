-- =====================================================================
-- 024 — Aniversariantes do mês para toda a comunidade
-- Todos os membros (Fundadores e Comunidade) veem quem faz aniversário no mês,
-- só com o nome e o dia: sem ano de nascimento, sem WhatsApp, sem e-mail.
-- (A equipe e as madrinhas continuam com a lista completa de antes.)
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

drop function if exists public.aniversariantes_da_comunidade(integer);
create function public.aniversariantes_da_comunidade(p_mes integer default null)
returns table (nome text, dia integer, mes integer, fundador boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  v_mes integer := coalesce(p_mes, extract(month from (now() at time zone 'America/Sao_Paulo'))::integer);
begin
  if not (public.sou_membro() or public.sou_admin()) then
    return; -- quem não é membro não vê a lista
  end if;
  return query
    select coalesce(nullif(trim(c.nome), ''), m.nome),
           extract(day from m.data_nascimento)::integer,
           extract(month from m.data_nascimento)::integer,
           exists (select 1 from public.assinaturas a
                   where a.cliente_id = c.id and a.plano_id = 'fundador' and a.status = 'ativa')
    from public.mapas_nascimento m
    join public.clientes c on c.id = m.cliente_id
    where m.proprio
      and extract(month from m.data_nascimento) = v_mes
      -- só quem também é da comunidade (plano ativo)
      and exists (select 1 from public.assinaturas a
                  where a.cliente_id = c.id and a.status = 'ativa' and (a.fim is null or a.fim > now()))
    order by 2, 1;
end $$;
revoke execute on function public.aniversariantes_da_comunidade(integer) from public, anon;
grant  execute on function public.aniversariantes_da_comunidade(integer) to authenticated;
