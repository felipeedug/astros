-- =====================================================================
-- 034 — "Meus presentes": lembrar que o presente já foi enviado
-- Quando a pessoa clica em "Enviar pelo WhatsApp" ou "Copiar link", o site
-- marca o presente como enviado. Ele continua na lista até ser resgatado.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

alter table public.presentes add column if not exists enviado_em timestamptz;

-- Marca como enviado (só quem comprou o presente)
create or replace function public.marcar_presente_enviado(p_codigo text)
returns void language sql security definer set search_path = public as $$
  update public.presentes
     set enviado_em = coalesce(enviado_em, now())
   where codigo = upper(trim(p_codigo))
     and comprador_id = public.meu_cliente_id();
$$;
revoke execute on function public.marcar_presente_enviado(text) from public, anon;
grant  execute on function public.marcar_presente_enviado(text) to authenticated;

-- A lista passa a dizer também se já foi enviado (mesmos campos de antes + enviado)
drop function if exists public.meus_presentes();
create function public.meus_presentes()
returns table (codigo text, produto_nome text, criado_em timestamptz, resgatado boolean, para_quem text, enviado boolean)
language sql stable security definer set search_path = public as $$
  select p.codigo, pr.nome, p.criado_em, p.resgatado_em is not null,
         split_part(coalesce(d.nome, d.email, ''), ' ', 1),
         p.enviado_em is not null
  from public.presentes p
  join public.produtos pr on pr.id = p.produto_id
  left join public.clientes d on d.id = p.destinatario_id
  where p.comprador_id = public.meu_cliente_id() and p.visivel
  order by p.resgatado_em is not null, p.criado_em desc;
$$;
revoke execute on function public.meus_presentes() from public, anon;
grant  execute on function public.meus_presentes() to authenticated;

notify pgrst, 'reload schema';

-- Conferência: deve mostrar as duas funções
select proname from pg_proc where proname in ('marcar_presente_enviado', 'meus_presentes');
