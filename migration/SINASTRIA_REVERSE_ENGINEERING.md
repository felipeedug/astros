# Levantamento da sinastria do Astrovida

## Materiais encontrados

- `migration/original/CalcMapa.cpp`, `CalcMapa.h`, `Data.h`, `Defines.h` e `ExternData.h`: cópias dos fontes do núcleo natal Astrovida.
- `core/legacy/CalcMapaCore.cpp` e `legacy_calc_api.cpp`: adaptação usada pelo Entre Estrelas para calcular um mapa natal e devolver longitudes e cúspides em JSON.
- `data/ephemerides/*.Efe`: arquivos binários externos usados pelo núcleo legado.
- `data/cities/`: catálogo de localidades usado pelo Entre Estrelas.
- `fonts/Aspectos.txt`, `fonts/Resumo Interpretação - Base.txt`, `fonts/Mapa Natal.pdf` e `fonts/Mapa Interpretado Completo.pdf`: materiais de interpretação e exemplos de mapas natais.

Não foi localizado neste workspace `Astrovida.exe`, o código da interface MFC, fonte de sinastria, relatório de sinastria ou mapa de referência com duas pessoas. O caminho citado no `README.md` (`Fontes Astrovida/Astrovida.exe`) não existe no ambiente disponível.

## Evidência encontrada

- `CCalcMapa::CalcularMapa` calcula um mapa a partir de data, hora, latitude, longitude, fuso e horário de verão. O adapter web `astro_legacy::ComputeNatalChartJson` expõe longitudes dos corpos/pontos e as 12 cúspides.
- Os fontes preservados não contêm módulo, classe ou rotina identificável de sinastria, sobreposição de mapas ou interpretação de relacionamento.
- O frontend atual já compara aspectos cruzados entre Mapa do Ano e Mapa da Vida. Usa conjunção (0°/8°), sextil (60°/5°), quadratura (90°/6°), trígono (120°/6°) e oposição (180°/8°). O limite global escolhido pela pessoa é aplicado como `min(limite global, máximo daquele aspecto)`; o valor inicial é 5° e a faixa da interface é 0°–10°. Isso é regra do produto atual, não evidência da regra de sinastria do Astrovida.
- Para casas, o frontend atual localiza uma longitude dentro do intervalo circular entre duas cúspides consecutivas. Essa regra é adequada para apresentar a posição técnica, mas não foi possível confirmar se o relatório de sinastria Astrovida aplicava uma regra de cúspide/orbe adicional.
- Os textos em `fonts/Aspectos.txt` usam chaves de aspectos natais do tipo `aspecto:planeta:planeta`; não há indicação de que devam ser reinterpretados como aspectos entre pessoas.

## Decisões e lacunas mantidas explícitas

- A implementação pode calcular dois mapas natais com o núcleo legado e exibir aspectos cruzados e as duas direções de planetas nas casas do outro mapa. Os critérios de aspectos são derivados do comparador cruzado que já existe no Entre Estrelas, e a interface identifica essa origem.
- A apresentação inclui as duas mandalas natais com três disposições selecionáveis: sobrepostas com a Pessoa A ao centro, sobrepostas com a Pessoa B ao centro ou lado a lado. Em uma sobreposição, o mapa central fornece a roda zodiacal e os aspectos natais; o segundo mapa aparece com planetas e cúspides no anel externo. As tabelas detalhadas permanecem abaixo da visualização.
- Não foram criadas interpretações astrológicas de sinastria, pesos, pontuações de compatibilidade ou conclusões sobre relacionamento. É necessária uma referência original de sinastria para preservar esse comportamento.
- Data, hora e local selecionado são obrigatórios no estado atual da implementação, pois o cálculo natal devolve ângulos e casas e não há evidência no material de como o Astrovida tratava horário desconhecido em sinastria.
- O horário de verão é resolvido automaticamente pela mesma regra e tabela `data/brazil_dst.csv` usadas pelo Mapa da Vida: período inclusivo por data, limitado aos estados listados; quando a tabela marca `*`, vale para qualquer estado. O ajuste de uma hora é enviado ao núcleo natal antes de montar cada mapa.
- Como no Mapa da Vida, a tabela histórica coberta é brasileira. Para localidades fora do Brasil, nenhuma correção de horário de verão é aplicada automaticamente; expandir essa cobertura exige regras históricas verificadas para outros países.

## Testes da implementação web

Os casos automatizados estão em `tests/sinastria.test.mjs` e podem ser executados com Node.js 18 ou mais novo usando `node --test tests/sinastria.test.mjs`. Incluem cruzamento de 0°/360°, limite e teto das orbes, dados ausentes, validação do limite, cúspides circulares, sobreposição de planetas, arredondamento na virada de signo e determinação automática do horário de verão por período e estado.

## Referências necessárias para fechar a compatibilidade Astrovida

Disponibilizar o executável/interface original ou fontes do módulo de relacionamentos; um mapa/relatório original de sinastria com os dados de nascimento; e regras documentadas para aspectos habilitados, orbes por planeta/aspecto, cúspides, pontos/asteroides incluídos e interpretações/opções selecionáveis.
