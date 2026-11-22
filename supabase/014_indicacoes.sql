-- =====================================================================
-- 014 — Indicações: quem trouxe cada pessoa para a base
-- • Parceiras (astrólogas, Mara, Felipe...) recebem metade do valor pago
--   por quem elas indicaram.
-- • No Painel você associa a indicação à mão; e cada parceira tem um link
--   próprio (entreestrelas.com/?indicacao=CODIGO) que associa sozinho.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

alter table public.clientes add column if not exists indicado_por     uuid references public.clientes (id) on delete set null;
alter table public.clientes add column if not exists parceiro         boolean not null default false;
alter table public.clientes add column if not exists codigo_indicacao text;
create unique index if not exists clientes_codigo_indicacao_unico on public.clientes (lower(codigo_indicacao));

-- Só administradores mudam papel, e-mail, observações e os campos de indicação
-- (a função registrar_indicacao abaixo é a única exceção, e só preenche uma vez).
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
       or (new.indicado_por is distinct from old.indicado_por
           and coalesce(current_setting('app.registrando_indicacao', true), '') <> 'sim') then
      raise exception 'Somente administradores podem alterar este campo.';
    end if;
  end if;
  return new;
end $$;

-- Quem chegou pelo link de uma parceira: associa na primeira vez que entra.
-- Nunca troca uma indicação que já existe.
create or replace function public.registrar_indicacao(p_codigo text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_eu       uuid := public.meu_cliente_id();
  v_parceiro uuid;
begin
  if v_eu is null then return 'entre_primeiro'; end if;
  select id into v_parceiro from public.clientes
  where parceiro and lower(codigo_indicacao) = lower(trim(p_codigo));
  if v_parceiro is null then return 'codigo_invalido'; end if;
  if v_parceiro = v_eu then return 'proprio'; end if;
  perform set_config('app.registrando_indicacao', 'sim', true);
  update public.clientes set indicado_por = v_parceiro where id = v_eu and indicado_por is null;
  perform set_config('app.registrando_indicacao', '', true);
  return 'ok';
end $$;
revoke execute on function public.registrar_indicacao(text) from public, anon;
grant  execute on function public.registrar_indicacao(text) to authenticated;
