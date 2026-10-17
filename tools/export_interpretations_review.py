"""Exporta todas as interpretações do Astrovida para revisão offline.

Gera:
- data/interpretations-review.csv (separador ';', UTF-8 com BOM para Excel)
- data/interpretations-review.txt (leitura corrida, agrupada por seção)

Cada linha traz a combinação, a chave usada no JSON, o status (OK/FALTA) e o texto.
Combinações que o site pode consultar mas que não existem no JSON aparecem como FALTA.
"""
import csv
import json
from itertools import combinations
from pathlib import Path

SOURCE = Path('data/interpretations.json')
CSV_OUT = Path('data/interpretations-review.csv')
TXT_OUT = Path('data/interpretations-review.txt')

PLANETS = ['Sol', 'Lua', 'Mercúrio', 'Vênus', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Netuno', 'Plutão',
           'Ascendente', 'Meio do Céu', 'Roda da Fortuna', 'Cabeça (Nodo Norte)', 'Cauda (Nodo Sul)',
           'Ponto Leste', 'Vertex', 'Lilith', 'Príapo', 'Chiron', 'Demeter', 'Pallas', 'Juno', 'Vesta']
SIGNS = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
         'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes']
ASPECTS = ['Conjunção', 'Sextil', 'Quadratura', 'Trígono', 'Oposição']
TEMPERAMENTS = ['Fogo', 'Terra', 'Ar', 'Água', 'Terra + Ar', 'Terra + Água', 'Terra + Fogo',
                'Ar + Água', 'Ar + Fogo', 'Água + Fogo']

# IDs de objetos que o app consulta (app.js: planetIds)
APP_PLANET_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 23]


def main():
    data = json.loads(SOURCE.read_text(encoding='utf-8'))
    rows = []

    def add(tipo, combinacao, item1, item2, item3, chave, texto):
        rows.append({
            'Tipo': tipo, 'Combinacao': combinacao, 'Item1': item1, 'Item2': item2, 'Item3': item3,
            'ChaveJSON': chave, 'Status': 'OK' if texto else 'FALTA', 'Texto': texto or '',
        })

    for temperament in TEMPERAMENTS:
        add('Temperamento', temperament, temperament, '', '', temperament,
            data.get('temperament', {}).get(temperament, ''))

    for house in range(1, 13):
        add('Casa', f'Casa {house}', f'Casa {house}', '', '', str(house), data['houses'].get(str(house), ''))

    for planet_id, planet in enumerate(PLANETS):
        add('Planeta', planet, planet, '', '', str(planet_id), data['planets'].get(str(planet_id), ''))

    for sign_id, sign in enumerate(SIGNS):
        add('Signo', sign, sign, '', '', str(sign_id), data['signs'].get(str(sign_id), ''))

    for house in range(1, 13):
        for sign_id, sign in enumerate(SIGNS):
            add('Casa no signo', f'Casa {house} em {sign}', f'Casa {house}', sign, '',
                f'{sign_id}:{house}', data['houseSigns'].get(f'{sign_id}:{house}', ''))

    for planet_id in APP_PLANET_IDS:
        for house in range(1, 13):
            add('Planeta na casa', f'{PLANETS[planet_id]} na Casa {house}', PLANETS[planet_id], f'Casa {house}', '',
                f'{planet_id}:{house}', data['planetHouses'].get(f'{planet_id}:{house}', ''))

    for planet_id in APP_PLANET_IDS:
        for sign_id, sign in enumerate(SIGNS):
            add('Planeta no signo', f'{PLANETS[planet_id]} em {sign}', PLANETS[planet_id], sign, '',
                f'{planet_id}:{sign_id}', data['planetSigns'].get(f'{planet_id}:{sign_id}', ''))

    for aspect_id, aspect in enumerate(ASPECTS):
        for first_id, second_id in combinations(APP_PLANET_IDS, 2):
            text = (data['aspects'].get(f'{aspect_id}:{first_id}:{second_id}')
                    or data['aspects'].get(f'{aspect_id}:{second_id}:{first_id}', ''))
            add('Aspecto', f'{aspect} · {PLANETS[first_id]} / {PLANETS[second_id]}', aspect,
                PLANETS[first_id], PLANETS[second_id], f'{aspect_id}:{first_id}:{second_id}', text)

    with CSV_OUT.open('w', encoding='utf-8-sig', newline='') as output:
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()), delimiter=';')
        writer.writeheader()
        writer.writerows(rows)

    sections = ['Temperamento', 'Casa', 'Planeta', 'Signo', 'Casa no signo', 'Planeta na casa', 'Planeta no signo', 'Aspecto']
    with TXT_OUT.open('w', encoding='utf-8') as output:
        output.write('REVISÃO DAS INTERPRETAÇÕES — Eu e as Estrelas\n')
        output.write('Status: OK = texto existente · FALTA = combinação sem texto no JSON\n\n')
        for section in sections:
            section_rows = [row for row in rows if row['Tipo'] == section]
            missing = sum(1 for row in section_rows if row['Status'] == 'FALTA')
            output.write(f"\n{'=' * 78}\n{section.upper()} ({len(section_rows)} combinações, {missing} faltantes)\n{'=' * 78}\n")
            for row in section_rows:
                output.write(f"\n[{row['Status']}] {row['Combinacao']}  (chave: {row['ChaveJSON']})\n")
                output.write(f"{row['Texto']}\n")

    total_missing = sum(1 for row in rows if row['Status'] == 'FALTA')
    print(f'total={len(rows)} faltantes={total_missing}')
    for section in sections:
        section_rows = [row for row in rows if row['Tipo'] == section]
        missing = sum(1 for row in section_rows if row['Status'] == 'FALTA')
        print(f'{section}: {len(section_rows)} combinações, {missing} faltantes')
    print(f'Arquivos: {CSV_OUT} · {TXT_OUT}')


if __name__ == '__main__':
    main()
