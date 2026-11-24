import test from 'node:test';
import assert from 'node:assert/strict';
import { describeLongitude, findSynastryAspects, houseForLongitude, overlayPlanets } from '../js/sinastria.js';
import { natalReadout } from '../js/synastry-mandala.js';
import { hasHistoricalBrazilianDstInRules, parseBrazilDstRules } from '../js/daylight-saving.mjs';

const chart = (overrides = {}) => ({
  Sun: 0, Moon: 30, Mercury: 60, Venus: 90, Mars: 120, Jupiter: 150,
  Saturn: 180, Uranus: 210, Neptune: 240, Pluto: 270, Ascendant: 300, Midheaven: 330,
  ...overrides
});

test('identifica conjunção exata e preserva os dois sentidos do par', () => {
  const aspects = findSynastryAspects({ Sun: 359 }, { Moon: 1 }, { maxOrb: 2, enabled: ['conjunction'] });
  assert.deepEqual(aspects.map(({ planetA, planetB, orb }) => [planetA, planetB, orb]), [['Sun', 'Moon', 2]]);
});

test('inclui aspecto no limite da orbe e exclui quando excede o limite', () => {
  const a = { Sun: 0 };
  const b = { Moon: 65 };
  assert.equal(findSynastryAspects(a, b, { maxOrb: 5, enabled: ['sextile'] }).length, 1);
  assert.equal(findSynastryAspects(a, b, { maxOrb: 4.99, enabled: ['sextile'] }).length, 0);
});

test('respeita teto específico de cada aspecto mesmo com limite global maior', () => {
  const a = { Sun: 0 };
  const b = { Moon: 66 };
  b.Moon = 64.99;
  assert.equal(findSynastryAspects(a, b, { maxOrb: 10, enabled: ['sextile'] }).length, 1);
  b.Moon = 65.01;
  assert.equal(findSynastryAspects(a, b, { maxOrb: 10, enabled: ['sextile'] }).length, 0);
});

test('aceita oposição de 180 graus e posições que cruzam zero', () => {
  assert.equal(findSynastryAspects({ Sun: 359 }, { Moon: 179 }, { maxOrb: 0, enabled: ['opposition'] }).length, 1);
});

test('retorna vazio sem posições válidas e valida intervalo do limite global', () => {
  assert.deepEqual(findSynastryAspects({ Sun: NaN }, { Moon: Infinity }), []);
  assert.throws(() => findSynastryAspects(chart(), chart(), { maxOrb: 11 }), RangeError);
});

test('atribui casas em mapa que cruza 360 graus e mantém cúspide no início da casa', () => {
  const houses = Array.from({ length: 12 }, (_, index) => (330 + index * 30) % 360);
  assert.equal(houseForLongitude(359, houses), 1);
  assert.equal(houseForLongitude(0, houses), 2);
  assert.equal(houseForLongitude(330, houses), 1);
});

test('sobrepõe apenas os dez planetas clássicos quando há cúspides válidas', () => {
  const houses = Array.from({ length: 12 }, (_, index) => index * 30);
  const overlay = overlayPlanets(chart(), houses);
  assert.equal(overlay.length, 10);
  assert.equal(overlay.some(({ planet }) => planet === 'Ascendant'), false);
  assert.equal(overlay[0].house, 1);
});

test('arredondamento da posição respeita a virada de signo e 360 graus', () => {
  assert.equal(describeLongitude(29.9999), '00° 00′ Touro');
  assert.equal(describeLongitude(359.9999), '00° 00′ Áries');
});

test('listas de mapa mantêm o padrão e arredondamento de graus e casas', () => {
  const readout = natalReadout({
    longitudes: { Sun: 29.9999, Moon: 359.9999 },
    houses: Array.from({ length: 12 }, (_, index) => index === 0 ? 29.9999 : index * 30)
  });
  assert.deepEqual(readout.planets.map(({ name, degree, signGlyph }) => [name, degree, signGlyph]), [
    ['Sol', '00° 00′', 'õ'], ['Lua', '00° 00′', 'ô']
  ]);
  assert.deepEqual(readout.houses.slice(0, 2).map(({ name, degree }) => [name, degree]), [
    ['I', '00° 00′'], ['II', '00° 00′']
  ]);
});

test('interpreta automaticamente período histórico e limita regra aos estados indicados', () => {
  const rules = parseBrazilDstRules('inicio,fim,estados\n2000-10-08,2001-02-17,SP;RJ\n2001-10-14,2002-02-17,*');
  assert.equal(hasHistoricalBrazilianDstInRules('São Paulo, SP, Brasil', '2000-10-08', rules), true);
  assert.equal(hasHistoricalBrazilianDstInRules('Porto Alegre, RS, Brasil', '2000-12-01', rules), false);
  assert.equal(hasHistoricalBrazilianDstInRules('Porto Alegre, RS, Brasil', '2001-12-01', rules), true);
});

test('não aplica ajuste fora dos períodos cobertos ou fora do Brasil', () => {
  const rules = parseBrazilDstRules('inicio,fim,estados\n2000-10-08,2001-02-17,*');
  assert.equal(hasHistoricalBrazilianDstInRules('São Paulo, SP, Brasil', '2001-02-18', rules), false);
  assert.equal(hasHistoricalBrazilianDstInRules('Lisboa, Lisboa, Portugal', '2000-12-01', rules), false);
});
