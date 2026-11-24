-- =====================================================================
-- 027 — Presentear os conteúdos abertos ("Comece agora") sem pagar
-- Quem tem cadastro gera um link de presente na hora (Quem Você É, Como Você Ama,
-- Mapa da Vida Resumido, Janelas de Pausa...). Quem recebe entra com o e-mail para
-- abrir: é assim que novas pessoas chegam e se cadastram.
-- Limite: 20 presentes por pessoa por dia (evita abuso).
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

alter table public.presentes add column if not exists origem text not null default 'compra';
alter table public.presentes add column if not exists visivel boolean not null default true;

create or replace function public.presentear_gratis(p_slug text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := public.meu_cliente_id();
  v_produto public.produtos;
  v_codigo text;
begin
  if v_eu is null then
    raise exception 'Entre com o seu e-mail para presentear.';
  end if;
  select * into v_produto from public.produtos where slug = p_slug and ativo;
  if not found or coalesce(v_produto.nivel, 'pago') not in ('aberto', 'cadastro') then
    raise exception 'Este conteúdo não pode ser presenteado assim.';
  end if;
  if (select count(*) from public.presentes
       where comprador_id = v_eu and origem = 'gratis' and criado_em > now() - interval '1 day') >= 20 then
    raise exception 'Você já enviou muitos presentes hoje. Tente de novo amanhã.';
  end if;
  v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.presentes (codigo, produto_id, comprador_id, origem, visivel)
  values (v_codigo, v_produto.id, v_eu, 'gratis', true);
  return v_codigo;
end $$;
revoke execute on function public.presentear_gratis(text) from public, anon;
grant  execute on function public.presentear_gratis(text) to authenticated;
