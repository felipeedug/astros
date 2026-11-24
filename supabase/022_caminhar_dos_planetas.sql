-- =====================================================================
-- 022 — Efemérides vira "Caminhar dos Planetas", ferramenta para profissionais
-- (aparece em O que oferecemos → Para profissionais).
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

update public.produtos
   set nome = 'Caminhar dos Planetas',
       tipo = 'formacao',
       descricao = 'O movimento dos planetas dia a dia, mês a mês: uma ferramenta de trabalho para astrólogas e astrólogos.'
 where slug = 'efemerides';

-- Lua fora de curso vira "Janelas de Pausa" (Para começar)
update public.produtos
   set nome = 'Janelas de Pausa',
       descricao = 'Os intervalos do dia em que é melhor não começar nada novo nem tomar decisões importantes: hora de descansar, treinar ou cuidar do que já está em andamento.',
       slogan = coalesce(nullif(slogan, ''), 'Saber a hora de pausar também é caminhar.'),
       pagina = coalesce(nullif(pagina, ''), $t$## O que é

Ao longo do mês, existem intervalos em que as coisas costumam não sair do jeito que a gente espera. São momentos de mais conflito emocional, em que começar algo novo ou tomar uma decisão importante tende a dar mais trabalho do que deveria.

As Janelas de Pausa mostram quando esses intervalos acontecem, com dia e hora para começar e terminar.

> Não é proibição: é um convite para respirar e esperar o momento certo.

## Como usar

- Evite começar projetos, assinar contratos ou tomar decisões importantes dentro da janela
- Aproveite para descansar, treinar, organizar e terminar o que já está em andamento
- Quando a janela fechar, siga em frente com mais clareza

## Como funciona

- Você entra com o seu e-mail
- Escolhe o mês e a sua cidade
- Vê todas as janelas do mês, no seu horário$t$)
 where slug = 'lua-fora-de-curso';
