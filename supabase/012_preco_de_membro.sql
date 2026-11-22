-- =====================================================================
-- 012 — Preço de membro para comprar para si (ex.: livro digital da Mara)
-- • Livro: R$ 17,90 para membros e R$ 26,90 para quem não é membro.
-- • O livro continua DESATIVADO até o PDF ser enviado (veja o fim do arquivo).
-- Rode no SQL Editor ANTES de atualizar a função criar-pagamento. Pode rodar de novo.
-- =====================================================================

alter table public.produtos add column if not exists preco_membro_centavos integer;

update public.produtos set
  preco_centavos        = 2690,
  preco_membro_centavos = 1790
where slug = 'livro-mara-digital';

-- Depois de enviar o PDF em Storage → arquivos → livros/astrologia-e-o-poder-de-comer-sem-culpa.pdf,
-- rode só esta linha para o livro aparecer no site:
-- update public.produtos set ativo = true where slug = 'livro-mara-digital';

-- ---------------------------------------------------------------------
-- Live da Árvore de Natal com Raízes: 5/12 às 14h30 (horário de Brasília)
-- Aparece na Agenda; o link de acesso você coloca depois pelo Painel → Agenda.
-- ---------------------------------------------------------------------
insert into public.eventos (titulo, descricao, tipo, inicio, duracao_min, publico, inscricoes_abertas, ativo, produto_id)
select 'Árvore de Natal com Raízes', 'Live com a equipe do Entre Estrelas e o Ritual de Renovação.', 'live',
       '2026-12-05 14:30:00-03', 90, 'cadastro', true, true, p.id
from public.produtos p
where p.slug = 'natal-2026'
  and not exists (select 1 from public.eventos e where e.produto_id = p.id);

update public.produtos
set pagina = replace(pagina, 'no dia **5 de dezembro**.', 'no dia **5 de dezembro, às 14h30**.')
where slug = 'natal-2026' and pagina not like '%14h30%';

-- Quem se inscreve no lançamento (ou compra / ganha de presente) já fica inscrito na live dele
create or replace function public.inscrever_nos_eventos_do_produto()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.inscricoes_eventos (cliente_id, evento_id)
  select new.cliente_id, e.id from public.eventos e
  where e.produto_id = new.produto_id and e.ativo and e.inicio > now()
  on conflict (cliente_id, evento_id) do nothing;
  return new;
end $$;

drop trigger if exists inscrever_nos_eventos_do_produto on public.inscricoes;
create trigger inscrever_nos_eventos_do_produto after insert on public.inscricoes
  for each row execute function public.inscrever_nos_eventos_do_produto();

-- Quem já estava inscrito no lançamento entra na live também
insert into public.inscricoes_eventos (cliente_id, evento_id)
select i.cliente_id, e.id
from public.inscricoes i
join public.eventos e on e.produto_id = i.produto_id and e.ativo and e.inicio > now()
on conflict (cliente_id, evento_id) do nothing;
