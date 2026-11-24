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
