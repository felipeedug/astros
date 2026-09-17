# Adaptador numerico do Astrovida

O site so deve consumir resultados produzidos pelo nucleo portado, nunca as classes visuais MFC.

## Entrada

```text
name: string
birthDate: YYYY-MM-DD
birthTime: HH:mm
latitude: graus decimais
longitude: graus decimais
utcOffset: horas decimais
summerTime: horas decimais
```

## Saida minima

```json
{
  "chartTitle": "Mapa de ...",
  "julianDay": 0,
  "planets": {
    "Sun": { "longitude": 0, "latitude": 0, "speed": 0 },
    "Moon": { "longitude": 0, "latitude": 0, "speed": 0 }
  },
  "angles": {
    "ascendant": 0,
    "midheaven": 0
  },
  "houses": [0],
  "status": ""
}
```

## Corte de portabilidade

A entrada numerica deve chamar `CCalcMapa::CalcularMapa` depois de substituir:

- `CString`, `CStringArray` e `CFile` pela camada em `migration/legacy_compat.h`;
- `AfxMessageBox` por erros retornaveis no JSON;
- `theApp` por configuracao explicita;
- o bloco que atualiza `CArrayEntidades` por um DTO baseado em `sChartPos0`;
- os nomes relativos dos arquivos `.Efe` por um diretorio de dados configuravel.

O bloco visual nao participa do calculo astronomico e nao deve ser levado para WebAssembly.

## Estado

`core/astro_core.cpp` ainda e um fallback provisório. A presenca deste contrato evita que ele seja confundido com uma validacao do Astrovida.exe. A proxima implementacao deve preencher este DTO usando `sChartPos0`, incluindo longitude, latitude, velocidade, casas e angulos.
