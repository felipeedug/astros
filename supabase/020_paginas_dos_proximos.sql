-- =====================================================================
-- 020 — Página "Conhecer" de cada próximo passo (produto.html?p=slug)
-- Textos de RASCUNHO para revisar: edite no Table Editor → produtos
-- (colunas slogan e pagina). Só preenche o que ainda estiver vazio.
-- Formato do texto: "## Título", "- item", "> destaque", "**negrito**",
-- e uma linha em branco entre os blocos.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

update public.produtos p set
  slogan = coalesce(nullif(p.slogan, ''), v.slogan),
  pagina = v.pagina
  from (values

('mapa-do-ano', 'O seu ano pessoal, de um aniversário ao outro.', $t$## O que é

O Mapa do Ano mostra o que o céu desenha para o seu ano pessoal, que começa no seu aniversário e vai até o próximo. Ele é feito a partir do seu Mapa da Vida e da posição dos astros no momento em que o Sol volta ao ponto exato em que estava quando você nasceu.

> O Mapa da Vida é a sua bússola maior. O Mapa do Ano é a bússola do momento.

## O que você descobre

- Os grandes temas do seu ano: o que pede atenção, o que pede pausa e o que pede coragem
- As áreas da vida que ficam em evidência: trabalho, relações, casa, saúde, estudos
- Os melhores momentos para começar, decidir e descansar
- Como aproveitar o ano respeitando quem você é

## Para quem é

Para quem quer viver o próprio ano com mais clareza, se preparar para as mudanças e usar melhor cada fase.

**Membros Fundadores recebem antes, em dezembro, e ajudam a deixar o Mapa do Ano ainda melhor.**$t$),

('carreira-e-trabalho', 'Seus talentos a serviço do que te realiza.', $t$## O que é

Uma análise do seu mapa voltada para o trabalho: os seus talentos naturais, o que te motiva, o ambiente em que você rende mais e o tipo de atividade que traz sentido para você.

## O que você descobre

- Suas habilidades específicas e como usá-las melhor
- O que te realiza no trabalho, além do dinheiro
- Seu jeito de liderar, colaborar e tomar decisões
- Os desafios que se repetem e como lidar com eles

## Para quem é

Para quem está escolhendo uma carreira, pensando em mudar de área, empreendendo ou querendo se sentir mais inteiro no trabalho que já tem.$t$),

('compatibilidade', 'O que aproxima e o que desafia uma relação.', $t$## O que é

Uma leitura dos dois mapas juntos: como cada pessoa ama, se comunica e reage, e como essas energias se encontram na relação. Sem julgamento e sem sentença: a ideia é entender, não rotular.

## O que você descobre

- Onde vocês se encontram com facilidade
- Onde estão os atritos e como conversar sobre eles
- O jeito de cada um demonstrar afeto e de precisar de cuidado
- Apoio para decisões importantes: morar junto, casar, seguir caminhos diferentes

## Para quem é

Para casais, para quem está começando uma relação e também para outras relações importantes, como mãe e filho, sócios e amigos.$t$),

('periodos-propicios', 'A data certa para o seu passo importante.', $t$## O que é

Uma análise para escolher as melhores datas para o que é importante para você: lançar um projeto, abrir um negócio, publicar um livro, realizar um evento ou fazer uma transição.

## O que você recebe

- Os períodos mais favoráveis para o seu objetivo
- Os momentos a evitar e por quê
- Sugestões de como se preparar até a data escolhida

## Para quem é

Para quem empreende, cria, lança projetos ou tem um grande passo pela frente e quer dar esse passo no tempo certo.$t$),

('mudancas-no-trabalho', 'O momento certo para mudar.', $t$## O que é

Uma análise para identificar o período mais favorável para mudar de emprego, pedir um aumento, buscar uma promoção ou começar algo novo na sua carreira.

## O que você descobre

- Os períodos mais propícios para a mudança que você quer
- O que está em movimento no seu mapa agora
- Como se preparar para aproveitar a oportunidade

## Para quem é

Para quem sente que chegou a hora de mudar, mas quer fazer isso com mais segurança.$t$),

('mapa-infantil', 'Para conhecer melhor e respeitar o tempo de cada criança.', $t$## O que é

O mapa da criança lido para os pais e cuidadores: como ela é, como brinca, como aprende e do que precisa para se sentir segura.

## O que você descobre

- O temperamento e as necessidades emocionais da criança
- Como ela aprende melhor, para ajudar na escolha do tipo de ensino e da escola
- Seus talentos naturais e como estimulá-los
- Como respeitar o tempo e o jeito de ser de cada um

## Para quem é

Para mães, pais, avós e educadores que querem conhecer melhor a criança e apoiá-la com mais compreensão.$t$),

('talisma', 'Um símbolo seu, em sintonia com o seu céu.', $t$## O que é

Uma vivência para criar o seu talismã pessoal: um objeto simbólico escolhido e preparado a partir do seu mapa, para lembrar você da sua força e da sua intenção.

## Como vai ser

- Um encontro ao vivo, conduzido pelas astrólogas do Entre Estrelas
- A escolha dos elementos do seu talismã a partir do seu mapa
- Um momento de intenção e de ativação

A data e os detalhes serão divulgados em breve.$t$),

('formacao-astrologia', 'Aprenda a ler o céu e a si mesmo.', $t$## O que é

Uma formação para quem quer estudar astrologia de verdade: dos fundamentos à leitura completa de um mapa, com as astrólogas do Entre Estrelas e a linguagem simbólica, humanista e sem determinismo que é a nossa marca.

## O que você vai aprender

- Signos, planetas, casas e aspectos
- Como interpretar um mapa por inteiro
- Ciclos e trânsitos
- Como conduzir um atendimento com ética e cuidado

## Para quem é

Para quem quer se conhecer mais a fundo e para quem quer trabalhar com astrologia.

**Em construção. Marque "Tenho interesse" para ajudar a definir as datas e receber as novidades.**$t$),

('software-astrologas', 'O seu trabalho, com a tecnologia do Entre Estrelas.', $t$## O que é

O software do Entre Estrelas para astrólogas e profissionais de autoconhecimento: mapas, interpretações e a gestão dos seus clientes em um só lugar.

## O que você vai poder fazer

- Gerar mapas e análises para os seus clientes
- Oferecer as análises do Entre Estrelas junto com o seu próprio atendimento
- Organizar os seus clientes, os dados de nascimento e o histórico de cada um

**Em construção. Marque "Tenho interesse" para participar dos primeiros testes.**$t$),

('quem-voce-e', 'O essencial do seu Mapa da Vida.', $t$## O que é

Um resumo dos pontos mais importantes do seu Mapa da Vida: o seu Sol, a sua Lua e o seu Ascendente, e o que eles dizem sobre quem você é.

## Como funciona

- Você entra com o seu e-mail
- Preenche data, hora e local de nascimento
- Recebe o seu resumo na hora

É um primeiro passo. Quando quiser ir mais fundo, o Mapa da Vida completo está aqui.$t$)

  ) as v(slug, slogan, pagina)
 where p.slug = v.slug and coalesce(p.pagina, '') = '';
