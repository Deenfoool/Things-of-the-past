const rooms = {
  office: {
    label: 'Кабинет следователя',
    scenes: [
      {
        src: './table.png',
        label: 'Рабочий стол',
        alt: 'Рабочий стол следователя',
        hotspots: [
          {
            x: 27, y: 34, w: 46, h: 43,
            title: 'Рабочий стол',
            text: 'Здесь будут лежать материалы текущего дела: протоколы, фотографии, ориентировки, документы и личные записи следователя.'
          }
        ]
      },
      {
        src: './monitor.png',
        label: 'Компьютер',
        alt: 'Компьютер в кабинете следователя',
        hotspots: [
          {
            x: 31, y: 7, w: 37, h: 54,
            title: 'Служебный компьютер',
            text: 'Служебный компьютер. Через него будут доступны базы, архивные карточки, результаты экспертиз и служебная информация.'
          },
          {
            x: 70, y: 42, w: 17, h: 25,
            title: 'Телефон',
            text: 'Служебный телефон. По нему будут поступать звонки, сообщения и новая информация по делу.'
          },
          {
            x: 0, y: 43, w: 20, h: 32,
            title: 'Папки',
            text: 'Рабочие папки с документами и материалами расследований.'
          }
        ]
      },
      {
        src: './board.png',
        label: 'Доска расследования',
        alt: 'Доска расследования в кабинете',
        hotspots: [
          {
            x: 17, y: 12, w: 66, h: 67,
            title: 'Доска расследования',
            text: 'Здесь будут появляться фотографии, показания, документы и связи между фактами. Игрок сможет собирать собственную версию событий.'
          }
        ]
      },
      {
        src: './door-corridor.png',
        label: 'Дверь в коридор',
        alt: 'Дверь из кабинета следователя в коридор',
        hotspots: [
          {
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
        src: './door-inside.png',
        label: 'Кабинет следователя',
        alt: 'Дверь в кабинет следователя из коридора',
        hotspots: [
          {
            x: 31, y: 7, w: 39, h: 86,
            title: 'Войти в кабинет',
            action: 'room',
            targetRoom: 'office',
            targetIndex: 3
          }
        ]
      },
      {
        src: './officer-window.png',
        label: 'Окно дежурного',
        alt: 'Окно дежурного в коридоре',
        hotspots: [
          {
            x: 23, y: 11, w: 56, h: 62,
            title: 'Окно дежурного',
            text: 'Здесь дежурный будет передавать новые сообщения, ориентировки, документы и информацию, поступившую по текущему делу.'
          }
        ]
      },
      {
        src: './evidence-storage.png',
        label: 'Комната улик',
        alt: 'Хранилище вещественных доказательств',
        hotspots: [
          {
            x: 22, y: 7, w: 58, h: 83,
            title: 'Хранилище улик',
            text: 'Здесь будут храниться вещественные доказательства текущего дела. Позже отсюда можно будет брать предметы для отдельного осмотра и вращения.'
          }
        ]
      },
      {
        src: './door-outside.png',
        label: 'Выезд на локацию',
        alt: 'Дверь для выезда на место происшествия',
        hotspots: [
          {
            x: 31, y: 7, w: 39, h: 86,
            title: 'Выезд на локацию',
            action: 'outside'
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

let currentRoomId = localStorage.getItem('things-of-the-past-room-id') || 'office';
if (!rooms[currentRoomId]) currentRoomId = 'office';

let currentIndex = Number(localStorage.getItem(`things-of-the-past-view-${currentRoomId}`)) || 0;
if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= rooms[currentRoomId].scenes.length) currentIndex = 0;

let isTurning = false;
let observationTimer = null;
let touchStartX = null;
let debugHotspots = false;

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

function savePosition() {
  localStorage.setItem('things-of-the-past-room-id', currentRoomId);
  localStorage.setItem(`things-of-the-past-view-${currentRoomId}`, String(currentIndex));
}

function renderScene() {
  const room = currentRoom();
  const scene = currentScene();
  currentImage.src = scene.src;
  currentImage.alt = scene.alt;
  sceneLabel.textContent = scene.label;
  if (roomLabel) roomLabel.textContent = room.label;
  game.setAttribute('aria-label', room.label);
  renderHotspots(scene.hotspots || []);
}

function renderHotspots(hotspots) {
  hotspotsEl.innerHTML = '';

  for (const item of hotspots) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `hotspot${item.action ? ' hotspot--action' : ''}`;
    button.setAttribute('aria-label', item.title);
    button.style.left = `${item.x}%`;
    button.style.top = `${item.y}%`;
    button.style.width = `${item.w}%`;
    button.style.height = `${item.h}%`;

    const debugLabel = document.createElement('span');
    debugLabel.className = 'hotspot__debug-label';
    debugLabel.textContent = item.title;
    button.appendChild(debugLabel);

    button.addEventListener('mouseenter', () => showObservation(item.title));
    button.addEventListener('focus', () => showObservation(item.title));
    button.addEventListener('click', () => activateHotspot(item));
    hotspotsEl.appendChild(button);
  }
}

function activateHotspot(item) {
  if (item.action === 'room') {
    changeRoom(item.targetRoom, item.targetIndex ?? 0);
    return;
  }

  if (item.action === 'outside') {
    openModal(
      'Выезд',
      'Куда едем?',
      'Выход на игровые локации подключён. Когда добавим первое дело, здесь появится выбор открытых мест: место преступления, адреса свидетелей и другие доступные точки расследования.'
    );
    return;
  }

  openModal('Осмотр', item.title, item.text || 'Здесь появится интерактивное действие.');
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
    renderHotspots(nextSceneData.hotspots || []);
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

function toggleDebugHotspots() {
  debugHotspots = !debugHotspots;
  game.classList.toggle('is-debug', debugHotspots);
  showObservation(debugHotspots ? 'Точки интереса: показаны' : 'Точки интереса: скрыты');
}

turnLeft.addEventListener('click', () => rotate(-1));
turnRight.addEventListener('click', () => rotate(1));
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
helpButton.addEventListener('click', toggleHelp);

document.querySelectorAll('[data-panel]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.panel === 'case') {
      openModal('Материалы', 'Текущее дело', 'Дело пока не выбрано. Здесь появятся исходные материалы первого расследования.');
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

  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') rotate(-1);
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') rotate(1);
});

sceneEl.addEventListener('touchstart', event => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

sceneEl.addEventListener('touchend', event => {
  if (touchStartX === null) return;
  const delta = event.changedTouches[0].clientX - touchStartX;
  touchStartX = null;
  if (Math.abs(delta) < 55) return;
  rotate(delta > 0 ? -1 : 1);
}, { passive: true });

renderScene();
savePosition();
