-- =====================================================================
-- 025 — Presente dos Fundadores guardado até a revelação
-- Os presentes de Fundador ficam escondidos em "Meus presentes" até você liberar.
-- Rode no SQL Editor AGORA. Pode rodar de novo.
--
-- Para liberar depois (por exemplo, ao final da live), rode só esta linha:
--   update public.presentes set visivel = true where origem = 'bonus-fundador';
-- =====================================================================

alter table public.presentes add column if not exists visivel boolean not null default true;

-- Esconde os que já foram criados
update public.presentes set visivel = false where origem = 'bonus-fundador' and resgatado_em is null;

-- Os próximos (quem virar Fundador até 30/11) também nascem escondidos,
-- a não ser que você já tenha liberado os demais
create or replace function public.dar_presente_de_fundador(p_cliente uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_mapa uuid; v_liberado boolean;
begin
  select id into v_mapa from public.produtos where slug = 'mapa-da-vida';
  if v_mapa is null then return; end if;
  if exists (select 1 from public.presentes where comprador_id = p_cliente and origem = 'bonus-fundador') then return; end if;
  v_liberado := exists (select 1 from public.presentes where origem = 'bonus-fundador' and visivel);
  insert into public.presentes (codigo, produto_id, comprador_id, origem, visivel)
  values (upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)), v_mapa, p_cliente, 'bonus-fundador', v_liberado);
end $$;
revoke execute on function public.dar_presente_de_fundador(uuid) from public, anon, authenticated;

-- "Meus presentes" só mostra os visíveis
create or replace function public.meus_presentes()
returns table (codigo text, produto_nome text, criado_em timestamptz, resgatado boolean, para_quem text)
language sql stable security definer set search_path = public as $$
  select p.codigo, pr.nome, p.criado_em, p.resgatado_em is not null,
         split_part(coalesce(d.nome, d.email, ''), ' ', 1)
  from public.presentes p
  join public.produtos pr on pr.id = p.produto_id
  left join public.clientes d on d.id = p.destinatario_id
  where p.comprador_id = public.meu_cliente_id() and p.visivel
  order by p.criado_em desc;
$$;
revoke execute on function public.meus_presentes() from public, anon;
grant  execute on function public.meus_presentes() to authenticated;

-- Conferência: deve mostrar 56 escondidos e 0 visíveis
select visivel, count(*) from public.presentes where origem = 'bonus-fundador' group by visivel;
