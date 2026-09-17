window.astroWasmLoading = true;

const form = document.querySelector('#birth-form');
const canvas = document.querySelector('#chart');
const context = canvas.getContext('2d');

const signs = ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'];
const signNames = ['Aries', 'Touro', 'Gemeos', 'Cancer', 'Leao', 'Virgem', 'Libra', 'Escorpiao', 'Sagitario', 'Capricornio', 'Aquario', 'Peixes'];
const colors = { ink: '#20252b', coral: '#d97b65', gold: '#d5a34c', mint: '#76a99a', line: '#d8d2c7', paper: '#f4f0e8' };
const objectNames = { Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercurio', Venus: 'Venus', Mars: 'Marte', Jupiter: 'Jupiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Netuno', Pluto: 'Plutao', Chiron: 'Chiron', Demeter: 'Demeter', Vesta: 'Vesta', Node: 'Nodo', Lilith: 'Lilith', Fortune: 'Parte da Fortuna', Vertex: 'Vertex', Ascendant: 'Ascendente' };
const cities = { 'sao paulo': [-23.5505, -46.6333, -3], 'rio de janeiro': [-22.9068, -43.1729, -3], 'brasilia': [-15.7939, -47.8828, -3], 'lisboa': [38.7223, -9.1393, 0], 'london': [51.5072, -0.1276, 0], 'new york': [40.7128, -74.006, -5] };
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
function cityData(place) {
  const normalized = place.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(',')[0].trim();
  return cities[normalized] || null;
}
function julianDate(date, time, zone) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return Date.UTC(year, month - 1, day, hour - zone, minute) / 86400000 + 2440587.5;
}
function toDegreeText(longitude) {
  const normalized = mod(longitude);
  const degree = Math.floor(mod(normalized, 30));
  const minute = Math.floor(((normalized % 1) * 60));
  return `${String(degree).padStart(2, '0')}° ${String(minute).padStart(2, '0')}′`;
}
function positionText(longitude) {
  return `${toDegreeText(longitude)} ${signNames[signAt(longitude)]}`;
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
  const result = { Sun: mod(282.9404 + 4.70935e-5 * days + 356.047 + 0.9856002585 * days) };
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
  return mod(degrees(Math.atan2(-Math.cos(radians(sidereal)), Math.sin(radians(sidereal)) * Math.cos(obliquity) + Math.tan(radians(latitude)) * Math.sin(obliquity))));
}

function buildFallbackChart(data) {
  const name = data.name || 'visitante';
  const location = cityData(data.place) || cities['sao paulo'];
  const [latitude, longitude, zone] = location;
  const jd = julianDate(data.date, data.time, zone);
  const longitudes = planetaryLongitudes(jd);
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

async function callAstroApi(data) {
  const payload = {
    name: data.name,
    date: data.date,
    time: data.time,
    place: data.place
  };

  if (window.astroWasm && typeof window.astroWasm.computeJsonApi === 'function') {
    const json = window.astroWasm.computeJsonApi(payload.name, payload.date, payload.time, payload.place);
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
    return result;
  }

  if (window.astroWasmLoading) {
    return buildFallbackChart(data);
  }

  if (window.location.protocol !== 'file:') {
    try {
      const response = await fetch('/api/natal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('API real indisponivel, usando fallback local.', error);
    }
  }

  return buildFallbackChart(data);
}

function drawChart(longitudes, rising, houses = []) {
  const size = canvas.width;
  const center = size / 2;
  const radius = size * 0.405;
  const ascendantLongitude = mod(rising || 0);
  const plottedLongitudes = { ...longitudes, Ascendant: rising };
  const chartAngle = (longitude) => radians(180 + ascendantLongitude - mod(longitude));

  context.clearRect(0, 0, size, size);
  context.fillStyle = colors.paper;
  context.fillRect(0, 0, size, size);
  context.strokeStyle = colors.line;
  context.lineWidth = 1;

  [radius, radius * 0.82, radius * 0.54].forEach((ring) => {
    context.beginPath();
    context.arc(center, center, ring, 0, Math.PI * 2);
    context.stroke();
  });

  for (let index = 0; index < 12; index += 1) {
    const boundaryLongitude = index * 30;
    const angle = chartAngle(boundaryLongitude);
    context.beginPath();
    context.moveTo(center, center);
    context.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
    context.stroke();

    const signLongitude = boundaryLongitude + 15;
    const labelAngle = chartAngle(signLongitude);
    context.fillStyle = index % 3 === 0 ? colors.coral : colors.ink;
    context.font = '500 13px DM Mono';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(signs[index], center + Math.cos(labelAngle) * radius * 0.9, center + Math.sin(labelAngle) * radius * 0.9);
  }

  const houseCusps = houses.length === 12 ? houses : Array.from({ length: 12 }, (_, index) => mod(rising + index * 30));
  houseCusps.forEach((cusp, index) => {
    const angle = chartAngle(cusp);
    context.strokeStyle = colors.ink;
    context.globalAlpha = 0.7;
    context.beginPath();
    context.moveTo(center, center);
    context.lineTo(center + Math.cos(angle) * radius * 0.82, center + Math.sin(angle) * radius * 0.82);
    context.stroke();
    context.globalAlpha = 1;

    const nextCusp = houseCusps[(index + 1) % 12];
    const midpoint = mod(cusp + mod(nextCusp - cusp) / 2);
    const numberAngle = chartAngle(midpoint);
    context.fillStyle = colors.mint;
    context.font = '500 11px DM Mono';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(index + 1), center + Math.cos(numberAngle) * radius * 0.45, center + Math.sin(numberAngle) * radius * 0.45);
  });

  const planetColors = { Sun: colors.gold, Moon: colors.coral, Mercury: colors.mint, Venus: colors.coral, Mars: colors.ink, Jupiter: colors.gold, Saturn: colors.mint, Uranus: colors.mint, Neptune: colors.coral, Pluto: colors.ink, Chiron: colors.gold, Demeter: colors.mint, Vesta: colors.coral, Node: colors.ink, Lilith: colors.coral, Fortune: colors.gold, Vertex: colors.mint, Ascendant: colors.ink };

  Object.entries(plottedLongitudes).forEach(([planet, longitude]) => {
    if (!Number.isFinite(longitude)) return;
    const angle = chartAngle(longitude);
    const distance = radius * 0.64;
    const x = center + Math.cos(angle) * distance;
    const y = center + Math.sin(angle) * distance;

    context.strokeStyle = planetColors[planet] || colors.ink;
    context.globalAlpha = 0.55;
    context.beginPath();
    context.moveTo(center, center);
    context.lineTo(x, y);
    context.stroke();

    context.globalAlpha = 1;
    context.fillStyle = planetColors[planet] || colors.ink;
    context.beginPath();
    context.arc(x, y, 7, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = colors.ink;
    context.font = planet === 'Ascendant' ? '700 10px DM Mono' : '500 10px DM Mono';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const displayName = objectNames[planet] || planet;
    context.fillText(planet === 'Ascendant' ? 'ASC' : displayName.slice(0, 3).toUpperCase(), center + Math.cos(angle) * radius * 0.74, center + Math.sin(angle) * radius * 0.74);
  });

  const readout = document.querySelector('#planet-readout');
  if (readout) {
    readout.innerHTML = Object.entries(plottedLongitudes).filter(([, longitude]) => Number.isFinite(longitude)).map(([planet, longitude]) => `<span><b>${objectNames[planet] || planet}</b><small>${positionText(longitude)}</small></span>`).join('');
  }

  document.querySelector('#center-sign').textContent = signs[signAt(longitudes.Sun)];
  document.querySelector('#center-degree').textContent = toDegreeText(longitudes.Sun);
}

async function renderMap() {
  const name = document.querySelector('#name').value.trim() || 'visitante';
  const date = document.querySelector('#date').value || '1990-06-21';
  const time = document.querySelector('#time').value || '12:00';
  const place = document.querySelector('#place').value || 'Sao Paulo, Brasil';

  const result = await callAstroApi({ name, date, time, place });
  const chartData = result.longitudes ? result : buildFallbackChart({ name, date, time, place });

  document.querySelector('#chart-title').textContent = result.chartTitle || `Mapa de ${name}`;
  document.querySelector('#sun-sign').textContent = result.sunSign || chartData.sunSign;
  document.querySelector('#moon-sign').textContent = result.moonSign || chartData.moonSign;
  document.querySelector('#rising-sign').textContent = result.risingSign || chartData.risingSign;
  document.querySelector('#form-status').textContent = result.status || chartData.status;
  document.querySelector('#center-sign').textContent = result.centerSign || chartData.centerSign;
  document.querySelector('#center-degree').textContent = result.centerDegree || chartData.centerDegree;

  drawChart(chartData.longitudes || buildFallbackChart({ name, date, time, place }).longitudes, chartData.rising ?? buildFallbackChart({ name, date, time, place }).rising, chartData.houses || []);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await renderMap();
});

window.addEventListener('astro-wasm-ready', () => {
  renderMap();
});

renderMap();
