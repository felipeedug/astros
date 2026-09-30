window.astroWasmLoading = true;

const form = document.querySelector('#birth-form');
const canvas = document.querySelector('#chart');
let context = canvas.getContext('2d');

const signs = ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'];
const signNames = ['Aries', 'Touro', 'Gemeos', 'Cancer', 'Leao', 'Virgem', 'Libra', 'Escorpiao', 'Sagitario', 'Capricornio', 'Aquario', 'Peixes'];
const colors = { ink: '#20252b', coral: '#d97b65', gold: '#d5a34c', mint: '#76a99a', line: '#d8d2c7', paper: '#f4f0e8' };
const signColors = { fire: '#e34234', earth: '#4b5320', air: '#f28c28', water: '#4169e1' };
const signElements = ['fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water'];
const planetReadoutOrder = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Midheaven', 'Fortune', 'NorthNode', 'SouthNode', 'EastPoint', 'Vertex', 'Lilith', 'Priapo', 'Chiron', 'Demeter', 'Pallas', 'Juno', 'Vesta'];
const objectNames = { Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercurio', Venus: 'Venus', Mars: 'Marte', Jupiter: 'Jupiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Netuno', Pluto: 'Plutao', Chiron: 'Chiron', Demeter: 'Demeter', Pallas: 'Pallas', Juno: 'Juno', Vesta: 'Vesta', NorthNode: 'Cabeça', SouthNode: 'Cauda', Lilith: 'Lilith', Priapo: 'Príapo', Fortune: 'Roda da Fortuna', EastPoint: 'Ponto Leste', Vertex: 'Vertex', Ascendant: 'Ascendente', Midheaven: 'Meio do Ceu' };
const objectLabels = { Ascendant: 'ASC', Midheaven: 'MC', EastPoint: 'EP' };
const signGlyphs = [0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFB, 0xFC, 0xFD, 0xFE, 0xFF].map((code) => String.fromCharCode(code));
const objectGlyphs = { Sun: 0xA2, Moon: 0xA1, Mercury: 0xA3, Venus: 0xA4, Mars: 0xA5, Jupiter: 0xA6, Saturn: 0xA7, Uranus: 0xA8, Neptune: 0xA9, Pluto: 0xAA, Chiron: 0xB1, Demeter: 0xB2, Pallas: 0xB3, Juno: 0xB4, Vesta: 0xB5, NorthNode: 0xAB, SouthNode: 0xC1, Lilith: 0xE0, Priapo: 0xBD, Fortune: 0xB0, EastPoint: 0xDB, Vertex: 0xAE, Ascendant: 0xAD, Midheaven: 0xAC };
Object.keys(objectGlyphs).forEach((key) => { objectGlyphs[key] = String.fromCharCode(objectGlyphs[key]); });
const aspectColors = { conjunction: '#71857b', sextile: '#5d9b72', square: '#c94f4f', trine: '#4d73b3', opposition: '#c94f4f' };
const aspectNames = { conjunction: 'Conjuncao', sextile: 'Sextil', square: 'Quadratura', trine: 'Trigono', opposition: 'Oposicao' };
const aspectGlyphNames = { conjunction: 'Conjunção', sextile: 'Sextil', square: 'Quadratura', trine: 'Trígono', opposition: 'Oposição' };
const visibleAspects = new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition']);
const optionalObjects = new Set(['Chiron', 'Demeter', 'Pallas', 'Juno', 'Vesta', 'Fortune', 'NorthNode', 'SouthNode', 'EastPoint', 'Vertex', 'Lilith', 'Priapo']);
const visibleAdditionalObjects = new Set(optionalObjects);
let orbLimit = 5;
let currentChart = null;
let currentSolarChart = null;
let currentNatalInput = null;
let interpretationData = null;
const planetIds = { Sun: 0, Moon: 1, Mercury: 2, Venus: 3, Mars: 4, Jupiter: 5, Saturn: 6, Uranus: 7, Neptune: 8, Pluto: 9, Ascendant: 10, Midheaven: 11, NorthNode: 13, SouthNode: 14, Lilith: 17, Priapo: 18, Vertex: 16, Chiron: 19, Demeter: 20, Vesta: 23, Fortune: 12 };
const balanceBodies = { Sun: 3, Moon: 3, Mercury: 2, Venus: 2, Mars: 2, Jupiter: 2, Saturn: 2, Uranus: 1, Neptune: 1, Pluto: 1, Ascendant: 3, Midheaven: 1 };
const balanceQualities = { Sun: 2, Moon: 2, Mercury: 1, Venus: 1, Mars: 1, Jupiter: 1, Saturn: 1, Uranus: 1, Neptune: 1, Pluto: 1, Ascendant: 2, Midheaven: 2 };
const signRhythms = ['Cardeal', 'Fixo', 'Mutavel', 'Cardeal', 'Fixo', 'Mutavel', 'Cardeal', 'Fixo', 'Mutavel', 'Cardeal', 'Fixo', 'Mutavel'];
const signPolarities = ['Positivo', 'Negativo', 'Positivo', 'Negativo', 'Positivo', 'Negativo', 'Positivo', 'Negativo', 'Positivo', 'Negativo', 'Positivo', 'Negativo'];
const cities = { 'sao paulo': [-23.5505, -46.6333, -3], 'rio de janeiro': [-22.9068, -43.1729, -3], 'brasilia': [-15.7939, -47.8828, -3], 'lisboa': [38.7223, -9.1393, 0], 'london': [51.5072, -0.1276, 0], 'new york': [40.7128, -74.006, -5] };
const selectedCityLocations = new Map();
const cityShardCache = new Map();
const cityCatalogPromise = window.location.protocol === 'file:'
  ? Promise.resolve(null)
  : fetch('./data/cities/index.json').then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).catch((error) => {
    console.error('Catálogo de cidades indisponível.', error);
    return null;
  });
let locationPickersReady = Promise.resolve();
const brazilianStateNames = Object.entries({ acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA', ceara: 'CE', 'distrito federal': 'DF', 'espirito santo': 'ES', goias: 'GO', maranhao: 'MA', 'mato grosso do sul': 'MS', 'mato grosso': 'MT', 'minas gerais': 'MG', paraiba: 'PB', parana: 'PR', pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS', rondonia: 'RO', roraima: 'RR', 'santa catarina': 'SC', 'sao paulo': 'SP', sergipe: 'SE', tocantins: 'TO', para: 'PA' }).sort(([first], [second]) => second.length - first.length);
const brazilianCityStates = { 'sao paulo': 'SP', 'rio de janeiro': 'RJ', brasilia: 'DF' };
const brazilDstRulesPromise = window.location.protocol === 'file:'
  ? Promise.resolve([])
  : fetch('./data/brazil_dst.csv').then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }).then((csv) => csv.trim().split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
    const [start, end, stateList] = line.split(',');
    return { start, end, states: stateList === '*' ? null : stateList.split(';') };
  })).catch((error) => {
    console.warn('Tabela brasileira de horario de verao indisponivel.', error);
    return [];
  });
const orbitals = {
  Mercury: [48.3313, 3.24587e-5, 7.0047, 5e-8, 29.1241, 1.01444e-5, 0.387098, 0, 0.205635, 5.59e-10, 168.6562, 4.0923344368],
  Venus: [76.6799, 2.4659e-5, 3.3946, 2.75e-8, 54.891, 1.38374e-5, 0.72333, 0, 0.006773, -1.302e-9, 48.0052, 1.6021302244],
  Mars: [49.5574, 2.11081e-5, 1.8497, -1.78e-8, 286.5016, 2.92961e-5, 1.523688, 0, 0.093405, 2.516e-9, 18.6021, 0.5240207766],
  Jupiter: [100.4542, 2.76854e-5, 1.303, -1.557e-7, 273.8777, 1.64505e-5, 5.20256, 0, 0.048498, 4.469e-9, 19.895, 0.0830853001],
  Saturn: [113.6634, 2.3898e-5, 2.4886, -1.081e-7, 339.3939, 2.97661e-5, 9.55475, 0, 0.055546, -9.499e-9, 316.967, 0.0334442282]
};

function mod(value, divisor = 360) { return ((value % divisor) + divisor) % divisor; }
function radians(value) { return value * Math.PI / 180; }
function degrees(value) { return value * 180 / Math.PI; }
function signAt(longitude) { return Math.floor(mod(longitude) / 30); }
function normalizePlace(place) { return place.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
function cityData(place) {
  const normalizedPlace = normalizePlace(place);
  const selected = selectedCityLocations.get(normalizedPlace);
  if (selected) return selected;
  const normalizedCity = normalizedPlace.split(',')[0].trim();
  return cities[normalizedCity] || null;
}

async function initializeLocationPickers() {
  const catalog = await cityCatalogPromise;
  if (!catalog?.countries?.length) return;
  const countriesById = new Map(catalog.countries.map((country) => [country.id, country]));
  const getShard = (country) => {
    if (!cityShardCache.has(country.id)) {
      cityShardCache.set(country.id, fetch(`./data/cities/${country.file}`).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      }).then((data) => data.cities || []));
    }
    return cityShardCache.get(country.id);
  };

  async function initializePicker(prefix, defaultCountryName, defaultRegionCode, defaultCityName) {
    const countrySelect = document.querySelector(`#${prefix}-country`);
    const regionSelect = document.querySelector(`#${prefix}-region`);
    const regionField = regionSelect?.closest('.location-region-field');
    const cityInput = document.querySelector(`#${prefix}-city`);
    const cityList = document.querySelector(`#${prefix}-city-options`);
    const placeInput = document.querySelector(prefix === 'birth' ? '#place' : '#solar-place');
    if (!countrySelect || !regionSelect || !cityInput || !cityList || !placeInput) return;

    const countries = [...catalog.countries].sort((first, second) => first.name.localeCompare(second.name));
    countrySelect.replaceChildren(new Option('Selecione um país', ''));
    countries.forEach((country) => countrySelect.add(new Option(country.name, country.id)));

    let currentCountry = null;
    let cityRecords = [];
    let regionNameByCode = new Map();
    let countryGeneration = 0;
    let suggestionMatches = [];
    let duplicateCounts = new Map();
    let renderedSuggestionCount = 0;
    let activeSuggestionIndex = -1;
    let chosenLabel = '';
    let chosenRecord = null;

    const clearCity = () => {
      cityInput.value = '';
      cityInput.setCustomValidity('Selecione uma cidade nas sugestões.');
      placeInput.value = '';
      cityList.replaceChildren();
      cityList.hidden = true;
      cityInput.setAttribute('aria-expanded', 'false');
      cityInput.removeAttribute('aria-activedescendant');
      suggestionMatches = [];
      renderedSuggestionCount = 0;
      activeSuggestionIndex = -1;
      chosenLabel = '';
      chosenRecord = null;
    };

    const regionRecords = () => {
      const regionCode = regionSelect.value;
      if (!regionCode) return [];
      return cityRecords.filter((record) => record[1] === regionCode);
    };

    const labelForRecord = (record) => {
      const regionName = regionNameByCode.get(record[1]) || record[1];
      const baseLabel = currentCountry.regions.length > 1 ? `${record[0]} — ${regionName}` : record[0];
      const duplicateKey = `${normalizePlace(record[0])}|${record[1]}`;
      return duplicateCounts.get(duplicateKey) > 1 ? `${baseLabel} · ${Number(record[2]).toFixed(3)}, ${Number(record[3]).toFixed(3)}` : baseLabel;
    };

    const chooseCity = (record, label = labelForRecord(record)) => {
      const canonicalPlace = `${record[0]}, ${record[1]}, ${currentCountry.name}`;
      cityInput.value = label;
      placeInput.value = canonicalPlace;
      selectedCityLocations.set(normalizePlace(canonicalPlace), [record[2], record[3], record[4], record[1], currentCountry.name, record[0]]);
      cityInput.setCustomValidity('');
      cityInput.setAttribute('aria-expanded', 'false');
      cityInput.removeAttribute('aria-activedescendant');
      cityList.hidden = true;
      chosenLabel = label;
      chosenRecord = record;
      activeSuggestionIndex = -1;
    };

    const appendSuggestions = () => {
      const end = Math.min(renderedSuggestionCount + 80, suggestionMatches.length);
      const fragment = document.createDocumentFragment();
      for (let index = renderedSuggestionCount; index < end; index += 1) {
        const record = suggestionMatches[index];
        const option = document.createElement('button');
        option.type = 'button';
        option.id = `${prefix}-city-option-${index}`;
        option.className = 'city-suggestion-option';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', index === activeSuggestionIndex ? 'true' : 'false');
        option.dataset.index = String(index);
        option.textContent = labelForRecord(record);
        fragment.append(option);
      }
      cityList.append(fragment);
      renderedSuggestionCount = end;
      cityList.hidden = suggestionMatches.length === 0;
      cityInput.setAttribute('aria-expanded', String(!cityList.hidden));
    };

    const setActiveSuggestion = (index) => {
      if (index < 0 || index >= renderedSuggestionCount) return;
      cityList.querySelector('[aria-selected="true"]')?.setAttribute('aria-selected', 'false');
      activeSuggestionIndex = index;
      const option = document.getElementById(`${prefix}-city-option-${index}`);
      option?.setAttribute('aria-selected', 'true');
      cityInput.setAttribute('aria-activedescendant', `${prefix}-city-option-${index}`);
      option?.scrollIntoView({ block: 'nearest' });
    };

    const refreshSuggestions = (preferredCity = '') => {
      const records = regionRecords();
      duplicateCounts = new Map();
      records.forEach((record) => {
        const key = `${normalizePlace(record[0])}|${record[1]}`;
        duplicateCounts.set(key, (duplicateCounts.get(key) || 0) + 1);
      });
      const queryText = preferredCity || cityInput.value.split(/[—·]/)[0];
      const query = normalizePlace(queryText);
      suggestionMatches = query.length
        ? records.filter((record) => normalizePlace(record[0]).includes(query))
        : records;
      const exactPreferred = preferredCity
        ? records.find((record) => normalizePlace(record[0]) === normalizePlace(preferredCity))
        : null;
      if (exactPreferred) {
        suggestionMatches = [exactPreferred, ...suggestionMatches.filter((record) => record !== exactPreferred)];
      }
      renderedSuggestionCount = 0;
      activeSuggestionIndex = -1;
      cityList.replaceChildren();
      if (!preferredCity) {
        cityInput.setCustomValidity('Selecione uma cidade nas sugestões.');
        placeInput.value = '';
        chosenLabel = '';
        chosenRecord = null;
      }
      appendSuggestions();
      if (exactPreferred) chooseCity(exactPreferred);
    };

    async function loadCountry(countryId, preferredRegion = '', preferredCity = '') {
      const generation = ++countryGeneration;
      currentCountry = countriesById.get(countryId) || null;
      clearCity();
      if (!currentCountry) {
        regionSelect.replaceChildren(new Option('Selecione um estado/região', ''));
        regionField.hidden = true;
        cityInput.disabled = true;
        cityRecords = [];
        return;
      }
      regionNameByCode = new Map(currentCountry.regions.map((region) => [region.code, region.name]));
      regionSelect.replaceChildren();
      const hasMultipleRegions = currentCountry.regions.length > 1;
      regionField.hidden = !hasMultipleRegions;
      regionSelect.required = hasMultipleRegions;
      if (hasMultipleRegions) regionSelect.add(new Option('Selecione um estado/região', ''));
      currentCountry.regions.forEach((region) => regionSelect.add(new Option(region.name, region.code)));
      regionSelect.value = currentCountry.regions.some((region) => region.code === preferredRegion)
        ? preferredRegion
        : hasMultipleRegions ? '' : currentCountry.regions[0]?.code || '';
      cityInput.disabled = hasMultipleRegions && !regionSelect.value;

      try {
        cityRecords = await getShard(currentCountry);
      } catch (error) {
        cityRecords = [];
        console.error(`Cidades de ${currentCountry.name} indisponíveis.`, error);
      }
      if (generation !== countryGeneration) return;
      refreshSuggestions(preferredCity);
    }

    countrySelect.addEventListener('change', () => loadCountry(countrySelect.value));
    regionSelect.addEventListener('change', () => {
      clearCity();
      cityInput.disabled = currentCountry?.regions.length > 1 && !regionSelect.value;
      refreshSuggestions();
    });
    cityInput.addEventListener('input', () => refreshSuggestions());
    cityInput.addEventListener('focus', () => {
      if (!chosenRecord) refreshSuggestions();
    });
    cityInput.addEventListener('change', () => {
      if (chosenRecord && cityInput.value === chosenLabel) return;
      const query = normalizePlace(cityInput.value.split(/[—·]/)[0]);
      const exact = regionRecords().find((record) => normalizePlace(record[0]) === query);
      if (exact) chooseCity(exact);
      else refreshSuggestions();
    });
    cityInput.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (cityList.hidden) refreshSuggestions();
        if (renderedSuggestionCount === 0) return;
        setActiveSuggestion(Math.min(activeSuggestionIndex + 1, renderedSuggestionCount - 1));
      } else if (event.key === 'ArrowUp' && !cityList.hidden) {
        event.preventDefault();
        setActiveSuggestion(Math.max(activeSuggestionIndex - 1, 0));
      } else if (event.key === 'Enter' && !cityList.hidden) {
        const query = normalizePlace(cityInput.value.split(/[—·]/)[0]);
        const exact = suggestionMatches.find((record) => normalizePlace(record[0]) === query);
        const record = exact || (activeSuggestionIndex >= 0 ? suggestionMatches[activeSuggestionIndex] : null);
        if (record) {
          event.preventDefault();
          chooseCity(record);
        }
      } else if (event.key === 'Escape') {
        cityList.hidden = true;
        cityInput.setAttribute('aria-expanded', 'false');
      }
    });
    cityList.addEventListener('click', (event) => {
      const option = event.target.closest('[role="option"]');
      if (option) chooseCity(suggestionMatches[Number(option.dataset.index)]);
    });
    cityList.addEventListener('scroll', () => {
      if (cityList.scrollTop + cityList.clientHeight >= cityList.scrollHeight - 32 && renderedSuggestionCount < suggestionMatches.length) {
        appendSuggestions();
      }
    });

    const defaultCountry = countries.find((country) => normalizePlace(country.name) === normalizePlace(defaultCountryName));
    countrySelect.value = defaultCountry?.id || '';
    await loadCountry(countrySelect.value, defaultRegionCode, defaultCityName);
  }

  await Promise.all([
    initializePicker('birth', 'Brasil', 'SP', 'São Paulo'),
    initializePicker('solar', 'Brasil', 'SP', 'São Paulo')
  ]);
}

locationPickersReady = initializeLocationPickers();

function brazilianStateForPlace(place) {
  const normalized = normalizePlace(place);
  const stateCode = normalized.match(/(?:^|[\s,/-])(ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to)(?=$|[\s,/-])/);
  if (stateCode) return stateCode[1].toUpperCase();
  const namedState = brazilianStateNames.find(([name]) => normalized.includes(name));
  if (namedState) return namedState[1];
  return brazilianCityStates[normalized.split(',')[0].trim()] || null;
}

async function hasHistoricalBrazilianDst(place, date) {
  const normalized = normalizePlace(place);
  const state = brazilianStateForPlace(place);
  const city = normalized.split(',')[0].trim();
  const isBrazilianLocation = Boolean(state || brazilianCityStates[city] || /(?:^|[\s,])(brasil|brazil)(?:$|[\s,])/.test(normalized));
  if (!isBrazilianLocation) return false;
  const rules = await brazilDstRulesPromise;
  return rules.some((rule) => date >= rule.start && date <= rule.end && (!rule.states || (state && rule.states.includes(state))));
}

function effectiveZone(place, daylightSaving = false) {
  const location = cityData(place) || cities['sao paulo'];
  return daylightSaving ? location[2] + 1 : location[2];
}

function correctedMoonLongitude(longitude) {
  return mod(longitude + 3.134);
}

function julianDate(date, time, zone) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return Date.UTC(year, month - 1, day, hour - zone, minute) / 86400000 + 2440587.5;
}
function roundedLongitude(longitude) { return mod(Math.round(mod(longitude) * 60) / 60); }
function toDegreeText(longitude) {
  const withinSign = mod(roundedLongitude(longitude), 30);
  const totalMinutes = Math.round(withinSign * 60);
  const degree = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(degree).padStart(2, '0')}° ${String(minute).padStart(2, '0')}′`;
}
function positionText(longitude) {
  const normalized = roundedLongitude(longitude);
  return `${toDegreeText(normalized)} ${signNames[signAt(normalized)]}`;
}

function withLunarNodes(longitudes) {
  const result = { ...longitudes };
  if (Number.isFinite(result.Node)) {
    result.NorthNode = result.Node;
    result.SouthNode = mod(result.Node + 180);
    delete result.Node;
  }
  if (Number.isFinite(result.Lilith)) result.Priapo = mod(result.Lilith + 180);
  return result;
}

function visibleLongitudes(longitudes) {
  return Object.fromEntries(Object.entries(longitudes).filter(([planet]) => !optionalObjects.has(planet) || visibleAdditionalObjects.has(planet)));
}

function setOptionalObjectDefaults(mapType) {
  const defaults = mapType === 'solar' ? new Set(['Chiron', 'Fortune', 'NorthNode', 'SouthNode']) : new Set(optionalObjects);
  visibleAdditionalObjects.clear();
  defaults.forEach((object) => visibleAdditionalObjects.add(object));
  document.querySelectorAll('[data-object-toggle]').forEach((control) => {
    control.checked = defaults.has(control.dataset.objectToggle);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function houseAtLongitude(longitude, houses) {
  for (let index = 0; index < 12; index += 1) {
    const start = mod(houses[index]);
    const width = mod(houses[(index + 1) % 12] - start);
    if (mod(longitude - start) < width || width === 0) return index + 1;
  }
  return 1;
}

function interpretationText(collection, key) {
  return interpretationData && interpretationData[collection] ? interpretationData[collection][key] : '';
}

function renderBalanceTables(longitudes) {
  const totals = { elements: { Fogo: 0, Terra: 0, Ar: 0, 'Água': 0 }, rhythms: { Cardeal: 0, Fixo: 0, 'Mutável': 0 }, polarities: { Positivo: 0, Negativo: 0 } };
  Object.entries(balanceBodies).forEach(([planet, points]) => {
    if (!Number.isFinite(longitudes[planet])) return;
    const signIndex = signAt(longitudes[planet]);
    const element = ['Fogo', 'Terra', 'Ar', 'Água'][signIndex % 4];
    totals.elements[element] += points;
    totals.rhythms[signRhythms[signIndex].replace('Mutavel', 'Mutável')] += balanceQualities[planet];
    totals.polarities[signPolarities[signIndex]] += balanceQualities[planet];
  });
  const renderRows = (element, values) => Object.entries(values).map(([label, value]) => `<div><b>${label}</b><strong>${value}</strong></div>`).join('');
  document.querySelector('#element-balance').innerHTML = renderRows('elements', totals.elements);
  document.querySelector('#rhythm-balance').innerHTML = renderRows('rhythms', totals.rhythms);
  document.querySelector('#polarity-balance').innerHTML = renderRows('polarities', totals.polarities);
}

function renderNatalInterpretation(content, chart) {
  const longitudes = visibleLongitudes(chart.longitudes || {});
  if (!Number.isFinite(longitudes.Ascendant) && Number.isFinite(chart.rising)) longitudes.Ascendant = chart.rising;
  if (!Number.isFinite(longitudes.Midheaven) && Number.isFinite(chart.midheaven)) longitudes.Midheaven = chart.midheaven;
  const houses = chart.houses.length === 12 ? chart.houses : Array.from({ length: 12 }, (_, index) => mod(chart.rising + index * 30));
  const aspects = chartAspects(longitudes);
  const planetLabels = { Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercúrio', Venus: 'Vênus', Mars: 'Marte', Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Netuno', Pluto: 'Plutão', Ascendant: 'Ascendente' };
  const aspectSectionLabels = { Sun: 'Aspectos do Sol', Ascendant: 'Aspectos do Ascendente', Moon: 'Aspectos da Lua', Mercury: 'Aspectos do Mercúrio', Venus: 'Aspectos da Vênus', Mars: 'Aspectos de Marte', Jupiter: 'Aspectos de Júpiter', Saturn: 'Aspectos de Saturno', Uranus: 'Aspectos de Urano', Neptune: 'Aspectos de Netuno', Pluto: 'Aspectos de Plutão' };
  const section = (title, cards) => `<section class="interpretation-topic"><h3 class="interpretation-subtitle">${title}</h3><div class="interpretation-grid">${cards.join('')}</div></section>`;
  const card = (title, text) => {
    const paragraphs = (Array.isArray(text) ? text : [text]).filter(Boolean);
    return `<article class="interpretation-card"><h4>${escapeHtml(title)}</h4>${(paragraphs.length ? paragraphs : ['Interpretação indisponível.']).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</article>`;
  };
  const planetSignText = (planet, longitude) => {
    const planetId = planetIds[planet];
    const signId = signAt(longitude);
    return interpretationText('planetSigns', `${planetId}:${signId}`) || [interpretationText('planets', `${planetId}`), interpretationText('signs', `${signId}`)].filter(Boolean).join(' ');
  };
  const planetSignCard = (planet) => {
    const longitude = longitudes[planet];
    const signId = signAt(longitude);
    return card(`${planetLabels[planet] || objectNames[planet]} no signo ${signNames[signId]}`, planetSignText(planet, longitude));
  };
  const planetHouseCard = (planet) => {
    const houseId = houseAtLongitude(longitudes[planet], houses);
    const planetId = planetIds[planet];
    const text = interpretationText('planetHouses', `${planetId}:${houseId}`) || interpretationText('houses', `${houseId}`);
    return card(`${planetLabels[planet] || objectNames[planet]} na casa ${houseId}`, text);
  };
  const houseSignCard = (houseId) => {
    const signId = signAt(houses[houseId - 1]);
    return card(`Casa ${houseId} no signo ${signNames[signId]}`, interpretationText('houseSigns', `${signId}:${houseId}`));
  };
  const aspectsCard = (planet) => {
    const planetId = planetIds[planet];
    const related = aspects.filter((aspect) => aspect.firstPlanet === planet || aspect.secondPlanet === planet);
    const paragraphs = related.map((aspect) => {
      const aspectKey = Object.keys(aspectNames).find((key) => aspectNames[key] === aspect.name);
      const aspectId = ['conjunction', 'sextile', 'square', 'trine', 'opposition'].indexOf(aspectKey);
      const firstId = planetIds[aspect.firstPlanet];
      const secondId = planetIds[aspect.secondPlanet];
      const text = interpretationText('aspects', `${aspectId}:${firstId}:${secondId}`) || interpretationText('aspects', `${aspectId}:${secondId}:${firstId}`);
      const otherPlanet = aspect.firstPlanet === planet ? aspect.secondPlanet : aspect.firstPlanet;
      return `${objectNames[otherPlanet] || otherPlanet} · ${aspectGlyphNames[aspectKey]}${text ? `: ${text}` : ''}`;
    });
    return card(aspectSectionLabels[planet] || `Aspectos de ${planetLabels[planet] || objectNames[planet]}`, paragraphs.length ? paragraphs : 'Nenhum aspecto selecionado dentro da orbe atual.');
  };
  const dominantElement = () => {
    const totals = { Fogo: 0, Terra: 0, Ar: 0, 'Água': 0 };
    Object.entries(balanceBodies).forEach(([planet, points]) => {
      if (!Number.isFinite(longitudes[planet])) return;
      const signIndex = signAt(longitudes[planet]);
      const element = ['Fogo', 'Terra', 'Ar', 'Água'][signIndex % 4];
      totals[element] += points;
    });
    const highest = Math.max(...Object.values(totals));
    return Object.entries(totals).filter(([, score]) => score === highest).map(([element]) => `${element} (${highest} pontos)`).join(' e ');
  };

  const firstHouseSign = signAt(houses[0]);
  const ascendantText = Number.isFinite(longitudes.Ascendant) ? planetSignText('Ascendant', longitudes.Ascendant) : '';
  const firstHouseText = interpretationText('houseSigns', `${firstHouseSign}:1`);
  const ascendantHouseCard = card(`Casa 1 / Ascendente no signo ${signNames[firstHouseSign]}`, [ascendantText, firstHouseText]);
  const planetSection = (planet) => [planetSignCard(planet), planetHouseCard(planet), aspectsCard(planet)];

  content.innerHTML = `<h3 class="interpretation-subtitle">Interpretação do Mapa Natal</h3>${section('Identidade', [planetSignCard('Sun'), ascendantHouseCard, planetHouseCard('Sun'), aspectsCard('Sun'), aspectsCard('Ascendant'), houseSignCard(5)])}${section('Temperamento', [card('Elemento predominante', dominantElement())])}${section('Emocional', [planetSignCard('Moon'), planetHouseCard('Moon'), aspectsCard('Moon'), houseSignCard(4)])}${section('Forma de Pensar / Intelecto', [...planetSection('Mercury'), houseSignCard(3), houseSignCard(6)])}${section('Afetividade / Forma de Amar', [...planetSection('Venus'), houseSignCard(2), houseSignCard(7)])}${section('Força Interior / Força de Vontade', planetSection('Mars'))}${section('Oportunidades de Expansão e Crescimento', [...planetSection('Jupiter'), houseSignCard(9)])}${section('Desafios e Pontos Importantes', [...planetSection('Saturn'), houseSignCard(10)])}${section('Libertação e Revolução', [...planetSection('Uranus'), houseSignCard(11)])}${section('Espiritualidade e Acreditar em Si', [...planetSection('Neptune'), houseSignCard(12)])}${section('Transformação / Força Potencial', [...planetSection('Pluto'), houseSignCard(8)])}`;
}

function renderInterpretation() {
  const content = document.querySelector('#interpretation-content');
  const interpretationChart = document.querySelector('#map-type')?.value === 'solar' && currentSolarChart ? currentSolarChart : currentChart;
  if (!content || !interpretationChart || !interpretationData) return;
  if (document.querySelector('#map-type')?.value !== 'solar') {
    renderNatalInterpretation(content, interpretationChart);
    return;
  }
  const houses = interpretationChart.houses.length === 12 ? interpretationChart.houses : Array.from({ length: 12 }, (_, index) => mod(interpretationChart.rising + index * 30));
  const entries = Object.entries(visibleLongitudes(interpretationChart.longitudes)).filter(([planet, longitude]) => planetIds[planet] !== undefined && Number.isFinite(longitude));
  const placementMarkup = entries.map(([planet, longitude]) => {
    const planetId = planetIds[planet];
    const signId = signAt(longitude);
    const houseId = houseAtLongitude(longitude, houses);
    const signText = interpretationText('planetSigns', `${planetId}:${signId}`) || [interpretationText('planets', `${planetId}`), interpretationText('signs', `${signId}`)].filter(Boolean).join(' ');
    const houseText = interpretationText('planetHouses', `${planetId}:${houseId}`) || interpretationText('houses', `${houseId}`);
    return `<article class="interpretation-card"><h3>${escapeHtml(objectNames[planet] || planet)} em ${escapeHtml(signNames[signId])}</h3><p>${escapeHtml(signText || 'Texto de planeta no signo indisponivel.')}</p><h4>Na casa ${houseId}</h4><p>${escapeHtml(houseText || 'Texto de planeta na casa indisponivel.')}</p></article>`;
  }).join('');
  const houseSignMarkup = houses.map((cusp, index) => {
    const houseId = index + 1;
    const signId = signAt(cusp);
    const text = interpretationText('houseSigns', `${signId}:${houseId}`);
    return `<article class="interpretation-card"><h3>Casa ${houseId} abre em ${escapeHtml(toDegreeText(cusp))} ${escapeHtml(signNames[signId])}</h3><p>${escapeHtml(text || 'Texto de signo na casa indisponivel.')}</p></article>`;
  }).join('');
  const aspectEntries = chartAspects(interpretationChart.longitudes);
  const aspectMarkup = aspectEntries.map(({ firstPlanet, secondPlanet, name, color }) => {
    const definition = Object.entries(aspectNames).find(([, label]) => label === name);
    const aspectId = definition ? ['conjunction', 'sextile', 'square', 'trine', 'opposition'].indexOf(definition[0]) : -1;
    const firstId = planetIds[firstPlanet];
    const secondId = planetIds[secondPlanet];
    const text = interpretationText('aspects', `${aspectId}:${firstId}:${secondId}`) || interpretationText('aspects', `${aspectId}:${secondId}:${firstId}`);
    return `<article class="interpretation-card aspect-card"><h3 style="color:${color}">${escapeHtml(objectNames[firstPlanet])} / ${escapeHtml(objectNames[secondPlanet])} · ${escapeHtml(name)}</h3><p>${escapeHtml(text || 'Texto deste aspecto indisponivel.')}</p></article>`;
  }).join('');
  const title = document.querySelector('#map-type')?.value === 'solar' ? 'Interpretação da Revolução Solar' : 'Interpretação do Mapa Natal';
  content.innerHTML = `<h3 class="interpretation-subtitle">${title}</h3><h3 class="interpretation-subtitle">Casas nos signos</h3><div class="interpretation-grid">${houseSignMarkup}</div><h3 class="interpretation-subtitle">Planetas nos signos e casas</h3><div class="interpretation-grid">${placementMarkup}</div><h3 class="interpretation-subtitle">Aspectos selecionados</h3><div class="interpretation-grid">${aspectMarkup || '<p class="readout-empty">Nenhum aspecto selecionado.</p>'}</div>`;
}

function chartAspects(longitudes, selectedPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Midheaven']) {
  const aspectDefinitions = [
    { key: 'conjunction', angle: 0, orb: 8, color: aspectColors.conjunction },
    { key: 'sextile', angle: 60, orb: 5, color: aspectColors.sextile },
    { key: 'square', angle: 90, orb: 6, color: aspectColors.square },
    { key: 'trine', angle: 120, orb: 6, color: aspectColors.trine },
    { key: 'opposition', angle: 180, orb: 8, color: aspectColors.opposition }
  ];
  const visible = visibleLongitudes(longitudes);
  const aspectPlanets = selectedPlanets.filter((planet) => Number.isFinite(visible[planet]));
  const aspects = [];

  for (let firstIndex = 0; firstIndex < aspectPlanets.length; firstIndex += 1) {
    const firstPlanet = aspectPlanets[firstIndex];
    for (let secondIndex = firstIndex + 1; secondIndex < aspectPlanets.length; secondIndex += 1) {
      const secondPlanet = aspectPlanets[secondIndex];
      const separation = Math.abs(mod(visible[firstPlanet] - visible[secondPlanet] + 180, 360) - 180);
      const definition = aspectDefinitions.find((candidate) => visibleAspects.has(candidate.key) && Math.abs(separation - candidate.angle) <= Math.min(candidate.orb, orbLimit));
      if (definition) aspects.push({ firstPlanet, secondPlanet, name: aspectNames[definition.key], color: definition.color, orb: Math.abs(separation - definition.angle) });
    }
  }

  return aspects;
}

function crossChartAspects(solarLongitudes, natalLongitudes) {
  const aspectDefinitions = [
    { key: 'conjunction', angle: 0, orb: 8, color: aspectColors.conjunction },
    { key: 'sextile', angle: 60, orb: 5, color: aspectColors.sextile },
    { key: 'square', angle: 90, orb: 6, color: aspectColors.square },
    { key: 'trine', angle: 120, orb: 6, color: aspectColors.trine },
    { key: 'opposition', angle: 180, orb: 8, color: aspectColors.opposition }
  ];
  const points = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Midheaven'];
  const aspects = [];
  Object.entries(visibleLongitudes(solarLongitudes)).forEach(([firstPlanet, firstLongitude]) => {
    if (!points.includes(firstPlanet) || !Number.isFinite(firstLongitude)) return;
    Object.entries(visibleLongitudes(natalLongitudes)).forEach(([secondPlanet, secondLongitude]) => {
      if (!points.includes(secondPlanet) || !Number.isFinite(secondLongitude)) return;
      const separation = Math.abs(mod(firstLongitude - secondLongitude + 180, 360) - 180);
      const definition = aspectDefinitions.find((candidate) => visibleAspects.has(candidate.key) && Math.abs(separation - candidate.angle) <= Math.min(candidate.orb, orbLimit));
      if (definition) aspects.push({ firstPlanet, secondPlanet, name: aspectNames[definition.key], color: definition.color, orb: Math.abs(separation - definition.angle) });
    });
  });
  return aspects;
}

function renderAspectMatrixTo(container, rowLongitudes, columnLongitudes = null, upperTriangleOnly = false) {
  if (!container) return;
  const rows = visibleLongitudes(rowLongitudes);
  const columns = columnLongitudes ? visibleLongitudes(columnLongitudes) : rows;
  const rowPlanets = planetReadoutOrder.filter((planet) => Number.isFinite(rows[planet]));
  const columnPlanets = planetReadoutOrder.filter((planet) => Number.isFinite(columns[planet]));
  const definitions = [
    { key: 'conjunction', angle: 0, orb: 8, color: aspectColors.conjunction },
    { key: 'sextile', angle: 60, orb: 5, color: aspectColors.sextile },
    { key: 'square', angle: 90, orb: 6, color: aspectColors.square },
    { key: 'trine', angle: 120, orb: 6, color: aspectColors.trine },
    { key: 'opposition', angle: 180, orb: 8, color: aspectColors.opposition }
  ];
  const aspectByPair = new Map();
  rowPlanets.forEach((firstPlanet, rowIndex) => columnPlanets.forEach((secondPlanet, columnIndex) => {
    if (!columnLongitudes && rowIndex >= columnIndex) return;
    const separation = Math.abs(mod(rows[firstPlanet] - columns[secondPlanet] + 180, 360) - 180);
    const definition = definitions.find((candidate) => visibleAspects.has(candidate.key) && Math.abs(separation - candidate.angle) <= Math.min(candidate.orb, orbLimit));
    if (!definition) return;
    const marker = `<span class="aspect-mark aspect-mark--${definition.key}" style="color:${definition.color}" role="img" aria-label="${aspectGlyphNames[definition.key]}" title="${aspectGlyphNames[definition.key]}"></span>`;
    aspectByPair.set(`${firstPlanet}|${secondPlanet}`, marker);
    if (!columnLongitudes) aspectByPair.set(`${secondPlanet}|${firstPlanet}`, marker);
  }));
  const axisSymbol = (planet, source) => {
    const symbol = objectLabels[planet] || objectGlyphs[planet] || planet.slice(0, 3).toUpperCase();
    const symbolClass = objectLabels[planet] ? 'aspect-axis-label' : 'aspect-axis-glyph';
    const color = signColors[signElements[signAt(source[planet])]];
    return `<span class="${symbolClass}" style="color:${color}" title="${escapeHtml(objectNames[planet] || planet)}">${escapeHtml(symbol)}</span>`;
  };
  const corner = '<th class="aspect-matrix-corner" aria-hidden="true"></th>';
  const headers = columnPlanets.map((planet) => `<th scope="col">${axisSymbol(planet, columns)}</th>`).join('');
  const rowsMarkup = rowPlanets.map((firstPlanet, rowIndex) => {
    const cells = columnPlanets.map((secondPlanet, columnIndex) => {
      if (columnLongitudes && rowIndex === columnIndex) return '<td class="aspect-matrix-empty"></td>';
      if (!columnLongitudes && rowIndex === columnIndex) return `<td class="aspect-matrix-diagonal">${axisSymbol(firstPlanet, rows)}</td>`;
      if (!columnLongitudes && upperTriangleOnly && rowIndex > columnIndex) return '<td class="aspect-matrix-empty"></td>';
      return `<td>${aspectByPair.get(`${firstPlanet}|${secondPlanet}`) || ''}</td>`;
    }).join('');
    return `<tr><th scope="row">${axisSymbol(firstPlanet, rows)}</th>${cells}<th scope="row">${axisSymbol(firstPlanet, rows)}</th></tr>`;
  }).join('');
  const footer = `<tfoot><tr>${corner}${headers}${corner}</tr></tfoot>`;
  const legend = Object.entries(aspectGlyphNames).map(([key, label]) => `<span><i class="aspect-mark aspect-mark--${key}" style="color:${aspectColors[key]}" aria-hidden="true"></i>${label}</span>`).join('');
  container.innerHTML = `<div class="aspect-matrix-scroll"><table class="aspect-matrix" aria-label="Matriz de aspectos"><thead><tr>${corner}${headers}${corner}</tr></thead><tbody>${rowsMarkup}</tbody>${footer}</table></div><div class="aspect-matrix-legend">${legend}</div>`;
}

function orbitalLongitude(planet, days) {
  const [n0, nd, i0, id, w0, wd, a0, ad, e0, ed, m0, md] = orbitals[planet];
  const node = radians(n0 + nd * days);
  const inclination = radians(i0 + id * days);
  const perihelion = radians(w0 + wd * days);
  const axis = a0 + ad * days;
  const eccentricity = e0 + ed * days;
  const meanAnomaly = radians(mod(m0 + md * days));
  let eccentricAnomaly = meanAnomaly;
  for (let iteration = 0; iteration < 6; iteration += 1) {
    eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(eccentricAnomaly);
  }
  const x = axis * (Math.cos(eccentricAnomaly) - eccentricity);
  const y = axis * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(eccentricAnomaly);
  const trueAnomaly = Math.atan2(y, x);
  const distance = Math.sqrt(x * x + y * y);
  const heliocentricX = distance * (Math.cos(node) * Math.cos(trueAnomaly + perihelion) - Math.sin(node) * Math.sin(trueAnomaly + perihelion) * Math.cos(inclination));
  const heliocentricY = distance * (Math.sin(node) * Math.cos(trueAnomaly + perihelion) + Math.cos(node) * Math.sin(trueAnomaly + perihelion) * Math.cos(inclination));
  return mod(degrees(Math.atan2(heliocentricY, heliocentricX)));
}

function planetaryLongitudes(jd) {
  const days = jd - 2451543.5;
  const marsLongitude = orbitalLongitude('Mars', days);
  const earthLongitude = marsLongitude + 180;
  const solarDays = jd - 2451545.0;
  const meanLongitude = mod(280.459 + 0.98564736 * solarDays);
  const meanAnomaly = radians(mod(357.529 + 0.98560028 * solarDays));
  const solarLongitude = mod(meanLongitude + 1.9148 * Math.sin(meanAnomaly) + 0.0200 * Math.sin(2 * meanAnomaly) + 0.0003 * Math.sin(3 * meanAnomaly));
  const result = { Sun: solarLongitude };
  Object.keys(orbitals).forEach((planet) => {
    result[planet] = mod(orbitalLongitude(planet, days) + (earthLongitude - marsLongitude) * 0.02);
  });
  result.Moon = mod(218.316 + 13.176396 * days + 6.289 * Math.sin(radians(134.963 + 13.064993 * days)));
  return result;
}

function ascendant(jd, latitude, longitude) {
  const centuries = (jd - 2451545) / 36525;
  const sidereal = mod(280.46061837 + 360.98564736629 * (jd - 2451545) + longitude + 0.000387933 * centuries * centuries);
  const obliquity = radians(23.4393 - 0.013 * centuries);
  return mod(degrees(Math.atan2(-Math.cos(radians(sidereal)), Math.sin(radians(sidereal)) * Math.cos(obliquity) + Math.tan(radians(latitude)) * Math.sin(obliquity))) + 180);
}

function buildFallbackChart(data) {
  const name = data.name || 'visitante';
  const location = cityData(data.place) || cities['sao paulo'];
  const [latitude, longitude, zone] = location;
  const jd = julianDate(data.date, data.time, effectiveZone(data.place, data.daylightSaving));
  const longitudes = planetaryLongitudes(jd);
  longitudes.Moon = correctedMoonLongitude(longitudes.Moon);
  const rising = ascendant(jd, latitude, longitude);

  return {
    chartTitle: `Mapa de ${name}`,
    centerSign: signs[signAt(longitudes.Sun)],
    centerDegree: toDegreeText(longitudes.Sun),
    sunSign: signNames[signAt(longitudes.Sun)],
    moonSign: signNames[signAt(longitudes.Moon)],
    risingSign: signNames[signAt(rising)],
    status: cityData(data.place) ? 'Mapa calculado com data, hora e coordenadas.' : 'Cidade nao reconhecida: usamos Sao Paulo como referencia.',
    longitudes,
    rising,
    houses: Array.from({ length: 12 }, (_, index) => mod(rising + index * 30))
  };
}

function chartFromJulian(jd, place, title) {
  const location = cityData(place) || cities['sao paulo'];
  const [latitude, longitude] = location;
  const longitudes = planetaryLongitudes(jd);
  longitudes.Moon = correctedMoonLongitude(longitudes.Moon);
  const rising = ascendant(jd, latitude, longitude);
  return {
    chartTitle: title,
    longitudes: { ...longitudes, Midheaven: mod(rising + 270) },
    midheaven: mod(rising + 270),
    rising,
    houses: Array.from({ length: 12 }, (_, index) => mod(rising + index * 30)),
    status: cityData(place) ? 'Revolucao calculada com data, hora e local do aniversario.' : 'Cidade nao reconhecida: usamos Sao Paulo como referencia.'
  };
}

function localDateTimeFromJulian(jd, zone) {
  const localDate = new Date((jd - 2440587.5 + zone / 24) * 86400000);
  const pad = (value) => String(value).padStart(2, '0');
  return {
    date: `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())}`,
    time: `${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}`
  };
}

function shiftLocalDateTime(date, time, hours) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day, hour, minute) + hours * 3600000);
  const pad = (value) => String(value).padStart(2, '0');
  return {
    date: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    time: `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`
  };
}

async function solarReturnChart(natalChart, natalData, solarYear, solarPlace) {
  const location = cityData(solarPlace) || cities['sao paulo'];
  const [, , baseZone] = location;
  const natalSun = natalChart.longitudes.Sun;
  const natalLocation = cityData(natalData.place) || cities['sao paulo'];
  const natalDaylightSaving = await hasHistoricalBrazilianDst(natalData.place, natalData.date);
  const natalJd = julianDate(natalData.date, natalData.time, effectiveZone(natalData.place, natalDaylightSaving));
  const fallbackNatalSun = planetaryLongitudes(natalJd).Sun;
  const solarCorrection = degrees(Math.atan2(Math.sin(radians(natalSun - fallbackNatalSun)), Math.cos(radians(natalSun - fallbackNatalSun))));
  const monthDay = natalData.date.slice(5);
  const approximateDate = `${solarYear}-${monthDay}`;
  const approximateDaylightSaving = await hasHistoricalBrazilianDst(solarPlace, approximateDate);
  const approximateZone = effectiveZone(solarPlace, approximateDaylightSaving);
  const approximateJd = julianDate(approximateDate, '12:00', approximateZone);
  const difference = (jd) => Math.atan2(Math.sin(radians(planetaryLongitudes(jd).Sun + solarCorrection - natalSun)), Math.cos(radians(planetaryLongitudes(jd).Sun + solarCorrection - natalSun)));
  let low = approximateJd - 3;
  let high = approximateJd + 3;
  for (let iteration = 0; iteration < 50; iteration += 1) {
    const middle = (low + high) / 2;
    if (difference(middle) > 0) high = middle;
    else low = middle;
  }
  const returnJd = (low + high) / 2;
  let local = localDateTimeFromJulian(returnJd, baseZone);
  for (let iteration = 0; iteration < 2; iteration += 1) {
    const returnDaylightSaving = await hasHistoricalBrazilianDst(solarPlace, local.date);
    const zonedLocal = localDateTimeFromJulian(returnJd, effectiveZone(solarPlace, returnDaylightSaving));
    if (zonedLocal.date === local.date && zonedLocal.time === local.time) break;
    local = zonedLocal;
  }
  const chart = chartFromJulian(returnJd, solarPlace, `Revolucao Solar ${solarYear}`);
  chart.longitudes.Sun = mod(chart.longitudes.Sun + solarCorrection);
  return { ...chart, returnDate: local.date, returnTime: local.time, returnPlace: solarPlace };
}

async function calculateSolarChart(natalChart, natalData, solarYear, solarPlace) {
  const estimate = await solarReturnChart(natalChart, natalData, solarYear, solarPlace);
  let returnDate = estimate.returnDate;
  let returnTime = estimate.returnTime;
  let solarResult = null;

  if (window.astroWasm && !window.astroWasmLoading) {
    for (let iteration = 0; iteration < 3; iteration += 1) {
      solarResult = await callAstroApi({ name: `${natalData.name} Revolucao Solar`, date: returnDate, time: returnTime, place: solarPlace });
      if (!solarResult.longitudes || !Number.isFinite(solarResult.longitudes.Sun)) break;
      const difference = degrees(Math.atan2(Math.sin(radians(solarResult.longitudes.Sun - natalChart.longitudes.Sun)), Math.cos(radians(solarResult.longitudes.Sun - natalChart.longitudes.Sun))));
      if (Math.abs(difference) < 0.0001) break;
      const shifted = shiftLocalDateTime(returnDate, returnTime, -difference / 0.041);
      returnDate = shifted.date;
      returnTime = shifted.time;
    }
  }

  const chart = solarResult && solarResult.longitudes ? solarResult : estimate;
  const longitudes = withLunarNodes(chart.longitudes);
  if (Number.isFinite(chart.midheaven)) longitudes.Midheaven = chart.midheaven;
  return {
    ...chart,
    chartTitle: `Revolucao Solar ${solarYear}`,
    longitudes,
    rising: chart.rising ?? estimate.rising,
    houses: chart.houses && chart.houses.length === 12 ? chart.houses : estimate.houses,
    midheaven: chart.midheaven,
    returnDate,
    returnTime,
    returnPlace: solarPlace
  };
}

async function callAstroApi(data) {
  const payload = {
    name: data.name,
    date: data.date,
    time: data.time,
    place: data.place
  };
  const daylightSaving = await hasHistoricalBrazilianDst(payload.place, payload.date);
  const [latitude, longitude, utcOffset] = cityData(payload.place) || [NaN, NaN, NaN];

  if (window.astroWasm && typeof window.astroWasm.computeJsonApi === 'function') {
    const json = window.astroWasm.computeJsonApi(payload.name, payload.date, payload.time, payload.place, daylightSaving, latitude, longitude, utcOffset);
    const result = JSON.parse(json);
    if (result.sunLongitude !== undefined) {
      result.longitudes = result.longitudes || { Sun: result.sunLongitude, Moon: result.moonLongitude };
      result.rising = result.ascendantLongitude;
      result.houses = result.houses || [];
      result.centerSign = signs[Number(result.centerSign)] || result.centerSign;
      result.sunSign = signNames[result.sunSignIndex];
      result.moonSign = signNames[result.moonSignIndex];
      result.risingSign = signNames[result.risingSignIndex];
    }
    return { ...result, daylightSaving };
  }

  if (window.astroWasmLoading) {
    return { ...buildFallbackChart({ ...data, daylightSaving }), daylightSaving };
  }

  if (window.location.protocol !== 'file:') {
    try {
      const response = await fetch('/api/natal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, daylightSaving })
      });
      if (response.ok) {
        return { ...await response.json(), daylightSaving };
      }
    } catch (error) {
      console.warn('API real indisponivel, usando fallback local.', error);
    }
  }

  return { ...buildFallbackChart({ ...data, daylightSaving }), daylightSaving };
}

function drawChart(longitudes, rising, houses = [], targetCanvas = canvas, updateReadout = true, transparent = false, outerLayer = false, anchorRising = rising) {
  context = targetCanvas.getContext('2d');
  const size = targetCanvas.width;
  const center = size / 2;
  const radius = size * (document.querySelector('#map-type')?.value === 'solar' ? 0.33 : 0.38);
  const ascendantLongitude = mod(anchorRising || 0);
  const plottedLongitudes = { ...visibleLongitudes(longitudes), Ascendant: rising };
  const chartAngle = (longitude) => radians(180 + ascendantLongitude - mod(longitude));
  const displayAngles = {};
  const displayRadii = {};
  const displayEntries = Object.entries(plottedLongitudes).filter(([, longitude]) => Number.isFinite(longitude)).sort(([, first], [, second]) => first - second);
  const displayGroups = [];
  displayEntries.forEach((entry) => {
    const currentGroup = displayGroups[displayGroups.length - 1];
    if (!currentGroup || mod(entry[1] - currentGroup[currentGroup.length - 1][1]) > 4) displayGroups.push([entry]);
    else currentGroup.push(entry);
  });
  if (displayGroups.length > 1 && mod(displayGroups[0][0][1] - displayGroups[displayGroups.length - 1][displayGroups[displayGroups.length - 1].length - 1][1]) < 4) {
    displayGroups[0] = displayGroups[displayGroups.length - 1].concat(displayGroups[0]);
    displayGroups.pop();
  }
  displayGroups.forEach((group) => {
    group.forEach(([planet, longitude], index) => {
      displayAngles[planet] = chartAngle(longitude);
      displayRadii[planet] = radius * (0.63 + (index % 3) * 0.065);
    });
  });

  context.clearRect(0, 0, size, size);
  if (!transparent) {
    context.fillStyle = colors.paper;
    context.fillRect(0, 0, size, size);
  }
  context.strokeStyle = colors.line;
  context.lineWidth = 1;

  const houseCusps = houses.length === 12 ? houses : Array.from({ length: 12 }, (_, index) => mod(rising + index * 30));
  const solarHouseRing = !outerLayer && document.querySelector('#map-type')?.value === 'solar';
  const solarChartLayer = currentSolarChart && longitudes === currentSolarChart.longitudes;
  if (!outerLayer) {
  [radius, radius * 0.82, radius * 0.54].forEach((ring) => {
    context.beginPath();
    context.arc(center, center, ring, 0, Math.PI * 2);
    context.stroke();
  });

  for (let degree = 0; degree < 360; degree += 1) {
    const isFiveDegreeMark = degree % 5 === 0;
    const angle = chartAngle(degree);
    context.strokeStyle = colors.ink;
    context.globalAlpha = isFiveDegreeMark ? 0.9 : 0.65;
    context.lineWidth = isFiveDegreeMark ? 1.5 : 0.7;
    context.beginPath();
    context.moveTo(center + Math.cos(angle) * radius * (isFiveDegreeMark ? 0.91 : 0.95), center + Math.sin(angle) * radius * (isFiveDegreeMark ? 0.91 : 0.95));
    context.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
    context.stroke();
  }
  context.globalAlpha = 1;
  context.lineWidth = 1;

  for (let index = 0; index < 12; index += 1) {
    const boundaryLongitude = index * 30;
    const angle = chartAngle(boundaryLongitude);
    const nextAngle = chartAngle(boundaryLongitude + 30);
    const signColor = signColors[signElements[index]];
    context.fillStyle = signColor;
    context.globalAlpha = 0.12;
    context.beginPath();
    context.moveTo(center + Math.cos(angle) * radius * 0.82, center + Math.sin(angle) * radius * 0.82);
    context.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
    context.arc(center, center, radius, angle, nextAngle, true);
    context.lineTo(center + Math.cos(nextAngle) * radius * 0.82, center + Math.sin(nextAngle) * radius * 0.82);
    context.arc(center, center, radius * 0.82, nextAngle, angle, false);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;

    const signLongitude = boundaryLongitude + 15;
    const labelAngle = chartAngle(signLongitude);
    context.fillStyle = signColor;
    context.font = '30px Astrovida, "Segoe UI Symbol", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(signGlyphs[index], center + Math.cos(labelAngle) * radius * 0.86, center + Math.sin(labelAngle) * radius * 0.86);
  }

  }

  if (outerLayer) {
    const natalHouseLayer = currentChart && longitudes === currentChart.longitudes;
    context.strokeStyle = colors.ink;
    context.globalAlpha = 0.8;
    context.lineWidth = 1.2;
    context.beginPath();
    context.arc(center, center, radius * 1.02, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(center, center, radius * 1.18, 0, Math.PI * 2);
    context.stroke();
    houseCusps.forEach((cusp, index) => {
      const angle = chartAngle(cusp);
      context.beginPath();
      context.moveTo(center + Math.cos(angle) * radius * 1.02, center + Math.sin(angle) * radius * 1.02);
      context.lineTo(center + Math.cos(angle) * radius * 1.18, center + Math.sin(angle) * radius * 1.18);
      context.stroke();
      const nextCusp = houseCusps[(index + 1) % 12];
      const midpoint = mod(cusp + mod(nextCusp - cusp) / 2);
      const numberAngle = chartAngle(midpoint);
      context.font = '700 13px DM Mono';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const numberRadius = radius * 1.08;
      const numberX = center + Math.cos(numberAngle) * numberRadius;
      const numberY = center + Math.sin(numberAngle) * numberRadius;
      if (!natalHouseLayer) {
        context.fillStyle = colors.paper;
        context.globalAlpha = 0.92;
        context.fillRect(numberX - 9, numberY - 9, 18, 18);
      }
      context.globalAlpha = 1;
      context.fillStyle = solarChartLayer ? signColors[signElements[signAt(cusp)]] : colors.ink;
      context.globalAlpha = natalHouseLayer ? 0.82 : 1;
      context.font = natalHouseLayer ? '500 12px DM Mono' : '700 13px DM Mono';
      context.fillText(String(index + 1), numberX, numberY);
      context.globalAlpha = 1;
    });
    context.globalAlpha = 1;
  }

  if (!outerLayer) {
  houseCusps.forEach((cusp, index) => {
    const angle = chartAngle(cusp);
    context.strokeStyle = colors.ink;
    context.globalAlpha = 0.5;
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(center + Math.cos(angle) * radius * 0.54, center + Math.sin(angle) * radius * 0.54);
    context.lineTo(center + Math.cos(angle) * radius * 0.82, center + Math.sin(angle) * radius * 0.82);
    context.stroke();
    context.globalAlpha = 1;
    context.lineWidth = 1;

    const nextCusp = houseCusps[(index + 1) % 12];
    const midpoint = mod(cusp + mod(nextCusp - cusp) / 2);
    const numberAngle = chartAngle(midpoint);
    if (!solarHouseRing) {
      context.fillStyle = signColors[signElements[signAt(cusp)]];
      context.globalAlpha = 1;
      context.font = '700 12px DM Mono';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(String(index + 1), center + Math.cos(numberAngle) * radius * 1.08, center + Math.sin(numberAngle) * radius * 1.08);
    }
    if (!solarHouseRing) {
      const cuspLabelAngle = chartAngle(cusp);
      context.strokeStyle = colors.ink;
      context.globalAlpha = 0.65;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(center + Math.cos(cuspLabelAngle) * radius, center + Math.sin(cuspLabelAngle) * radius);
      context.lineTo(center + Math.cos(cuspLabelAngle) * radius * 1.1, center + Math.sin(cuspLabelAngle) * radius * 1.1);
      context.stroke();
      context.globalAlpha = 1;
      context.fillStyle = signColors[signElements[signAt(cusp)]];
      context.font = '700 12px "DM Mono"';
      context.fillText(toDegreeText(cusp), center + Math.cos(cuspLabelAngle) * radius * 1.16, center + Math.sin(cuspLabelAngle) * radius * 1.16);
    }
  });
  }

  if (solarHouseRing) {
    context.strokeStyle = colors.ink;
    context.globalAlpha = 0.8;
    context.lineWidth = 1.2;
    context.beginPath();
    context.arc(center, center, radius * 1.3, 0, Math.PI * 2);
    context.stroke();
    houseCusps.forEach((cusp, index) => {
      const angle = chartAngle(cusp);
      context.beginPath();
      context.moveTo(center + Math.cos(angle) * radius * 1.2, center + Math.sin(angle) * radius * 1.2);
      context.lineTo(center + Math.cos(angle) * radius * 1.3, center + Math.sin(angle) * radius * 1.3);
      context.stroke();
      const nextCusp = houseCusps[(index + 1) % 12];
      const midpoint = mod(cusp + mod(nextCusp - cusp) / 2);
      const numberAngle = chartAngle(midpoint);
      const numberRadius = radius * 1.25;
      const numberX = center + Math.cos(numberAngle) * numberRadius;
      const numberY = center + Math.sin(numberAngle) * numberRadius;
      context.fillStyle = colors.paper;
      context.globalAlpha = 0.94;
      context.fillRect(numberX - 9, numberY - 9, 18, 18);
      context.globalAlpha = 1;
      context.fillStyle = solarChartLayer ? signColors[signElements[signAt(cusp)]] : colors.ink;
      context.font = '700 13px DM Mono';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(String(index + 1), numberX, numberY);
      context.fillStyle = solarChartLayer ? signColors[signElements[signAt(cusp)]] : colors.ink;
      context.font = index === 0 || index === 6 ? '700 11px "DM Mono"' : '700 9px "DM Mono"';
      context.textAlign = index === 0 ? 'right' : index === 6 ? 'left' : Math.cos(angle) > 0.2 ? 'left' : Math.cos(angle) < -0.2 ? 'right' : 'center';
      context.textBaseline = 'middle';
      const labelX = index === 0 ? center - radius * 1.22 : index === 6 ? center + radius * 1.22 : center + Math.cos(angle) * radius * 1.38;
      const labelY = index === 0 || index === 6 ? center + Math.sin(angle) * radius * 1.24 : center + Math.sin(angle) * radius * 1.38;
      context.fillText(toDegreeText(cusp), labelX, labelY);
    });
    context.globalAlpha = 1;
  }

  const planetColors = { Sun: colors.gold, Moon: colors.coral, Mercury: colors.mint, Venus: colors.coral, Mars: colors.ink, Jupiter: colors.gold, Saturn: colors.mint, Uranus: colors.mint, Neptune: colors.coral, Pluto: colors.ink, Chiron: colors.gold, Demeter: colors.mint, Vesta: colors.coral, Node: colors.ink, Lilith: colors.coral, Fortune: colors.gold, Vertex: colors.mint, Ascendant: colors.ink };
  const aspects = chartAspects(longitudes);

  if (!outerLayer) {
  aspects.forEach(({ firstPlanet, secondPlanet, name, color }) => {
    const firstAngle = displayAngles[firstPlanet] || chartAngle(longitudes[firstPlanet]);
    const secondAngle = displayAngles[secondPlanet] || chartAngle(longitudes[secondPlanet]);
    const firstDistance = outerLayer ? radius * 0.96 : displayRadii[firstPlanet] || radius * 0.74;
    const secondDistance = outerLayer ? radius * 0.96 : displayRadii[secondPlanet] || radius * 0.74;
    context.strokeStyle = color;
    context.globalAlpha = name === aspectNames.conjunction ? 0.95 : 0.75;
    context.lineWidth = name === aspectNames.conjunction ? 2 : 1.3;
    context.beginPath();
    context.moveTo(center + Math.cos(firstAngle) * firstDistance, center + Math.sin(firstAngle) * firstDistance);
    context.lineTo(center + Math.cos(secondAngle) * secondDistance, center + Math.sin(secondAngle) * secondDistance);
    context.stroke();
  });
  context.globalAlpha = 1;
  context.lineWidth = 1;
  }

  Object.entries(plottedLongitudes).forEach(([planet, longitude]) => {
    if (!Number.isFinite(longitude)) return;
    const angle = displayAngles[planet] || chartAngle(longitude);
    const symbolDistance = outerLayer ? radius * 1.1 : displayRadii[planet] || radius * 0.74;
    context.fillStyle = signColors[signElements[signAt(longitude)]];
    context.font = objectLabels[planet] ? '700 12px "DM Mono"' : '22px Astrovida';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(objectLabels[planet] || objectGlyphs[planet] || planet.slice(0, 3).toUpperCase(), center + Math.cos(angle) * symbolDistance, center + Math.sin(angle) * symbolDistance);
  });

  if (updateReadout) {
    const readout = document.querySelector('#planet-readout');
    if (readout) {
      const order = new Map(planetReadoutOrder.map((planet, index) => [planet, index]));
      const readoutEntries = Object.entries(plottedLongitudes)
        .filter(([, longitude]) => Number.isFinite(longitude))
        .sort(([first], [second]) => (order.get(first) ?? Infinity) - (order.get(second) ?? Infinity));
      readout.innerHTML = readoutEntries.map(([planet, longitude]) => {
        const displayLongitude = roundedLongitude(longitude);
        const pointLabel = objectLabels[planet];
        const symbol = pointLabel === 'ASC' || pointLabel === 'EP' ? pointLabel : objectGlyphs[planet] || '';
        const symbolClass = pointLabel === 'ASC' || pointLabel === 'EP' ? ' class="readout-point-label"' : '';
        const signIndex = signAt(displayLongitude);
        const signColor = signColors[signElements[signIndex]];
        return `<span><b><i${symbolClass} style="color:${signColor}">${symbol}</i>${objectNames[planet] || planet}</b><small style="color:${signColor}">${toDegreeText(displayLongitude)} <span class="readout-sign">${signGlyphs[signIndex]}</span></small></span>`;
      }).join('');
    }

    const houseReadout = document.querySelector('#house-readout');
    if (houseReadout) {
      houseReadout.innerHTML = houseCusps.map((cusp, index) => {
        const displayCusp = roundedLongitude(cusp);
        const cuspSignIndex = signAt(displayCusp);
        const cuspDegree = toDegreeText(displayCusp);
        const cuspSignGlyph = signGlyphs[cuspSignIndex];
        const cuspColor = signColors[signElements[cuspSignIndex]];
        const natalHouseStyle = solarHouseRing ? '' : ` style="color:${cuspColor};font-weight:700"`;
        const natalCuspStyle = solarHouseRing ? '' : ` style="color:${cuspColor};font-weight:700"`;
        return `<span><b${natalHouseStyle}>Casa ${index + 1}</b><small${natalCuspStyle}>${cuspDegree} <span class="readout-sign">${cuspSignGlyph}</span></small></span>`;
      }).join('');
    }

    const aspectReadout = document.querySelector('#aspect-readout');
    if (aspectReadout) {
      const matrixLongitudes = visibleLongitudes(longitudes);
      const matrixPlanets = planetReadoutOrder.filter((planet) => Number.isFinite(matrixLongitudes[planet]));
      const matrixAspects = chartAspects(matrixLongitudes, matrixPlanets);
      const aspectByPair = new Map();
      matrixAspects.forEach((aspect) => {
        const key = Object.keys(aspectNames).find((aspectKey) => aspectNames[aspectKey] === aspect.name);
        if (!key) return;
        const marker = `<span class="aspect-mark aspect-mark--${key}" style="color:${aspect.color}" role="img" aria-label="${aspectGlyphNames[key]}" title="${aspectGlyphNames[key]}"></span>`;
        aspectByPair.set(`${aspect.firstPlanet}|${aspect.secondPlanet}`, marker);
        aspectByPair.set(`${aspect.secondPlanet}|${aspect.firstPlanet}`, marker);
      });
      const axisSymbol = (planet) => {
        const symbol = objectLabels[planet] || objectGlyphs[planet] || planet.slice(0, 3).toUpperCase();
        const symbolClass = objectLabels[planet] ? 'aspect-axis-label' : 'aspect-axis-glyph';
        const color = signColors[signElements[signAt(matrixLongitudes[planet])]];
        return `<span class="${symbolClass}" style="color:${color}" title="${escapeHtml(objectNames[planet] || planet)}">${escapeHtml(symbol)}</span>`;
      };
      const columnHeaders = matrixPlanets.map((planet) => `<th scope="col">${axisSymbol(planet)}</th>`).join('');
      const columnFooters = matrixPlanets.map((planet) => `<th scope="col">${axisSymbol(planet)}</th>`).join('');
      const upperTriangleOnly = document.querySelector('#map-type')?.value === 'natal';
      const matrixRows = matrixPlanets.map((firstPlanet, rowIndex) => {
        const rowHeader = `<th scope="row">${axisSymbol(firstPlanet)}</th>`;
        const rowFooter = `<th scope="row">${axisSymbol(firstPlanet)}</th>`;
        const cells = matrixPlanets.map((secondPlanet, columnIndex) => {
          if (rowIndex === columnIndex) return `<td class="aspect-matrix-diagonal">${upperTriangleOnly ? '' : axisSymbol(firstPlanet)}</td>`;
          if (upperTriangleOnly && rowIndex > columnIndex) return '<td class="aspect-matrix-empty"></td>';
          return `<td>${aspectByPair.get(`${firstPlanet}|${secondPlanet}`) || ''}</td>`;
        }).join('');
        return `<tr>${rowHeader}${cells}${rowFooter}</tr>`;
      }).join('');
      const corner = '<th class="aspect-matrix-corner" aria-hidden="true"></th>';
      const bottomAxis = `<tfoot><tr>${corner}${columnFooters}${corner}</tr></tfoot>`;
      const legend = Object.entries(aspectGlyphNames).map(([key, label]) => `<span><i class="aspect-mark aspect-mark--${key}" style="color:${aspectColors[key]}" aria-hidden="true"></i>${label}</span>`).join('');
      aspectReadout.innerHTML = `<div class="aspect-matrix-scroll"><table class="aspect-matrix" aria-label="Matriz de aspectos do mapa"><thead><tr>${corner}${columnHeaders}${corner}</tr></thead><tbody>${matrixRows}</tbody>${bottomAxis}</table></div><div class="aspect-matrix-legend">${legend}</div>`;
    }
  }

}

function renderNatalView() {
  const chartWrap = document.querySelector('#chart-wrap');
  const solarPair = document.querySelector('#solar-pair');
  const overlayCanvas = document.querySelector('#solar-overlay-chart');
  if (chartWrap) chartWrap.hidden = false;
  if (solarPair) solarPair.hidden = true;
  if (overlayCanvas) overlayCanvas.hidden = true;
  document.querySelector('#natal-aspect-section').hidden = false;
  document.querySelector('#solar-aspect-section').hidden = true;
  document.querySelector('#cross-aspect-section').hidden = true;
  if (currentChart) {
    renderBalanceTables(currentChart.longitudes);
    drawChart(currentChart.longitudes, currentChart.rising, currentChart.houses, canvas, true, false);
    renderAspectMatrixTo(document.querySelector('#aspect-readout'), currentChart.longitudes, null, true);
  }
}

function renderSolarLayers() {
  if (!currentChart || !currentSolarChart) return;
  const innerIsSolar = document.querySelector('#solar-inner')?.value !== 'natal';
  const innerChart = innerIsSolar ? currentSolarChart : currentChart;
  const outerChart = innerIsSolar ? currentChart : currentSolarChart;
  const layout = document.querySelector('#solar-layout')?.value || 'overlay';
  const chartWrap = document.querySelector('#chart-wrap');
  const solarPair = document.querySelector('#solar-pair');
  const overlayCanvas = document.querySelector('#solar-overlay-chart');

  document.querySelector('#chart-title').textContent = innerIsSolar ? 'Revolução Solar' : 'Mapa Natal';
  document.querySelector('#form-status').textContent = `Retorno solar: ${currentSolarChart.returnDate} ${currentSolarChart.returnTime} · ${currentSolarChart.returnPlace}`;
  renderBalanceTables(innerChart.longitudes);
  document.querySelector('#natal-aspect-section').hidden = false;
  document.querySelector('#solar-aspect-section').hidden = false;
  document.querySelector('#cross-aspect-section').hidden = false;
  renderAspectMatrixTo(document.querySelector('#aspect-readout'), currentChart.longitudes, null, true);
  renderAspectMatrixTo(document.querySelector('#solar-aspect-readout'), currentSolarChart.longitudes, null, true);
  renderAspectMatrixTo(document.querySelector('#solar-cross-readout'), currentChart.longitudes, currentSolarChart.longitudes, false);

  if (layout === 'side-by-side') {
    if (chartWrap) chartWrap.hidden = true;
    if (solarPair) solarPair.hidden = false;
    if (overlayCanvas) overlayCanvas.hidden = true;
    const firstCanvas = document.querySelector('#solar-pair-first');
    const secondCanvas = document.querySelector('#solar-pair-second');
    drawChart(innerChart.longitudes, innerChart.rising, innerChart.houses, firstCanvas, true, false);
    drawChart(outerChart.longitudes, outerChart.rising, outerChart.houses, secondCanvas, false, false);
    renderAspectMatrixTo(document.querySelector('#aspect-readout'), currentChart.longitudes, null, true);
    renderAspectMatrixTo(document.querySelector('#solar-aspect-readout'), currentSolarChart.longitudes, null, true);
    renderAspectMatrixTo(document.querySelector('#solar-cross-readout'), currentChart.longitudes, currentSolarChart.longitudes, false);
    return;
  }

  if (chartWrap) chartWrap.hidden = false;
  if (solarPair) solarPair.hidden = true;
  if (overlayCanvas) overlayCanvas.hidden = false;
  drawChart(innerChart.longitudes, innerChart.rising, innerChart.houses, canvas, true, false);
  drawChart(outerChart.longitudes, outerChart.rising, outerChart.houses, overlayCanvas, false, true, true, innerChart.rising);
  renderAspectMatrixTo(document.querySelector('#aspect-readout'), currentChart.longitudes, null, true);
  renderAspectMatrixTo(document.querySelector('#solar-aspect-readout'), currentSolarChart.longitudes, null, true);
  renderAspectMatrixTo(document.querySelector('#solar-cross-readout'), currentChart.longitudes, currentSolarChart.longitudes, false);
}

async function renderSolarExperience() {
  if (!currentChart || !currentNatalInput) return;
  const solarYear = Number(document.querySelector('#solar-year')?.value) || new Date().getFullYear();
  const solarPlace = document.querySelector('#solar-place')?.value.trim() || currentNatalInput.place;
  currentSolarChart = await calculateSolarChart(currentChart, currentNatalInput, solarYear, solarPlace);
  await renderChartMetadata();
  renderSolarLayers();
}

function redrawActiveView() {
  if (document.querySelector('#map-type')?.value === 'solar' && currentSolarChart) renderSolarLayers();
  else renderNatalView();
}

function formatCoordinate(value, positiveHemisphere, negativeHemisphere) {
  let degreesValue = Math.floor(Math.abs(value));
  let minutes = Math.round((Math.abs(value) - degreesValue) * 60);
  if (minutes === 60) {
    degreesValue += 1;
    minutes = 0;
  }
  return `${degreesValue}° ${String(minutes).padStart(2, '0')}′ ${value < 0 ? negativeHemisphere : positiveHemisphere}`;
}

function formatUtcOffset(offset) {
  const totalMinutes = Math.round(Math.abs(offset) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const sign = offset < 0 ? '−' : '+';
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function metadataCard(title, data, daylightSaving) {
  const location = cityData(data.place) || cities['sao paulo'];
  const [latitude, longitude] = location;
  const fields = [
    ['Nome', data.name || 'visitante'],
    ['Data', data.date.split('-').reverse().join('/')],
    ['Horário', data.time],
    ['Local', data.place],
    ['Latitude', formatCoordinate(latitude, 'N', 'S')],
    ['Longitude', formatCoordinate(longitude, 'L', 'O')],
    ['Fuso horário', formatUtcOffset(effectiveZone(data.place, daylightSaving))]
  ];
  return `<section class="metadata-card"><h3>${title}</h3><dl>${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl></section>`;
}

async function renderChartMetadata() {
  const container = document.querySelector('#chart-metadata');
  if (!container || !currentNatalInput) return;
  const isSolar = document.querySelector('#map-type')?.value === 'solar' && currentSolarChart;
  const natalDaylightSaving = await hasHistoricalBrazilianDst(currentNatalInput.place, currentNatalInput.date);
  const natalCard = metadataCard('Mapa Natal', currentNatalInput, natalDaylightSaving);
  if (!isSolar) {
    container.classList.remove('solar-metadata');
    container.innerHTML = natalCard;
    return;
  }
  const solarData = {
    name: currentNatalInput.name,
    date: currentSolarChart.returnDate,
    time: currentSolarChart.returnTime,
    place: currentSolarChart.returnPlace
  };
  const solarDaylightSaving = await hasHistoricalBrazilianDst(solarData.place, solarData.date);
  container.classList.add('solar-metadata');
  container.innerHTML = `${natalCard}${metadataCard('Revolução Solar', solarData, solarDaylightSaving)}`;
}

async function renderMap() {
  await locationPickersReady;
  const name = document.querySelector('#name').value.trim() || 'visitante';
  const date = document.querySelector('#date').value || '1990-06-21';
  const time = document.querySelector('#time').value || '12:00';
  const place = document.querySelector('#place').value || 'Sao Paulo, Brasil';
  const mapType = document.querySelector('#map-type')?.value || 'natal';
  const solarFields = document.querySelector('#solar-fields');
  if (solarFields) solarFields.hidden = mapType !== 'solar';
  currentNatalInput = { name, date, time, place };

  const result = await callAstroApi({ name, date, time, place });
  const chartData = result.longitudes ? result : buildFallbackChart({ name, date, time, place, daylightSaving: result.daylightSaving });

  document.querySelector('#chart-title').textContent = mapType === 'solar' ? 'Revolução Solar' : 'Mapa Natal';
  document.querySelector('#sun-sign').textContent = result.sunSign || chartData.sunSign;
  document.querySelector('#moon-sign').textContent = result.moonSign || chartData.moonSign;
  document.querySelector('#rising-sign').textContent = result.risingSign || chartData.risingSign;
  const statusMessage = result.status || chartData.status;
  document.querySelector('#form-status').textContent = statusMessage === 'Calculado pelo nucleo CalcMapa legado.' ? '' : statusMessage;

  currentChart = { chartTitle: result.chartTitle || `Mapa de ${name}`, longitudes: withLunarNodes(chartData.longitudes || buildFallbackChart({ name, date, time, place, daylightSaving: result.daylightSaving }).longitudes), rising: chartData.rising ?? buildFallbackChart({ name, date, time, place, daylightSaving: result.daylightSaving }).rising, houses: chartData.houses || [] };
  if (Number.isFinite(chartData.midheaven)) currentChart.longitudes.Midheaven = chartData.midheaven;
  if (mapType === 'solar') await renderSolarExperience();
  else {
    currentSolarChart = null;
    await renderChartMetadata();
    renderNatalView();
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await renderMap();
});

const navigationLinks = [...document.querySelectorAll('.nav-link')];
const viewPanels = [...document.querySelectorAll('.view-panel')];

function showView(viewId) {
  if (!viewPanels.some((panel) => panel.id === viewId)) return;
  viewPanels.forEach((panel) => { panel.hidden = panel.id !== viewId; });
  navigationLinks.forEach((link) => {
    const isActive = link.hash === `#${viewId}`;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
  if (viewId === 'mapa' && currentChart) redrawActiveView();
}

navigationLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showView(link.hash.slice(1));
  });
});
document.querySelector('.text-link')?.addEventListener('click', (event) => {
  event.preventDefault();
  showView('ascendente');
});
window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
showView('mapa');

['map-type', 'solar-year', 'solar-place', 'solar-layout', 'solar-inner'].forEach((id) => {
  document.querySelector(`#${id}`)?.addEventListener('change', () => {
    if (id === 'map-type') setOptionalObjectDefaults(document.querySelector('#map-type').value);
    renderMap();
  });
});

window.addEventListener('astro-wasm-ready', () => {
  renderMap();
});

document.querySelectorAll('[data-aspect]').forEach((control) => {
  control.addEventListener('change', () => {
    if (control.checked) visibleAspects.add(control.dataset.aspect);
    else visibleAspects.delete(control.dataset.aspect);
    if (currentChart) redrawActiveView();
  });
});

document.querySelectorAll('[data-object-toggle]').forEach((control) => {
  control.addEventListener('change', () => {
    if (control.checked) visibleAdditionalObjects.add(control.dataset.objectToggle);
    else visibleAdditionalObjects.delete(control.dataset.objectToggle);
    if (currentChart) {
      redrawActiveView();
      if (!document.querySelector('#interpretation-panel')?.hidden) renderInterpretation();
    }
  });
});

const orbControl = document.querySelector('#aspect-orb');
const orbValue = document.querySelector('#aspect-orb-value');
if (orbControl) {
  orbControl.addEventListener('input', () => {
    orbLimit = Number(orbControl.value);
    if (orbValue) orbValue.value = `${orbLimit}°`;
    if (orbValue) orbValue.textContent = `${orbLimit}°`;
    if (currentChart) redrawActiveView();
  });
}

const interpretationReady = fetch('./data/interpretations.json').then((response) => response.json()).then((data) => { interpretationData = data; if (!document.querySelector('#interpretation-panel')?.hidden) renderInterpretation(); return data; }).catch(() => null);
document.querySelector('#interpret-button')?.addEventListener('click', () => {
  const panel = document.querySelector('#interpretation-panel');
  if (!panel) return;
  panel.hidden = false;
  renderInterpretation();
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.querySelector('#print-chart')?.addEventListener('click', async () => {
  await interpretationReady;
  const panel = document.querySelector('#interpretation-panel');
  if (panel && interpretationData) {
    panel.hidden = false;
    renderInterpretation();
  }
  window.print();
});

renderMap();
