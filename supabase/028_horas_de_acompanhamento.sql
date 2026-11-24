-- =====================================================================
-- 028 — Horas de Acompanhamento (para ir além, dentro da Constelação)
-- Acompanhamento individual com as astrólogas, além do que a Constelação já inclui.
-- Fica "em breve" até ter preço. Texto de RASCUNHO: ajuste no Table Editor → produtos.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

alter table public.produtos drop constraint if exists produtos_tipo_valido;
alter table public.produtos add constraint produtos_tipo_valido
  check (tipo in ('produto', 'vivencia', 'formacao', 'acompanhamento', 'live', 'aula', 'ferramenta'));

insert into public.produtos (slug, nome, descricao, tipo, status, previsao, ativo, nivel, inscricoes_abertas, icone, ordem, fora_dos_planos, slogan, pagina)
select 'horas-de-acompanhamento', 'Horas de Acompanhamento',
       'Acompanhamento individual com uma astróloga do Entre Estrelas, para olhar com calma para o seu momento.',
       'acompanhamento', 'em_breve', null, true, 'pago', true, 'estrela', 200, true,
       'Uma astróloga do seu lado, só para você.',
       $t$## O que é

Na Constelação, a gente apresenta cada passo, ensina como aplicar e acompanha em grupo. As Horas de Acompanhamento são para quando você quer ir além: um encontro individual com uma astróloga do Entre Estrelas, só para você.

## Para que serve

- Olhar com calma para o seu momento e para as suas dúvidas
- Aprofundar o seu Mapa da Vida, o seu Mapa do Ano ou outra análise
- Conversar sobre uma decisão importante, com a astrologia como bússola

## Como funciona

- Você escolhe quantas horas quer
- Combina o dia e o horário com a astróloga
- O encontro acontece on-line, por vídeo

**Em breve. Marque "Quero ser avisado(a)" para saber quando abrir.**$t$
 where not exists (select 1 from public.produtos p where p.slug = 'horas-de-acompanhamento');
