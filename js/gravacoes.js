// Gravações das lives, para a página gravacao.html?live=<chave>.
// Para uma live nova: copie um bloco, troque a chave, os vídeos do YouTube (o código
// depois de youtu.be/) e os capítulos [segundos, 'título']. Depois, no Painel → Agenda,
// coloque no "Link da gravação" do evento: https://entreestrelas.com/gravacao.html?live=<chave>
export const GRAVACOES = {
  'boas-vindas': {
    titulo: 'Live de Boas-vindas e Próximos Passos',
    data: '2026-11-25',
    com: 'Felipe Gonçalves, Mara e Jussara',
    resumo: 'O nosso primeiro encontro ao vivo. Contamos como o Entre Estrelas nasceu, o que já está pronto no portal e o que vem pela frente: a Constelação, as vivências, as lives e a formação. E ouvimos as histórias de quem já recebeu o Mapa da Vida.',
    playlist: 'PLD9EvCLNLNQ8',
    partes: [
      {
        video: 'mqwmO189X4w',
        titulo: 'Parte 1 · Nossa história e próximos passos',
        capitulos: [
          [0, 'Por que "Entre Estrelas"?'],
          [143, 'A coragem do autoconhecimento'],
          [208, 'Ressignificar: a primeira proposta do mapa'],
          [248, 'O que já existe no portal'],
          [286, 'Os pilares do Entre Estrelas'],
          [421, 'Autoconhecimento acessível'],
          [583, 'Como o portal foi construído'],
          [718, 'Como você pode ajudar a construir'],
          [811, 'Constelação: o coletivo de estrelas'],
          [872, 'Quem participou conta a sua história'],
          [1418, 'As 12 Noites Santas']
        ]
      },
      {
        video: '9ACMbOr3diw',
        titulo: 'Parte 2 · Black Friday e tour pelo portal',
        capitulos: [
          [0, 'O melhor presente é autoconhecimento'],
          [62, 'Preços especiais da Black Friday'],
          [133, 'Como se preparar para a Árvore de Natal com Raízes'],
          [176, 'Como entrar no portal (sem senha)'],
          [286, 'Como votar nos próximos lançamentos'],
          [340, 'Como dar uma análise de presente'],
          [466, 'Um novo pilar: viagens de autoconhecimento'],
          [598, 'Próximas lives e encerramento']
        ]
      }
    ],
    proximos: [
      '🗺️ Semana que vem: live sobre o Mapa da Vida',
      '🎄 5/12, às 14h30: Árvore de Natal com Raízes',
      '✨ Dezembro: lançamento do Mapa do Ano'
    ]
  }
};
