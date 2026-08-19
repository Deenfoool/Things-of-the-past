(() => {
  const panel = document.createElement('aside');
  panel.className = 'evidence-ui';
  panel.id = 'evidenceUi';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <header class="evidence-ui__header">
      <div><span class="evidence-ui__eyebrow">Комната улик</span><h2 id="evidenceUiTitle">Хранилище</h2></div>
      <button class="evidence-ui__close" type="button" aria-label="Закрыть">×</button>
    </header>
    <div class="evidence-ui__body" id="evidenceUiBody"></div>`;
  game.appendChild(panel);

  const body = panel.querySelector('#evidenceUiBody');
  const title = panel.querySelector('#evidenceUiTitle');
  const closeButton = panel.querySelector('.evidence-ui__close');
  let mode = 'storage';

  function getEvidence() {
    window.InvestigationState?.syncLegacyCase();
    return window.InvestigationState?.get().evidence || [];
  }

  function open(modeName) {
    if (typeof debugHotspots !== 'undefined' && debugHotspots) return;
    mode = modeName;
    render();
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    closeButton.focus();
  }

  function close() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
  }

  function render() {
    const evidence = getEvidence();
    if (mode === 'storage') renderStorage(evidence);
    if (mode === 'inspection') renderInspection(evidence);
    if (mode === 'issue-log') renderIssueLog(evidence);
    if (mode === 'registry') renderRegistry(evidence);
  }

  function renderStorage(evidence) {
    title.textContent = 'Хранилище вещественных доказательств';
    if (!evidence.length) return renderEmpty('Хранилище пусто', 'По текущему делу ещё не зарегистрировано ни одного вещественного доказательства.');
    body.innerHTML = `<div class="evidence-list">${evidence.map(cardHtml).join('')}</div>`;
  }

  function renderInspection(evidence) {
    title.textContent = 'Стол осмотра улик';
    if (!evidence.length) return renderEmpty('Осматривать пока нечего', 'После регистрации улики её можно будет выбрать здесь для отдельного осмотра.');
    body.innerHTML = `<div class="evidence-inspection"><h3>Выбери предмет из хранилища</h3><p>Следующим слоем сюда подключается 3D-просмотр: вращение, масштаб и фиксация скрытых деталей.</p></div><div class="evidence-list" style="margin-top:10px">${evidence.map(cardHtml).join('')}</div>`;
  }

  function renderIssueLog(evidence) {
    title.textContent = 'Журнал выдачи';
    if (!evidence.length) return renderEmpty('Записей нет', 'Ни одна улика по текущему делу ещё не поступала на хранение и не выдавалась для осмотра.');
    body.innerHTML = `<table class="evidence-ledger"><thead><tr><th>№</th><th>Предмет</th><th>Статус</th></tr></thead><tbody>${evidence.map((item, index) => `<tr><td>${String(index + 1).padStart(3, '0')}</td><td>${escapeHtml(item.title || item.id)}</td><td>${escapeHtml(item.status || 'на хранении')}</td></tr>`).join('')}</tbody></table>`;
  }

  function renderRegistry(evidence) {
    title.textContent = 'Реестр хранения';
    if (!evidence.length) return renderEmpty('Реестр пуст', 'После поступления вещественного доказательства здесь появится его регистрационная карточка.');
    body.innerHTML = `<table class="evidence-ledger"><thead><tr><th>Код</th><th>Наименование</th><th>Источник</th></tr></thead><tbody>${evidence.map(item => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.title || 'Без названия')}</td><td>${escapeHtml(item.location || 'не указано')}</td></tr>`).join('')}</tbody></table>`;
  }

  function renderEmpty(heading, text) {
    body.innerHTML = `<div class="evidence-ui__empty"><strong>${heading}</strong><p>${text}</p></div>`;
  }

  function cardHtml(item) {
    return `<article class="evidence-card"><span>${escapeHtml(item.kind || 'Улика')}</span><strong>${escapeHtml(item.title || item.id)}</strong><p>${escapeHtml(item.description || 'Описание ещё не добавлено.')}</p><small>${escapeHtml(item.status || 'зарегистрировано')}</small></article>`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  const hotspotModes = {
    'evidence-storage': 'storage',
    'custom-mt04kkpf': 'inspection',
    'custom-mt04leqt': 'issue-log',
    'custom-mt04lvth': 'registry'
  };

  hotspotsEl.addEventListener('click', event => {
    if (typeof debugHotspots !== 'undefined' && debugHotspots) return;
    const hotspot = event.target.closest('.hotspot');
    if (!hotspot) return;
    const nextMode = hotspotModes[hotspot.dataset.hotspotId];
    if (!nextMode) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open(nextMode);
  }, true);

  closeButton.addEventListener('click', close);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('is-open')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }
  }, true);

  window.addEventListener('investigation:change', () => {
    if (panel.classList.contains('is-open')) render();
  });
})();
