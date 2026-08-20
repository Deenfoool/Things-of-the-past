(() => {
  const CASE_ID = 'lyublino-1994';
  const CASE_ACTIVE_KEY = 'things-of-the-past-case-active';

  const registry = new Map([
    ['lyublino-market', {
      id: 'lyublino-market',
      title: 'Люблинский рынок',
      subtitle: 'Место происшествия',
      roomId: 'market-main',
      artReady: true,
      description: 'Первичная торговая зона рынка. Осмотр ещё не проводился.'
    }]
  ]);

  const overlay = document.createElement('section');
  overlay.className = 'travel-ui';
  overlay.id = 'travelUi';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <button class="travel-ui__backdrop" type="button" aria-label="Закрыть выбор локации"></button>
    <div class="travel-ui__panel" role="dialog" aria-modal="true" aria-labelledby="travelUiTitle">
      <header class="travel-ui__header">
        <div><span class="travel-ui__eyebrow">Дежурная часть · выезд</span><h2 id="travelUiTitle">Доступные локации</h2></div>
        <button class="travel-ui__close" type="button" aria-label="Закрыть">×</button>
      </header>
      <div class="travel-ui__body" id="travelUiBody"></div>
    </div>
  `;
  game.appendChild(overlay);

  const body = overlay.querySelector('#travelUiBody');
  const closeButton = overlay.querySelector('.travel-ui__close');
  const backdrop = overlay.querySelector('.travel-ui__backdrop');

  function caseIsActive() {
    return localStorage.getItem(CASE_ACTIVE_KEY) === CASE_ID;
  }

  function syncState() {
    window.InvestigationState?.syncLegacyCase();
  }

  function openTravel() {
    if (typeof debugHotspots !== 'undefined' && debugHotspots) return;
    syncState();
    render();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    closeButton.focus();
  }

  function closeTravel() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function availableLocations() {
    if (!caseIsActive()) return [];
    const stateLocations = window.InvestigationState?.get().locations || [];
    return stateLocations
      .filter(item => item.unlocked)
      .map(item => ({ ...registry.get(item.id), ...item }))
      .filter(item => item.id && item.title);
  }

  function render() {
    if (!caseIsActive()) {
      body.innerHTML = `
        <div class="travel-ui__empty">
          <strong>Выезд не назначен</strong>
          <p>Активного дела пока нет. Сначала получи сообщение в окне дежурного.</p>
          <button class="travel-ui__button" type="button" data-go-duty>К дежурному</button>
        </div>`;
      body.querySelector('[data-go-duty]')?.addEventListener('click', () => {
        closeTravel();
        changeRoom('corridor', 1);
      });
      return;
    }

    const locations = availableLocations();
    body.innerHTML = `
      <p class="travel-ui__intro">На карте отображаются только места, о которых следователь уже узнал по текущему делу.</p>
      ${locations.map(location => destinationHtml(location)).join('') || '<div class="travel-ui__empty"><strong>Нет доступных мест</strong></div>'}
      <div class="travel-ui__notice">Полевые локации открываются только после получения дела. Новые места будут добавляться сюда по мере расследования.</div>
    `;

    body.querySelectorAll('[data-travel-location]').forEach(button => {
      button.addEventListener('click', () => travelTo(button.dataset.travelLocation));
    });
  }

  function destinationHtml(location) {
    const runtime = registry.get(location.id) || location;
    const ready = Boolean(runtime.artReady && runtime.roomId && rooms[runtime.roomId]);
    return `
      <article class="travel-destination">
        <div class="travel-destination__meta">
          <span>${escapeHtml(runtime.subtitle || 'Локация')}</span>
          <h3>${escapeHtml(runtime.title)}</h3>
          <p>${escapeHtml(runtime.description || '')}</p>
          <div class="travel-destination__status">
            <i>${location.visited ? 'Уже посещена' : 'Не осмотрена'}</i>
            <i>${ready ? 'Локация готова' : 'Ожидает фоновые сцены'}</i>
          </div>
        </div>
        <button class="travel-ui__button" type="button" data-travel-location="${location.id}" ${ready ? '' : 'disabled'}>${ready ? 'Выехать' : 'Нужны PNG'}</button>
      </article>`;
  }

  function travelTo(id) {
    const location = registry.get(id);
    if (!location?.artReady || !location.roomId || !rooms[location.roomId]) return;
    closeTravel();
    window.InvestigationState?.markLocationVisited(id);
    changeRoom(location.roomId, 0);
  }

  function registerLocation(config) {
    if (!config?.id) throw new Error('Field location requires id');

    const previous = registry.get(config.id) || {};
    const incomingReady = Boolean(config.roomId && Array.isArray(config.scenes));

    if (incomingReady) {
      rooms[config.roomId] = {
        label: config.roomLabel || config.title || config.id,
        scenes: config.scenes
      };
    }

    // Runtime registration is monotonic: a lightweight metadata refresh must never
    // downgrade a location that already has a registered room and ready art.
    const effectiveRoomId = incomingReady
      ? config.roomId
      : (previous.roomId || config.roomId || null);
    const effectiveArtReady = Boolean(incomingReady || previous.artReady);

    registry.set(config.id, {
      ...previous,
      ...config,
      roomId: effectiveRoomId,
      artReady: effectiveArtReady
    });

    // Avoid emitting investigation:change when the runtime values are already
    // identical. This prevents event feedback loops between case modules and the
    // shared travel registry.
    const stateLocation = window.InvestigationState?.get?.().locations?.find(item => item.id === config.id);
    if (
      stateLocation &&
      (stateLocation.roomId !== effectiveRoomId || Boolean(stateLocation.artReady) !== effectiveArtReady)
    ) {
      window.InvestigationState?.setLocationRuntime(config.id, {
        roomId: effectiveRoomId,
        artReady: effectiveArtReady
      });
    }

    if (overlay.classList.contains('is-open')) render();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  hotspotsEl.addEventListener('click', event => {
    if (typeof debugHotspots !== 'undefined' && debugHotspots) return;
    const hotspot = event.target.closest('.hotspot');
    if (!hotspot) return;
    const id = hotspot.dataset.hotspotId;
    if (id !== 'corridor-to-locations' && id !== 'custom-mt04iog9') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openTravel();
  }, true);

  closeButton.addEventListener('click', closeTravel);
  backdrop.addEventListener('click', closeTravel);

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeTravel();
    }
  }, true);

  window.FieldLocations = {
    get: id => ({ ...(registry.get(id) || {}) }),
    list: () => Array.from(registry.values()).map(item => ({ ...item })),
    register: registerLocation,
    openTravel
  };
})();
