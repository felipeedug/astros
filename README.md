# Migração do núcleo astrológico para web

## Estado atual da migração

Os arquivos originais foram adicionados ao workspace e preservados em:

- `migration/original/CalcMapa.cpp`
- `migration/original/CalcMapa.h`
- `data/ephemerides/Externos.Efe`
- `data/ephemerides/Asteroides.Efe`
- `data/ephemerides/Chiron.Efe`

O executável original continua na pasta de fontes (`Fontes Astrovida/Astrovida.exe`) e será usado como referência de comparação, não como dependência do site.

## Simbolos da mandala

O programa original desenhava os objetos usando a fonte proprietária `Astrovida`. Os códigos dos glifos foram recuperados de `Config.cpp`:

- signos: `0xF4` a `0xFF`
- planetas e pontos: `0xA1` a `0xE0`

O arquivo original da fonte está em `fonts/astrovida.TTF` e é carregado por `styles.css`. Os glifos recuperados são usados pelo `app.js` para reproduzir os símbolos da mandala.

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

## Catálogo de localidades

`data/cities/` contém 257.376 localidades de 220 países, convertidas das páginas do GeoWorldMap distribuídas com o Astrovida. Os arquivos são separados por país e carregados sob demanda; a interface permite escolher país, estado/região e cidade. A seleção envia latitude, longitude e fuso do registro ao cálculo WASM.

Para regenerar o catálogo, execute `python tools/import_astrovida_cities.py --source "C:\Users\felip\Fontes Astrovida\db" --output data/cities`. Preserve e consulte `data/cities/LICENSE.txt`: o catálogo original inclui condições próprias de uso e redistribuição.

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
