# Extração de CalcMapa

## Fonte preservada

A cópia original está em `migration/original/CalcMapa.cpp` e `CalcMapa.h`.

A entrada pública do cálculo é:

```cpp
CCalcMapa::CalcularMapa(
  int dia, int mes, int ano,
  double latitudeRad, double longitudeRad,
  double horaHms, double zonaHms, double horarioVeraoHms,
  CArrayEntidades* entidades
)
```

O método controla o fluxo do núcleo, mas ainda mistura três responsabilidades que precisam ser separadas no port para WebAssembly:

1. cálculo astronômico (`CalcularAstros`, `ComputarPlanetas`, `ComputarLua` e funções auxiliares);
2. leitura dos arquivos binários de efemérides;
3. atualização visual de `CArrayEntidades`, `CPlaneta`, `CCasa` e `CSigno`.

## Compatibilidade identificada

- `CString` e `CStringArray` são usados na nomenclatura e tabelas internas;
- `CFile::Open`, `Read`, `Seek` e `Close` são usados para os arquivos `.Efe`;
- `CArray` precisa de `Add`, `GetAt`, `GetSize` e `RemoveAll`;
- `theApp` aparece no fluxo legado, principalmente em operações de UI/interrupção;
- `AfxMessageBox`, `TRY/CATCH` e classes de desenho devem ser removidos do caminho WASM.

A primeira camada está em `migration/legacy_compat.h`. Ela não substitui ainda `CArrayEntidades`: o adapter final deve retornar um DTO sem referências à UI.

## Build esperado

O build final deve usar Emscripten e incluir somente o núcleo portado, os dados `.Efe` como arquivos pré-carregados e `wasm/astro_wasm.cpp` como API JSON. O ambiente atual não possui `emcc`, portanto a compilação não foi executada nesta máquina.
