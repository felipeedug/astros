-- =====================================================================
-- 032 — Constelação: "orientação para toda a comunidade", não "acompanhamento em grupo"
-- (dúvida da Mara: "acompanhamento" dava a impressão de que a gente fica à
-- disposição de cada pessoa). Na Constelação, a orientação acontece pelos
-- textos, leituras e explicações colocados para todos; o individual são as
-- Horas de Acompanhamento, à parte.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

update public.produtos
   set pagina = replace(pagina,
         'Na Constelação, a gente apresenta cada passo, ensina como aplicar e acompanha em grupo.',
         'Na Constelação, a gente coloca textos, leituras e explicações de cada passo para toda a comunidade: é sempre o mesmo para todos, nada individual.')
 where slug = 'horas-de-acompanhamento'
   and pagina like '%acompanha em grupo%';

notify pgrst, 'reload schema';

-- Conferência: algum outro texto de produto ainda fala em acompanhar em grupo?
-- (se aparecer alguma linha, me mande que eu ajusto)
select slug, nome,
       case when pagina ilike '%acompanh%grupo%' then 'pagina' end as onde_pagina,
       case when descricao ilike '%acompanh%grupo%' then 'descricao' end as onde_descricao,
       case when slogan ilike '%acompanh%grupo%' then 'slogan' end as onde_slogan
  from public.produtos
 where pagina ilike '%acompanh%grupo%'
    or descricao ilike '%acompanh%grupo%'
    or slogan ilike '%acompanh%grupo%';
