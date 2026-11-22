-- =====================================================================
-- Entre Estrelas — banco de dados do portal (Supabase / Postgres)
--
-- Como usar: no painel do Supabase, abra "SQL Editor", cole este arquivo
-- inteiro e clique em "Run". Pode ser executado de novo sem problemas.
--
-- Ideia central:
--   * clientes ............ toda pessoa conhecida pelo portal (comprou algo,
--                           é membro, ou foi cadastrada por você). Pode existir
--                           ANTES da pessoa criar login: quando ela entrar com
--                           o mesmo e-mail, o cadastro é ligado ao login.
--   * mapas_nascimento .... dados de nascimento. Cada cliente tem o seu
--                           ("proprio"); astrólogas poderão ter vários.
--   * produtos ............ o que é vendido (Mapa da Vida, livros, análises...).
--   * planos / assinaturas  Fundador (vitalício, tudo) e Comunidade (mensal).
--   * compras ............. compras avulsas de produtos.
--
-- Regra de acesso: a pessoa acessa um produto se COMPROU esse produto
-- OU tem uma ASSINATURA ATIVA de um plano que inclui o produto.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
do $$ begin
  create type papel_usuario as enum ('cliente', 'astrologa', 'admin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------
create table if not exists public.clientes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique references auth.users (id) on delete set null,
  email        text not null unique check (email = lower(trim(email)) and email like '%@%'),
  nome         text,
  whatsapp     text,
  papel        papel_usuario not null default 'cliente',
  observacoes  text,
  criado_em    timestamptz not null default now()
);

create table if not exists public.mapas_nascimento (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid not null references public.clientes (id) on delete cascade,
  proprio          boolean not null default true,   -- true = o mapa da própria pessoa
  nome             text not null,
  data_nascimento  date not null,
  hora_nascimento  time not null,
  pais             text not null,
  regiao           text,                            -- código do estado/região (ex.: SP)
  cidade           text not null,
  latitude         double precision,
  longitude        double precision,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);
-- Cada cliente tem no máximo um mapa "próprio".
create unique index if not exists mapas_nascimento_um_proprio
  on public.mapas_nascimento (cliente_id) where proprio;

create table if not exists public.produtos (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,            -- identificador usado no site
  nome             text not null,
  descricao        text,
  preco_centavos   integer,
  link_pagamento   text,
  link_acesso      text,                            -- para onde o botão "Acessar" leva
  ativo            boolean not null default true,
  ordem            integer not null default 100,
  criado_em        timestamptz not null default now()
);

create table if not exists public.planos (
  id                     text primary key,          -- 'fundador', 'comunidade'
  nome                   text not null,
  descricao              text,
  inclui_todos_produtos  boolean not null default true
);

-- Só usado quando um plano NÃO inclui todos os produtos.
create table if not exists public.planos_produtos (
  plano_id    text not null references public.planos (id) on delete cascade,
  produto_id  uuid not null references public.produtos (id) on delete cascade,
  primary key (plano_id, produto_id)
);

create table if not exists public.assinaturas (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clientes (id) on delete cascade,
  plano_id    text not null references public.planos (id),
  status      text not null default 'ativa' check (status in ('ativa', 'cancelada')),
  inicio      timestamptz not null default now(),
  fim         timestamptz,                          -- vazio = vitalício (Fundador)
  origem      text not null default 'manual',       -- manual, infinitepay, importacao...
  referencia_externa text,
  criado_em   timestamptz not null default now()
);

create table if not exists public.compras (
  id                  uuid primary key default gen_random_uuid(),
  cliente_id          uuid not null references public.clientes (id) on delete cascade,
  produto_id          uuid not null references public.produtos (id),
  status              text not null default 'pago' check (status in ('pago', 'reembolsado')),
  valor_centavos      integer,
  origem              text not null default 'manual',
  referencia_externa  text,                         -- id do pagamento no meio de pagamento
  pago_em             timestamptz not null default now(),
  criado_em           timestamptz not null default now()
);
create index if not exists compras_cliente on public.compras (cliente_id);
create index if not exists assinaturas_cliente on public.assinaturas (cliente_id);

-- ---------------------------------------------------------------------
-- Funções auxiliares (security definer = enxergam tudo, mas só devolvem
-- informação sobre o próprio usuário logado)
-- ---------------------------------------------------------------------
create or replace function public.meu_cliente_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.clientes where user_id = auth.uid();
$$;

create or replace function public.meu_papel()
returns papel_usuario language sql stable security definer set search_path = public as $$
  select papel from public.clientes where user_id = auth.uid();
$$;

create or replace function public.sou_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select papel = 'admin' from public.clientes where user_id = auth.uid()), false);
$$;

-- A regra de acesso, em um lugar só.
create or replace function public.tem_acesso(p_cliente uuid, p_produto uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (
      select 1 from public.compras c
      where c.cliente_id = p_cliente and c.produto_id = p_produto and c.status = 'pago'
    )
    or exists (
      select 1
      from public.assinaturas a
      join public.planos pl on pl.id = a.plano_id
      where a.cliente_id = p_cliente
        and a.status = 'ativa'
        and a.inicio <= now()
        and (a.fim is null or a.fim > now())
        and (
          pl.inclui_todos_produtos
          or exists (select 1 from public.planos_produtos pp
                     where pp.plano_id = pl.id and pp.produto_id = p_produto)
        )
    );
$$;

-- Só o próprio cliente (ou um admin) pode perguntar sobre um cliente.
create or replace function public.cliente_tem_acesso(p_cliente uuid, p_produto_slug text)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if p_cliente is distinct from public.meu_cliente_id() and not public.sou_admin() then
    return false;
  end if;
  return public.tem_acesso(p_cliente, (select id from public.produtos where slug = p_produto_slug));
end $$;

-- ---------------------------------------------------------------------
-- Ligação automática login <-> cadastro (pelo e-mail)
-- Quando alguém cria login, se já existir um cliente com o mesmo e-mail
-- (cadastrado por você, importado do Forms...), ele é ligado ao login.
-- O login por link mágico garante que a pessoa é dona do e-mail.
-- ---------------------------------------------------------------------
create or replace function public.ligar_cliente_ao_login()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is null then
    return new;
  end if;
  insert into public.clientes (email, user_id)
  values (lower(trim(new.email)), new.id)
  on conflict (email) do update
    set user_id = excluded.user_id
    where public.clientes.user_id is null;
  return new;
end $$;

drop trigger if exists ao_criar_login on auth.users;
create trigger ao_criar_login
  after insert on auth.users
  for each row execute function public.ligar_cliente_ao_login();

-- Impede que um cliente comum mude o próprio papel, e-mail ou login.
create or replace function public.proteger_campos_cliente()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.sou_admin() then
    if new.papel is distinct from old.papel
       or new.email is distinct from old.email
       or new.user_id is distinct from old.user_id
       or new.observacoes is distinct from old.observacoes then
      raise exception 'Somente administradores podem alterar este campo.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists proteger_cliente on public.clientes;
create trigger proteger_cliente
  before update on public.clientes
  for each row execute function public.proteger_campos_cliente();

create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

drop trigger if exists mapas_atualizado_em on public.mapas_nascimento;
create trigger mapas_atualizado_em
  before update on public.mapas_nascimento
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------------
-- "Meus produtos": todos os produtos ativos + se o usuário logado tem acesso
-- (chamado pelo site com supabase.rpc('meus_produtos'))
-- ---------------------------------------------------------------------
drop view if exists public.meus_produtos;
create or replace function public.meus_produtos()
returns table (
  id uuid, slug text, nome text, descricao text, preco_centavos integer,
  link_pagamento text, link_acesso text, ordem integer, liberado boolean
)
language sql stable security definer set search_path = public as $$
  select p.id, p.slug, p.nome, p.descricao, p.preco_centavos,
         p.link_pagamento, p.link_acesso, p.ordem,
         public.tem_acesso(c.id, p.id)
  from public.produtos p
  join public.clientes c on c.user_id = auth.uid()
  where p.ativo
  order by p.ordem, p.nome;
$$;

-- tem_acesso é interna: ninguém de fora consulta clientes alheios.
revoke execute on function public.tem_acesso(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.meus_produtos() from public, anon;
grant  execute on function public.meus_produtos() to authenticated;
revoke execute on function public.cliente_tem_acesso(uuid, text) from public, anon;
grant  execute on function public.cliente_tem_acesso(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- Segurança (Row Level Security): o banco só entrega a cada pessoa
-- o que é dela, mesmo que alguém mexa no código do site.
-- ---------------------------------------------------------------------
alter table public.clientes         enable row level security;
alter table public.mapas_nascimento enable row level security;
alter table public.produtos         enable row level security;
alter table public.planos           enable row level security;
alter table public.planos_produtos  enable row level security;
alter table public.assinaturas      enable row level security;
alter table public.compras          enable row level security;

-- clientes
drop policy if exists clientes_ler on public.clientes;
create policy clientes_ler on public.clientes for select to authenticated
  using (user_id = auth.uid() or public.sou_admin());
drop policy if exists clientes_editar on public.clientes;
create policy clientes_editar on public.clientes for update to authenticated
  using (user_id = auth.uid() or public.sou_admin())
  with check (user_id = auth.uid() or public.sou_admin());
drop policy if exists clientes_admin_inserir on public.clientes;
create policy clientes_admin_inserir on public.clientes for insert to authenticated
  with check (public.sou_admin());
drop policy if exists clientes_admin_apagar on public.clientes;
create policy clientes_admin_apagar on public.clientes for delete to authenticated
  using (public.sou_admin());

-- mapas_nascimento
--   * cliente lê os seus; cadastra o próprio UMA vez; não altera depois
--     (evita usar uma compra para gerar mapas de várias pessoas).
--     Correções são feitas por um admin.
--   * astróloga cadastra e altera mapas de clientes dela (proprio = false).
drop policy if exists mapas_ler on public.mapas_nascimento;
create policy mapas_ler on public.mapas_nascimento for select to authenticated
  using (cliente_id = public.meu_cliente_id() or public.sou_admin());
drop policy if exists mapas_inserir on public.mapas_nascimento;
create policy mapas_inserir on public.mapas_nascimento for insert to authenticated
  with check (
    public.sou_admin()
    or (cliente_id = public.meu_cliente_id()
        and (proprio or public.meu_papel() = 'astrologa'))
  );
drop policy if exists mapas_editar on public.mapas_nascimento;
create policy mapas_editar on public.mapas_nascimento for update to authenticated
  using (
    public.sou_admin()
    or (cliente_id = public.meu_cliente_id() and not proprio and public.meu_papel() = 'astrologa')
  )
  with check (
    public.sou_admin()
    or (cliente_id = public.meu_cliente_id() and not proprio and public.meu_papel() = 'astrologa')
  );
drop policy if exists mapas_apagar on public.mapas_nascimento;
create policy mapas_apagar on public.mapas_nascimento for delete to authenticated
  using (
    public.sou_admin()
    or (cliente_id = public.meu_cliente_id() and not proprio and public.meu_papel() = 'astrologa')
  );

-- produtos / planos: vitrine pública; só admin altera
drop policy if exists produtos_ler on public.produtos;
create policy produtos_ler on public.produtos for select to anon, authenticated
  using (ativo or public.sou_admin());
drop policy if exists produtos_admin on public.produtos;
create policy produtos_admin on public.produtos for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

drop policy if exists planos_ler on public.planos;
create policy planos_ler on public.planos for select to anon, authenticated using (true);
drop policy if exists planos_admin on public.planos;
create policy planos_admin on public.planos for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

drop policy if exists planos_produtos_ler on public.planos_produtos;
create policy planos_produtos_ler on public.planos_produtos for select to anon, authenticated using (true);
drop policy if exists planos_produtos_admin on public.planos_produtos;
create policy planos_produtos_admin on public.planos_produtos for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

-- compras / assinaturas: cliente só lê as suas; só admin registra
drop policy if exists compras_ler on public.compras;
create policy compras_ler on public.compras for select to authenticated
  using (cliente_id = public.meu_cliente_id() or public.sou_admin());
drop policy if exists compras_admin on public.compras;
create policy compras_admin on public.compras for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

drop policy if exists assinaturas_ler on public.assinaturas;
create policy assinaturas_ler on public.assinaturas for select to authenticated
  using (cliente_id = public.meu_cliente_id() or public.sou_admin());
drop policy if exists assinaturas_admin on public.assinaturas;
create policy assinaturas_admin on public.assinaturas for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

-- ---------------------------------------------------------------------
-- Permissões da API (projetos novos do Supabase não liberam sozinhos).
-- O que cada pessoa vê continua decidido pelas regras acima.
-- (Mesmo conteúdo de supabase/permissoes.sql.)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.produtos, public.planos, public.planos_produtos to anon;
grant select, insert, update, delete on
  public.clientes, public.mapas_nascimento, public.produtos, public.planos,
  public.planos_produtos, public.assinaturas, public.compras
to authenticated;
grant execute on function public.meu_cliente_id() to anon, authenticated;
grant execute on function public.meu_papel()      to anon, authenticated;
grant execute on function public.sou_admin()      to anon, authenticated;
grant execute on function public.meus_produtos()  to authenticated;
grant execute on function public.cliente_tem_acesso(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- Dados iniciais
-- ---------------------------------------------------------------------
insert into public.planos (id, nome, descricao, inclui_todos_produtos) values
  ('fundador',   'Membro Fundador', 'Acesso vitalício a todos os produtos, inclusive os futuros.', true),
  ('comunidade', 'Comunidade',      'Assinatura mensal com acesso a todas as análises.',          true)
on conflict (id) do nothing;

insert into public.produtos (slug, nome, descricao, preco_centavos, link_acesso, ordem) values
  ('mapa-da-vida', 'Mapa da Vida',
   'Seu Mapa da Vida completo, com uma interpretação sensível e pessoal.',
   null, 'index.html?meu-mapa=1#mapa', 10)
on conflict (slug) do nothing;
