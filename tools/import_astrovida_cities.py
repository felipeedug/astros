import argparse
import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path


class CountryPage(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows = []
        self.row = None
        self.cell = None
        self.in_title = False
        self.title = []

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag == 'title':
            self.in_title = True
        elif tag == 'tr':
            self.row = []
        elif tag == 'td' and self.row is not None:
            self.cell = []

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == 'title':
            self.in_title = False
        elif tag == 'td' and self.cell is not None:
            self.row.append(''.join(self.cell).strip())
            self.cell = None
        elif tag == 'tr' and self.row is not None:
            if self.row:
                self.rows.append(self.row)
            self.row = None

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)
        if self.in_title:
            self.title.append(data)


def normalize(value):
    decomposed = unicodedata.normalize('NFKD', value.casefold())
    return ''.join(c for c in decomposed if not unicodedata.combining(c)).strip()


def parse_coordinate(value, directions):
    match = re.fullmatch(r'\s*(\d{1,3})\s*([NSEW])\s*(\d{1,2})\s*', value, re.I)
    if not match:
        raise ValueError(f'coordenada inválida: {value!r}')
    degree, direction, minute = match.groups()
    number = int(degree) + int(minute) / 60
    return -number if direction.upper() in directions else number


def parse_zone(value):
    match = re.fullmatch(r'\s*(\d{1,2})\s*([EW])\s*(\d{1,2})\s*', value, re.I)
    if not match:
        raise ValueError(f'fuso inválido: {value!r}')
    hour, direction, minute = match.groups()
    offset = int(hour) + int(minute) / 60
    return offset if direction.upper() == 'E' else -offset


def load_region_lookup(source):
    with (source / 'Regions.txt').open(encoding='cp1252', newline='') as file:
        regions = list(csv.DictReader(file))
    with (source / 'Cities.txt').open(encoding='cp1252', newline='') as file:
        cities = list(csv.DictReader(file))

    region_by_id = {row['RegionID']: row for row in regions}
    names_by_country = defaultdict(dict)
    countries_by_city_region = defaultdict(Counter)
    for region in regions:
        names_by_country[region['CountryID']][normalize(region['Code'])] = region['Region'].strip()
    for city in cities:
        region = region_by_id.get(city['RegionID'])
        if region:
            key = (normalize(city['City']), normalize(region['Code']))
            countries_by_city_region[key][city['CountryID']] += 1
    return countries_by_city_region, names_by_country


def parse_country(path, countries_by_city_region, names_by_country):
    parser = CountryPage()
    parser.feed(path.read_bytes().decode('cp1252'))
    records = [row for row in parser.rows if len(row) == 5 and normalize(row[0]) != 'cidade']
    country_matches = Counter()
    for city, region, _zone, _lat, _lon in records:
        country_matches.update(countries_by_city_region[(normalize(city), normalize(region))])

    region_names = {}
    if country_matches:
        ranked = country_matches.most_common(2)
        if ranked[0][1] >= 5 and (len(ranked) == 1 or ranked[0][1] >= ranked[1][1] * 2):
            region_names = names_by_country.get(ranked[0][0], {})

    city_rows = []
    region_codes = set()
    rejected = []
    for city, region, zone, latitude, longitude in records:
        try:
            code = region.strip()
            city_rows.append([
                city.strip(), code,
                parse_coordinate(latitude, 'S'),
                parse_coordinate(longitude, 'W'),
                parse_zone(zone),
            ])
            region_codes.add(code)
        except ValueError:
            rejected.append((city, region, zone, latitude, longitude))

    regions = [
        {'code': code, 'name': region_names.get(normalize(code), code)}
        for code in sorted(region_codes, key=str.casefold)
    ]
    return {
        'name': ''.join(parser.title).strip() or path.stem,
        'regions': regions,
        'cities': city_rows,
        'rejected': rejected,
    }


def main():
    parser = argparse.ArgumentParser(description='Converte o catálogo de cidades do Astrovida em arquivos por país.')
    parser.add_argument('--source', type=Path, default=Path(r'C:\Users\felip\Fontes Astrovida\db'))
    parser.add_argument('--output', type=Path, default=Path('data/cities'))
    args = parser.parse_args()

    city_region_countries, region_names = load_region_lookup(args.source)
    countries = [parse_country(path, city_region_countries, region_names) for path in args.source.glob('*.htm')]
    countries = sorted((country for country in countries if country['cities']), key=lambda item: normalize(item['name']))
    args.output.mkdir(parents=True, exist_ok=True)

    index = []
    rejected = []
    total_cities = 0
    for number, country in enumerate(countries):
        country_id = f'c{number:03d}'
        filename = f'{country_id}.json'
        index.append({'id': country_id, 'name': country['name'], 'regions': country['regions'], 'file': filename})
        (args.output / filename).write_text(
            json.dumps({'cities': country['cities']}, ensure_ascii=False, separators=(',', ':')),
            encoding='utf-8',
        )
        total_cities += len(country['cities'])
        rejected.extend((country['name'], row) for row in country['rejected'])

    (args.output / 'index.json').write_text(
        json.dumps({'source': 'Astrovida GeoWorldMap catalog', 'countries': index}, ensure_ascii=False, separators=(',', ':')),
        encoding='utf-8',
    )
    license_file = args.source / 'GeoWorldMap License Agreement.txt'
    if license_file.exists():
        (args.output / 'LICENSE.txt').write_text(license_file.read_bytes().decode('cp1252'), encoding='utf-8')

    print(f'countries={len(index)} cities={total_cities} rejected={len(rejected)}')
    for country, row in rejected:
        print('REJECTED', country, row)


if __name__ == '__main__':
    main()
