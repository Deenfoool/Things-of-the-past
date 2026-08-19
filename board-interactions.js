(() => {
  const CASE_ID = 'lyublino-1994';
  const CASE_ACTIVE_KEY = 'things-of-the-past-case-active';
  const BOARD_POSITIONS_KEY = 'things-of-the-past-board-positions-v1';
  const BOARD_VERSIONS_KEY = 'things-of-the-past-board-versions-v1';

  const systemCards = [
    {
      id: 'incident', kind: 'fact', title: 'Стрельба',
      text: 'В дежурную часть поступило сообщение о стрельбе на Люблинском рынке.',
      status: 'Первичное сообщение', x: 41, y: 38, tilt: -1,
      details: 'Точные обстоятельства стрельбы ещё не установлены. Этот факт основан только на исходном сообщении дежурной части.'
    },
    {
      id: 'place-market', kind: 'place', title: 'Люблинский рынок',
      text: 'Место, откуда поступило сообщение. Первичный осмотр ещё не проведён.',
      status: 'Локация известна', x: 15, y: 39, tilt: 1,
      details: 'Это единственная доступная для выезда локация на старте расследования.'
    },
    {
      id: 'time-noon', kind: 'fact', title: 'Около полудня',
      text: 'Ориентировочное время исходного сообщения.',
      status: 'Время приблизительное', x: 42, y: 12, tilt: 1,
      details: 'Точное время событий пока неизвестно. Его предстоит уточнить по документам и показаниям.'
    },
    {
      id: 'dead-unknown', kind: 'person', title: 'Погибший',
      text: 'Один человек погиб. Личность на данный момент не установлена.',
      status: 'Личность неизвестна', x: 68, y: 21, tilt: -1,
      details: 'Имя, должность и связь погибшего с рынком должны быть установлены после выезда.'
    },
    {
      id: 'wounded-unknown', kind: 'person', title: 'Раненый',
      text: 'Один человек ранен. Личность и состояние пока неизвестны.',
      status: 'Личность неизвестна', x: 70, y: 54, tilt: 1,
      details: 'Нужно выяснить личность раненого, его состояние и возможность получить показания.'
    },
    {
      id: 'shooter-question', kind: 'question', title: 'Кто стрелял?',
      text: 'Стрелявший, количество участников и направление их ухода неизвестны.',
      status: 'Вопрос расследования', x: 39, y: 68, tilt: -1,
      details: 'На старте нет достоверного описания стрелявшего и нельзя считать кого-либо подозреваемым.'
    }
  ];

  const links = [
    ['incident', 'place-market'],
    ['incident', 'time-noon'],
    ['incident', 'dead-unknown'],
    ['incident', 'wounded-unknown'],
    ['incident', 'shooter-question']
  ];

  const overlay = document.createElement('section');
  overlay.className = 'board-ui';
  overlay.id = 'investigationBoardUi';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <button class="board-ui__backdrop" type="button" aria-label="Закрыть доску"></button>
    <div class="board-ui__shell" role="dialog" aria-modal="true" aria-labelledby="boardUiTitle">
      <header class="board-ui__header">
        <div class="board-ui__title">
          <span>Кабинет следователя</span>
          <strong id="boardUiTitle">Доска расследования</strong>
        </div>
        <div class="board-ui__tools" aria-label="Фильтр карточек">
          <button type="button" data-board-filter="all" class="is-active">Все</button>
          <button type="button" data-board-filter="person">Люди</button>
          <button type="button" data-board-filter="fact">Факты</button>
          <button type="button" data-board-filter="place">Места</button>
          <button type="button" data-board-filter="question">Вопросы</button>
          <button type="button" data-board-filter="version">Версии</button>
          <button type="button" class="board-ui__add" data-board-add>+ Версия</button>
          <button type="button" data-board-arrange>Разложить</button>
        </div>
        <button class="board-ui__close" type="button" aria-label="Закрыть">×</button>
      </header>
      <div class="board-ui__workspace">
        <div class="board-ui__board" id="boardSurface">
          <svg class="board-ui__lines" id="boardLines" aria-hidden="true"></svg>
          <div class="board-ui__cards" id="boardCards"></div>
          <div class="board-ui__legend" aria-hidden="true">
            <span class="person"><i></i>люди</span><span class="place"><i></i>места</span><span class="fact"><i></i>факты</span><span class="question"><i></i>вопросы</span>
          </div>
          <div class="board-ui__hint">Перетаскивай карточки · клик — подробности</div>
        </div>
        <aside class="board-ui__drawer" id="boardDrawer" aria-hidden="true"></aside>
      </div>
    </div>
  `;
  document.getElementById('game').appendChild(overlay);

  const surface = overlay.querySelector('#boardSurface');
  const cardsLayer = overlay.querySelector('#boardCards');
  const linesLayer = overlay.querySelector('#boardLines');
  const drawer = overlay.querySelector('#boardDrawer');
  const closeButton = overlay.querySelector('.board-ui__close');
  const backdrop = overlay.querySelector('.board-ui__backdrop');

  let activeFilter = 'all';
  let selectedCardId = null;
  let dragState = null;

  function isCaseActive() {
    return localStorage.getItem(CASE_ACTIVE_KEY) === CASE_ID;
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function loadPositions() {
    return readJson(BOARD_POSITIONS_KEY, {});
  }

  function savePosition(id, x, y) {
    const positions = loadPositions();
    positions[id] = { x: round(x), y: round(y) };
    localStorage.setItem(BOARD_POSITIONS_KEY, JSON.stringify(positions));
  }

  function loadVersions() {
    const versions = readJson(BOARD_VERSIONS_KEY, []);
    return Array.isArray(versions) ? versions : [];
  }

  function saveVersions(versions) {
    localStorage.setItem(BOARD_VERSIONS_KEY, JSON.stringify(versions));
  }

  function allCards() {
    if (!isCaseActive()) return [];
    const positions = loadPositions();
    const base = systemCards.map(card => ({ ...card, ...(positions[card.id] || {}) }));
    const versions = loadVersions().map((card, index) => ({
      kind: 'version',
      status: 'Версия следователя',
      tilt: index % 2 ? 1 : -1,
      ...card,
      ...(positions[card.id] || {})
    }));
    return [...base, ...versions];
  }

  function openBoard(options = {}) {
    if (typeof debugHotspots !== 'undefined' && debugHotspots) return;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    activeFilter = 'all';
    updateFilterButtons();
    renderBoard();
    if (options.materials) openMaterialsDrawer();
    closeButton.focus();
  }

  function closeBoard() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    closeDrawer();
    selectedCardId = null;
  }

  function renderBoard() {
    cardsLayer.innerHTML = '';
    linesLayer.innerHTML = '';
    const cards = allCards();

    if (!cards.length) {
      const empty = document.createElement('div');
      empty.className = 'board-ui__empty';
      empty.innerHTML = `
        <strong>Доска пока пуста</strong>
        <p>Активного дела нет. После получения сообщения у дежурного здесь появятся только те сведения, которые следователь уже знает.</p>
      `;
      cardsLayer.appendChild(empty);
      return;
    }

    cards.forEach(card => cardsLayer.appendChild(createCardElement(card)));
    applyFilter();
    requestAnimationFrame(drawLines);
  }

  function createCardElement(card) {
    const element = document.createElement('article');
    element.className = `board-card${card.id === selectedCardId ? ' is-selected' : ''}`;
    element.dataset.cardId = card.id;
    element.dataset.kind = card.kind;
    element.style.left = `${card.x}%`;
    element.style.top = `${card.y}%`;
    element.style.setProperty('--tilt', `${card.tilt || 0}deg`);
    element.innerHTML = `
      ${card.kind === 'version' ? '<button class="board-card__remove" type="button" aria-label="Удалить версию">×</button>' : ''}
      <span class="board-card__kind">${kindLabel(card.kind)}</span>
      <strong>${escapeHtml(card.title)}</strong>
      <p>${escapeHtml(card.text || '')}</p>
      <span class="board-card__status">${escapeHtml(card.status || '')}</span>
    `;

    element.addEventListener('pointerdown', event => beginDrag(event, card, element));
    element.addEventListener('click', event => {
      if (dragState?.moved) return;
      if (event.target.closest('.board-card__remove')) return;
      selectCard(card.id);
      openCardDrawer(card.id);
    });

    element.querySelector('.board-card__remove')?.addEventListener('click', event => {
      event.stopPropagation();
      removeVersion(card.id);
    });

    return element;
  }

  function beginDrag(event, card, element) {
    if (event.button !== 0 || event.target.closest('button')) return;
    const rect = surface.getBoundingClientRect();
    const cardRect = element.getBoundingClientRect();
    dragState = {
      id: card.id,
      element,
      rect,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startLeftPx: cardRect.left - rect.left,
      startTopPx: cardRect.top - rect.top,
      moved: false
    };
    element.setPointerCapture?.(event.pointerId);
    element.classList.add('is-selected');
    selectedCardId = card.id;
  }

  function onPointerMove(event) {
    if (!dragState) return;
    const dx = event.clientX - dragState.startClientX;
    const dy = event.clientY - dragState.startClientY;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragState.moved = true;

    const maxX = dragState.rect.width - dragState.element.offsetWidth - 14;
    const maxY = dragState.rect.height - dragState.element.offsetHeight - 14;
    const left = clamp(dragState.startLeftPx + dx, 14, Math.max(14, maxX));
    const top = clamp(dragState.startTopPx + dy, 14, Math.max(14, maxY));
    const x = (left / dragState.rect.width) * 100;
    const y = (top / dragState.rect.height) * 100;

    dragState.element.style.left = `${x}%`;
    dragState.element.style.top = `${y}%`;
    dragState.x = x;
    dragState.y = y;
    drawLines();
  }

  function onPointerUp() {
    if (!dragState) return;
    if (dragState.moved) savePosition(dragState.id, dragState.x, dragState.y);
    const wasMoved = dragState.moved;
    const element = dragState.element;
    dragState = null;
    if (wasMoved) {
      setTimeout(() => element.classList.toggle('is-selected', element.dataset.cardId === selectedCardId), 0);
    }
  }

  function selectCard(id) {
    selectedCardId = id;
    cardsLayer.querySelectorAll('.board-card').forEach(element => {
      element.classList.toggle('is-selected', element.dataset.cardId === id);
    });
  }

  function drawLines() {
    linesLayer.innerHTML = '';
    if (activeFilter !== 'all') return;
    const visibleIds = new Set(Array.from(cardsLayer.querySelectorAll('.board-card:not(.is-hidden)')).map(el => el.dataset.cardId));

    links.forEach(([fromId, toId]) => {
      if (!visibleIds.has(fromId) || !visibleIds.has(toId)) return;
      const from = cardsLayer.querySelector(`[data-card-id="${CSS.escape(fromId)}"]`);
      const to = cardsLayer.querySelector(`[data-card-id="${CSS.escape(toId)}"]`);
      if (!from || !to) return;

      const boardRect = surface.getBoundingClientRect();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(a.left - boardRect.left + a.width / 2));
      line.setAttribute('y1', String(a.top - boardRect.top + a.height / 2));
      line.setAttribute('x2', String(b.left - boardRect.left + b.width / 2));
      line.setAttribute('y2', String(b.top - boardRect.top + b.height / 2));
      linesLayer.appendChild(line);
    });
  }

  function openCardDrawer(id) {
    const card = allCards().find(item => item.id === id);
    if (!card) return;
    drawer.innerHTML = `
      <div class="board-ui__drawer-header">
        <div><span>${kindLabel(card.kind)}</span><strong>${escapeHtml(card.title)}</strong></div>
        <button class="board-ui__drawer-close" type="button" aria-label="Закрыть">×</button>
      </div>
      <p>${escapeHtml(card.details || card.text || '')}</p>
      <dl>
        <div><dt>Статус</dt><dd>${escapeHtml(card.status || '—')}</dd></div>
        <div><dt>Тип</dt><dd>${kindLabel(card.kind)}</dd></div>
        <div><dt>Состояние</dt><dd>${card.kind === 'question' || card.kind === 'version' ? 'Не доказано' : 'Известно следователю'}</dd></div>
      </dl>
      ${card.kind === 'version' ? '<button class="board-card__action" type="button" data-remove-version>Удалить эту версию</button>' : ''}
    `;
    drawer.querySelector('.board-ui__drawer-close').addEventListener('click', closeDrawer);
    drawer.querySelector('[data-remove-version]')?.addEventListener('click', () => removeVersion(card.id));
    openDrawer();
  }

  function openMaterialsDrawer() {
    const active = isCaseActive();
    drawer.innerHTML = `
      <div class="board-ui__drawer-header">
        <div><span>Папка для доски</span><strong>Материалы</strong></div>
        <button class="board-ui__drawer-close" type="button" aria-label="Закрыть">×</button>
      </div>
      ${active
        ? '<p>Все сведения из первичной сводки уже разложены на доске. Новые карточки будут добавляться сюда после осмотра места, документов и разговоров со свидетелями.</p>'
        : '<p>Папка пуста. Сначала нужно получить активное дело у дежурного.</p>'}
    `;
    drawer.querySelector('.board-ui__drawer-close').addEventListener('click', closeDrawer);
    openDrawer();
  }

  function openVersionCreator() {
    if (!isCaseActive()) {
      drawer.innerHTML = `
        <div class="board-ui__drawer-header"><div><span>Версия</span><strong>Нет активного дела</strong></div><button class="board-ui__drawer-close" type="button">×</button></div>
        <p>Сначала получи дело у дежурного. Версии относятся к конкретному расследованию.</p>
      `;
      drawer.querySelector('.board-ui__drawer-close').addEventListener('click', closeDrawer);
      openDrawer();
      return;
    }

    drawer.innerHTML = `
      <div class="board-ui__drawer-header">
        <div><span>Версия следователя</span><strong>Новая карточка</strong></div>
        <button class="board-ui__drawer-close" type="button" aria-label="Закрыть">×</button>
      </div>
      <p>Запиши предположение. Такая карточка не считается доказанным фактом и останется помеченной как версия.</p>
      <textarea id="boardVersionText" maxlength="280" placeholder="Например: стрелявший мог знать расположение кабинета…"></textarea>
      <button class="board-card__action" type="button" data-add-version>Добавить на доску</button>
    `;
    drawer.querySelector('.board-ui__drawer-close').addEventListener('click', closeDrawer);
    drawer.querySelector('[data-add-version]').addEventListener('click', () => {
      const textarea = drawer.querySelector('#boardVersionText');
      const text = textarea.value.trim();
      if (!text) {
        textarea.focus();
        return;
      }
      addVersion(text);
    });
    openDrawer();
    drawer.querySelector('#boardVersionText').focus();
  }

  function addVersion(text) {
    const versions = loadVersions();
    const id = `version-${Date.now().toString(36)}`;
    const number = versions.length + 1;
    versions.push({
      id,
      title: `Версия ${number}`,
      text,
      details: text,
      x: clamp(26 + (number * 7) % 45, 8, 73),
      y: clamp(19 + (number * 11) % 48, 9, 72)
    });
    saveVersions(versions);
    closeDrawer();
    selectedCardId = id;
    renderBoard();
    openCardDrawer(id);
  }

  function removeVersion(id) {
    const versions = loadVersions().filter(item => item.id !== id);
    saveVersions(versions);
    const positions = loadPositions();
    delete positions[id];
    localStorage.setItem(BOARD_POSITIONS_KEY, JSON.stringify(positions));
    if (selectedCardId === id) selectedCardId = null;
    closeDrawer();
    renderBoard();
  }

  function arrangeCards() {
    localStorage.removeItem(BOARD_POSITIONS_KEY);
    const versions = loadVersions().map((item, index) => ({
      ...item,
      x: 11 + (index % 4) * 21,
      y: 78 - Math.floor(index / 4) * 18
    }));
    saveVersions(versions);
    renderBoard();
  }

  function applyFilter() {
    cardsLayer.querySelectorAll('.board-card').forEach(element => {
      element.classList.toggle('is-hidden', activeFilter !== 'all' && element.dataset.kind !== activeFilter);
    });
    requestAnimationFrame(drawLines);
  }

  function updateFilterButtons() {
    overlay.querySelectorAll('[data-board-filter]').forEach(button => {
      button.classList.toggle('is-active', button.dataset.boardFilter === activeFilter);
    });
  }

  function openDrawer() {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  function kindLabel(kind) {
    return ({ person: 'Лицо', place: 'Место', fact: 'Факт', question: 'Вопрос', version: 'Версия' })[kind] || 'Карточка';
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  overlay.querySelectorAll('[data-board-filter]').forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.boardFilter;
      updateFilterButtons();
      applyFilter();
    });
  });

  overlay.querySelector('[data-board-add]').addEventListener('click', openVersionCreator);
  overlay.querySelector('[data-board-arrange]').addEventListener('click', arrangeCards);
  closeButton.addEventListener('click', closeBoard);
  backdrop.addEventListener('click', closeBoard);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('resize', () => {
    if (overlay.classList.contains('is-open')) requestAnimationFrame(drawLines);
  });

  hotspotsEl.addEventListener('click', event => {
    if (typeof debugHotspots !== 'undefined' && debugHotspots) return;
    const hotspot = event.target.closest('.hotspot');
    if (!hotspot) return;
    const id = hotspot.dataset.hotspotId;
    if (id !== 'investigation-board' && id !== 'custom-mt04fy5n') return;

    event.preventDefault();
    event.stopPropagation();
    openBoard({ materials: id === 'custom-mt04fy5n' });
  }, true);

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (drawer.classList.contains('is-open')) closeDrawer();
      else closeBoard();
    }
  }, true);

  window.openInvestigationBoard = openBoard;
})();
