(() => {
  const normalizePlace = (place = '') => String(place).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const selectedLocations = new Map();
  const shardCache = new Map();
  const catalogPromise = fetch('./data/cities/index.json').then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });

  async function attachLocationPicker({ countrySelect, regionSelect, cityInput, suggestions, placeInput, regionField, defaults = {} }) {
    const catalog = await catalogPromise;
    if (!catalog?.countries?.length) throw new Error('O catálogo de localidades não está disponível.');
    const countries = [...catalog.countries].sort((first, second) => first.name.localeCompare(second.name));
    const countriesById = new Map(countries.map((country) => [country.id, country]));
    countrySelect.replaceChildren(new Option('Selecione um país', ''));
    countries.forEach((country) => countrySelect.add(new Option(country.name, country.id)));
    const idPrefix = countrySelect.id || `location-${Math.random().toString(36).slice(2)}`;
    let currentCountry = null;
    let cityRecords = [];
    let countryGeneration = 0;
    let suggestionMatches = [];
    let duplicateCounts = new Map();
    let renderedSuggestionCount = 0;
    let activeSuggestionIndex = -1;
    let chosenLabel = '';
    let chosenRecord = null;

    const getShard = (country) => {
      if (!shardCache.has(country.id)) shardCache.set(country.id, fetch(`./data/cities/${country.file}`).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      }).then((data) => data.cities || []));
      return shardCache.get(country.id);
    };

    const clearCity = () => {
      cityInput.value = '';
      cityInput.setCustomValidity('Selecione uma cidade nas sugestões.');
      placeInput.value = '';
      suggestions.replaceChildren();
      suggestions.hidden = true;
      cityInput.setAttribute('aria-expanded', 'false');
      cityInput.removeAttribute('aria-activedescendant');
      suggestionMatches = [];
      renderedSuggestionCount = 0;
      activeSuggestionIndex = -1;
      chosenLabel = '';
      chosenRecord = null;
    };

    const regionRecords = () => regionSelect.value
      ? cityRecords.filter((record) => record[1] === regionSelect.value)
      : [];

    const labelForRecord = (record) => {
      const baseLabel = currentCountry.regions.length > 1 ? `${record[0]} — ${record[1]}` : record[0];
      const duplicateKey = `${normalizePlace(record[0])}|${record[1]}`;
      return duplicateCounts.get(duplicateKey) > 1 ? `${baseLabel} · ${Number(record[2]).toFixed(3)}, ${Number(record[3]).toFixed(3)}` : baseLabel;
    };

    const chooseCity = (record, label = labelForRecord(record)) => {
      if (!record || !currentCountry) return;
      const canonicalPlace = `${record[0]}, ${record[1]}, ${currentCountry.name}`;
      cityInput.value = label;
      placeInput.value = canonicalPlace;
      selectedLocations.set(normalizePlace(canonicalPlace), [record[2], record[3], record[4], record[1], currentCountry.name, record[0]]);
      placeInput.dispatchEvent(new Event('location-changed', { bubbles: true }));
      cityInput.setCustomValidity('');
      cityInput.setAttribute('aria-expanded', 'false');
      cityInput.removeAttribute('aria-activedescendant');
      suggestions.hidden = true;
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
        option.id = `${idPrefix}-city-option-${index}`;
        option.className = 'city-suggestion-option';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', index === activeSuggestionIndex ? 'true' : 'false');
        option.dataset.index = String(index);
        option.textContent = labelForRecord(record);
        fragment.append(option);
      }
      suggestions.append(fragment);
      renderedSuggestionCount = end;
      suggestions.hidden = suggestionMatches.length === 0;
      cityInput.setAttribute('aria-expanded', String(!suggestions.hidden));
    };

    const setActiveSuggestion = (index) => {
      if (index < 0 || index >= renderedSuggestionCount) return;
      suggestions.querySelector('[aria-selected="true"]')?.setAttribute('aria-selected', 'false');
      activeSuggestionIndex = index;
      const option = document.getElementById(`${idPrefix}-city-option-${index}`);
      option?.setAttribute('aria-selected', 'true');
      cityInput.setAttribute('aria-activedescendant', `${idPrefix}-city-option-${index}`);
      option?.scrollIntoView({ block: 'nearest' });
    };

    const refreshSuggestions = (preferredCity = '') => {
      const records = regionRecords();
      duplicateCounts = new Map();
      records.forEach((record) => {
        const key = `${normalizePlace(record[0])}|${record[1]}`;
        duplicateCounts.set(key, (duplicateCounts.get(key) || 0) + 1);
      });
      const query = normalizePlace(preferredCity || cityInput.value.split(/[—·]/)[0]);
      suggestionMatches = query ? records.filter((record) => normalizePlace(record[0]).includes(query)) : records;
      const exactPreferred = preferredCity ? records.find((record) => normalizePlace(record[0]) === normalizePlace(preferredCity)) : null;
      if (exactPreferred) suggestionMatches = [exactPreferred, ...suggestionMatches.filter((record) => record !== exactPreferred)];
      renderedSuggestionCount = 0;
      activeSuggestionIndex = -1;
      suggestions.replaceChildren();
      if (!preferredCity) {
        cityInput.setCustomValidity('Selecione uma cidade nas sugestões.');
        placeInput.value = '';
        chosenLabel = '';
        chosenRecord = null;
      }
      appendSuggestions();
      if (exactPreferred) chooseCity(exactPreferred);
    };

    async function loadCountry(countryId, preferredRegion = '', preferredCity = '', savedLatitude, savedLongitude) {
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
      regionSelect.replaceChildren();
      const hasMultipleRegions = currentCountry.regions.length > 1;
      regionField.hidden = !hasMultipleRegions;
      regionSelect.required = hasMultipleRegions;
      if (hasMultipleRegions) regionSelect.add(new Option('Selecione um estado/região', ''));
      currentCountry.regions.forEach((region) => regionSelect.add(new Option(region.name, region.code)));
      const preferredRegionRecord = currentCountry.regions.find((region) => region.code === preferredRegion
        || normalizePlace(region.name) === normalizePlace(preferredRegion));
      regionSelect.value = preferredRegionRecord?.code || (hasMultipleRegions ? '' : currentCountry.regions[0]?.code || '');
      cityInput.disabled = hasMultipleRegions && !regionSelect.value;
      try {
        cityRecords = await getShard(currentCountry);
      } catch (error) {
        cityRecords = [];
        console.error(`Cidades de ${currentCountry.name} indisponíveis.`, error);
      }
      if (generation !== countryGeneration) return;
      refreshSuggestions(preferredCity);
      if (chosenRecord && Number.isFinite(savedLatitude) && Number.isFinite(savedLongitude)
        && (Math.abs(chosenRecord[2] - savedLatitude) >= 1e-4 || Math.abs(chosenRecord[3] - savedLongitude) >= 1e-4)) {
        const exact = regionRecords().find((record) => normalizePlace(record[0]) === normalizePlace(preferredCity)
          && Math.abs(record[2] - savedLatitude) < 1e-4 && Math.abs(record[3] - savedLongitude) < 1e-4);
        if (exact) chooseCity(exact);
        else clearCity();
      }
    }

    countrySelect.addEventListener('change', async () => {
      const countryId = countrySelect.value;
      await loadCountry(countryId);
      if (countrySelect.value !== countryId || !currentCountry) return;
      (currentCountry.regions.length > 1 ? regionSelect : cityInput).focus();
    });
    regionSelect.addEventListener('change', () => {
      clearCity();
      cityInput.disabled = currentCountry?.regions.length > 1 && !regionSelect.value;
      refreshSuggestions();
      if (regionSelect.value && !cityInput.disabled) cityInput.focus();
    });
    cityInput.addEventListener('input', () => refreshSuggestions());
    cityInput.addEventListener('focus', () => { if (!chosenRecord) refreshSuggestions(); });
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
        if (suggestions.hidden) refreshSuggestions();
        if (renderedSuggestionCount) setActiveSuggestion(Math.min(activeSuggestionIndex + 1, renderedSuggestionCount - 1));
      } else if (event.key === 'ArrowUp' && !suggestions.hidden) {
        event.preventDefault();
        setActiveSuggestion(Math.max(activeSuggestionIndex - 1, 0));
      } else if (event.key === 'Enter' && !suggestions.hidden) {
        const query = normalizePlace(cityInput.value.split(/[—·]/)[0]);
        const record = suggestionMatches.find((item) => normalizePlace(item[0]) === query)
          || (activeSuggestionIndex >= 0 ? suggestionMatches[activeSuggestionIndex] : null);
        if (record) { event.preventDefault(); chooseCity(record); }
      } else if (event.key === 'Escape') {
        suggestions.hidden = true;
        cityInput.setAttribute('aria-expanded', 'false');
      }
    });
    suggestions.addEventListener('click', (event) => {
      const option = event.target.closest('[role="option"]');
      if (option) chooseCity(suggestionMatches[Number(option.dataset.index)]);
    });
    suggestions.addEventListener('scroll', () => {
      if (suggestions.scrollTop + suggestions.clientHeight >= suggestions.scrollHeight - 32 && renderedSuggestionCount < suggestionMatches.length) appendSuggestions();
    });

    const country = countries.find((item) => normalizePlace(item.name) === normalizePlace(defaults.country || 'Brasil'));
    countrySelect.value = country?.id || '';
    await loadCountry(countrySelect.value, defaults.region || 'SP', defaults.city || 'São Paulo');
    return {
      async select(countryName, regionCode, cityName, latitude, longitude) {
        const match = countries.find((item) => normalizePlace(item.name) === normalizePlace(countryName));
        if (!match) return false;
        countrySelect.value = match.id;
        await loadCountry(match.id, regionCode || '', cityName, latitude, longitude);
        return Boolean(placeInput.value);
      },
      setDisabled(disabled) {
        countrySelect.disabled = disabled;
        regionSelect.disabled = disabled;
        cityInput.disabled = disabled || (currentCountry?.regions.length > 1 && !regionSelect.value);
      },
      get selected() { return chosenRecord && currentCountry ? { record: chosenRecord, country: currentCountry } : null; },
      get value() { return placeInput.value; }
    };
  }

  window.EntreEstrelasLocationPicker = {
    attach: attachLocationPicker,
    normalizePlace,
    cityData(place) { return selectedLocations.get(normalizePlace(place)) || null; }
  };
})();
