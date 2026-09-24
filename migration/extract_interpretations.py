import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class AstroHtmlParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.heading = ''
        self.heading_level = ''
        self.table = None
        self.row = None
        self.cell = None
        self.tables = []

    def handle_starttag(self, tag, attrs):
        if tag in ('h1', 'h2'):
            self.heading_level = tag
            self.heading = ''
        elif tag == 'table':
            self.table = []
        elif tag == 'tr' and self.table is not None:
            self.row = []
        elif tag == 'td' and self.row is not None:
            self.cell = ''
        elif tag == 'br' and self.cell is not None:
            self.cell += '\n'

    def handle_endtag(self, tag):
        if tag == self.heading_level:
            if self.heading_level == 'h1':
                self.heading = self.heading.strip()
            self.heading_level = ''
        elif tag == 'td' and self.cell is not None:
            self.row.append(re.sub(r'\s+', ' ', self.cell).strip())
            self.cell = None
        elif tag == 'tr' and self.row is not None:
            if self.row:
                self.table.append(self.row)
            self.row = None
        elif tag == 'table' and self.table is not None:
            self.tables.append((self.heading, list(self.table)))
            self.table = None

    def handle_data(self, data):
        if self.heading_level:
            self.heading += data
        if self.cell is not None:
            self.cell += data


def rows_for(parser, heading):
    for table_heading, rows in parser.tables:
        if table_heading == heading:
            return rows[1:]
    return []


def clean_id(value):
    match = re.search(r'\d+', value or '')
    return int(match.group()) if match else None


PLANET_IDS = {
    'Sol': 0, 'Lua': 1, 'Mercúrio': 2, 'Mercurio': 2, 'Vênus': 3, 'Venus': 3,
    'Marte': 4, 'Júpiter': 5, 'Jupiter': 5, 'Saturno': 6, 'Urano': 7,
    'Netuno': 8, 'Plutão': 9, 'Plutao': 9, 'Ascendente': 10, 'Roda': 12,
    'Cabeça': 13, 'Cabeca': 13, 'Cauda': 14, 'Vertex': 16, 'Lilith': 17,
    'Chiron': 19, 'Demeter': 20, 'Vesta': 23
}


def planet_id(value):
    name = re.sub(r'^\d+\s+', '', value or '').strip()
    return PLANET_IDS.get(name, clean_id(value))


def extract(source):
    parser = AstroHtmlParser()
    parser.feed(source.read_text(encoding='cp1252'))
    result = {
        'version': 1,
        'source': 'Astrovida legacy HTML export',
        'houses': {},
        'planets': {},
        'signs': {},
        'houseSigns': {},
        'planetHouses': {},
        'planetSigns': {},
        'aspects': {}
    }

    for row in rows_for(parser, 'Casas'):
        if len(row) >= 2 and clean_id(row[0]) is not None:
            result['houses'][str(clean_id(row[0]))] = row[1]
    for row in rows_for(parser, 'Planetas'):
        if len(row) >= 2 and clean_id(row[0]) is not None:
            result['planets'][str(clean_id(row[0]))] = row[1]
    for row in rows_for(parser, 'Signos'):
        if len(row) >= 2 and clean_id(row[0]) is not None:
            result['signs'][str(clean_id(row[0]))] = row[1]
    for row in rows_for(parser, 'Signo na casa'):
        if len(row) >= 3:
            result['houseSigns'][f'{clean_id(row[0])}:{clean_id(row[1])}'] = row[2]
    for row in rows_for(parser, 'Planeta na casa'):
        if len(row) >= 3:
            result['planetHouses'][f'{planet_id(row[0])}:{clean_id(row[1])}'] = row[2]
    for row in rows_for(parser, 'Planeta no signo'):
        if len(row) >= 3:
            result['planetSigns'][f'{planet_id(row[0])}:{clean_id(row[1])}'] = row[2]

    aspect_id = None
    for heading, rows in parser.tables:
        match = re.match(r'(\d+)\s*-', heading)
        if not match or len(rows) < 1:
            continue
        aspect_id = int(match.group(1))
        for row in rows[1:]:
            if len(row) >= 3:
                first = planet_id(row[0])
                second = planet_id(row[1])
                if first is not None and second is not None:
                    result['aspects'][f'{aspect_id}:{first}:{second}'] = row[2]

    return result


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r'C:\Users\felip\Fontes Astrovida\db_astro.html')
    target = Path(sys.argv[2]) if len(sys.argv) > 2 else Path('data/interpretations.json')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(extract(source), ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Generated {target}')


if __name__ == '__main__':
    main()