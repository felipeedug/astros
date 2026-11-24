-- =====================================================================
-- 019 — "O que oferecemos" em quatro frentes: Jornada, Avulsos, Formação e Gratuitos
-- • Nova categoria "formacao" (cursos e o software para astrólogas).
-- • Primeiros itens em breve de Formação e o "Quem você é" gratuito.
--   Nomes e textos são rascunho: ajuste no Table Editor → produtos.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

alter table public.produtos drop constraint if exists produtos_tipo_valido;
alter table public.produtos add constraint produtos_tipo_valido
  check (tipo in ('produto', 'vivencia', 'formacao', 'live', 'aula', 'ferramenta'));

insert into public.produtos (slug, nome, descricao, tipo, status, previsao, ativo, nivel, inscricoes_abertas, icone, ordem, fora_dos_planos)
select v.slug, v.nome, v.descricao, v.tipo, 'em_breve', null, true, v.nivel, true, v.icone, v.ordem, v.fora
  from (values
    ('formacao-astrologia', 'Formação em Astrologia',
     'Para quem quer estudar astrologia de verdade: dos fundamentos à leitura de mapas, com as astrólogas do Entre Estrelas.',
     'formacao', 'pago', 'livro', 300, true),
    ('software-astrologas', 'Entre Estrelas para Astrólogas',
     'O software do Entre Estrelas para o seu trabalho: mapas, interpretações e a gestão dos seus clientes em um só lugar.',
     'formacao', 'pago', 'mandala', 310, true),
    ('quem-voce-e', 'Quem Você É',
     'Um resumo gratuito do seu Mapa da Vida: os pontos mais importantes de quem você é.',
     'ferramenta', 'cadastro', 'estrela', 15, false)
  ) as v(slug, nome, descricao, tipo, nivel, icone, ordem, fora)
 where not exists (select 1 from public.produtos p where p.slug = v.slug);

notify pgrst, 'reload schema';
