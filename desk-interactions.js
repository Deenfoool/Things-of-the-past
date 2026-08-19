(() => {
  const CASE_ID = 'lyublino-1994';
  const CASE_ACTIVE_KEY = 'things-of-the-past-case-active';
  const CASE_READ_KEY = 'things-of-the-past-case-brief-read';
  const NOTES_KEY = 'things-of-the-past-investigator-notes-v1';

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
  let notesSaveTimer = null;

  function isCaseActive() {
    return localStorage.getItem(CASE_ACTIVE_KEY) === CASE_ID;
  }

  function openUi(mode) {
    if (typeof debugHotspots !== 'undefined' && debugHotspots) return;
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
    return `
      ${sectionHeading('Первичная сводка', caseData.title, 'В папке отображается только то, что следователь уже получил официально. Неустановленные сведения намеренно остаются пустыми.')}
      <dl class="case-facts">
        <div><dt>Дата</dt><dd>${caseData.date}</dd></div>
        <div><dt>Время</dt><dd>${caseData.time}</dd></div>
        <div><dt>Место</dt><dd>${caseData.location}</dd></div>
        <div><dt>Тип события</dt><dd>Стрельба</dd></div>
        <div><dt>Погибшие</dt><dd>1 человек · личность пока не установлена</dd></div>
        <div><dt>Раненые</dt><dd>1 человек · личность пока не установлена</dd></div>
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
    return `
      ${sectionHeading('Лица по делу', 'На данный момент установлено: 0', 'Карточки будут заполняться только после осмотра места, документов и разговоров со свидетелями.')}
      <div class="unknown-grid">
        <div class="unknown-card"><span>Погибший</span><strong>Личность не установлена</strong><small>Нужно установить на месте происшествия</small></div>
        <div class="unknown-card"><span>Раненый</span><strong>Личность не установлена</strong><small>Нужно выяснить состояние и получить сведения</small></div>
        <div class="unknown-card"><span>Стрелявший</span><strong>Неизвестен</strong><small>Описание отсутствует</small></div>
        <div class="unknown-card"><span>Возможные свидетели</span><strong>Не установлены</strong><small>Поиск начнётся после выезда</small></div>
      </div>
    `;
  }

  function caseEvidenceHtml() {
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
    return `
      ${sectionHeading('Доступные места', 'Открыта 1 локация', 'Новые адреса будут появляться только после того, как следователь узнает о них в ходе расследования.')}
      <div class="location-card is-open">
        <div>
          <span>Доступно</span>
          <strong>${caseData.location}</strong>
          <p>Место происшествия. Первичный осмотр ещё не проводился.</p>
        </div>
        <button class="desk-ui__primary" type="button" data-go-location>К двери выезда</button>
      </div>
      <div class="location-card is-locked">
        <div><span>Неизвестно</span><strong>Другие места</strong><p>Адреса появятся по мере получения новых фактов.</p></div>
      </div>
    `;
  }

  function caseTimelineHtml() {
    return `
      ${sectionHeading('Хронология', 'Известен только исходный сигнал', 'Время и последовательность событий будут уточняться по документам и показаниям.')}
      <ol class="timeline-list">
        <li><time>${caseData.date}, ${caseData.time}</time><strong>Сообщение о стрельбе</strong><p>Дежурная часть получает первичный сигнал с Люблинского рынка.</p></li>
        <li class="is-unknown"><time>?</time><strong>Что произошло до вызова</strong><p>Не установлено.</p></li>
        <li class="is-unknown"><time>?</time><strong>Что произошло после стрельбы</strong><p>Не установлено.</p></li>
      </ol>
    `;
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

  function renderPhone() {
    eyebrow.textContent = 'Рабочий стол · телефон';
    title.textContent = 'Служебный телефон';

    const active = isCaseActive();
    body.innerHTML = `
      <div class="phone-panel">
        <div class="phone-panel__receiver" aria-hidden="true">☎</div>
        <div>
          <span class="phone-panel__line">Линия 2 · внутренняя</span>
          <h3>${active ? 'Срочных звонков нет' : 'Линия свободна'}</h3>
          <p>${active ? 'Дело принято. Новые звонки свидетелей, экспертов и сотрудников будут появляться здесь по мере расследования.' : 'Активного дела пока нет. Телефон понадобится после получения задания у дежурного.'}</p>
        </div>
      </div>
      <div class="phone-log">
        <strong>Журнал последних событий</strong>
        ${active
          ? '<div><span>Дежурная часть</span><small>Передано первичное сообщение по Люблинскому рынку</small></div>'
          : '<div class="is-empty">Записей пока нет</div>'}
      </div>
    `;
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
})();
