-- =====================================================================
-- 015 — Valor real recebido e repasses pagos às parceiras
-- • valor_fundador_centavos: quanto entrou de fato pelo Membro Fundador dessa
--   pessoa (já sem taxas, ou pago pelo Mercado Pago...). Vazio = regra padrão
--   (R$ 49,85 cadastrado à mão, ou o valor pago pelo portal).
-- • repasses: cada pagamento feito a uma parceira (para saber quanto falta).
-- Só administradores veem e alteram. Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

alter table public.clientes add column if not exists valor_fundador_centavos integer;

-- Só admin altera o valor (o cliente não pode mexer no próprio)
create or replace function public.proteger_campos_cliente()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.sou_admin() then
    if new.papel is distinct from old.papel
       or new.email is distinct from old.email
       or new.user_id is distinct from old.user_id
       or new.observacoes is distinct from old.observacoes
       or new.parceiro is distinct from old.parceiro
       or new.codigo_indicacao is distinct from old.codigo_indicacao
       or new.valor_fundador_centavos is distinct from old.valor_fundador_centavos
       or (new.indicado_por is distinct from old.indicado_por
           and coalesce(current_setting('app.registrando_indicacao', true), '') <> 'sim') then
      raise exception 'Somente administradores podem alterar este campo.';
    end if;
  end if;
  return new;
end $$;

create table if not exists public.repasses (
  id           uuid primary key default gen_random_uuid(),
  parceiro_id  uuid not null references public.clientes (id) on delete cascade,
  valor_centavos integer not null check (valor_centavos > 0),
  pago_em      date not null default current_date,
  observacao   text,
  criado_em    timestamptz not null default now()
);

alter table public.repasses enable row level security;
drop policy if exists repasses_admin on public.repasses;
create policy repasses_admin on public.repasses for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());
grant select, insert, update, delete on public.repasses to authenticated;
grant all on public.repasses to service_role;
