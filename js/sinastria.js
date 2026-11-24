import { hasHistoricalBrazilianDst } from './daylight-saving.mjs';
import { drawSynastryMandala, drawSynastryOverlay, natalReadout } from './synastry-mandala.js';

export const synastryAspectDefinitions = [
  { key: 'conjunction', label: 'Conjunção', angle: 0, orb: 8 },
  { key: 'sextile', label: 'Sextil', angle: 60, orb: 5 },
  { key: 'square', label: 'Quadratura', angle: 90, orb: 6 },
  { key: 'trine', label: 'Trígono', angle: 120, orb: 6 },
  { key: 'opposition', label: 'Oposição', angle: 180, orb: 8 }
];

export const synastryPlanetOrder = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Midheaven'];
export const synastryNames = { Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercúrio', Venus: 'Vênus', Mars: 'Marte', Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Netuno', Pluto: 'Plutão', Ascendant: 'Ascendente', Midheaven: 'Meio do Céu' };
const zodiacNames = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];
const bodyOrder = synastryPlanetOrder.slice(0, 10);
const mod = (value, divisor = 360) => ((value % divisor) + divisor) % divisor;

export function findSynastryAspects(longitudesA, longitudesB, { maxOrb = 5, enabled = synastryAspectDefinitions.map(({ key }) => key) } = {}) {
  if (!Number.isFinite(maxOrb) || maxOrb < 0 || maxOrb > 10) throw new RangeError('O limite global da orbe deve estar entre 0° e 10°.');
  const aspects = [];
  for (const planetA of synastryPlanetOrder) {
    const longitudeA = longitudesA?.[planetA];
    if (!Number.isFinite(longitudeA)) continue;
    for (const planetB of synastryPlanetOrder) {
      const longitudeB = longitudesB?.[planetB];
      if (!Number.isFinite(longitudeB)) continue;
      const separation = Math.abs(mod(longitudeA - longitudeB + 180) - 180);
      const definition = synastryAspectDefinitions.find((candidate) => enabled.includes(candidate.key)
        && Math.abs(separation - candidate.angle) <= Math.min(candidate.orb, maxOrb));
      if (definition) aspects.push({ planetA, planetB, key: definition.key, name: definition.label, angle: definition.angle, separation, orb: Math.abs(separation - definition.angle) });
    }
  }
  return aspects;
}

export function houseForLongitude(longitude, houses) {
  if (!Number.isFinite(longitude) || !Array.isArray(houses) || houses.length !== 12 || houses.some((cusp) => !Number.isFinite(cusp))) return null;
  const normalizedLongitude = mod(longitude);
  for (let index = 0; index < 12; index += 1) {
    const start = mod(houses[index]);
    const width = mod(houses[(index + 1) % 12] - start);
    if (mod(normalizedLongitude - start) < width || width === 0) return index + 1;
  }
  return 1;
}

export function overlayPlanets(longitudes, houses) {
  return bodyOrder.flatMap((planet) => {
    const longitude = longitudes?.[planet];
    const house = houseForLongitude(longitude, houses);
    return house === null ? [] : [{ planet, longitude: mod(longitude), house }];
  });
}

export function describeLongitude(longitude) {
  const totalMinutes = Math.round(mod(longitude) * 60) % (360 * 60);
  const zodiacIndex = Math.floor(totalMinutes / (30 * 60));
  const withinSignMinutes = totalMinutes % (30 * 60);
  const degree = Math.floor(withinSignMinutes / 60);
  const minute = withinSignMinutes % 60;
  return `${String(degree).padStart(2, '0')}° ${String(minute).padStart(2, '0')}′ ${zodiacNames[zodiacIndex]}`;
}

function appendCell(row, value, header = false) {
  const cell = document.createElement(header ? 'th' : 'td');
  if (header) cell.scope = 'col';
  cell.textContent = value;
  row.append(cell);
}

function makeTable(headers, rows) {
  const wrapper = document.createElement('div');
  wrapper.className = 'synastry-table-wrap';
  const table = document.createElement('table');
  table.className = 'synastry-table';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headers.forEach((header) => appendCell(headerRow, header, true));
  thead.append(headerRow);
  const tbody = document.createElement('tbody');
  rows.forEach((values) => {
    const row = document.createElement('tr');
    values.forEach((value) => appendCell(row, value));
    tbody.append(row);
  });
  table.append(thead, tbody);
  wrapper.append(table);
  return wrapper;
}

function resultCard(title, content) {
  const card = document.createElement('section');
  card.className = 'synastry-result-card';
  const heading = document.createElement('h2');
  heading.textContent = title;
  card.append(heading, content);
  return card;
}

function createReadoutItem({ name, symbol, degree, signGlyph, color, houseLabel }) {
  const item = document.createElement('span');
  item.className = 'readout-item';
  const heading = document.createElement('b');
  if (symbol) {
    const glyph = document.createElement('i');
    glyph.style.color = color;
    glyph.textContent = symbol;
    heading.append(glyph);
    const label = document.createElement('span');
    label.className = 'readout-object-name';
    label.textContent = name;
    heading.append(label);
  } else {
    heading.style.color = color;
    heading.textContent = name;
  }
  const position = document.createElement('small');
  position.style.color = color;
  const degreeLabel = document.createElement('span');
  degreeLabel.textContent = degree;
  const sign = document.createElement('span');
  sign.className = 'readout-sign';
  sign.textContent = signGlyph;
  position.append(degreeLabel, sign);
  if (houseLabel) {
    const house = document.createElement('span');
    house.className = 'synastry-house-label';
    house.textContent = houseLabel;
    position.append(house);
  }
  item.append(heading, position);
  return item;
}

function renderNativeReadouts(chart) {
  const data = natalReadout(chart);
  const tables = document.createElement('div');
  tables.className = 'planet-house-tables synastry-readouts';
  const planets = document.createElement('section');
  planets.className = 'readout-group';
  const planetHeading = document.createElement('div');
  planetHeading.className = 'readout-heading';
  planetHeading.textContent = 'Planetas';
  const planetReadout = document.createElement('div');
  planetReadout.className = 'planet-readout';
  planetReadout.setAttribute('aria-label', 'Posições dos planetas e pontos do mapa');
  data.planets.forEach((entry) => planetReadout.append(createReadoutItem(entry)));
  planets.append(planetHeading, planetReadout);

  const houses = document.createElement('section');
  houses.className = 'readout-group';
  const houseHeading = document.createElement('div');
  houseHeading.className = 'readout-heading';
  houseHeading.textContent = 'Casas';
  const houseReadout = document.createElement('div');
  houseReadout.className = 'house-readout';
  houseReadout.setAttribute('aria-label', 'Aberturas das casas do mapa');
  data.houses.forEach((entry) => houseReadout.append(createReadoutItem(entry)));
  houses.append(houseHeading, houseReadout);
  tables.append(planets, houses);
  return tables;
}

function renderOverlayReadout(entries) {
  const readout = document.createElement('div');
  readout.className = 'planet-readout synastry-overlay-readout';
  entries.forEach(({ planet, longitude, house }) => {
    const position = natalReadout({ longitudes: { [planet]: longitude }, houses: [] }).planets[0];
    readout.append(createReadoutItem({
      ...position,
      name: synastryNames[planet],
      symbol: position.symbol,
      houseLabel: `Casa ${house}`
    }));
  });
  return readout;
}

function createMandalaCanvas(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 700;
  canvas.className = 'synastry-mandala-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', label);
  return canvas;
}

function drawMandalaPresentation(host, personA, chartA, personB, chartB, layout) {
  host.replaceChildren();
  if (layout === 'side-by-side') {
    const pair = document.createElement('div');
    pair.className = 'synastry-mandala-pair';
    [[personA, chartA], [personB, chartB]].forEach(([person, chart]) => {
      const panel = document.createElement('article');
      const heading = document.createElement('h3');
      heading.textContent = person.name;
      const canvas = createMandalaCanvas(`Mandala natal de ${person.name}`);
      panel.append(heading, canvas);
      pair.append(panel);
      drawSynastryMandala(canvas, chart, person.name);
    });
    host.append(pair);
    return;
  }

  const centerIsA = layout !== 'overlay-b';
  const centerPerson = centerIsA ? personA : personB;
  const centerChart = centerIsA ? chartA : chartB;
  const outerPerson = centerIsA ? personB : personA;
  const outerChart = centerIsA ? chartB : chartA;
  const canvas = createMandalaCanvas(`Mandala sobreposta: ${centerPerson.name} no centro e ${outerPerson.name} na camada externa`);
  drawSynastryOverlay(canvas, centerChart, outerChart);
  const caption = document.createElement('p');
  caption.className = 'synastry-mandala-caption';
  caption.textContent = `${centerPerson.name}: mapa central, com as casas natais e os graus das cúspides no anel externo. ${outerPerson.name}: planetas e divisões das casas no anel sobreposto.`;
  host.append(canvas, caption);
}

export function renderSynastryResults(container, personA, chartA, personB, chartB, options) {
  container.replaceChildren();
  const aspects = findSynastryAspects(chartA.longitudes, chartB.longitudes, options);
  const mandalaContent = document.createElement('div');
  mandalaContent.className = 'synastry-mandala-content';
  const layoutLabel = document.createElement('label');
  layoutLabel.className = 'synastry-layout-control';
  layoutLabel.append(document.createTextNode('Visualização das mandalas'));
  const layoutSelect = document.createElement('select');
  layoutSelect.setAttribute('aria-label', 'Visualização das mandalas');
  [
    ['overlay-a', `Sobrepostas · ${personA.name} no centro`],
    ['overlay-b', `Sobrepostas · ${personB.name} no centro`],
    ['side-by-side', 'Lado a lado']
  ].forEach(([value, label]) => layoutSelect.add(new Option(label, value)));
  layoutLabel.append(layoutSelect);
  const mandalaHost = document.createElement('div');
  mandalaHost.className = 'synastry-mandala-stage';
  mandalaContent.append(layoutLabel, mandalaHost);
  container.append(resultCard('Mandalas natais', mandalaContent));
  const renderMandalas = () => drawMandalaPresentation(mandalaHost, personA, chartA, personB, chartB, layoutSelect.value);
  layoutSelect.addEventListener('change', renderMandalas);
  renderMandalas();

  const renderNatal = (person, chart) => {
    const details = document.createElement('p');
    details.className = 'synastry-map-meta';
    details.textContent = `${person.name} · ${person.date} ${person.time} · ${person.locationLabel} · horário de verão ${person.daylightSaving ? 'aplicado automaticamente' : 'não aplicado'}`;
    const content = document.createDocumentFragment();
    content.append(details, renderNativeReadouts(chart));
    return resultCard(`Posições natais · ${person.name}`, content);
  };
  container.append(renderNatal(personA, chartA), renderNatal(personB, chartB));
  const aspectContent = aspects.length
    ? makeTable(['Pessoa A', 'Posição A', 'Aspecto', 'Pessoa B', 'Posição B', 'Ângulo medido', 'Orbe'], aspects.map(({ planetA, planetB, name, separation, orb }) => [
      synastryNames[planetA], describeLongitude(chartA.longitudes[planetA]), name, synastryNames[planetB], describeLongitude(chartB.longitudes[planetB]), `${separation.toFixed(2)}°`, `${orb.toFixed(2)}°`
    ]))
    : Object.assign(document.createElement('p'), { className: 'synastry-empty', textContent: 'Nenhum aspecto cruzado corresponde aos tipos selecionados e ao limite global da orbe.' });
  container.append(resultCard(`Aspectos cruzados · ${personA.name} → ${personB.name}`, aspectContent));

  const overlayA = overlayPlanets(chartB.longitudes, chartA.houses);
  const overlayB = overlayPlanets(chartA.longitudes, chartB.houses);
  const overlayAContent = document.createElement('div');
  overlayAContent.className = 'synastry-readout-content';
  overlayAContent.append(renderOverlayReadout(overlayA));
  const overlayBContent = document.createElement('div');
  overlayBContent.className = 'synastry-readout-content';
  overlayBContent.append(renderOverlayReadout(overlayB));
  container.append(resultCard(`Planetas de ${personB.name} nas casas de ${personA.name}`, overlayAContent));
  container.append(resultCard(`Planetas de ${personA.name} nas casas de ${personB.name}`, overlayBContent));
  container.hidden = false;
  return { aspects, overlayA, overlayB };
}

async function initialize() {
  const form = document.querySelector('#synastry-form');
  const status = document.querySelector('#synastry-status');
  const results = document.querySelector('#synastry-results');
  const button = form.querySelector('.synastry-submit');
  const backButton = document.querySelector('[data-back]');
  backButton?.addEventListener('click', () => {
    const currentUrl = location.href;
    if (history.length <= 1) { location.assign('mapas.html'); return; }
    history.back();
    setTimeout(() => { if (location.href === currentUrl) location.assign('mapas.html'); }, 800);
  });
  const waitForWasm = () => {
    if (window.astroWasm?.computeJsonApi) return Promise.resolve();
    return new Promise((resolve, reject) => {
      window.addEventListener('astro-wasm-ready', resolve, { once: true });
      window.addEventListener('astro-wasm-error', () => reject(new Error('Não foi possível carregar o núcleo de cálculo. Acesse esta página pelo site ou por um servidor local.')), { once: true });
    });
  };
  waitForWasm().then(() => { status.textContent = 'Núcleo de cálculo carregado. Preencha os dados dos dois mapas.'; }).catch((error) => { status.textContent = error.message; });
  try {
    const locationPicker = window.EntreEstrelasLocationPicker;
    if (!locationPicker) throw new Error('O componente compartilhado de localidades não foi carregado.');
    for (const fieldset of form.querySelectorAll('.person-fields')) {
      const countrySelect = fieldset.querySelector('[name="country"]');
      const regionSelect = fieldset.querySelector('[name="region"]');
      const cityInput = fieldset.querySelector('[name="city"]');
      const placeInput = fieldset.querySelector('[name="place"]');
      const chosenLocation = fieldset.querySelector('.chosen-location');
      const cityPicker = await locationPicker.attach({
        countrySelect, regionSelect, cityInput,
        suggestions: fieldset.querySelector('.city-suggestions'),
        placeInput, regionField: regionSelect.closest('.location-region-field'),
        defaults: { country: 'Brasil', region: 'SP', city: 'São Paulo' }
      });
      fieldset.cityPicker = cityPicker;
      const updateLocation = () => {
        const selected = cityPicker.selected;
        chosenLocation.textContent = selected
          ? `${selected.record[0]} · ${selected.country.name} · UTC${selected.record[4] >= 0 ? '+' : ''}${selected.record[4]}`
          : 'Selecione uma localidade no catálogo.';
      };
      placeInput.addEventListener('location-changed', updateLocation);
      updateLocation();
    }
  } catch (error) {
    status.textContent = error.message;
  }

  try {
    const { attachSavedMapPicker } = await import('./saved-map-picker.js');
    for (const fieldset of form.querySelectorAll('.person-fields')) {
      const root = fieldset.querySelector('[data-saved-map-picker]');
      await attachSavedMapPicker(root, async (map) => {
        fieldset.querySelector('[name="name"]').value = map.nome || '';
        fieldset.querySelector('[name="date"]').value = map.data_nascimento || '';
        fieldset.querySelector('[name="time"]').value = (map.hora_nascimento || '').slice(0, 5);
        const selected = await fieldset.cityPicker?.select(map.pais, map.regiao, map.cidade, map.latitude, map.longitude);
        if (!selected) throw new Error('A localidade salva não corresponde ao catálogo. Confira os dados e selecione país, estado e cidade manualmente.');
        fieldset.querySelector('[name="place"]').dispatchEvent(new Event('location-changed', { bubbles: true }));
      });
    }
  } catch (error) {
    console.warn('Seleção de mapas cadastrados indisponível; o preenchimento manual segue ativo.', error);
  }

  const orbControl = form.querySelector('[name="orb"]');
  const orbOutput = form.querySelector('.synastry-orb output');
  orbControl.addEventListener('input', () => { orbOutput.value = `${orbControl.value}°`; orbOutput.textContent = `${orbControl.value}°`; });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    results.hidden = true;
    if (!form.reportValidity()) return;
    const people = [...form.querySelectorAll('.person-fields')];
    if (people.some((fieldset) => !fieldset.cityPicker?.selected)) {
      status.textContent = 'Selecione uma cidade nas sugestões para cada pessoa.';
      return;
    }
    button.disabled = true;
    status.textContent = 'Calculando os dois mapas natais…';
    try {
      await waitForWasm();
      const personData = await Promise.all(people.map(async (fieldset) => {
        const get = (name) => fieldset.querySelector(`[name="${name}"]`);
        const selected = fieldset.cityPicker.selected;
        const record = selected.record;
        const city = { name: record[0], region: record[1], latitude: record[2], longitude: record[3], utcOffset: record[4], countryName: selected.country.name };
        const locationLabel = `${city.name}, ${city.region}, ${city.countryName}`;
        const daylightSaving = await hasHistoricalBrazilianDst(locationLabel, get('date').value);
        const person = { name: get('name').value.trim(), date: get('date').value, time: get('time').value, locationLabel, daylightSaving };
        const json = window.astroWasm.computeJsonApi(person.name, person.date, person.time, locationLabel, daylightSaving, city.latitude, city.longitude, city.utcOffset);
        return { person, chart: JSON.parse(json) };
      }));
      if (personData.some(({ chart }) => !chart.longitudes || !Array.isArray(chart.houses) || chart.houses.length !== 12)) throw new Error('O núcleo não retornou as longitudes e as 12 cúspides necessárias para comparar os mapas.');
      const enabled = [...form.querySelectorAll('[name="aspect"]:checked')].map((input) => input.value);
      const comparison = renderSynastryResults(results, personData[0].person, personData[0].chart, personData[1].person, personData[1].chart, { maxOrb: Number(orbControl.value), enabled });
      const dstAdjusted = personData.filter(({ person }) => person.daylightSaving).map(({ person }) => person.name);
      const dstSummary = dstAdjusted.length ? ` Horário de verão histórico ajustado automaticamente para: ${dstAdjusted.join(', ')}.` : ' Nenhum ajuste histórico de horário de verão foi aplicado.';
      status.textContent = `Comparação calculada: ${comparison.aspects.length} aspectos dentro dos critérios selecionados. As orbes máximas são limitadas pelo critério de cada tipo de aspecto.${dstSummary}`;
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      console.error('Falha ao calcular a sinastria.', error);
      status.textContent = error.message || 'Não foi possível calcular os dois mapas.';
    } finally {
      button.disabled = false;
    }
  });
}

if (typeof document !== 'undefined' && document.querySelector('#synastry-form')) initialize();
