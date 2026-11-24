-- =====================================================================
-- 026 — Três amostras do Mapa da Vida, em "Comece agora"
-- Cada uma é uma parte do Mapa da Vida, aberta a todos:
-- • Mapa da Vida Resumido (a parte do Resumo)
-- • Quem Você É (só a primeira parte de "Quem Você É", um gostinho)
-- • Como Você Ama (só a forma de amar)
-- Textos de RASCUNHO: ajuste no Table Editor → produtos.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

insert into public.produtos (slug, nome, descricao, tipo, status, previsao, ativo, nivel, inscricoes_abertas, icone, ordem, fora_dos_planos, slogan, pagina)
select 'mapa-da-vida-resumido', 'Mapa da Vida Resumido',
       'O resumo do seu Mapa da Vida, aberto a todos: um pouco de cada parte do seu mapa, em poucos minutos de leitura.',
       'ferramenta', 'em_breve', null, true, 'cadastro', true, 'estrela', 14, false,
       'Uma amostra do seu Mapa da Vida.',
       $t$## O que é

Uma amostra do Mapa da Vida: o resumo final, com os pontos mais importantes do seu mapa, para você ter uma primeira visão de quem você é segundo o céu do dia em que nasceu.

## O que você recebe

- Os pontos mais marcantes do seu mapa
- O seu temperamento, em poucas palavras
- Um convite para ir mais fundo quando quiser

## Como funciona

- Você entra com o seu e-mail
- Preenche data, hora e local de nascimento
- Recebe o seu resumo na hora

Gostou? O Mapa da Vida completo traz cada parte em detalhe.$t$
 where not exists (select 1 from public.produtos p where p.slug = 'mapa-da-vida-resumido');

-- Quem Você É: só a primeira seção do Mapa da Vida (um gostinho)
update public.produtos set
  descricao = 'Um gostinho do seu Mapa da Vida: a primeira parte de quem você é, aberta a todos.',
  slogan = 'Um gostinho de quem você é.',
  pagina = $t$## O que é

Um gostinho do Mapa da Vida: a primeira parte da seção "Quem Você É", para você sentir como é se ver pelo seu mapa.

## Como funciona

- Você entra com o seu e-mail
- Preenche data, hora e local de nascimento
- Recebe a sua leitura na hora

Gostou? O Mapa da Vida completo vai muito mais fundo, e o Mapa da Vida Resumido mostra um pouco de tudo.$t$
 where slug = 'quem-voce-e';

-- Como Você Ama: só a forma de amar
update public.produtos set
  descricao = 'A sua forma de amar, segundo o seu mapa: uma amostra do Mapa da Vida, aberta a todos.',
  slogan = 'A sua forma de amar.',
  pagina = $t$## O que é

Um gostinho do Mapa da Vida: a sua forma de amar, segundo o céu do dia em que você nasceu.

## Como funciona

- Você entra com o seu e-mail
- Preenche data, hora e local de nascimento
- Recebe a sua leitura na hora

Gostou? O Mapa da Vida completo traz o amor e as relações em detalhe, e muito mais.$t$
 where slug = 'como-voce-ama';

-- A antiga "Mandala com resumo" não é usada (continua desligada)
update public.produtos set ativo = false where slug = 'mandala';
