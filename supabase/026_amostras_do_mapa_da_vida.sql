-- =====================================================================
-- 026 — Três amostras do Mapa da Vida, em "Comece agora"
-- Cada uma é uma parte do Mapa da Vida, aberta a todos:
-- • Mapa da Vida Resumido (a parte do Resumo)
-- • Quem Você É (a seção "Quem Você É")
-- • Como Você Ama (a parte de Amor e Relacionamentos)
-- Textos de RASCUNHO: ajuste no Table Editor → produtos.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

insert into public.produtos (slug, nome, descricao, tipo, status, previsao, ativo, nivel, inscricoes_abertas, icone, ordem, fora_dos_planos, slogan, pagina)
select 'mapa-da-vida-resumido', 'Mapa da Vida Resumido',
       'O resumo do seu Mapa da Vida, aberto a todos: os pontos mais importantes do seu mapa em poucos minutos de leitura.',
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

-- Quem Você É: a seção "Quem Você É" do Mapa da Vida
update public.produtos set
  descricao = 'A seção "Quem Você É" do Mapa da Vida, aberta a todos: o seu jeito de ser, os seus talentos e o que te move.',
  pagina = $t$## O que é

Uma amostra do Mapa da Vida: a seção "Quem Você É", completa. Ela fala do seu jeito de ser, dos seus talentos naturais e do que te move, a partir do seu Sol, da sua Lua e do seu Ascendente.

## Como funciona

- Você entra com o seu e-mail
- Preenche data, hora e local de nascimento
- Recebe a sua leitura na hora

Gostou? O Mapa da Vida completo traz também as suas raízes, a sua mente, o amor, o propósito, a carreira e muito mais.$t$
 where slug = 'quem-voce-e';

-- Como Você Ama: a parte de Amor e Relacionamentos do Mapa da Vida
update public.produtos set
  descricao = 'A parte de Amor e Relacionamentos do Mapa da Vida, aberta a todos: como você se aproxima, demonstra afeto e precisa de cuidado.',
  pagina = replace(pagina, 'Uma leitura aberta do seu mapa sobre o amor:', 'Uma amostra do Mapa da Vida: a parte de Amor e Relacionamentos, sobre')
 where slug = 'como-voce-ama';

-- A antiga "Mandala com resumo" não é usada (continua desligada)
update public.produtos set ativo = false where slug = 'mandala';
