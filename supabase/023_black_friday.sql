-- =====================================================================
-- 023 — Black Friday
-- • Cada Membro Fundador ganha 1 Mapa da Vida para presentear quem quiser
--   (os atuais agora, e quem virar Fundador até 30/11 às 23h59, na hora).
--   O presente aparece em Minha área → Meus presentes, com o link para enviar.
-- • Página do Mapa da Vida com o discurso da campanha "O melhor presente
--   é autoconhecimento" (produto.html?p=mapa-da-vida).
-- Rode no SQL Editor. Pode rodar de novo (ninguém ganha dois).
-- =====================================================================

alter table public.presentes add column if not exists origem text not null default 'compra';

-- Dá o presente de Fundador a um cliente (uma vez só)
create or replace function public.dar_presente_de_fundador(p_cliente uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_mapa uuid;
begin
  select id into v_mapa from public.produtos where slug = 'mapa-da-vida';
  if v_mapa is null then return; end if;
  if exists (select 1 from public.presentes where comprador_id = p_cliente and origem = 'bonus-fundador') then return; end if;
  insert into public.presentes (codigo, produto_id, comprador_id, origem)
  values (upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)), v_mapa, p_cliente, 'bonus-fundador');
end $$;
revoke execute on function public.dar_presente_de_fundador(uuid) from public, anon, authenticated;

-- Fundadores de hoje
select public.dar_presente_de_fundador(a.cliente_id)
  from public.assinaturas a
 where a.plano_id = 'fundador' and a.status = 'ativa' and (a.fim is null or a.fim > now());

-- Quem virar Fundador até o fim da Black Friday ganha na hora
create or replace function public.presente_ao_virar_fundador()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.plano_id = 'fundador' and new.status = 'ativa' and now() < timestamptz '2026-12-01 00:00:00-03' then
    perform public.dar_presente_de_fundador(new.cliente_id);
  end if;
  return new;
end $$;
drop trigger if exists presente_ao_virar_fundador on public.assinaturas;
create trigger presente_ao_virar_fundador after insert on public.assinaturas
  for each row execute function public.presente_ao_virar_fundador();

-- ---------------------------------------------------------------------
-- Página do Mapa da Vida: discurso da campanha
-- (para voltar ao texto anterior depois, é só editar no Table Editor)
-- ---------------------------------------------------------------------
update public.produtos set
  slogan = 'O melhor presente é autoconhecimento.',
  pagina = $t$## Um presente que fica para a vida inteira

Roupa, perfume, eletrônico… tudo isso passa. Mas a chance de alguém se entender melhor fica para sempre. O Mapa da Vida é um convite para a pessoa olhar para dentro, reconhecer os próprios talentos, entender os próprios desafios e crescer.

> Dar autoconhecimento é dar a oportunidade de ser melhor, para si e para quem está por perto.

## O que é o Mapa da Vida

É uma leitura do céu no momento exato em que a pessoa nasceu. Não é sentença nem previsão: é linguagem simbólica, uma bússola para entender como ela age, sente, pensa, ama e constrói a vida.

## O que a pessoa recebe

- A mandala completa do seu mapa, com planetas, casas e aspectos
- Uma interpretação sensível e pessoal, escrita para ela
- O temperamento e os pontos mais importantes do mapa
- Leituras sobre quem ela é, as raízes, a mente, o amor, o propósito, a carreira e as transformações
- Um resumo final para voltar sempre que precisar
- O PDF, para guardar e reler com calma

## Como funciona o presente

- Você escolhe "Dar de presente" e paga por Pix ou cartão
- Recebe um link especial para enviar a quem quiser, pelo WhatsApp ou por mensagem
- A pessoa abre o link, preenche data, hora e local de nascimento e recebe o Mapa da Vida na hora

## Para você também

Quer começar por você? Escolha "Quero este" e receba o seu Mapa da Vida agora mesmo.

**No pagamento, leve também o livro digital da Mara Muniz, "Astrologia e o poder de comer sem culpa", com preço especial de Black Friday.**$t$
 where slug = 'mapa-da-vida';

-- ---------------------------------------------------------------------
-- Livro da Mara (já com os preços de Black Friday: R$ 26,90 e R$ 17,90 para membros)
-- Depois de enviar o PDF em Storage → arquivos → livros/astrologia-e-o-poder-de-comer-sem-culpa.pdf,
-- rode esta linha para ele aparecer no "Leve também":
--   update public.produtos set ativo = true where slug = 'livro-mara-digital';
-- Depois da Black Friday, volte ao preço normal:
--   update public.produtos set preco_centavos = 3590 where slug = 'livro-mara-digital';
-- ---------------------------------------------------------------------
