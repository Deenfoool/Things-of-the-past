(() => {
  const CASE_ID = 'lyublino-1994';
  const CASE_ACTIVE_KEY = 'things-of-the-past-case-active';
  const BOARD_POSITIONS_KEY = 'things-of-the-past-board-positions-v2';
  const BOARD_VERSIONS_KEY = 'things-of-the-past-board-versions-v2';

  const BOARD_ROOM = 'office';
  const BOARD_VIEW = 2;

  const systemCards = [
    {
      id: 'incident', kind: 'fact', title: 'Стрельба',
      text: 'Поступило сообщение о стрельбе.',
      status: 'Первичное сообщение', x: 42, y: 39, tilt: -1,
      details: 'В дежурную часть поступило сообщение о стрельбе на Люблинском рынке. Точные обстоятельства пока не установлены.'
    },
    {
      id: 'place-market', kind: 'place', title: 'Люблинский рынок',
      text: 'Место происшествия.',
      status: 'Локация известна', x: 12, y: 41, tilt: 1,
      details: 'Это единственная доступная для выезда локация на старте расследования. Первичный осмотр ещё не проводился.'
    },
    {
      id: 'time-noon', kind: 'fact', title: 'Около полудня',
      text: 'Ориентировочное время.',
      status: 'Время приблизительное', x: 40, y: 9, tilt: 1,
      details: 'Точное время событий пока неизвестно. Его предстоит уточнить по документам и показаниям.'
    },
    {
      id: 'dead-unknown', kind: 'person', title: 'Погибший',
      text: 'Личность не установлена.',
      status: 'Неизвестен', x: 70, y: 18, tilt: -1,
      details: 'Один человек погиб. Имя и связь погибшего с рынком пока не установлены.'
    },
    {
      id: 'wounded-unknown', kind: 'person', title: 'Раненый',
      text: 'Личность неизвестна.',
      status: 'Неизвестен', x: 72, y: 51, tilt: 1,
      details: 'Один человек ранен. Нужно выяснить его личность, состояние и возможность получить показания.'
    },
    {
      id: 'shooter-question', kind: 'question', title: 'Кто стрелял?',
      text: 'Стрелявший неизвестен.',
      status: 'Вопрос', x: 39, y: 69, tilt: -1,
      details: 'На старте нет достоверного описания стрелявшего, количества участников или направления их ухода.'
    }
  ];

  const links = [
    ['incident', 'place-market'],
    ['incident', 'time-noon'],
    ['incident', 'dead-unknown'],
    ['incident', 'wounded-unknown'],
    ['incident', 'shooter-question']
  ];

  const layer = document.createElement('div');
  layer.className = 'board-wall-layer';
  layer.id = 'boardWallLayer';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `
    <svg class="board-wall__lines" id="boardWallLines" aria-hidden="true"></svg>
    <div class="board-wall__cards" id="boardWallCards"></div>
    <div class="board-wall__tools">
      <button type="button" data-board-add title="Добавить свою версию">+ версия</button>
      <button type="button" data-board-reset title="Вернуть карточки на исходные места">сброс</button>
    </div>
    <form class="board-wall__composer" id="boardWallComposer" hidden>
      <label>Версия следователя</label>
      <textarea id="boardWallVersionText" rows="3" maxlength="240" placeholder="Например: стрелявший мог знать расположение кабинета..."></textarea>
      <div>
        <button type="submit">Прикрепить</button>
        <button type="button" data-board-cancel>Отмена</button>
      </div>
    </form>
  `;

  sceneEl.appendChild(layer);

  const cardsLayer = layer.querySelector('#boardWallCards');
  const linesLayer = layer.querySelector('#boardWallLines');
  const composer = layer.querySelector('#boardWallComposer');
  const versionText = layer.querySelector('#boardWallVersionText');

  let dragState = null;
  let suppressClickUntil = 0;

  function isBoardWall() {
    return currentRoomId === BOARD_ROOM && currentIndex === BOARD_VIEW;
  }

  function isCaseActive() {
    return localStorage.getItem(CASE_ACTIVE_KEY) === CASE_ID;
  }

  function caseState() {
    return window.InvestigationState?.syncLegacyCase?.() || window.InvestigationState?.get?.() || {
      facts: [],
      people: [],
      evidence: [],
      locations: [],
      timeline: []
    };
  }

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function loadPositions() {
    const value = readJson(BOARD_POSITIONS_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function savePosition(id, x, y) {
    const positions = loadPositions();
    positions[id] = { x: round(x), y: round(y) };
    localStorage.setItem(BOARD_POSITIONS_KEY, JSON.stringify(positions));
  }

  function loadVersions() {
    const value = readJson(BOARD_VERSIONS_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  function saveVersions(items) {
    localStorage.setItem(BOARD_VERSIONS_KEY, JSON.stringify(items));
  }

  function allCards() {
    if (!isCaseActive()) return [];
    const positions = loadPositions();
    const state = caseState();
    const dynamicFacts = investigationFactCards(state.facts || []);
    const dynamicEvidence = investigationEvidenceCards(state.evidence || []);
    const dynamicPeople = investigationPersonCards(state.people || []);
    const facts = systemCards
      .map(card => investigationOverride(card, state))
      .concat(dynamicFacts)
      .concat(dynamicEvidence)
      .concat(dynamicPeople)
      .map(card => ({ ...card, ...(positions[card.id] || {}) }));
    const versions = loadVersions().map((card, index) => ({
      kind: 'version', status: 'Версия следователя', tilt: index % 2 ? 1 : -1,
      ...card, ...(positions[card.id] || {})
    }));
    return [...facts, ...versions];
  }

  function investigationOverride(card, state) {
    if (card.id === 'dead-unknown') {
      const victim = state.people?.find(item => item.id === 'victim-unknown');
      if (victim?.status === 'established' && victim?.name) {
        return {
          ...card,
          title: victim.name,
          text: victim.occupation ? `${victim.occupation}. Погибший.` : 'Личность погибшего установлена.',
          status: 'Личность установлена',
          details: victim.note || `${victim.name}. Личность погибшего установлена.`
        };
      }
      if (victim?.status === 'observed') {
        return {
          ...card,
          text: victim.note || 'Обнаружен в кабинете директора.',
          status: 'Обнаружен',
          details: 'Положение погибшего зафиксировано при осмотре кабинета директора. Личность пока не установлена.'
        };
      }
    }

    if (card.id === 'wounded-unknown') {
      const wounded = state.people?.find(item => item.id === 'wounded-unknown');
      if (wounded?.name) {
        return {
          ...card,
          title: wounded.name,
          text: wounded.note || 'Личность раненого установлена.',
          status: 'Личность установлена',
          details: wounded.note || `${wounded.name}. Личность раненого установлена.`
        };
      }
    }

    if (card.id === 'place-market') {
      const market = state.locations?.find(item => item.id === 'lyublino-market');
      if (market?.visited) {
        return {
          ...card,
          status: 'Посещено',
          details: 'Люблинский рынок открыт и уже посещался следователем.'
        };
      }
    }

    return card;
  }

  function investigationFactCards(facts) {
    const starterIds = new Set(['incident-shooting', 'time-around-noon']);
    return facts
      .filter(fact => fact?.id && !starterIds.has(fact.id))
      .map((fact, index) => ({
        id: `fact-${fact.id}`,
        kind: 'fact',
        title: fact.title || 'Новый факт',
        text: fact.text || '',
        status: statusLabel(fact.status),
        details: fact.text || statusLabel(fact.status),
        x: clamp(19 + (index % 3) * 22, 8, 78),
        y: clamp(58 + Math.floor(index / 3) * 13, 8, 78),
        tilt: index % 2 ? 1 : -1,
        source: 'investigation'
      }));
  }

  function investigationEvidenceCards(evidence) {
    return evidence
      .filter(item => item?.id)
      .map((item, index) => ({
        id: `evidence-${item.id}`,
        kind: 'evidence',
        title: item.title || 'Улика',
        text: item.description || item.location || '',
        status: item.status || 'зарегистрировано',
        details: [item.description, item.location ? `Место обнаружения: ${item.location}` : null].filter(Boolean).join('\n'),
        x: clamp(12 + (index % 3) * 24, 8, 78),
        y: clamp(78 - Math.floor(index / 3) * 13, 8, 78),
        tilt: index % 2 ? -1 : 1,
        source: 'investigation'
      }));
  }

  function investigationPersonCards(people) {
    const starterUnknownIds = new Set(['victim-unknown', 'wounded-unknown']);
    return people
      .filter(person => person?.id && !starterUnknownIds.has(person.id))
      .map((person, index) => ({
        id: `person-${person.id}`,
        kind: 'person',
        title: person.name || person.role || 'Лицо по делу',
        text: person.note || statusLabel(person.status),
        status: statusLabel(person.status) || person.role || '',
        details: person.note || statusLabel(person.status),
        x: clamp(66 + (index % 2) * 12, 8, 82),
        y: clamp(68 + Math.floor(index / 2) * 12, 8, 78),
        tilt: index % 2 ? 1 : -1,
        source: 'investigation'
      }));
  }

  function allLinks() {
    const dynamicLinks = allCards()
      .filter(card => card.source === 'investigation')
      .map(card => ['incident', card.id]);
    return [...links, ...dynamicLinks];
  }

  function syncBoardWall() {
    const visible = isBoardWall();
    layer.classList.toggle('is-visible', visible);
    layer.setAttribute('aria-hidden', String(!visible));
    if (!visible) {
      closeComposer();
      return;
    }
    renderBoard();
  }

  function renderBoard() {
    cardsLayer.innerHTML = '';
    linesLayer.innerHTML = '';

    const cards = allCards();
    layer.classList.toggle('is-empty', !cards.length);
    layer.classList.toggle('has-case', cards.length > 0);

    if (!cards.length) {
      layer.querySelector('.board-wall__tools').style.display = 'none';
      return;
    }

    layer.querySelector('.board-wall__tools').style.display = '';
    for (const card of cards) cardsLayer.appendChild(createCard(card));
    requestAnimationFrame(drawLines);
  }

  function createCard(card) {
    const el = document.createElement('article');
    el.className = 'board-wall-card';
    el.dataset.cardId = card.id;
    el.dataset.kind = card.kind;
    el.style.left = `${card.x}%`;
    el.style.top = `${card.y}%`;
    el.style.setProperty('--tilt', `${card.tilt || 0}deg`);
    el.innerHTML = `
      ${card.kind === 'version' ? '<button class="board-wall-card__remove" type="button" aria-label="Удалить версию">×</button>' : ''}
      <span>${kindLabel(card.kind)}</span>
      <strong>${escapeHtml(card.title)}</strong>
      <p>${escapeHtml(card.text || '')}</p>
      <small>${escapeHtml(card.status || '')}</small>
    `;

    el.addEventListener('pointerdown', event => beginDrag(event, card, el));
    el.addEventListener('click', event => {
      if (Date.now() < suppressClickUntil) return;
      if (event.target.closest('.board-wall-card__remove')) return;
      showCardDetails(card);
    });

    el.querySelector('.board-wall-card__remove')?.addEventListener('click', event => {
      event.stopPropagation();
      removeVersion(card.id);
    });

    return el;
  }

  function beginDrag(event, card, el) {
    if (event.button !== 0 || event.target.closest('button') || debugHotspots) return;
    event.preventDefault();

    const rect = layer.getBoundingClientRect();
    const cardRect = el.getBoundingClientRect();
    dragState = {
      id: card.id,
      el,
      rect,
      startX: event.clientX,
      startY: event.clientY,
      left: cardRect.left - rect.left,
      top: cardRect.top - rect.top,
      moved: false,
      pointerId: event.pointerId
    };
    el.setPointerCapture?.(event.pointerId);
    el.classList.add('is-dragging');
  }

  function onPointerMove(event) {
    if (!dragState) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) dragState.moved = true;

    const maxX = dragState.rect.width - dragState.el.offsetWidth - 4;
    const maxY = dragState.rect.height - dragState.el.offsetHeight - 4;
    const left = clamp(dragState.left + dx, 4, Math.max(4, maxX));
    const top = clamp(dragState.top + dy, 4, Math.max(4, maxY));
    const x = left / dragState.rect.width * 100;
    const y = top / dragState.rect.height * 100;

    dragState.x = x;
    dragState.y = y;
    dragState.el.style.left = `${x}%`;
    dragState.el.style.top = `${y}%`;
    drawLines();
  }

  function onPointerUp() {
    if (!dragState) return;
    if (dragState.moved) {
      savePosition(dragState.id, dragState.x, dragState.y);
      suppressClickUntil = Date.now() + 180;
    }
    dragState.el.classList.remove('is-dragging');
    dragState = null;
  }

  function drawLines() {
    linesLayer.innerHTML = '';
    if (!isBoardWall() || !isCaseActive()) return;

    const boardRect = layer.getBoundingClientRect();
    for (const [fromId, toId] of allLinks()) {
      const from = cardsLayer.querySelector(`[data-card-id="${CSS.escape(fromId)}"]`);
      const to = cardsLayer.querySelector(`[data-card-id="${CSS.escape(toId)}"]`);
      if (!from || !to) continue;

      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(a.left - boardRect.left + a.width / 2));
      line.setAttribute('y1', String(a.top - boardRect.top + a.height / 2));
      line.setAttribute('x2', String(b.left - boardRect.left + b.width / 2));
      line.setAttribute('y2', String(b.top - boardRect.top + b.height / 2));
      linesLayer.appendChild(line);
    }
  }

  function showCardDetails(card) {
    if (typeof openModal !== 'function') return;
    const status = card.kind === 'version' ? 'Версия следователя · не доказано' : card.status;
    openModal(kindLabel(card.kind), card.title, `${card.details || card.text || ''}${status ? `\n\nСтатус: ${status}` : ''}`);
  }

  function openComposer() {
    if (!isCaseActive() || debugHotspots) return;
    composer.hidden = false;
    versionText.value = '';
    versionText.focus();
  }

  function closeComposer() {
    composer.hidden = true;
    versionText.value = '';
  }

  function addVersion(text) {
    const items = loadVersions();
    const index = items.length;
    items.push({
      id: `version-${Date.now().toString(36)}`,
      title: `Версия ${index + 1}`,
      text,
      details: text,
      x: clamp(11 + (index % 4) * 21, 6, 76),
      y: clamp(73 - Math.floor(index / 4) * 16, 8, 76)
    });
    saveVersions(items);
    closeComposer();
    renderBoard();
  }

  function removeVersion(id) {
    saveVersions(loadVersions().filter(item => item.id !== id));
    const positions = loadPositions();
    delete positions[id];
    localStorage.setItem(BOARD_POSITIONS_KEY, JSON.stringify(positions));
    renderBoard();
  }

  function resetPositions() {
    localStorage.removeItem(BOARD_POSITIONS_KEY);
    renderBoard();
  }

  function kindLabel(kind) {
    return ({ person: 'Лицо', place: 'Место', fact: 'Факт', evidence: 'Улика', question: 'Вопрос', version: 'Версия' })[kind] || 'Карточка';
  }

  function statusLabel(status) {
    return ({ claim: 'Неподтверждено', established: 'Установлено', corroborated: 'Подтверждено', unknown: 'Неизвестно', interviewed: 'Опрошен' })[status] || status || '';
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
    return Math.round(Number(value) * 10) / 10;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  layer.querySelector('[data-board-add]').addEventListener('click', event => {
    event.stopPropagation();
    openComposer();
  });

  layer.querySelector('[data-board-reset]').addEventListener('click', event => {
    event.stopPropagation();
    resetPositions();
  });

  layer.querySelector('[data-board-cancel]').addEventListener('click', closeComposer);
  composer.addEventListener('submit', event => {
    event.preventDefault();
    const text = versionText.value.trim();
    if (!text) return;
    addVersion(text);
  });

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('resize', () => requestAnimationFrame(drawLines));
  window.addEventListener('investigation:change', () => {
    if (isBoardWall()) renderBoard();
  });

  const sceneObserver = new MutationObserver(() => requestAnimationFrame(syncBoardWall));
  sceneObserver.observe(currentImage, { attributes: true, attributeFilter: ['src'] });
  sceneObserver.observe(sceneLabel, { childList: true, characterData: true, subtree: true });

  const gameObserver = new MutationObserver(() => {
    if (!debugHotspots && isBoardWall()) requestAnimationFrame(drawLines);
  });
  gameObserver.observe(game, { attributes: true, attributeFilter: ['class'] });

  hotspotsEl.addEventListener('click', event => {
    if (debugHotspots) return;
    const hotspot = event.target.closest('.hotspot');
    if (!hotspot) return;
    const id = hotspot.dataset.hotspotId;
    if (id === 'investigation-board') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (id === 'custom-mt04fy5n') {
      event.preventDefault();
      event.stopPropagation();
      if (typeof openModal === 'function') {
        openModal(
          'Материалы доски',
          'Папка для доски',
          isCaseActive()
            ? 'Здесь будут лежать фотографии, копии документов и карточки, которые следователь сможет переносить на доску по мере расследования.'
            : 'Пока активного дела нет, папка пуста.'
        );
      }
    }
  }, true);

  syncBoardWall();
})();
