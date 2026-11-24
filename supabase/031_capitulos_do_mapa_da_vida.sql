-- =====================================================================
-- 031 — Amostras do Mapa da Vida no ar: cada uma é um capítulo do mapa
-- O site monta o Mapa da Vida igualzinho (mesmos textos de data/) e mostra
-- só o pedaço do produto (?capitulo=…), com um aviso de que é um capítulo
-- e um convite para o Mapa da Vida completo:
-- • Quem Você É           → a primeira parte da seção 3, "Quem Você É"
-- • Como Você Ama         → a "Forma de amar" (Vênus no signo), da seção 6
-- • Mapa da Vida Resumido → a seção 12, "Resumo"
-- A pessoa entra com o e-mail, preenche o nascimento uma única vez (fica
-- salvo, como no Mapa da Vida) e vê o capítulo na hora.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

update public.produtos set status = 'disponivel', link_acesso = 'index.html?meu-mapa=1&capitulo=quem-voce-e#mapa'
 where slug = 'quem-voce-e';
update public.produtos set status = 'disponivel', link_acesso = 'index.html?meu-mapa=1&capitulo=como-voce-ama#mapa'
 where slug = 'como-voce-ama';
update public.produtos set status = 'disponivel', link_acesso = 'index.html?meu-mapa=1&capitulo=mapa-da-vida-resumido#mapa'
 where slug = 'mapa-da-vida-resumido';

notify pgrst, 'reload schema';

-- Conferência
select slug, nome, status, ativo, nivel, link_acesso
  from public.produtos
 where slug in ('quem-voce-e', 'como-voce-ama', 'mapa-da-vida-resumido')
 order by ordem;
