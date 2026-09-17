# Migração do núcleo astrológico para web

## Estado atual da migração

Os arquivos originais foram adicionados ao workspace e preservados em:

- `migration/original/CalcMapa.cpp`
- `migration/original/CalcMapa.h`
- `data/ephemerides/Externos.Efe`
- `data/ephemerides/Asteroides.Efe`
- `data/ephemerides/Chiron.Efe`

O executável original continua na pasta de fontes (`Fontes Astrovida/Astrovida.exe`) e será usado como referência de comparação, não como dependência do site.

Sem esses arquivos, não é possível extrair o núcleo real com fidelidade nem comparar resultados de forma confiável com o executável original.

## Passos de migração planejados

1. Extrair a lógica de cálculo da camada MFC para um núcleo independente.
2. Criar uma camada de compatibilidade para CString, CFile, CArray e estruturas antigas.
3. Preservar os arquivos externos de efemérides e asteroides. (feito)
4. Compilar o núcleo em WebAssembly usando Emscripten.
5. Expor uma API JSON que o frontend consuma.
6. Substituir o cálculo aproximado atual em app.js. (bridge preparado; fallback permanece até o núcleo portado)
7. Validar resultados contra o Astrovida.exe usando um conjunto de casos de teste.

## Estrutura criada no workspace

- migration/legacy_compat.h: compatibilidade mínima para classes e estruturas do MFC.
- core/astro_core.h: API do núcleo de cálculo.
- core/astro_core.cpp: execução do cálculo em modo legado.
- wasm/astro_wasm.cpp: ponte para WebAssembly.

## Observação importante

O código em app.js foi modernizado para consumir uma API JSON. No momento, ele usa um fallback local enquanto a extração de `CalcMapa.cpp` ainda separa o cálculo da camada MFC.

## Próximo passo real no ambiente completo

Quando os arquivos originais forem disponibilizados, o fluxo correto será:

- mover a lógica de CalcMapa.cpp para core/
- manter os arquivos *.Efe em uma pasta de dados
- compilar com emcc
- expor a API no endpoint /api/natal
- substituir o fallback do frontend por chamadas reais para o wasm
- comparar os resultados com Astrovida.exe
