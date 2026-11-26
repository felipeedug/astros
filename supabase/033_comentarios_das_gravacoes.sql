-- =====================================================================
-- 033 — Comentários nas páginas das gravações (gravacao.html)
-- • Todo mundo vê os comentários (só o primeiro nome e o último sobrenome).
-- • Para comentar, a pessoa precisa ter entrado no site.
-- • Quem escreveu pode apagar o próprio comentário; a equipe (admin) apaga qualquer um.
-- O site só usa as três funções abaixo: a tabela não fica aberta para ninguém.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

create table if not exists public.comentarios (
  id         uuid primary key default gen_random_uuid(),
  gravacao   text not null check (gravacao ~ '^[a-z0-9-]{2,60}$'),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  texto      text not null check (char_length(trim(texto)) between 1 and 1000),
  criado_em  timestamptz not null default now(),
  apagado    boolean not null default false
);
create index if not exists comentarios_por_gravacao on public.comentarios (gravacao, criado_em);
alter table public.comentarios enable row level security;
revoke all on public.comentarios from anon, authenticated;

-- Lista os comentários de uma gravação (do mais antigo para o mais novo)
create or replace function public.comentarios_da_gravacao(p_gravacao text)
returns table (id uuid, autor text, texto text, criado_em timestamptz, meu boolean, posso_apagar boolean)
language sql stable security definer set search_path = public as $$
  with partes as (
    select co.id, co.texto, co.criado_em, co.cliente_id,
           regexp_split_to_array(trim(regexp_replace(coalesce(nullif(trim(c.nome), ''), split_part(c.email, '@', 1)), '\s+', ' ', 'g')), ' ') as p
      from public.comentarios co
      join public.clientes c on c.id = co.cliente_id
     where co.gravacao = p_gravacao and not co.apagado
  )
  select id,
         initcap(lower(case when array_length(p, 1) > 1 then p[1] || ' ' || p[array_length(p, 1)] else p[1] end)),
         texto, criado_em,
         cliente_id = public.meu_cliente_id(),
         cliente_id = public.meu_cliente_id() or public.sou_admin()
    from partes
   order by criado_em
   limit 500;
$$;
revoke execute on function public.comentarios_da_gravacao(text) from public;
grant  execute on function public.comentarios_da_gravacao(text) to anon, authenticated;

-- Publica um comentário (só quem entrou no site; até 5 por minuto)
create or replace function public.comentar(p_gravacao text, p_texto text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := public.meu_cliente_id();
  v_id uuid;
begin
  if v_eu is null then raise exception 'Entre no site para comentar.'; end if;
  if char_length(trim(coalesce(p_texto, ''))) = 0 then raise exception 'Escreva o seu comentário.'; end if;
  if char_length(trim(p_texto)) > 1000 then raise exception 'O comentário pode ter até 1.000 caracteres.'; end if;
  if (select count(*) from public.comentarios
       where cliente_id = v_eu and criado_em > now() - interval '1 minute') >= 5 then
    raise exception 'Calma! Espere um minutinho para comentar de novo.';
  end if;
  insert into public.comentarios (gravacao, cliente_id, texto)
  values (p_gravacao, v_eu, trim(p_texto)) returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.comentar(text, text) from public, anon;
grant  execute on function public.comentar(text, text) to authenticated;

-- Apaga (esconde) um comentário: o próprio autor ou a equipe
create or replace function public.apagar_comentario(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.comentarios set apagado = true
   where id = p_id and (cliente_id = public.meu_cliente_id() or public.sou_admin());
  if not found then raise exception 'Você não pode apagar este comentário.'; end if;
end $$;
revoke execute on function public.apagar_comentario(uuid) from public, anon;
grant  execute on function public.apagar_comentario(uuid) to authenticated;

notify pgrst, 'reload schema';

-- Conferência: deve mostrar as três funções
select proname from pg_proc
 where proname in ('comentarios_da_gravacao', 'comentar', 'apagar_comentario');
