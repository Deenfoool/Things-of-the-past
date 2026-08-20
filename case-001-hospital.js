(() => {
  const CASE_ID = 'lyublino-1994';
  const LOCATION_ID = 'hospital-ward';
  const ROOM_ID = 'hospital-ward';
  const FORENSIC_FACT_ID = 'victim-firearm-injuries-preliminary';
  const WOUNDED_PERSON_ID = 'wounded-unknown';
  const DESCRIPTION_FACT_ID = 'arkhipov-suspect-description';
  const SKETCH_FACT_ID = 'suspect-sketch-preliminary';

  const scenePaths = [
    './assets/locations/hospital/ward/01-bed.png',
    './assets/locations/hospital/ward/02-window.png',
    './assets/locations/hospital/ward/03-sketch-table.png',
    './assets/locations/hospital/ward/04-door.png'
  ];

  const locationMeta = {
    id: LOCATION_ID,
    title: 'Городская больница',
    subtitle: 'Палата Алексея Архипова',
    description: 'Раненый пришёл в сознание. Врач разрешил короткий опрос.',
    roomId: null,
    artReady: false
  };

  const sketchUi = document.createElement('section');
  sketchUi.className = 'composite-sketch-ui';
  sketchUi.id = 'compositeSketchUi';
  sketchUi.setAttribute('aria-hidden', 'true');
  sketchUi.innerHTML = `
    <button class="composite-sketch-ui__backdrop" type="button" aria-label="Закрыть фоторобот"></button>
    <div class="composite-sketch-ui__panel" role="dialog" aria-modal="true" aria-labelledby="compositeSketchTitle">
      <header>
        <div><span>Ориентировка · свидетель</span><h2 id="compositeSketchTitle">Предварительный фоторобот</h2></div>
        <button type="button" data-sketch-close aria-label="Закрыть">×</button>
      </header>
      <div class="composite-sketch-ui__body">
        <div class="composite-sketch-ui__portrait" aria-hidden="true">
          <div class="composite-sketch-ui__hair"></div>
          <div class="composite-sketch-ui__head"><span>?</span></div>
          <small>Черты лица недостаточны</small>
        </div>
        <div class="composite-sketch-ui__form">
          <p>Соберите ориентировку только из того, что удалось получить от свидетеля. Точные черты лица пока не устанавливаются.</p>
          <label><span>Возраст</span><select data-sketch-field="age"><option value="">—</option><option value="young">Молодой</option><option value="middle">Среднего возраста</option><option value="older">Пожилой</option></select></label>
          <label><span>Волосы</span><select data-sketch-field="hair"><option value="">—</option><option value="dark">Тёмные</option><option value="light">Светлые</option><option value="red">Рыжие</option></select></label>
          <label><span>Верхняя одежда</span><select data-sketch-field="top"><option value="">—</option><option value="white-pattern">Белый свитер с рисунком</option><option value="black-jacket">Чёрная куртка</option><option value="grey-coat">Серое пальто</option></select></label>
          <label><span>Брюки</span><select data-sketch-field="pants"><option value="">—</option><option value="blue-jeans">Голубые джинсы</option><option value="dark-pants">Тёмные брюки</option><option value="sport">Спортивные штаны</option></select></label>
          <div class="composite-sketch-ui__actions"><button type="button" data-sketch-save>Зафиксировать ориентировку</button><button type="button" data-sketch-reset>Сбросить</button></div>
          <div class="composite-sketch-ui__status" data-sketch-status>Фоторобот ещё не составлен.</div>
        </div>
      </div>
    </div>
  `;
  game.appendChild(sketchUi);

  function state() {
    return window.InvestigationState?.syncLegacyCase?.() || window.InvestigationState?.get?.() || null;
  }

  function activeCase() {
    return localStorage.getItem('things-of-the-past-case-active') === CASE_ID;
  }

  function hasFact(id) {
    return Boolean(state()?.facts?.some(item => item.id === id));
  }

  function wounded() {
    return state()?.people?.find(item => item.id === WOUNDED_PERSON_ID) || null;
  }

  function woundedKnown() {
    return wounded()?.name === 'Алексей Архипов';
  }

  function hospitalUnlocked() {
    return Boolean(state()?.locations?.some(item => item.id === LOCATION_ID && item.unlocked));
  }

  function registerMetadata() {
    window.FieldLocations?.register?.(locationMeta);
  }

  function unlockHospital() {
    if (!activeCase() || !woundedKnown() || !window.InvestigationState) return;
    if (!hospitalUnlocked()) {
      window.InvestigationState.unlockLocation({
        id: LOCATION_ID,
        title: 'Городская больница',
        kind: 'witness-location',
        unlocked: true,
        visited: false,
        artReady: false,
        roomId: null,
        note: 'Игровая больничная локация. Конкретное медицинское учреждение не установлено публичными источниками.'
      });
    }
    registerMetadata();
  }

  function hospitalScenes() {
    return [
      {
        src: scenePaths[0],
        label: 'Палата Архипова',
        alt: 'Больничная палата с койкой Алексея Архипова',
        hotspots: [
          { id: 'hospital-arkhipov-bed', x: 34, y: 28, w: 39, h: 58, title: 'Алексей Архипов' },
          { id: 'hospital-bedside-chart', x: 14, y: 41, w: 15, h: 34, title: 'Медицинская карта', text: 'Медицинские подробности не являются самостоятельной уликой. Для дела важны только сведения, официально переданные следствию.' },
          { id: 'hospital-bedside-chair', x: 75, y: 54, w: 17, h: 31, title: 'Стул у койки', text: 'Стул для посетителей. Врач разрешил только короткий разговор.' }
        ]
      },
      {
        src: scenePaths[1],
        label: 'Окно и тумба',
        alt: 'Окно и прикроватная часть больничной палаты',
        hotspots: [
          { id: 'hospital-window', x: 52, y: 6, w: 35, h: 58, title: 'Окно', text: 'Обычная больничная палата. За окном дневной город.' },
          { id: 'hospital-bedside-table', x: 23, y: 52, w: 20, h: 31, title: 'Тумба', text: 'Вода, стакан и личные вещи. Ничего из этого не относится к материалам дела.' },
          { id: 'hospital-call-button', x: 12, y: 25, w: 11, h: 20, title: 'Кнопка вызова', text: 'Кнопка вызова медперсонала. Архипову нужен покой.' }
        ]
      },
      {
        src: scenePaths[2],
        label: 'Стол для фоторобота',
        alt: 'Стол с бумагами для составления предварительного фоторобота',
        hotspots: [
          { id: 'hospital-sketch-table', x: 24, y: 39, w: 52, h: 44, title: 'Составить фоторобот' },
          { id: 'hospital-sketch-pencils', x: 69, y: 56, w: 13, h: 22, title: 'Карандаши', text: 'Рабочие принадлежности для ориентировки.' },
          { id: 'hospital-sketch-forms', x: 16, y: 23, w: 22, h: 23, title: 'Бланки ориентировки', text: 'Пока сведений о личности подозреваемого нет. Здесь фиксируется только внешний облик со слов свидетеля.' }
        ]
      },
      {
        src: scenePaths[3],
        label: 'Выход из палаты',
        alt: 'Дверь из больничной палаты в коридор',
        hotspots: [
          { id: 'hospital-exit', x: 37, y: 8, w: 28, h: 83, title: 'Покинуть больницу', action: 'room', targetRoom: 'corridor', targetIndex: 3 },
          { id: 'hospital-coat-hooks', x: 10, y: 23, w: 18, h: 49, title: 'Вешалка', text: 'Верхняя одежда посетителей и медицинского персонала.' },
          { id: 'hospital-door-sign', x: 69, y: 24, w: 18, h: 21, title: 'Табличка палаты', text: 'Обычная служебная табличка. Точный номер палаты не имеет значения для расследования.' }
        ]
      }
    ];
  }

  async function artExists(path) {
    try {
      const response = await fetch(path, { method: 'HEAD', cache: 'no-store' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function detectHospitalArt() {
    if (!window.FieldLocations) return;
    const ready = (await Promise.all(scenePaths.map(artExists))).every(Boolean);
    if (!ready) {
      registerMetadata();
      return;
    }

    window.FieldLocations.register({
      ...locationMeta,
      roomId: ROOM_ID,
      roomLabel: 'Городская больница · палата Архипова',
      artReady: true,
      scenes: hospitalScenes()
    });
  }

  function openSketch() {
    if (!hasFact(DESCRIPTION_FACT_ID)) {
      openModal?.('Фоторобот', 'Недостаточно сведений', 'Сначала расспросите Архипова о внешности человека, которого он пытался остановить.');
      return;
    }

    sketchUi.classList.add('is-open');
    sketchUi.setAttribute('aria-hidden', 'false');
    const done = hasFact(SKETCH_FACT_ID);
    sketchUi.querySelector('[data-sketch-status]').textContent = done
      ? 'Предварительная ориентировка уже внесена в материалы дела.'
      : 'Выберите признаки, которые запомнил свидетель.';
  }

  function closeSketch() {
    sketchUi.classList.remove('is-open');
    sketchUi.setAttribute('aria-hidden', 'true');
  }

  function resetSketch() {
    sketchUi.querySelectorAll('[data-sketch-field]').forEach(select => { select.value = ''; });
    sketchUi.querySelector('[data-sketch-status]').textContent = 'Выбор сброшен.';
  }

  function saveSketch() {
    const values = Object.fromEntries(Array.from(sketchUi.querySelectorAll('[data-sketch-field]')).map(select => [select.dataset.sketchField, select.value]));
    const correct = values.age === 'young' && values.hair === 'dark' && values.top === 'white-pattern' && values.pants === 'blue-jeans';
    const status = sketchUi.querySelector('[data-sketch-status]');

    if (!correct) {
      status.textContent = 'Ориентировка не совпадает с записанным показанием Архипова. Проверьте разговор ещё раз.';
      return;
    }

    if (!hasFact(SKETCH_FACT_ID) && window.InvestigationState) {
      window.InvestigationState.addFact({
        id: SKETCH_FACT_ID,
        title: 'Предварительный фоторобот',
        status: 'established',
        text: 'Составлена предварительная ориентировка: молодой темноволосый мужчина, белый свитер с рисунком, голубые джинсы. Точные черты лица пока не установлены.',
        sourceType: 'published-eyewitness-description-with-fiction-bridge',
        sourceRefs: ['S1'],
        sourceNote: 'S1 прямо сообщает приблизительный портрет по показаниям очевидцев. Игровой интерфейс составления фоторобота является художественной реконструкцией.'
      });
      window.InvestigationState.addTimeline({
        id: 'preliminary-composite-sketch-made',
        time: '24 августа 1994, больница',
        title: 'Составлен предварительный фоторобот',
        status: 'established',
        text: 'Зафиксированы основные приметы нападавшего; черты лица остаются неполными.'
      });
    }

    status.textContent = 'Ориентировка зафиксирована и добавлена в материалы дела.';
  }

  function patchPhonePanel() {
    const desk = document.getElementById('deskUi');
    const phone = desk?.querySelector('.phone-panel');
    if (!phone || !activeCase()) return;

    const heading = phone.querySelector('h3');
    const text = phone.querySelector('p');
    const receive = phone.querySelector('[data-receive-hospital-update]');

    if (hasFact(FORENSIC_FACT_ID) && !woundedKnown()) {
      if (heading) heading.textContent = 'Звонок из больницы';
      if (text) text.textContent = 'Раненый пришёл в сознание. Врачи установили его имя — Алексей Архипов — и разрешают следователю коротко его навестить.';
      if (receive) receive.textContent = 'Принять звонок';
      return;
    }

    if (woundedKnown()) {
      unlockHospital();
      if (heading) heading.textContent = 'Архипов пришёл в сознание';
      if (text) text.textContent = 'Врач разрешил короткий опрос. Больница добавлена в список доступных локаций.';
      if (!phone.querySelector('[data-open-hospital-travel]')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'desk-ui__primary';
        button.dataset.openHospitalTravel = '';
        button.textContent = 'Открыть список выездов';
        button.addEventListener('click', () => {
          desk.querySelector('.desk-ui__close')?.click();
          setTimeout(() => window.FieldLocations?.openTravel?.(), 0);
        });
        phone.querySelector('div:last-child')?.appendChild(button);
      }
    }
  }

  document.addEventListener('click', event => {
    const hotspot = event.target.closest?.('[data-hotspot-id]');
    if (!hotspot || (typeof debugHotspots !== 'undefined' && debugHotspots)) return;

    if (hotspot.dataset.hotspotId === 'hospital-arkhipov-bed') {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.DialogueSystem?.open?.('arkhipov-hospital');
      return;
    }

    if (hotspot.dataset.hotspotId === 'hospital-sketch-table') {
      event.preventDefault();
      event.stopImmediatePropagation();
      openSketch();
    }
  }, true);

  sketchUi.querySelector('[data-sketch-close]').addEventListener('click', closeSketch);
  sketchUi.querySelector('.composite-sketch-ui__backdrop').addEventListener('click', closeSketch);
  sketchUi.querySelector('[data-sketch-reset]').addEventListener('click', resetSketch);
  sketchUi.querySelector('[data-sketch-save]').addEventListener('click', saveSketch);

  const bodyObserver = new MutationObserver(() => requestAnimationFrame(patchPhonePanel));
  const deskBody = document.getElementById('deskUiBody');
  if (deskBody) bodyObserver.observe(deskBody, { childList: true, subtree: true });

  window.addEventListener('investigation:change', () => {
    unlockHospital();
    requestAnimationFrame(patchPhonePanel);
  });

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sketchUi.classList.contains('is-open')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeSketch();
    }
  }, true);

  registerMetadata();
  unlockHospital();
  detectHospitalArt();
})();
