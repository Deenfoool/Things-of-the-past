const FIRST_CASE = {
  id: 'lyublino-1994',
  title: 'Дело №001',
  location: 'Люблинский рынок',
  summary: '24 августа 1994 года. Около полудня в дежурную часть поступило сообщение о стрельбе на Люблинском рынке. Есть погибший и раненый. Личности участников и обстоятельства пока не установлены.'
};

const HOTSPOT_EDITS_KEY = 'things-of-the-past-hotspot-edits-v1';

const rooms = {
  office: {
    label: 'Кабинет следователя',
    scenes: [
      {
        src: './assets/rooms/office/table.png',
        label: 'Рабочий стол',
        alt: 'Рабочий стол следователя',
        hotspots: [
          {
            id: 'case-folder',
            x: 29, y: 39, w: 28, h: 25,
            title: 'Папка текущего дела',
            action: 'case-file'
          },
          {
            id: 'desk-phone',
            x: 79, y: 12, w: 17, h: 22,
            title: 'Служебный телефон',
            text: 'Телефон на рабочем столе. Позже через него будут поступать звонки свидетелей, экспертов и сотрудников дежурной части.'
          },
          {
            id: 'desk-notes',
            x: 54, y: 42, w: 11, h: 20,
            title: 'Рабочие записи',
            text: 'Блокнот и рабочие записи следователя.'
          }
        ]
      },
      {
        src: './assets/rooms/office/monitor.png',
        label: 'Компьютер',
        alt: 'Компьютер в кабинете следователя',
        hotspots: [
          {
            id: 'office-computer',
            x: 31, y: 7, w: 37, h: 54,
            title: 'Служебный компьютер',
            text: 'Служебный компьютер. Через него будут доступны базы, архивные карточки, результаты экспертиз и служебная информация.'
          },
          {
            id: 'computer-phone',
            x: 70, y: 42, w: 17, h: 25,
            title: 'Телефон',
            text: 'Служебный телефон. По нему будут поступать звонки, сообщения и новая информация по делу.'
          },
          {
            id: 'computer-folders',
            x: 0, y: 43, w: 20, h: 32,
            title: 'Папки',
            text: 'Рабочие папки с документами и материалами расследований.'
          }
        ]
      },
      {
        src: './assets/rooms/office/board.png',
        label: 'Доска расследования',
        alt: 'Доска расследования в кабинете',
        hotspots: [
          {
            id: 'investigation-board',
            x: 17, y: 12, w: 66, h: 67,
            title: 'Доска расследования',
            text: 'Здесь будут появляться фотографии, показания, документы и связи между фактами. Игрок сможет собирать собственную версию событий.'
          }
        ]
      },
      {
        src: './assets/rooms/office/door-corridor.png',
        label: 'Дверь в коридор',
        alt: 'Дверь из кабинета следователя в коридор',
        hotspots: [
          {
            id: 'office-to-corridor',
            x: 31, y: 7, w: 39, h: 86,
            title: 'Выйти в коридор',
            action: 'room',
            targetRoom: 'corridor',
            targetIndex: 0
          }
        ]
      }
    ]
  },

  corridor: {
    label: 'Коридор дежурной части',
    scenes: [
      {
        src: './assets/rooms/corridor/door-inside.png',
        label: 'Кабинет следователя',
        alt: 'Дверь в кабинет следователя из коридора',
        hotspots: [
          {
            id: 'corridor-to-office',
            x: 31, y: 7, w: 39, h: 86,
            title: 'Войти в кабинет',
            action: 'room',
            targetRoom: 'office',
            targetIndex: 3
          }
        ]
      },
      {
        src: './assets/rooms/corridor/officer-window.png',
        label: 'Окно дежурного',
        alt: 'Окно дежурного в коридоре',
        hotspots: [
          {
            id: 'duty-officer-window',
            x: 23, y: 11, w: 56, h: 62,
            title: 'Окно дежурного',
            action: 'duty-officer'
          }
        ]
      },
      {
        src: './assets/rooms/corridor/evidence-storage.png',
        label: 'Комната улик',
        alt: 'Хранилище вещественных доказательств',
        hotspots: [
          {
            id: 'evidence-storage',
            x: 22, y: 7, w: 58, h: 83,
            title: 'Хранилище улик',
            text: 'Здесь будут храниться вещественные доказательства текущего дела. Позже отсюда можно будет брать предметы для отдельного осмотра и вращения.'
          }
        ]
      },
      {
        src: './assets/rooms/corridor/door-outside.png',
        label: 'Выезд на локацию',
        alt: 'Дверь для выезда на место происшествия',
        hotspots: [
          {
            id: 'corridor-to-locations',
            x: 31, y: 7, w: 39, h: 86,
            title: 'Выезд на локацию',
            action: 'outside'
          }
        ]
      }
    ]
  },

  'market-main': {
    label: 'Люблинский рынок',
    scenes: [
      {
        src: './assets/locations/lyublino-market/market-main/01-main-stalls.png',
        label: 'Основные прилавки',
        alt: 'Основные торговые прилавки Люблинского рынка',
        hotspots: [
          {
            id: 'market-main-counter',
            x: 28, y: 45, w: 44, h: 35,
            title: 'Центральный прилавок',
            text: 'Прилавок уже осматривают поверхностно. Пока видно только обычную торговую обстановку: ящики, ткань, старые ёмкости и следы спешно оставленной работы.'
          },
          {
            id: 'market-main-scales',
            x: 49, y: 32, w: 13, h: 21,
            title: 'Весы',
            text: 'Старые торговые весы. Они не связаны с делом напрямую, но помогают понять, что место до происшествия работало в обычном режиме.'
          },
          {
            id: 'market-main-notices',
            x: 38, y: 16, w: 23, h: 18,
            title: 'Объявления',
            text: 'На доске висят объявления и служебные бумаги рынка. Текст разрозненный, без сведений, которые можно считать фактом по делу.'
          }
        ]
      },
      {
        src: './assets/locations/lyublino-market/market-main/02-side-stalls.png',
        label: 'Боковая торговая зона',
        alt: 'Боковая торговая зона Люблинского рынка',
        hotspots: [
          {
            id: 'market-side-bench',
            x: 7, y: 52, w: 27, h: 22,
            title: 'Скамья',
            text: 'Скамья пустует. Здесь могли ждать покупатели или работники рынка, но сейчас рядом никого нет.'
          },
          {
            id: 'market-side-shutter',
            x: 38, y: 13, w: 26, h: 41,
            title: 'Закрытый роллет',
            text: 'Торговая точка закрыта. Нужно будет выяснить, кто работал рядом и мог видеть происходящее.'
          },
          {
            id: 'market-side-crates',
            x: 39, y: 63, w: 37, h: 26,
            title: 'Ящики у прилавка',
            text: 'Обычные рыночные ящики и тара. Следов явного значения для дела при первичном осмотре не видно.'
          }
        ]
      },
      {
        src: './assets/locations/lyublino-market/market-main/03-administration-side.png',
        label: 'Административная сторона',
        alt: 'Административная сторона торговой зоны',
        hotspots: [
          {
            id: 'market-admin-door',
            x: 49, y: 15, w: 19, h: 70,
            title: 'Дверь администрации',
            action: 'room',
            targetRoom: 'director-office',
            targetIndex: 0
          },
          {
            id: 'market-admin-window',
            x: 28, y: 36, w: 16, h: 21,
            title: 'Служебное окно',
            text: 'Через такое окно могли передавать бумаги или ключи. Пока это только ориентир для дальнейшего осмотра.'
          },
          {
            id: 'market-admin-board',
            x: 13, y: 26, w: 18, h: 25,
            title: 'Служебная доска',
            text: 'На доске висят старые объявления и служебные листы. Ничего, что можно занести в материалы дела, пока не выделяется.'
          }
        ]
      },
      {
        src: './assets/locations/lyublino-market/market-main/04-exit.png',
        label: 'Проход к выходу',
        alt: 'Проход к выходу с торговой зоны',
        hotspots: [
          {
            id: 'market-to-yard',
            x: 34, y: 12, w: 29, h: 73,
            title: 'Выйти во двор рынка',
            action: 'room',
            targetRoom: 'market-yard',
            targetIndex: 0
          },
          {
            id: 'market-exit-threshold',
            x: 41, y: 58, w: 18, h: 20,
            title: 'Порог прохода',
            text: 'Проход ведёт наружу, во внутренний двор рынка. Оттуда удобнее понять, где машина и служебные выходы.'
          },
          {
            id: 'market-exit-crates',
            x: 72, y: 52, w: 23, h: 32,
            title: 'Ящики у выхода',
            text: 'Ящики сложены у стены. При первичном взгляде они не дают новых сведений по делу.'
          }
        ]
      }
    ]
  },

  'director-office': {
    label: 'Кабинет директора',
    scenes: [
      {
        src: './assets/locations/lyublino-market/director-office/01-entry-door.png',
        label: 'Дверь в администрацию',
        alt: 'Дверь из кабинета директора в административную часть рынка',
        hotspots: [
          {
            id: 'director-office-to-market',
            x: 36, y: 7, w: 27, h: 86,
            title: 'Вернуться к административной стороне',
            action: 'room',
            targetRoom: 'market-main',
            targetIndex: 2
          },
          {
            id: 'director-office-coat-rack',
            x: 16, y: 20, w: 16, h: 57,
            title: 'Вешалка',
            text: 'Служебная одежда и старые вещи у двери. При первом осмотре ничего, что меняло бы картину дела, не видно.'
          },
          {
            id: 'director-office-duty-window',
            x: 66, y: 26, w: 15, h: 29,
            title: 'Служебное окно',
            text: 'Окно выходит в административную часть. Через него могли передавать бумаги или разговаривать с работниками.'
          }
        ]
      },
      {
        src: './assets/locations/lyublino-market/director-office/02-desk.png',
        label: 'Рабочий стол',
        alt: 'Рабочий стол в кабинете директора рынка',
        hotspots: [
          {
            id: 'director-office-desk',
            x: 13, y: 63, w: 62, h: 27,
            title: 'Рабочий стол',
            text: 'На столе лежат папки, бумаги и канцелярия. Без отдельного осмотра документов нельзя делать выводы о личности владельца или мотивах.'
          },
          {
            id: 'director-office-phone',
            x: 13, y: 56, w: 17, h: 16,
            title: 'Телефон',
            text: 'Стационарный телефон на рабочем столе. Журнал звонков или показания сотрудников могут позже придать ему значение.'
          },
          {
            id: 'director-office-wall-portrait',
            x: 58, y: 20, w: 9, h: 17,
            title: 'Портрет на стене',
            text: 'Старый портрет в рамке. По нему нельзя официально установить личность погибшего.'
          },
          {
            id: 'director-office-window',
            x: 84, y: 11, w: 14, h: 45,
            title: 'Окно',
            text: 'Окно выходит к территории рынка. Свет хороший, но с этой позиции не видно внешние ряды целиком.'
          }
        ]
      },
      {
        src: './assets/locations/lyublino-market/director-office/03-records.png',
        label: 'Документы и сейф',
        alt: 'Шкафы, сейф и документы в кабинете директора',
        hotspots: [
          {
            id: 'director-office-file-cabinets',
            x: 16, y: 24, w: 27, h: 61,
            title: 'Картотека',
            text: 'Металлические шкафы с документами. Понадобится отдельный допуск или основание для детального просмотра.'
          },
          {
            id: 'director-office-safe',
            x: 39, y: 45, w: 16, h: 36,
            title: 'Сейф',
            text: 'Сейф закрыт. Его содержимое пока неизвестно и не должно считаться установленным фактом.'
          },
          {
            id: 'director-office-record-shelves',
            x: 70, y: 13, w: 29, h: 72,
            title: 'Папки и журналы',
            text: 'На полках много служебных папок и журналов. Нужен осмотр документов, чтобы выделить значимые материалы.'
          }
        ]
      },
      {
        src: './assets/locations/lyublino-market/director-office/04-incident-area.png',
        label: 'Место осмотра',
        alt: 'Нейтрально обозначенное место осмотра в кабинете директора',
        hotspots: [
          {
            id: 'director-office-covered-form',
            x: 71, y: 70, w: 28, h: 24,
            title: 'Накрытая фигура',
            text: 'Фигура накрыта тканью. Это место требует отдельного процессуального осмотра; личность погибшего пока не установлена в материалах игрока.'
          },
          {
            id: 'director-office-fallen-chair',
            x: 47, y: 70, w: 18, h: 18,
            title: 'Опрокинутый стул',
            text: 'Стул лежит на боку. Пока это только наблюдение об обстановке, а не доказанная последовательность событий.'
          },
          {
            id: 'director-office-side-table',
            x: 13, y: 50, w: 21, h: 27,
            title: 'Тумба с бумагами',
            text: 'На тумбе лежат бумаги и мелкие предметы. Их значение станет ясно только после детального осмотра.'
          }
        ]
      }
    ]
  },

  'market-yard': {
    label: 'Двор Люблинского рынка',
    scenes: [
      {
        src: './assets/locations/lyublino-market/market-yard/01-back-to-market.png',
        label: 'Вход в торговый зал',
        alt: 'Двор рынка у входа в торговый зал',
        hotspots: [
          {
            id: 'yard-to-market-main',
            x: 39, y: 17, w: 23, h: 60,
            title: 'Вернуться в торговую зону',
            action: 'room',
            targetRoom: 'market-main',
            targetIndex: 3
          },
          {
            id: 'yard-handcarts',
            x: 5, y: 50, w: 24, h: 30,
            title: 'Тележки',
            text: 'Старые тележки для ящиков и товара. Их положение выглядит обычным для хозяйственного двора.'
          },
          {
            id: 'yard-crates-market-door',
            x: 72, y: 48, w: 24, h: 29,
            title: 'Ящики у входа',
            text: 'Ящики сложены у стены, рядом с дверью в торговый зал. При первичном осмотре ничего явно важного не видно.'
          }
        ]
      },
      {
        src: './assets/locations/lyublino-market/market-yard/02-storage-side.png',
        label: 'Хозяйственная сторона',
        alt: 'Хозяйственная сторона двора рынка',
        hotspots: [
          {
            id: 'yard-storage-doors',
            x: 32, y: 20, w: 31, h: 59,
            title: 'Складские двери',
            text: 'Складские двери закрыты. Нужно будет выяснить, кто имел доступ к этой части двора.'
          },
          {
            id: 'yard-notice-board',
            x: 11, y: 23, w: 16, h: 28,
            title: 'Доска объявлений',
            text: 'Бумаги выцвели и частично размокли. С первого взгляда здесь нет сведений, которые можно внести в дело.'
          },
          {
            id: 'yard-covered-crates',
            x: 68, y: 51, w: 19, h: 27,
            title: 'Накрытые ящики',
            text: 'Ящики укрыты брезентом. Это больше похоже на обычное хранение товара, чем на отдельную улику.'
          }
        ]
      },
      {
        src: './assets/locations/lyublino-market/market-yard/03-service-gate.png',
        label: 'Служебные ворота',
        alt: 'Служебные ворота двора рынка',
        hotspots: [
          {
            id: 'yard-service-gate',
            x: 31, y: 15, w: 43, h: 61,
            title: 'Ворота',
            text: 'Ворота выходят к внешним рядам рынка. Пока нельзя утверждать, связан ли этот проход с происшествием.'
          },
          {
            id: 'yard-gate-cart',
            x: 18, y: 48, w: 11, h: 29,
            title: 'Ручная тележка',
            text: 'Тележка стоит у ворот. Следов свежего использования при беглом осмотре не видно.'
          },
          {
            id: 'yard-gate-view',
            x: 38, y: 26, w: 25, h: 21,
            title: 'Внешние ряды',
            text: 'За воротами видны торговые ряды. Это возможное направление для дальнейшего осмотра, если появятся основания.'
          }
        ]
      },
      {
        src: './assets/locations/lyublino-market/market-yard/04-car-exit.png',
        label: 'Выезд со двора',
        alt: 'Выезд со двора рынка к служебной машине',
        hotspots: [
          {
            id: 'yard-to-corridor',
            x: 0, y: 36, w: 25, h: 40,
            title: 'Уехать в дежурную часть',
            action: 'room',
            targetRoom: 'corridor',
            targetIndex: 3
          },
          {
            id: 'yard-open-gate',
            x: 23, y: 26, w: 24, h: 43,
            title: 'Открытые ворота',
            text: 'Через ворота можно выехать со двора. Сейчас это путь обратно к дежурной части.'
          },
          {
            id: 'yard-car-crates',
            x: 59, y: 55, w: 22, h: 22,
            title: 'Ящики у стены',
            text: 'Пустая тара у стены. Ничего, что меняло бы картину происшествия, пока не найдено.'
          }
        ]
      }
    ]
  }
};

const game = document.getElementById('game');
const sceneEl = document.getElementById('scene');
const currentImage = document.getElementById('sceneImage');
const nextImage = document.getElementById('nextImage');
const hotspotsEl = document.getElementById('hotspots');
const sceneLabel = document.getElementById('sceneLabel');
const roomLabel = document.getElementById('roomLabel');
const observation = document.getElementById('observation');
const turnLeft = document.getElementById('turnLeft');
const turnRight = document.getElementById('turnRight');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const modalEyebrow = document.getElementById('modalEyebrow');
const modalClose = document.getElementById('modalClose');
const modalBackdrop = document.getElementById('modalBackdrop');
const help = document.getElementById('help');
const helpButton = document.getElementById('helpButton');

const hotspotEditor = document.getElementById('hotspotEditor');
const editorClose = document.getElementById('editorClose');
const editorRoomName = document.getElementById('editorRoomName');
const editorSceneName = document.getElementById('editorSceneName');
const editorSceneFile = document.getElementById('editorSceneFile');
const editorZoneSelect = document.getElementById('editorZoneSelect');
const editorCreate = document.getElementById('editorCreate');
const editorDelete = document.getElementById('editorDelete');
const editorZoneName = document.getElementById('editorZoneName');
const editorX = document.getElementById('editorX');
const editorY = document.getElementById('editorY');
const editorW = document.getElementById('editorW');
const editorH = document.getElementById('editorH');
const editorCopyZone = document.getElementById('editorCopyZone');
const editorCopyWall = document.getElementById('editorCopyWall');
const editorExport = document.getElementById('editorExport');
const editorResetWall = document.getElementById('editorResetWall');
const editorStatus = document.getElementById('editorStatus');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sceneStorageKey(roomId, index) {
  return `${roomId}:${index}`;
}

const baseHotspotsByScene = {};
for (const [roomId, room] of Object.entries(rooms)) {
  room.scenes.forEach((scene, index) => {
    baseHotspotsByScene[sceneStorageKey(roomId, index)] = clone(scene.hotspots || []);
  });
}

function loadHotspotEdits() {
  try {
    return JSON.parse(localStorage.getItem(HOTSPOT_EDITS_KEY) || '{}');
  } catch {
    return {};
  }
}

let hotspotEdits = loadHotspotEdits();

function applySavedHotspotEdits() {
  for (const [roomId, room] of Object.entries(rooms)) {
    room.scenes.forEach((scene, index) => {
      const key = sceneStorageKey(roomId, index);
      const saved = hotspotEdits[key];
      if (!Array.isArray(saved)) return;

      const base = baseHotspotsByScene[key] || [];
      scene.hotspots = saved.map(record => {
        const original = base.find(item => item.id === record.id);
        if (original) return { ...clone(original), ...record };
        return {
          id: record.id,
          title: record.title || 'Новая зона',
          x: record.x,
          y: record.y,
          w: record.w,
          h: record.h,
          custom: true,
          text: 'Пользовательская точка интереса. Действие ещё не назначено.'
        };
      });
    });
  }
}

applySavedHotspotEdits();

let currentRoomId = localStorage.getItem('things-of-the-past-room-id') || 'office';
if (!rooms[currentRoomId]) currentRoomId = 'office';

let currentIndex = Number(localStorage.getItem(`things-of-the-past-view-${currentRoomId}`)) || 0;
if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= rooms[currentRoomId].scenes.length) currentIndex = 0;

let caseActive = localStorage.getItem('things-of-the-past-case-active') === FIRST_CASE.id;
let isTurning = false;
let observationTimer = null;
let touchStartX = null;
let debugHotspots = localStorage.getItem('things-of-the-past-debug-hotspots') === '1';
let selectedHotspotId = null;
let editorStatusTimer = null;

game.classList.toggle('is-debug', debugHotspots);
hotspotEditor.setAttribute('aria-hidden', String(!debugHotspots));

for (const room of Object.values(rooms)) {
  for (const scene of room.scenes) {
    const image = new Image();
    image.src = scene.src;
  }
}

function currentRoom() {
  return rooms[currentRoomId];
}

function currentScene() {
  return currentRoom().scenes[currentIndex];
}

function currentHotspot() {
  return currentScene().hotspots?.find(item => item.id === selectedHotspotId) || null;
}

function savePosition() {
  localStorage.setItem('things-of-the-past-room-id', currentRoomId);
  localStorage.setItem(`things-of-the-past-view-${currentRoomId}`, String(currentIndex));
}

function editableHotspotRecord(item) {
  return {
    id: item.id,
    title: item.title,
    x: roundCoord(item.x),
    y: roundCoord(item.y),
    w: roundCoord(item.w),
    h: roundCoord(item.h),
    custom: Boolean(item.custom)
  };
}

function saveCurrentSceneHotspots() {
  const key = sceneStorageKey(currentRoomId, currentIndex);
  hotspotEdits[key] = (currentScene().hotspots || []).map(editableHotspotRecord);
  localStorage.setItem(HOTSPOT_EDITS_KEY, JSON.stringify(hotspotEdits));
  setEditorStatus('Сохранено', true);
}

function renderScene() {
  const room = currentRoom();
  const scene = currentScene();
  currentImage.src = scene.src;
  currentImage.alt = scene.alt;
  sceneLabel.textContent = scene.label;
  if (roomLabel) roomLabel.textContent = room.label;
  game.setAttribute('aria-label', room.label);

  const hotspots = scene.hotspots || [];
  if (!hotspots.some(item => item.id === selectedHotspotId)) {
    selectedHotspotId = debugHotspots && hotspots.length ? hotspots[0].id : null;
  }

  renderHotspots(hotspots);
  updateEditorPanel();
}

function renderHotspots(hotspots) {
  hotspotsEl.innerHTML = '';

  for (const item of hotspots) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `hotspot${item.action ? ' hotspot--action' : ''}${item.id === selectedHotspotId ? ' is-selected' : ''}`;
    button.dataset.hotspotId = item.id;
    button.setAttribute('aria-label', item.title);
    applyHotspotGeometryToElement(item, button);

    const debugLabel = document.createElement('span');
    debugLabel.className = 'hotspot__debug-label';
    debugLabel.textContent = debugText(item);
    button.appendChild(debugLabel);

    const resizeHandle = document.createElement('span');
    resizeHandle.className = 'hotspot__resize';
    resizeHandle.setAttribute('aria-hidden', 'true');
    resizeHandle.addEventListener('pointerdown', event => {
      if (!debugHotspots || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      startHotspotDrag(event, item, button, 'resize');
    });
    button.appendChild(resizeHandle);

    button.addEventListener('pointerdown', event => {
      if (!debugHotspots || event.button !== 0) return;
      event.preventDefault();
      startHotspotDrag(event, item, button, 'move');
    });

    button.addEventListener('mouseenter', () => {
      if (!debugHotspots) showObservation(item.title);
    });
    button.addEventListener('focus', () => {
      if (!debugHotspots) showObservation(item.title);
    });
    button.addEventListener('click', event => {
      if (debugHotspots) {
        event.preventDefault();
        selectHotspot(item.id);
        return;
      }
      activateHotspot(item);
    });

    hotspotsEl.appendChild(button);
  }
}

function debugText(item) {
  return `${item.title}\nx:${roundCoord(item.x)} y:${roundCoord(item.y)} w:${roundCoord(item.w)} h:${roundCoord(item.h)}`;
}

function applyHotspotGeometryToElement(item, element) {
  element.style.left = `${item.x}%`;
  element.style.top = `${item.y}%`;
  element.style.width = `${item.w}%`;
  element.style.height = `${item.h}%`;
}

function updateHotspotElement(item) {
  const element = hotspotsEl.querySelector(`[data-hotspot-id="${CSS.escape(item.id)}"]`);
  if (!element) return;
  applyHotspotGeometryToElement(item, element);
  const label = element.querySelector('.hotspot__debug-label');
  if (label) label.textContent = debugText(item);
  element.setAttribute('aria-label', item.title);
}

function startHotspotDrag(event, item, element, mode) {
  selectHotspot(item.id);

  const rect = hotspotsEl.getBoundingClientRect();
  const startClientX = event.clientX;
  const startClientY = event.clientY;
  const start = { x: item.x, y: item.y, w: item.w, h: item.h };

  function onMove(moveEvent) {
    const dx = ((moveEvent.clientX - startClientX) / rect.width) * 100;
    const dy = ((moveEvent.clientY - startClientY) / rect.height) * 100;

    if (mode === 'move') {
      item.x = roundCoord(clamp(start.x + dx, 0, 100 - item.w));
      item.y = roundCoord(clamp(start.y + dy, 0, 100 - item.h));
    } else {
      item.w = roundCoord(clamp(start.w + dx, 2, 100 - item.x));
      item.h = roundCoord(clamp(start.h + dy, 2, 100 - item.y));
    }

    updateHotspotElement(item);
    updateEditorFields(item);
  }

  function onUp() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    saveCurrentSceneHotspots();
  }

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

function selectHotspot(id) {
  selectedHotspotId = id;
  hotspotsEl.querySelectorAll('.hotspot').forEach(element => {
    element.classList.toggle('is-selected', element.dataset.hotspotId === id);
  });
  updateEditorPanel();
}

function updateEditorPanel() {
  if (!hotspotEditor) return;
  const room = currentRoom();
  const scene = currentScene();
  const hotspots = scene.hotspots || [];

  editorRoomName.textContent = room.label;
  editorSceneName.textContent = scene.label;
  editorSceneFile.textContent = scene.src.replace('./', '');

  editorZoneSelect.innerHTML = '';
  if (!hotspots.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'На стене пока нет зон';
    editorZoneSelect.appendChild(option);
    selectedHotspotId = null;
  } else {
    if (!hotspots.some(item => item.id === selectedHotspotId)) selectedHotspotId = hotspots[0].id;
    hotspots.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.title} · ${item.id}`;
      option.selected = item.id === selectedHotspotId;
      editorZoneSelect.appendChild(option);
    });
  }

  const item = currentHotspot();
  const disabled = !item;
  editorZoneName.disabled = disabled;
  editorDelete.disabled = disabled;
  editorCopyZone.disabled = disabled;
  editorX.disabled = disabled;
  editorY.disabled = disabled;
  editorW.disabled = disabled;
  editorH.disabled = disabled;

  if (item) {
    updateEditorFields(item);
    editorExport.value = buildZoneExport(item);
  } else {
    editorZoneName.value = '';
    editorX.value = '';
    editorY.value = '';
    editorW.value = '';
    editorH.value = '';
    editorExport.value = buildWallExport();
  }
}

function updateEditorFields(item) {
  editorZoneName.value = item.title || '';
  editorX.value = roundCoord(item.x);
  editorY.value = roundCoord(item.y);
  editorW.value = roundCoord(item.w);
  editorH.value = roundCoord(item.h);
  editorExport.value = buildZoneExport(item);
}

function createHotspot() {
  const scene = currentScene();
  if (!scene.hotspots) scene.hotspots = [];

  const id = `custom-${Date.now().toString(36)}`;
  const item = {
    id,
    title: 'Новая зона',
    x: 42,
    y: 38,
    w: 16,
    h: 16,
    custom: true,
    text: 'Пользовательская точка интереса. Действие ещё не назначено.'
  };

  scene.hotspots.push(item);
  selectedHotspotId = id;
  saveCurrentSceneHotspots();
  renderHotspots(scene.hotspots);
  updateEditorPanel();
  editorZoneName.focus();
  editorZoneName.select();
}

function deleteSelectedHotspot() {
  const scene = currentScene();
  const index = (scene.hotspots || []).findIndex(item => item.id === selectedHotspotId);
  if (index < 0) return;

  scene.hotspots.splice(index, 1);
  selectedHotspotId = scene.hotspots[0]?.id || null;
  saveCurrentSceneHotspots();
  renderHotspots(scene.hotspots);
  updateEditorPanel();
}

function resetCurrentWall() {
  const key = sceneStorageKey(currentRoomId, currentIndex);
  currentScene().hotspots = clone(baseHotspotsByScene[key] || []);
  delete hotspotEdits[key];
  localStorage.setItem(HOTSPOT_EDITS_KEY, JSON.stringify(hotspotEdits));
  selectedHotspotId = currentScene().hotspots[0]?.id || null;
  renderHotspots(currentScene().hotspots);
  updateEditorPanel();
  setEditorStatus('Стена сброшена', true);
}

function updateSelectedFromInputs() {
  const item = currentHotspot();
  if (!item) return;

  const x = Number(editorX.value);
  const y = Number(editorY.value);
  const w = Number(editorW.value);
  const h = Number(editorH.value);
  if (![x, y, w, h].every(Number.isFinite)) return;

  item.w = roundCoord(clamp(w, 2, 100));
  item.h = roundCoord(clamp(h, 2, 100));
  item.x = roundCoord(clamp(x, 0, 100 - item.w));
  item.y = roundCoord(clamp(y, 0, 100 - item.h));

  updateHotspotElement(item);
  updateEditorFields(item);
  saveCurrentSceneHotspots();
}

function renameSelectedHotspot() {
  const item = currentHotspot();
  if (!item) return;
  const value = editorZoneName.value.trim();
  item.title = value || 'Без названия';
  updateHotspotElement(item);

  const option = Array.from(editorZoneSelect.options).find(entry => entry.value === item.id);
  if (option) option.textContent = `${item.title} · ${item.id}`;

  editorExport.value = buildZoneExport(item);
  saveCurrentSceneHotspots();
}

function buildZoneExport(item) {
  const room = currentRoom();
  const scene = currentScene();
  return [
    `Комната: ${room.label}`,
    `Стена: ${scene.label}`,
    `Файл: ${scene.src.replace('./', '')}`,
    `Зона: ${item.title}`,
    `ID: ${item.id}`,
    `Положение: x=${roundCoord(item.x)}%, y=${roundCoord(item.y)}%, w=${roundCoord(item.w)}%, h=${roundCoord(item.h)}%`
  ].join('\n');
}

function buildWallExport() {
  const room = currentRoom();
  const scene = currentScene();
  const hotspots = scene.hotspots || [];
  const lines = [
    `Комната: ${room.label}`,
    `Стена: ${scene.label}`,
    `Файл: ${scene.src.replace('./', '')}`,
    `Зон: ${hotspots.length}`,
    ''
  ];

  hotspots.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.title}`);
    lines.push(`ID: ${item.id}`);
    lines.push(`x=${roundCoord(item.x)}%, y=${roundCoord(item.y)}%, w=${roundCoord(item.w)}%, h=${roundCoord(item.h)}%`);
    if (index < hotspots.length - 1) lines.push('');
  });

  return lines.join('\n');
}

async function copyEditorText(text) {
  editorExport.value = text;
  let copied = false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) {
    try {
      editorExport.focus();
      editorExport.select();
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
  }

  setEditorStatus(copied ? 'Скопировано — вставляй в чат' : 'Текст выделен — нажми Ctrl+C', copied);
}

function setEditorStatus(text, success = false) {
  clearTimeout(editorStatusTimer);
  editorStatus.textContent = text;
  editorStatus.classList.toggle('is-success', success);
  editorStatusTimer = window.setTimeout(() => {
    editorStatus.textContent = 'Изменения сохраняются в браузере';
    editorStatus.classList.remove('is-success');
  }, 2600);
}

function roundCoord(value) {
  return Math.round(Number(value) * 10) / 10;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function activateHotspot(item) {
  if (item.action === 'room') {
    changeRoom(item.targetRoom, item.targetIndex ?? 0);
    return;
  }

  if (item.action === 'case-file') {
    openCaseFile();
    return;
  }

  if (item.action === 'duty-officer') {
    talkToDutyOfficer();
    return;
  }

  if (item.action === 'outside') {
    openLocations();
    return;
  }

  openModal('Осмотр', item.title, item.text || 'Здесь появится интерактивное действие.');
}

function talkToDutyOfficer() {
  if (!caseActive) {
    caseActive = true;
    localStorage.setItem('things-of-the-past-case-active', FIRST_CASE.id);
    openModal(
      'Дежурная часть',
      'Новое сообщение',
      `${FIRST_CASE.summary} Материалы уже переданы в кабинет. После ознакомления можно выезжать на место.`
    );
    return;
  }

  openModal(
    'Дежурная часть',
    'По текущему делу пока без изменений',
    `Активно ${FIRST_CASE.title}: ${FIRST_CASE.location}. Новых сообщений пока нет.`
  );
}

function openCaseFile() {
  if (!caseActive) {
    openModal(
      'Материалы',
      'Папка пуста',
      'Нового дела пока нет. Проверь окно дежурного в коридоре.'
    );
    return;
  }

  openModal(
    'Материалы дела',
    `${FIRST_CASE.title} — ${FIRST_CASE.location}`,
    `${FIRST_CASE.summary} На этом этапе подозреваемые, мотив и точная последовательность событий неизвестны.`
  );
}

function openLocations() {
  if (!caseActive) {
    openModal(
      'Выезд',
      'Ехать пока некуда',
      'Активного дела нет. Сначала проверь окно дежурного.'
    );
    return;
  }

  openModal(
    'Выезд',
    'Доступная локация',
    `${FIRST_CASE.location} — место происшествия. Следующим этапом подключим переход из этой двери непосредственно на первую игровую локацию дела.`
  );
}

function rotate(direction) {
  if (isTurning || modal.classList.contains('is-open')) return;
  const room = currentRoom();
  const nextIndex = (currentIndex + direction + room.scenes.length) % room.scenes.length;
  transitionTo(currentRoomId, nextIndex, direction);
}

function changeRoom(roomId, index) {
  if (!rooms[roomId] || isTurning || modal.classList.contains('is-open')) return;
  transitionTo(roomId, index, 1);
}

function transitionTo(roomId, index, direction) {
  const targetRoom = rooms[roomId];
  const safeIndex = Math.max(0, Math.min(index, targetRoom.scenes.length - 1));
  const nextSceneData = targetRoom.scenes[safeIndex];

  isTurning = true;
  hotspotsEl.style.pointerEvents = 'none';
  nextImage.src = nextSceneData.src;
  nextImage.alt = nextSceneData.alt;

  sceneEl.classList.add(direction > 0 ? 'is-turning-right' : 'is-turning-left');
  sceneLabel.style.opacity = '0';

  window.setTimeout(() => {
    currentRoomId = roomId;
    currentIndex = safeIndex;
    currentImage.src = nextSceneData.src;
    currentImage.alt = nextSceneData.alt;
    sceneEl.classList.remove('is-turning-right', 'is-turning-left');
    sceneLabel.textContent = nextSceneData.label;
    sceneLabel.style.opacity = '';
    if (roomLabel) roomLabel.textContent = targetRoom.label;
    game.setAttribute('aria-label', targetRoom.label);
    selectedHotspotId = debugHotspots ? nextSceneData.hotspots?.[0]?.id || null : null;
    renderHotspots(nextSceneData.hotspots || []);
    updateEditorPanel();
    hotspotsEl.style.pointerEvents = '';
    savePosition();
    isTurning = false;
  }, 440);
}

function showObservation(text) {
  clearTimeout(observationTimer);
  observation.textContent = text;
  observation.classList.add('is-visible');
  observationTimer = window.setTimeout(() => observation.classList.remove('is-visible'), 1400);
}

function openModal(eyebrow, title, text) {
  modalEyebrow.textContent = eyebrow;
  modalTitle.textContent = title;
  modalText.textContent = text;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  modalClose.focus();
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

function toggleHelp() {
  const open = !help.classList.contains('is-open');
  help.classList.toggle('is-open', open);
  help.setAttribute('aria-hidden', String(!open));
  if (open) window.setTimeout(() => {
    help.classList.remove('is-open');
    help.setAttribute('aria-hidden', 'true');
  }, 3400);
}

function toggleDebugHotspots(forceValue) {
  debugHotspots = typeof forceValue === 'boolean' ? forceValue : !debugHotspots;
  game.classList.toggle('is-debug', debugHotspots);
  hotspotEditor.setAttribute('aria-hidden', String(!debugHotspots));
  localStorage.setItem('things-of-the-past-debug-hotspots', debugHotspots ? '1' : '0');

  if (debugHotspots && !currentHotspot()) {
    selectedHotspotId = currentScene().hotspots?.[0]?.id || null;
  }

  renderHotspots(currentScene().hotspots || []);
  updateEditorPanel();
  showObservation(debugHotspots ? 'Редактор точек интереса включён' : 'Редактор точек интереса закрыт');
}

turnLeft.addEventListener('click', () => rotate(-1));
turnRight.addEventListener('click', () => rotate(1));
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
helpButton.addEventListener('click', toggleHelp);
editorClose.addEventListener('click', () => toggleDebugHotspots(false));

editorZoneSelect.addEventListener('change', () => selectHotspot(editorZoneSelect.value));
editorCreate.addEventListener('click', createHotspot);
editorDelete.addEventListener('click', deleteSelectedHotspot);
editorResetWall.addEventListener('click', resetCurrentWall);
editorZoneName.addEventListener('input', renameSelectedHotspot);
[editorX, editorY, editorW, editorH].forEach(input => input.addEventListener('change', updateSelectedFromInputs));
editorCopyZone.addEventListener('click', () => {
  const item = currentHotspot();
  if (item) copyEditorText(buildZoneExport(item));
});
editorCopyWall.addEventListener('click', () => copyEditorText(buildWallExport()));

document.querySelectorAll('[data-panel]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.panel === 'case') {
      openCaseFile();
    } else {
      openModal('Блокнот', 'Записи следователя', 'Записей пока нет. Во время расследования сюда будут попадать важные наблюдения и открытые факты.');
    }
  });
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeModal();
    help.classList.remove('is-open');
    return;
  }

  if (event.key === 'F2') {
    event.preventDefault();
    toggleDebugHotspots();
    return;
  }

  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;

  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') rotate(-1);
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') rotate(1);
});

sceneEl.addEventListener('touchstart', event => {
  if (debugHotspots) return;
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

sceneEl.addEventListener('touchend', event => {
  if (debugHotspots || touchStartX === null) return;
  const delta = event.changedTouches[0].clientX - touchStartX;
  touchStartX = null;
  if (Math.abs(delta) < 55) return;
  rotate(delta > 0 ? -1 : 1);
}, { passive: true });

renderScene();
savePosition();
