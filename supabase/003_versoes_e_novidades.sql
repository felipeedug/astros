-- =====================================================================
-- 003 — Ícone, versão e "O que há de novo" de cada produto
-- Rode no SQL Editor do Supabase depois do 002. Pode rodar de novo.
--
-- A cada nova versão de um produto, atualize no Table Editor (tabela produtos):
--   versao         → ex.: 2.1
--   versao_data    → data do lançamento
--   novidades      → uma novidade por linha
--   destaque_ate   → até quando mostrar o selo "Nova versão"
-- =====================================================================

alter table public.produtos
  add column if not exists icone        text,   -- bussola, calendario, lua, mandala, estrela
  add column if not exists versao       text,
  add column if not exists versao_data  date,
  add column if not exists novidades    text,
  add column if not exists destaque_ate date;

drop function if exists public.meus_produtos();
create function public.meus_produtos()
returns table (
  id uuid, slug text, nome text, descricao text, preco_centavos integer,
  link_pagamento text, link_acesso text, ordem integer, nivel text,
  icone text, versao text, versao_data date, novidades text, nova_versao boolean,
  liberado boolean
)
language sql stable security definer set search_path = public as $$
  select p.id, p.slug, p.nome, p.descricao, p.preco_centavos,
         p.link_pagamento, p.link_acesso, p.ordem, p.nivel,
         p.icone, p.versao, p.versao_data, p.novidades,
         coalesce(p.destaque_ate >= current_date, false),
         public.tem_acesso(c.id, p.id)
  from public.produtos p
  join public.clientes c on c.user_id = auth.uid()
  where p.ativo
  order by p.ordem, p.nome;
$$;
revoke execute on function public.meus_produtos() from public, anon;
grant  execute on function public.meus_produtos() to authenticated;

-- Ícones das ferramentas
update public.produtos set icone = 'calendario' where slug = 'efemerides'        and icone is null;
update public.produtos set icone = 'lua'        where slug = 'lua-fora-de-curso' and icone is null;
update public.produtos set icone = 'mandala'    where slug = 'mandala'           and icone is null;
update public.produtos set icone = 'estrela'    where slug = 'ascendente'        and icone is null;

-- Nova versão do Mapa da Vida (rascunho: revise o texto no Table Editor)
update public.produtos set
  icone        = 'bussola',
  versao       = '2.0',
  versao_data  = '2026-11-22',
  destaque_ate = '2026-12-31',
  novidades    = $txt$Nova seção: Conceito chave
Nova seção: Finanças, com três tipos de dinheiro (registrado, não registrado e de investimento)
Nova seção: Sexualidade e libido
O termo "sexo oposto" agora é "pessoas de energia oposta à sua"
Títulos revisados: "Família de base ou constituída", "Casamento, parcerias ou sociedade" e "Crises, ressignificações e renascimentos"$txt$
where slug = 'mapa-da-vida';
