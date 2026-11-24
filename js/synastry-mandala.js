const planetOrder = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Midheaven'];
const planetGlyphs = {
  Sun: '\u00a2', Moon: '\u00a1', Mercury: '\u00a3', Venus: '\u00a4', Mars: '\u00a5',
  Jupiter: '\u00a6', Saturn: '\u00a7', Uranus: '\u00a8', Neptune: '\u00a9', Pluto: '\u00aa',
  Ascendant: 'ASC', Midheaven: 'MC'
};
const signGlyphs = Array.from({ length: 12 }, (_, index) => String.fromCharCode(0xf4 + index));
const signColors = ['#C0392B', '#4A5D23', '#E8B923', '#2E5BB8'];
const signElements = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];
const aspectColors = { conjunction: '#71857b', sextile: '#5d9b72', square: '#c94f4f', trine: '#4d73b3', opposition: '#c94f4f' };
const aspectAngles = [
  { key: 'conjunction', angle: 0, orb: 8 }, { key: 'sextile', angle: 60, orb: 5 },
  { key: 'square', angle: 90, orb: 6 }, { key: 'trine', angle: 120, orb: 6 }, { key: 'opposition', angle: 180, orb: 8 }
];
const mod = (value, divisor = 360) => ((value % divisor) + divisor) % divisor;
const signAt = (longitude) => Math.floor(mod(longitude) / 30);
const angleAt = (longitude, anchor) => (180 + anchor - mod(longitude)) * Math.PI / 180;

function positionedPlanets(longitudes, anchor, radius) {
  const entries = planetOrder.filter((planet) => Number.isFinite(longitudes?.[planet]))
    .map((planet) => [planet, longitudes[planet]]).sort((first, second) => first[1] - second[1]);
  const groups = [];
  entries.forEach((entry) => {
    const group = groups.at(-1);
    if (!group || mod(entry[1] - group.at(-1)[1]) > 4) groups.push([entry]);
    else group.push(entry);
  });
  if (groups.length > 1 && mod(groups[0][0][1] - groups.at(-1).at(-1)[1]) < 4) groups[0] = groups.pop().concat(groups[0]);
  return groups.flatMap((group) => group.map(([planet, longitude], index) => ({
    planet, longitude, angle: angleAt(longitude, anchor), radius: radius * (0.63 + (index % 3) * 0.065)
  })));
}

function strokeCircle(context, center, radius, color = '#526872', width = 1) {
  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.strokeStyle = color;
  context.lineWidth = width;
  context.stroke();
}

function chartAspects(longitudes) {
  const points = planetOrder.filter((planet) => Number.isFinite(longitudes?.[planet]));
  const results = [];
  for (let first = 0; first < points.length; first += 1) {
    for (let second = first + 1; second < points.length; second += 1) {
      const separation = Math.abs(mod(longitudes[points[first]] - longitudes[points[second]] + 180) - 180);
      const aspect = aspectAngles.find(({ angle, orb }) => Math.abs(separation - angle) <= orb);
      if (aspect) results.push({ first: points[first], second: points[second], key: aspect.key });
    }
  }
  return results;
}

function drawBase(context, canvas, chart, name, anchor = chart.longitudes.Ascendant, solarHouseRing = false) {
  const size = canvas.width;
  const center = size / 2;
  // The solar-chart presentation in app.js uses this same scale so that both
  // synastry layers have room for the outer house ring and cusp labels.
  const radius = size * 0.33;
  const houses = chart.houses?.length === 12 ? chart.houses : Array.from({ length: 12 }, (_, index) => mod(anchor + index * 30));
  const planets = positionedPlanets(chart.longitudes, anchor, radius);
  const positions = new Map(planets.map((planet) => [planet.planet, planet]));
  context.save();
  context.fillStyle = '#fffefa';
  context.fillRect(0, 0, size, size);
  [radius, radius * 0.82, radius * 0.54].forEach((ring) => strokeCircle(context, center, ring));

  for (let degree = 0; degree < 360; degree += 1) {
    const angle = angleAt(degree, anchor);
    context.beginPath();
    context.moveTo(center + Math.cos(angle) * radius * (degree % 5 === 0 ? 0.91 : 0.95), center + Math.sin(angle) * radius * (degree % 5 === 0 ? 0.91 : 0.95));
    context.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
    context.strokeStyle = '#162e43';
    context.lineWidth = degree % 5 === 0 ? 1.3 : 0.65;
    context.globalAlpha = degree % 5 === 0 ? 0.9 : 0.58;
    context.stroke();
  }
  context.globalAlpha = 1;

  for (let sign = 0; sign < 12; sign += 1) {
    const start = angleAt(sign * 30, anchor);
    const end = angleAt((sign + 1) * 30, anchor);
    context.beginPath();
    context.moveTo(center + Math.cos(start) * radius * 0.82, center + Math.sin(start) * radius * 0.82);
    context.lineTo(center + Math.cos(start) * radius, center + Math.sin(start) * radius);
    context.arc(center, center, radius, start, end, true);
    context.lineTo(center + Math.cos(end) * radius * 0.82, center + Math.sin(end) * radius * 0.82);
    context.arc(center, center, radius * 0.82, end, start, false);
    context.closePath();
    context.fillStyle = signColors[signElements[sign]];
    context.globalAlpha = 0.12;
    context.fill();
    context.globalAlpha = 1;
    const signAngle = angleAt(sign * 30 + 15, anchor);
    context.fillStyle = signColors[signElements[sign]];
    context.font = '30px Astrovida, "Noto Sans Symbols 2", "Segoe UI Symbol", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(signGlyphs[sign], center + Math.cos(signAngle) * radius * 0.86, center + Math.sin(signAngle) * radius * 0.86);
  }

  houses.forEach((cusp, index) => {
    const angle = angleAt(cusp, anchor);
    const next = houses[(index + 1) % 12];
    const midpoint = mod(cusp + mod(next - cusp) / 2);
    context.beginPath();
    context.moveTo(center + Math.cos(angle) * radius * 0.54, center + Math.sin(angle) * radius * 0.54);
    context.lineTo(center + Math.cos(angle) * radius * 0.82, center + Math.sin(angle) * radius * 0.82);
    context.strokeStyle = '#162e43';
    context.globalAlpha = 0.5;
    context.lineWidth = 1;
    context.stroke();
    context.globalAlpha = 1;
    const numberAngle = angleAt(midpoint, anchor);
    if (!solarHouseRing) {
      context.fillStyle = signColors[signElements[signAt(cusp)]];
      context.font = '700 12px "DM Mono", monospace';
      context.textAlign = 'center';
      context.fillText(String(index + 1), center + Math.cos(numberAngle) * radius * 1.08, center + Math.sin(numberAngle) * radius * 1.08);
      context.beginPath();
      context.moveTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
      context.lineTo(center + Math.cos(angle) * radius * 1.1, center + Math.sin(angle) * radius * 1.1);
      context.strokeStyle = '#162e43';
      context.globalAlpha = 0.65;
      context.stroke();
      context.globalAlpha = 1;
      context.font = '700 10px "DM Mono", monospace';
      context.textAlign = Math.cos(angle) > 0.2 ? 'left' : Math.cos(angle) < -0.2 ? 'right' : 'center';
      context.fillText(cuspDegreeText(cusp), center + Math.cos(angle) * radius * 1.16, center + Math.sin(angle) * radius * 1.16);
    }
  });

  if (solarHouseRing) {
    strokeCircle(context, center, radius * 1.3, '#162e43', 1.25);
    houses.forEach((cusp, index) => {
      const angle = angleAt(cusp, anchor);
      const midpoint = mod(cusp + mod(houses[(index + 1) % 12] - cusp) / 2);
      context.beginPath();
      context.moveTo(center + Math.cos(angle) * radius * 1.2, center + Math.sin(angle) * radius * 1.2);
      context.lineTo(center + Math.cos(angle) * radius * 1.3, center + Math.sin(angle) * radius * 1.3);
      context.strokeStyle = '#162e43';
      context.globalAlpha = 0.85;
      context.lineWidth = 1.2;
      context.stroke();
      context.globalAlpha = 1;
      const labelAngle = angleAt(midpoint, anchor);
      const labelX = center + Math.cos(labelAngle) * radius * 1.25;
      const labelY = center + Math.sin(labelAngle) * radius * 1.25;
      context.fillStyle = '#fffefa';
      context.fillRect(labelX - 9, labelY - 9, 18, 18);
      context.fillStyle = signColors[signElements[signAt(cusp)]];
      context.font = '700 13px "DM Mono", monospace';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(String(index + 1), labelX, labelY);
      context.font = index === 0 || index === 6 ? '700 11px "DM Mono", monospace' : '700 9px "DM Mono", monospace';
      context.textAlign = index === 0 ? 'right' : index === 6 ? 'left' : Math.cos(angle) > 0.2 ? 'left' : Math.cos(angle) < -0.2 ? 'right' : 'center';
      const degreeX = index === 0 ? center - radius * 1.22 : index === 6 ? center + radius * 1.22 : center + Math.cos(angle) * radius * 1.38;
      const degreeY = index === 0 || index === 6 ? center + Math.sin(angle) * radius * 1.24 : center + Math.sin(angle) * radius * 1.38;
      context.fillText(cuspDegreeText(cusp), degreeX, degreeY);
    });
  }

  chartAspects(chart.longitudes).forEach(({ first, second, key }) => {
    const firstPosition = positions.get(first);
    const secondPosition = positions.get(second);
    if (!firstPosition || !secondPosition) return;
    context.beginPath();
    context.moveTo(center + Math.cos(firstPosition.angle) * firstPosition.radius, center + Math.sin(firstPosition.angle) * firstPosition.radius);
    context.lineTo(center + Math.cos(secondPosition.angle) * secondPosition.radius, center + Math.sin(secondPosition.angle) * secondPosition.radius);
    context.strokeStyle = aspectColors[key];
    context.globalAlpha = key === 'conjunction' ? 0.88 : 0.62;
    context.lineWidth = key === 'conjunction' ? 2 : 1.25;
    context.stroke();
  });
  context.globalAlpha = 1;

  planets.forEach(({ planet, longitude, angle, radius: planetRadius }) => {
    const distance = planetRadius;
    context.fillStyle = signColors[signElements[signAt(longitude)]];
    context.font = planet === 'Ascendant' || planet === 'Midheaven'
      ? '700 12px Montserrat, sans-serif'
      : '22px Astrovida, "Noto Sans Symbols 2", "Segoe UI Symbol", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(planetGlyphs[planet], center + Math.cos(angle) * distance, center + Math.sin(angle) * distance);
  });
  context.restore();
  return { center, radius };
}

function cuspDegreeText(longitude) {
  const minutes = Math.round(mod(longitude, 30) * 60) % 1800;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}° ${String(minutes % 60).padStart(2, '0')}′`;
}

function drawOuterLayer(context, canvas, chart, anchor) {
  const size = canvas.width;
  const center = size / 2;
  const radius = size * 0.33;
  const houses = chart.houses?.length === 12 ? chart.houses : Array.from({ length: 12 }, (_, index) => mod(chart.longitudes.Ascendant + index * 30));
  context.save();
  context.strokeStyle = '#162e43';
  context.globalAlpha = 0.88;
  context.lineWidth = 1.35;
  strokeCircle(context, center, radius * 1.02, '#162e43', 1.35);
  strokeCircle(context, center, radius * 1.18, '#162e43', 1.35);
  houses.forEach((cusp, index) => {
    const angle = angleAt(cusp, anchor);
    const midpoint = mod(cusp + mod(houses[(index + 1) % 12] - cusp) / 2);
    context.beginPath();
    context.moveTo(center + Math.cos(angle) * radius * 1.02, center + Math.sin(angle) * radius * 1.02);
    context.lineTo(center + Math.cos(angle) * radius * 1.18, center + Math.sin(angle) * radius * 1.18);
    context.strokeStyle = '#162e43';
    context.lineWidth = 1.2;
    context.globalAlpha = 0.92;
    context.stroke();
    context.globalAlpha = 1;
    const labelAngle = angleAt(midpoint, anchor);
    const labelX = center + Math.cos(labelAngle) * radius * 1.08;
    const labelY = center + Math.sin(labelAngle) * radius * 1.08;
    context.fillStyle = '#fffefa';
    context.globalAlpha = 0.92;
    context.fillRect(labelX - 9, labelY - 9, 18, 18);
    context.globalAlpha = 1;
    context.fillStyle = signColors[signElements[signAt(cusp)]];
    context.font = '700 13px "DM Mono", monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(index + 1), labelX, labelY);
  });
  positionedPlanets(chart.longitudes, anchor, radius).forEach(({ planet, longitude, angle }) => {
    context.fillStyle = signColors[signElements[signAt(longitude)]];
    context.font = planet === 'Ascendant' || planet === 'Midheaven'
      ? '700 12px Montserrat, sans-serif'
      : '22px Astrovida, "Noto Sans Symbols 2", "Segoe UI Symbol", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(planetGlyphs[planet], center + Math.cos(angle) * radius * 1.1, center + Math.sin(angle) * radius * 1.1);
  });
  context.globalAlpha = 1;
  context.restore();
}

const readoutNames = {
  Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercúrio', Venus: 'Vênus', Mars: 'Marte',
  Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Netuno', Pluto: 'Plutão',
  Ascendant: 'Ascendente', Midheaven: 'Meio do Céu'
};
const romanHouses = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function natalReadout(chart) {
  const planets = planetOrder.filter((planet) => Number.isFinite(chart.longitudes?.[planet])).map((planet) => {
    const longitude = mod(Math.round(mod(chart.longitudes[planet]) * 60) / 60);
    const sign = signAt(longitude);
    const withinSignMinutes = Math.round(mod(longitude, 30) * 60);
    return {
      name: readoutNames[planet], symbol: planetGlyphs[planet], longitude,
      degree: `${String(Math.floor(withinSignMinutes / 60)).padStart(2, '0')}° ${String(withinSignMinutes % 60).padStart(2, '0')}′`,
      signGlyph: signGlyphs[sign], color: signColors[signElements[sign]]
    };
  });
  const houses = (chart.houses || []).map((cusp, index) => {
    const longitude = mod(Math.round(mod(cusp) * 60) / 60);
    const sign = signAt(longitude);
    const withinSignMinutes = Math.round(mod(longitude, 30) * 60);
    return {
      name: romanHouses[index],
      degree: `${String(Math.floor(withinSignMinutes / 60)).padStart(2, '0')}° ${String(withinSignMinutes % 60).padStart(2, '0')}′`,
      signGlyph: signGlyphs[sign], color: signColors[signElements[sign]]
    };
  });
  return { planets, houses };
}

export function drawSynastryMandala(canvas, chart, name) {
  const context = canvas.getContext('2d');
  drawBase(context, canvas, chart, name);
}

export function drawSynastryOverlay(canvas, centerChart, outerChart) {
  const context = canvas.getContext('2d');
  drawBase(context, canvas, centerChart, '', centerChart.longitudes.Ascendant, true);
  drawOuterLayer(context, canvas, outerChart, centerChart.longitudes.Ascendant);
}
