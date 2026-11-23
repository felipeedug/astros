-- =====================================================================
-- 016 — Aniversariantes do mês, com a madrinha (quem indicou)
-- • Admin e astrólogas: veem todos os aniversariantes.
-- • Parceiras (madrinhas): veem só as pessoas que elas indicaram.
-- Os dados vêm do nascimento do Mapa da Vida. Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

drop function if exists public.aniversariantes_do_mes(integer);
create function public.aniversariantes_do_mes(p_mes integer default null)
returns table (cliente_id uuid, nome text, data_nascimento date, whatsapp text, email text,
               fundador boolean, madrinha text)
language plpgsql stable security definer set search_path = public as $$
declare
  v_mes   integer := coalesce(p_mes, extract(month from (now() at time zone 'America/Sao_Paulo'))::integer);
  v_eu    uuid    := public.meu_cliente_id();
  v_papel text    := coalesce(public.meu_papel()::text, '');
  v_tudo  boolean := v_papel in ('admin', 'astrologa');
begin
  if not v_tudo and not exists (select 1 from public.clientes where id = v_eu and parceiro) then
    raise exception 'Somente a equipe pode ver os aniversariantes.';
  end if;
  return query
    select c.id,
           coalesce(nullif(c.nome, ''), m.nome),
           m.data_nascimento,
           c.whatsapp,
           c.email,
           exists (select 1 from public.assinaturas a
                   where a.cliente_id = c.id and a.plano_id = 'fundador' and a.status = 'ativa'),
           (select coalesce(nullif(i.nome, ''), i.email) from public.clientes i where i.id = c.indicado_por)
    from public.mapas_nascimento m
    join public.clientes c on c.id = m.cliente_id
    where m.proprio
      and extract(month from m.data_nascimento) = v_mes
      and (v_tudo or c.indicado_por = v_eu)
    order by extract(day from m.data_nascimento), 2;
end $$;
revoke execute on function public.aniversariantes_do_mes(integer) from public, anon;
grant  execute on function public.aniversariantes_do_mes(integer) to authenticated;
