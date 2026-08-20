(() => {
  const CASE_ID = 'lyublino-1994';
  const CASE_ACTIVE_KEY = 'things-of-the-past-case-active';
  const CASE_READ_KEY = 'things-of-the-past-case-brief-read';
  const NOTES_KEY = 'things-of-the-past-investigator-notes-v1';
  const FORENSIC_FACT_ID = 'victim-firearm-injuries-preliminary';
  const WOUNDED_ID_FACT = 'wounded-identified-arkhipov';
  const WOUNDED_PERSON_ID = 'wounded-unknown';
  const WOUNDED_TIMELINE_ID = 'wounded-identity-confirmed';

  const caseData = {
    number: 'Дело №001',
    title: 'Стрельба на Люблинском рынке',
    date: '24 августа 1994',
    time: 'около полудня',
    location: 'Люблинский рынок',
    status: 'Первичный выезд',
    dispatch: 'В дежурную часть поступило сообщение о стрельбе на Люблинском рынке. По предварительным данным, один человек погиб, один ранен. Личности участников и точные обстоятельства пока не установлены.'
  };

  const overlay = document.createElement('section');
  overlay.className = 'desk-ui';
  overlay.id = 'deskUi';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <button class="desk-ui__backdrop" type="button" aria-label="Закрыть"></button>
    <div class="desk-ui__shell" role="dialog" aria-modal="true" aria-labelledby="deskUiTitle">
      <header class="desk-ui__header">
        <div>
          <span class="desk-ui__eyebrow" id="deskUiEyebrow">Рабочий стол</span>
          <h2 id="deskUiTitle">Материалы</h2>
        </div>
        <button class="desk-ui__close" type="button" aria-label="Закрыть">×</button>
      </header>
      <div class="desk-ui__body" id="deskUiBody"></div>
    </div>
  `;
  document.getElementById('game').appendChild(overlay);

  const body = overlay.querySelector('#deskUiBody');
  const title = overlay.querySelector('#deskUiTitle');
  const eyebrow = overlay.querySelector('#deskUiEyebrow');
  const closeButton = overlay.querySelector('.desk-ui__close');
  const backdrop = overlay.querySelector('.desk-ui__backdrop');

  let activeCaseTab = 'summary';
  let activeMode = null;
  let notesSaveTimer = null;

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

  function hasFact(id) {
    return Boolean(caseState().facts?.some(item => item.id === id));
  }

  function woundedPerson() {
    return caseState().people?.find(item => item.id === WOUNDED_PERSON_ID) || null;
  }

  function woundedIdentityEstablished() {
    return woundedPerson()?.name === 'Алексей Архипов';
  }

  function canReceiveHospitalUpdate() {
    return isCaseActive() && hasFact(FORENSIC_FACT_ID) && !woundedIdentityEstablished();
  }

  function openUi(mode) {
    if (typeof debugHotspots !== 'undefined' && debugHotspots) return;
    activeMode = mode;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');

    if (mode === 'case') renderCaseFile();
    if (mode === 'notes') renderNotes();
    if (mode === 'phone') renderPhone();

    closeButton.focus();
  }

  function closeUi() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    activeMode = null;
  }

  function renderCaseFile() {
    eyebrow.textContent = 'Рабочий стол · папка';
    title.textContent = isCaseActive() ? `${caseData.number} — ${caseData.location}` : 'Папка текущего дела';

    if (!isCaseActive()) {
      body.innerHTML = `
        <div class="case-empty">
          <div class="case-empty__stamp">НЕТ ДЕЛА</div>
          <h3>Папка пока пуста</h3>
          <p>Новых материалов на столе нет. Если поступило происшествие, сначала нужно получить сообщение у дежурного в коридоре.</p>
          <button class="desk-ui__primary" type="button" data-go-duty>Выйти к дежурному</button>
        </div>
      `;
      body.querySelector('[data-go-duty]')?.addEventListener('click', () => {
        closeUi();
        if (typeof changeRoom === 'function') changeRoom('corridor', 1);
      });
      return;
    }

    localStorage.setItem(CASE_READ_KEY, '1');
    renderActiveCaseTab();
  }

  function renderActiveCaseTab() {
    const tabs = [
      ['summary', 'Сводка'],
      ['people', 'Люди'],
      ['evidence', 'Улики'],
      ['locations', 'Локации'],
      ['timeline', 'Хронология']
    ];

    body.innerHTML = `
      <div class="case-file">
        <aside class="case-file__tabs" aria-label="Разделы дела">
          <div class="case-file__cover">
            <span>МВД</span>
            <strong>${caseData.number}</strong>
            <small>${caseData.date}</small>
          </div>
          <nav>
            ${tabs.map(([id, label]) => `<button type="button" data-case-tab="${id}" class="${activeCaseTab === id ? 'is-active' : ''}">${label}</button>`).join('')}
          </nav>
          <div class="case-file__status">
            <span>Статус</span>
            <strong>${caseData.status}</strong>
          </div>
        </aside>
        <article class="case-file__paper" id="casePaper"></article>
      </div>
    `;

    body.querySelectorAll('[data-case-tab]').forEach(button => {
      button.addEventListener('click', () => {
        activeCaseTab = button.dataset.caseTab;
        renderActiveCaseTab();
      });
    });

    const paper = body.querySelector('#casePaper');
    if (activeCaseTab === 'summary') paper.innerHTML = caseSummaryHtml();
    if (activeCaseTab === 'people') paper.innerHTML = casePeopleHtml();
    if (activeCaseTab === 'evidence') paper.innerHTML = caseEvidenceHtml();
    if (activeCaseTab === 'locations') paper.innerHTML = caseLocationsHtml();
    if (activeCaseTab === 'timeline') paper.innerHTML = caseTimelineHtml();

    paper.querySelectorAll('[data-go-location]').forEach(button => {
      button.addEventListener('click', () => {
        closeUi();
        if (typeof changeRoom === 'function') changeRoom('corridor', 3);
      });
    });
  }

  function sectionHeading(kicker, heading, text) {
    return `
      <div class="paper-heading">
        <span>${kicker}</span>
        <h3>${heading}</h3>
        ${text ? `<p>${text}</p>` : ''}
      </div>
    `;
  }

  function caseSummaryHtml() {
    const state = caseState();
    const victim = state.people.find(item => item.id === 'victim-unknown');
    const wounded = state.people.find(item => item.id === WOUNDED_PERSON_ID);
    const victimText = victim?.name
      ? `1 человек · ${escapeHtml(victim.name)}${victim.occupation ? ` · ${escapeHtml(victim.occupation)}` : ''}`
      : victim?.status === 'observed'
        ? '1 человек · обнаружен, личность пока не установлена'
        : '1 человек · личность пока не установлена';
    const woundedText = wounded?.name
      ? `1 человек · ${escapeHtml(wounded.name)}`
      : '1 человек · личность пока не установлена';

    return `
      ${sectionHeading('Первичная сводка', caseData.title, 'В папке отображается только то, что следователь уже получил официально. Неустановленные сведения намеренно остаются пустыми.')}
      <dl class="case-facts">
        <div><dt>Дата</dt><dd>${caseData.date}</dd></div>
        <div><dt>Время</dt><dd>${caseData.time}</dd></div>
        <div><dt>Место</dt><dd>${caseData.location}</dd></div>
        <div><dt>Тип события</dt><dd>Стрельба</dd></div>
        <div><dt>Погибшие</dt><dd>${victimText}</dd></div>
        <div><dt>Раненые</dt><dd>${woundedText}</dd></div>
      </dl>
      <div class="paper-note">
        <strong>Сообщение дежурного</strong>
        <p>${caseData.dispatch}</p>
      </div>
      <div class="paper-actions">
        <button class="desk-ui__primary" type="button" data-go-location>Подготовиться к выезду</button>
      </div>
    `;
  }

  function casePeopleHtml() {
    const state = caseState();
    const knownPeople = state.people || [];
    const establishedCount = knownPeople.filter(item => item.name).length;
    const cards = knownPeople.map(item => {
      const title = item.name || 'Личность не установлена';
      const status = statusLabel(item.status) || 'Неизвестно';
      return `<div class="unknown-card"><span>${escapeHtml(item.role || 'Лицо')}</span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(item.note || status)}</small></div>`;
    }).join('');

    return `
      ${sectionHeading('Лица по делу', `На данный момент установлено: ${establishedCount}`, 'Карточки будут заполняться только после осмотра места, документов и разговоров со свидетелями.')}
      <div class="unknown-grid">
        ${cards}
        <div class="unknown-card"><span>Стрелявший</span><strong>Неизвестен</strong><small>Описание отсутствует</small></div>
        <div class="unknown-card"><span>Возможные свидетели</span><strong>Не установлены</strong><small>Поиск начнётся после выезда</small></div>
      </div>
    `;
  }

  function caseEvidenceHtml() {
    const evidence = caseState().evidence || [];
    if (evidence.length) {
      return `
        ${sectionHeading('Вещественные доказательства', `Зарегистрировано: ${evidence.length}`, 'Здесь отображаются только предметы, уже внесённые в материалы текущего дела.')}
        <div class="unknown-grid">
          ${evidence.map(item => `<div class="unknown-card"><span>${escapeHtml(item.kind || 'Улика')}</span><strong>${escapeHtml(item.title || item.id)}</strong><small>${escapeHtml(item.description || item.status || 'Зарегистрировано')}</small></div>`).join('')}
        </div>
      `;
    }

    return `
      ${sectionHeading('Вещественные доказательства', 'Улик пока нет', 'До осмотра места происшествия нельзя считать никакой предмет или версию установленным фактом.')}
      <div class="empty-ledger">
        <span>0</span>
        <strong>зарегистрированных улик</strong>
        <p>После обнаружения и регистрации предметы появятся здесь и в комнате хранения улик.</p>
      </div>
    `;
  }

  function caseLocationsHtml() {
    const locations = caseState().locations || [];
    const openLocations = locations.filter(item => item.unlocked);

    return `
      ${sectionHeading('Доступные места', `Открыто: ${openLocations.length}`, 'Новые адреса будут появляться только после того, как следователь узнает о них в ходе расследования.')}
      ${openLocations.map(location => `
        <div class="location-card is-open">
          <div>
            <span>${location.visited ? 'Посещено' : 'Доступно'}</span>
            <strong>${escapeHtml(location.title || caseData.location)}</strong>
            <p>${location.visited ? 'Локация уже была открыта для осмотра.' : 'Место происшествия. Первичный осмотр ещё не проводился.'}</p>
          </div>
          <button class="desk-ui__primary" type="button" data-go-location>К двери выезда</button>
        </div>
      `).join('')}
      <div class="location-card is-locked">
        <div><span>Неизвестно</span><strong>Другие места</strong><p>Адреса появятся по мере получения новых фактов.</p></div>
      </div>
    `;
  }

  function caseTimelineHtml() {
    const timeline = caseState().timeline || [];

    return `
      ${sectionHeading('Хронология', `Записей: ${timeline.length}`, 'Время и последовательность событий будут уточняться по документам и показаниям.')}
      <ol class="timeline-list">
        ${timeline.map(item => `<li><time>${escapeHtml(item.time || '?')}</time><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text || statusLabel(item.status))}</p></li>`).join('')}
        <li class="is-unknown"><time>?</time><strong>Что произошло до вызова</strong><p>Не установлено.</p></li>
        <li class="is-unknown"><time>?</time><strong>Что произошло после стрельбы</strong><p>Не установлено.</p></li>
      </ol>
    `;
  }

  function statusLabel(status) {
    return ({ claim: 'Неподтверждённое сообщение', established: 'Установлено', corroborated: 'Подтверждено', unknown: 'Неизвестно', observed: 'Обнаружен', interviewed: 'Опрошен' })[status] || '';
  }

  function renderNotes() {
    eyebrow.textContent = 'Рабочий стол · блокнот';
    title.textContent = 'Записи следователя';
    const saved = localStorage.getItem(NOTES_KEY) || '';

    body.innerHTML = `
      <div class="notes-sheet">
        <div class="notes-sheet__meta"><span>Личные рабочие записи</span><small>Сохраняются автоматически в этом браузере</small></div>
        <textarea id="investigatorNotes" spellcheck="true" placeholder="Запиши версию, вопрос свидетелю, несостыковку или то, что нужно проверить...">${escapeHtml(saved)}</textarea>
        <div class="notes-sheet__footer"><span id="notesStatus">Сохранено</span><button type="button" data-clear-notes>Очистить</button></div>
      </div>
    `;

    const textarea = body.querySelector('#investigatorNotes');
    const status = body.querySelector('#notesStatus');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    textarea.addEventListener('input', () => {
      status.textContent = 'Сохранение…';
      clearTimeout(notesSaveTimer);
      notesSaveTimer = setTimeout(() => {
        localStorage.setItem(NOTES_KEY, textarea.value);
        status.textContent = 'Сохранено';
      }, 250);
    });

    body.querySelector('[data-clear-notes]').addEventListener('click', () => {
      textarea.value = '';
      localStorage.removeItem(NOTES_KEY);
      status.textContent = 'Очищено';
      textarea.focus();
    });
  }

  function receiveHospitalUpdate() {
    if (!canReceiveHospitalUpdate() || !window.InvestigationState) return;

    window.InvestigationState.addFact({
      id: WOUNDED_ID_FACT,
      title: 'Установлена личность раненого',
      status: 'established',
      text: 'Раненый, доставленный после происшествия на Люблинском рынке, установлен как Алексей Архипов.',
      sourceType: 'service-update',
      sourceRefs: ['S1', 'S2', 'S3', 'S4']
    });

    window.InvestigationState.upsertPerson({
      id: WOUNDED_PERSON_ID,
      role: 'Раненый',
      name: 'Алексей Архипов',
      status: 'established',
      note: 'Алексей Архипов — раненый по делу. Личность подтверждена служебным сообщением из больницы; обстоятельства ранения ещё предстоит уточнить.'
    });

    window.InvestigationState.addTimeline({
      id: WOUNDED_TIMELINE_ID,
      time: '24 августа 1994, после первичного выезда',
      title: 'Установлена личность раненого',
      status: 'established',
      text: 'Из больницы передано уточнение: раненый — Алексей Архипов.'
    });
  }

  function renderPhone() {
    eyebrow.textContent = 'Рабочий стол · телефон';
    title.textContent = 'Служебный телефон';

    const active = isCaseActive();
    const incoming = canReceiveHospitalUpdate();
    const woundedKnown = woundedIdentityEstablished();

    let heading = 'Линия свободна';
    let text = 'Активного дела пока нет. Телефон понадобится после получения задания у дежурного.';
    if (active && incoming) {
      heading = 'Есть новое служебное сообщение';
      text = 'Из больницы передали уточнение по раненому, доставленному после происшествия на Люблинском рынке.';
    } else if (active && woundedKnown) {
      heading = 'Новых сообщений нет';
      text = 'Последнее служебное уточнение принято: личность раненого установлена.';
    } else if (active) {
      heading = 'Срочных звонков нет';
      text = 'Дело принято. Новые звонки свидетелей, экспертов и сотрудников будут появляться здесь по мере расследования.';
    }

    body.innerHTML = `
      <div class="phone-panel">
        <div class="phone-panel__receiver" aria-hidden="true">☎</div>
        <div>
          <span class="phone-panel__line">Линия 2 · внутренняя</span>
          <h3>${heading}</h3>
          <p>${text}</p>
          ${incoming ? '<button class="desk-ui__primary" type="button" data-receive-hospital-update>Принять сообщение</button>' : ''}
        </div>
      </div>
      <div class="phone-log">
        <strong>Журнал последних событий</strong>
        ${active
          ? `<div><span>Дежурная часть</span><small>Передано первичное сообщение по Люблинскому рынку</small></div>${woundedKnown ? '<div><span>Больница</span><small>Раненый установлен как Алексей Архипов</small></div>' : ''}`
          : '<div class="is-empty">Записей пока нет</div>'}
      </div>
    `;

    body.querySelector('[data-receive-hospital-update]')?.addEventListener('click', receiveHospitalUpdate);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function hotspotModeFromId(id) {
    if (id === 'case-folder') return 'case';
    if (id === 'desk-notes' || id === 'custom-mt04c98g') return 'notes';
    if (id === 'desk-phone' || id === 'computer-phone') return 'phone';
    return null;
  }

  hotspotsEl.addEventListener('click', event => {
    if (typeof debugHotspots !== 'undefined' && debugHotspots) return;
    const hotspot = event.target.closest('.hotspot');
    if (!hotspot) return;
    const mode = hotspotModeFromId(hotspot.dataset.hotspotId);
    if (!mode) return;

    event.preventDefault();
    event.stopPropagation();
    openUi(mode);
  }, true);

  document.addEventListener('click', event => {
    const panelButton = event.target.closest('[data-panel]');
    if (!panelButton) return;
    const mode = panelButton.dataset.panel === 'case' ? 'case' : panelButton.dataset.panel === 'notes' ? 'notes' : null;
    if (!mode) return;

    event.preventDefault();
    event.stopPropagation();
    openUi(mode);
  }, true);

  closeButton.addEventListener('click', closeUi);
  backdrop.addEventListener('click', closeUi);

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeUi();
    }
  }, true);

  window.addEventListener('investigation:change', () => {
    if (!overlay.classList.contains('is-open') || !isCaseActive()) return;
    if (activeMode === 'case') renderActiveCaseTab();
    if (activeMode === 'phone') renderPhone();
  });
})();
