const brazilianStateNames = Object.entries({
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA', ceara: 'CE',
  'distrito federal': 'DF', 'espirito santo': 'ES', goias: 'GO', maranhao: 'MA',
  'mato grosso do sul': 'MS', 'mato grosso': 'MT', 'minas gerais': 'MG', paraiba: 'PB',
  parana: 'PR', pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN', 'rio grande do sul': 'RS', rondonia: 'RO',
  roraima: 'RR', 'santa catarina': 'SC', 'sao paulo': 'SP', sergipe: 'SE',
  tocantins: 'TO', para: 'PA'
}).sort(([first], [second]) => second.length - first.length);

const brazilianCityStates = { 'sao paulo': 'SP', 'rio de janeiro': 'RJ', brasilia: 'DF' };

function normalizePlace(place) {
  return String(place || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function brazilianStateForPlace(place) {
  const normalized = normalizePlace(place);
  const stateCode = normalized.match(/(?:^|[\s,/-])(ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to)(?=$|[\s,/-])/);
  if (stateCode) return stateCode[1].toUpperCase();
  const namedState = brazilianStateNames.find(([name]) => normalized.includes(name));
  if (namedState) return namedState[1];
  return brazilianCityStates[normalized.split(',')[0].trim()] || null;
}

export function parseBrazilDstRules(csv) {
  return String(csv).trim().split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
    const [start, end, stateList] = line.split(',');
    return { start, end, states: stateList === '*' ? null : stateList.split(';') };
  });
}

export function hasHistoricalBrazilianDstInRules(place, date, rules) {
  const normalized = normalizePlace(place);
  const state = brazilianStateForPlace(place);
  const city = normalized.split(',')[0].trim();
  const isBrazilianLocation = Boolean(state || brazilianCityStates[city] || /(?:^|[\s,])(brasil|brazil)(?:$|[\s,])/.test(normalized));
  if (!isBrazilianLocation) return false;
  return rules.some((rule) => date >= rule.start && date <= rule.end && (!rule.states || (state && rule.states.includes(state))));
}

let brazilDstRulesPromise;
function loadBrazilDstRules() {
  if (!brazilDstRulesPromise) {
    brazilDstRulesPromise = globalThis.location?.protocol === 'file:'
      ? Promise.resolve([])
      : fetch(new URL('../data/brazil_dst.csv', import.meta.url)).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      }).then(parseBrazilDstRules).catch((error) => {
        console.warn('Tabela brasileira de horario de verao indisponivel.', error);
        return [];
      });
  }
  return brazilDstRulesPromise;
}

export async function hasHistoricalBrazilianDst(place, date) {
  return hasHistoricalBrazilianDstInRules(place, date, await loadBrazilDstRules());
}
