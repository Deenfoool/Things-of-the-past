(() => {
  const DEFAULT_SETTINGS = {
    masterVolume: 80,
    musicVolume: 70,
    effectsVolume: 80,
    uiVolume: 75,
    matureContent: false,
    motion: 'normal'
  };

  const game = document.getElementById('game');
  const settingsKey = window.ThingsGame?.settingsKey || 'things-of-the-past-settings-v1';

  const menu = document.createElement('section');
  menu.className = 'main-menu is-open';
  menu.id = 'mainMenu';
  menu.setAttribute('aria-label', 'Главное меню');
  menu.innerHTML = `
    <div class="main-menu__panel">
      <div class="main-menu__brand">
        <span>Детективная хроника</span>
        <h1>Дела прошлого</h1>
        <p>Москва, 1994. Первое дело начинается с сигнала о стрельбе на Люблинском рынке.</p>
      </div>
      <div class="main-menu__actions">
        <button class="main-menu__button main-menu__button--primary" type="button" data-menu-new>Новая игра</button>
        <button class="main-menu__button" type="button" data-menu-continue>Продолжить</button>
        <button class="main-menu__button" type="button" data-menu-settings>Настройки</button>
      </div>
      <div class="main-menu__meta">
        <span>Версия прототипа: 0.1</span>
        <span>Сохранение: локальный браузер</span>
      </div>
    </div>

    <section class="main-menu__settings" id="mainMenuSettings" aria-hidden="true" aria-labelledby="settingsTitle">
      <header class="main-menu__settings-header">
        <div><span>Системные параметры</span><h2 id="settingsTitle">Настройки</h2></div>
        <button class="main-menu__close" type="button" data-settings-close aria-label="Закрыть настройки">×</button>
      </header>
      <div class="main-menu__settings-body">
        <section class="settings-section">
          <h3>Звук</h3>
          <label class="settings-control">
            <span>Общая громкость<small>Основной уровень для всех будущих аудиослоёв.</small></span>
            <input type="range" min="0" max="100" step="1" data-setting="masterVolume" />
          </label>
          <label class="settings-control">
            <span>Музыка<small>Фоновая музыка и темы меню.</small></span>
            <input type="range" min="0" max="100" step="1" data-setting="musicVolume" />
          </label>
          <label class="settings-control">
            <span>Эффекты<small>Двери, бумага, телефон, шаги и предметы.</small></span>
            <input type="range" min="0" max="100" step="1" data-setting="effectsVolume" />
          </label>
          <label class="settings-control">
            <span>Интерфейс<small>Щелчки, подтверждения и служебные сигналы.</small></span>
            <input type="range" min="0" max="100" step="1" data-setting="uiVolume" />
          </label>
        </section>

        <section class="settings-section">
          <h3>Клавиши</h3>
          <div class="settings-key-list">
            <div class="settings-key"><span>Повернуться влево</span><kbd>← / A</kbd></div>
            <div class="settings-key"><span>Повернуться вправо</span><kbd>→ / D</kbd></div>
            <div class="settings-key"><span>Закрыть окно</span><kbd>Esc</kbd></div>
            <div class="settings-key"><span>Редактор зон</span><kbd>F2</kbd></div>
          </div>
          <p class="settings-note">Текущая схема управления.</p>
        </section>

        <section class="settings-section">
          <h3>Контент</h3>
          <label class="settings-control">
            <span>Показывать 18+ сцены<small>Включает более явные следы насилия в сценах осмотра.</small></span>
            <input type="checkbox" data-setting="matureContent" />
          </label>
          <label class="settings-control">
            <span>Интенсивность движения<small>Управляет переходами и анимациями.</small></span>
            <select data-setting="motion">
              <option value="normal">Обычная</option>
              <option value="reduced">Сниженная</option>
            </select>
          </label>
        </section>
      </div>
    </section>
  `;

  game.appendChild(menu);
  game.classList.add('is-menu-open');

  const settingsPanel = menu.querySelector('#mainMenuSettings');
  const continueButton = menu.querySelector('[data-menu-continue]');
  const settingInputs = Array.from(menu.querySelectorAll('[data-setting]'));

  function readSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      return { ...DEFAULT_SETTINGS, ...(saved && typeof saved === 'object' ? saved : {}) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    window.ThingsGame?.applySettings?.();
  }

  function syncSettingsForm() {
    const settings = readSettings();
    settingInputs.forEach(input => {
      const key = input.dataset.setting;
      if (input.type === 'checkbox') input.checked = Boolean(settings[key]);
      else input.value = settings[key];
    });
  }

  function updateContinueState() {
    continueButton.disabled = !window.ThingsGame?.hasSave?.();
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    game.classList.remove('is-menu-open');
    settingsPanel.classList.remove('is-open');
    settingsPanel.setAttribute('aria-hidden', 'true');
  }

  function openSettings() {
    syncSettingsForm();
    settingsPanel.classList.add('is-open');
    settingsPanel.setAttribute('aria-hidden', 'false');
    settingsPanel.querySelector('[data-settings-close]').focus();
  }

  function closeSettings() {
    settingsPanel.classList.remove('is-open');
    settingsPanel.setAttribute('aria-hidden', 'true');
    menu.querySelector('[data-menu-settings]').focus();
  }

  menu.querySelector('[data-menu-new]').addEventListener('click', () => {
    window.ThingsGame?.newGame?.();
    closeMenu();
  });

  continueButton.addEventListener('click', () => {
    if (continueButton.disabled) return;
    window.ThingsGame?.continueGame?.();
    closeMenu();
  });

  menu.querySelector('[data-menu-settings]').addEventListener('click', openSettings);
  menu.querySelector('[data-settings-close]').addEventListener('click', closeSettings);

  settingInputs.forEach(input => {
    input.addEventListener('input', () => {
      const settings = readSettings();
      const key = input.dataset.setting;
      settings[key] = input.type === 'checkbox' ? input.checked : input.value;
      if (input.type === 'range') settings[key] = Number(input.value);
      saveSettings(settings);
    });
  });

  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.classList.contains('is-open')) return;
    if (settingsPanel.classList.contains('is-open')) {
      event.preventDefault();
      closeSettings();
    }
  }, true);

  syncSettingsForm();
  updateContinueState();
})();
