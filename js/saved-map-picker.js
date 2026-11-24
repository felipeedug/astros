import { configurado, sessaoAtual, supabase } from './portal.js';

const fields = ['id', 'nome', 'data_nascimento', 'hora_nascimento', 'pais', 'regiao', 'cidade', 'latitude', 'longitude', 'proprio'];
const text = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
const labelFor = (map) => `${map.nome || 'Sem nome'} · ${[map.cidade, map.regiao, map.pais].filter(Boolean).join(', ')} · ${map.data_nascimento || ''}`;

export async function attachSavedMapPicker(root, onSelect) {
  const input = root.querySelector('[data-saved-map-query]');
  const list = root.querySelector('[data-saved-map-options]');
  const status = root.querySelector('[data-saved-map-status]');
  const clear = root.querySelector('[data-saved-map-clear]');
  const state = { maps: [], selected: null };

  const clearSelection = () => {
    state.selected = null;
    clear.hidden = true;
    status.textContent = 'Seleção removida. Os dados permanecem nos campos e podem ser editados manualmente.';
  };
  clear.addEventListener('click', clearSelection);
  input.addEventListener('input', () => {
    const query = text(input.value.trim());
    list.replaceChildren();
    if (!query || !state.maps.length) { list.hidden = true; return; }
    const matches = state.maps.filter((map) => text(labelFor(map)).includes(query)).slice(0, 30);
    matches.forEach((map) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'saved-map-option';
      option.setAttribute('role', 'option');
      option.textContent = labelFor(map);
      option.addEventListener('click', async () => {
        state.selected = map;
        input.value = map.nome || '';
        list.hidden = true;
        clear.hidden = false;
        status.textContent = `Dados de ${map.nome || 'pessoa'} preenchidos. Revise ou edite antes de gerar o mapa.`;
        try {
          await onSelect(map);
        } catch (error) {
          status.textContent = error.message || 'Não foi possível preencher este mapa.';
        }
      });
      list.append(option);
    });
    list.hidden = matches.length === 0;
    if (!matches.length) status.textContent = 'Nenhum mapa acessível corresponde à busca.';
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') list.hidden = true;
    if (event.key === 'Enter' && !list.hidden) {
      event.preventDefault();
      list.querySelector('.saved-map-option')?.click();
    }
  });
  document.addEventListener('click', (event) => {
    if (!root.contains(event.target)) list.hidden = true;
  });

  if (!configurado) {
    input.disabled = true;
    status.textContent = 'Entre na sua conta para buscar mapas cadastrados. O preenchimento manual continua disponível.';
    return state;
  }
  try {
    const session = await sessaoAtual();
    if (!session) {
      input.disabled = true;
      status.textContent = 'Entre na sua conta para buscar mapas cadastrados. O preenchimento manual continua disponível.';
      return state;
    }
    const { data, error } = await supabase.from('mapas_nascimento')
      .select(fields.join(','))
      .order('atualizado_em', { ascending: false })
      .limit(500);
    if (error) throw error;
    state.maps = (data || []).filter((map) => map.data_nascimento && map.hora_nascimento && map.cidade && map.pais);
    status.textContent = state.maps.length
      ? `${state.maps.length} mapa(s) disponível(is) para sua conta. Digite para buscar.`
      : 'Não há mapas cadastrados disponíveis para sua conta. Você pode preencher os dados manualmente.';
  } catch (error) {
    input.disabled = true;
    status.textContent = 'Não foi possível consultar os mapas cadastrados. O preenchimento manual continua disponível.';
    console.warn('Busca de mapas cadastrados indisponível.', error);
  }
  return state;
}
