-- =====================================================================
-- 021 — "Como Você Ama": nova análise aberta (Para começar)
-- Texto de RASCUNHO: ajuste no Table Editor → produtos.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

insert into public.produtos (slug, nome, descricao, tipo, status, previsao, ativo, nivel, inscricoes_abertas, icone, ordem, fora_dos_planos, slogan, pagina)
select 'como-voce-ama', 'Como Você Ama',
       'O seu jeito de amar segundo o seu mapa: como você se aproxima, demonstra afeto e precisa de cuidado.',
       'ferramenta', 'em_breve', null, true, 'cadastro', true, 'estrela', 16, false,
       'O seu jeito de amar, escrito nas estrelas.',
       $t$## O que é

Uma leitura aberta do seu mapa sobre o amor: como você se aproxima das pessoas, como demonstra afeto e do que precisa para se sentir amado(a).

## O que você descobre

- O seu jeito de se apaixonar e de construir uma relação
- Como você demonstra carinho e como gosta de receber
- O que te aproxima e o que te afasta de quem você ama

## Como funciona

- Você entra com o seu e-mail
- Preenche data, hora e local de nascimento
- Recebe a sua leitura na hora

Quando quiser olhar para uma relação a dois, a Compatibilidade nos Relacionamentos está aqui.$t$
 where not exists (select 1 from public.produtos p where p.slug = 'como-voce-ama');
