-- =====================================================================
-- 013 — Membro Fundador pelo pagamento automático (sem cadastro manual)
-- • A pessoa entra com o e-mail, paga pela InfinitePay e o plano Fundador
--   é liberado sozinho, na hora.
-- • Vendas abertas até 30/11/2026 às 23h59 (horário de Brasília).
-- Rode no SQL Editor ANTES de atualizar a função criar-pagamento. Pode rodar de novo.
-- =====================================================================

alter table public.produtos add column if not exists concede_plano text references public.planos (id);
alter table public.produtos add column if not exists venda_ate timestamptz;

insert into public.produtos (slug, nome, descricao, preco_centavos, ativo, nivel, fora_dos_planos, concede_plano, venda_ate, icone, ordem)
values ('membro-fundador', 'Membro Fundador',
        'Acesso vitalício a todos os produtos do Entre Estrelas, começando pelo seu Mapa da Vida.',
        4985, true, 'pago', true, 'fundador', '2026-11-30 23:59:59-03', 'estrela', 999)
on conflict (slug) do update set
  preco_centavos = excluded.preco_centavos,
  concede_plano  = excluded.concede_plano,
  venda_ate      = excluded.venda_ate,
  fora_dos_planos = true,
  ativo = true;

-- Liberar pedido: produto que concede plano vira assinatura; o resto, como antes
create or replace function public.liberar_pedido(p_pedido uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_pedido public.pedidos;
  v_item   jsonb;
  v_codigo text;
  v_plano  text;
begin
  select * into v_pedido from public.pedidos where id = p_pedido for update;
  if not found or v_pedido.status = 'pago' then
    return;  -- não existe ou já foi liberado (aviso repetido)
  end if;

  update public.pedidos set status = 'pago', pago_em = now() where id = p_pedido;

  for v_item in select * from jsonb_array_elements(v_pedido.itens) loop
    select concede_plano into v_plano from public.produtos where id = (v_item ->> 'produto_id')::uuid;

    if v_plano is not null then
      -- Plano (ex.: Membro Fundador): cria a assinatura, se ainda não houver uma ativa
      if not exists (select 1 from public.assinaturas a
                     where a.cliente_id = v_pedido.cliente_id and a.plano_id = v_plano and a.status = 'ativa') then
        insert into public.assinaturas (cliente_id, plano_id, origem, referencia_externa)
        values (v_pedido.cliente_id, v_plano, 'pagamento', p_pedido::text);
      end if;
    elsif coalesce((v_item ->> 'presente')::boolean, false) then
      v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      insert into public.presentes (codigo, pedido_id, produto_id, comprador_id)
      values (v_codigo, p_pedido, (v_item ->> 'produto_id')::uuid, v_pedido.cliente_id);
    else
      insert into public.compras (cliente_id, produto_id, valor_centavos, origem, referencia_externa)
      values (v_pedido.cliente_id, (v_item ->> 'produto_id')::uuid,
              (v_item ->> 'preco_centavos')::integer, 'pagamento', p_pedido::text);
    end if;
  end loop;
end $$;
revoke execute on function public.liberar_pedido(uuid) from public, anon, authenticated;
grant execute on function public.liberar_pedido(uuid) to service_role;
