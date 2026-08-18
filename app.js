const scenes = [
  {
    src: './table.png',
    label: 'Рабочий стол',
    alt: 'Рабочий стол следователя',
    hotspots: [
      {
        x: 34, y: 38, w: 32, h: 35,
        title: 'Рабочий стол',
        text: 'Здесь будут лежать материалы текущего дела: ориентировки, протоколы, фотографии и документы, которые нужно изучать по ходу расследования.'
      }
    ]
  },
  {
    src: './monitor.png',
    label: 'Компьютер',
    alt: 'Компьютер в кабинете следователя',
    hotspots: [
      {
        x: 34, y: 27, w: 32, h: 42,
        title: 'Служебный компьютер',
        text: 'Старый служебный компьютер. Позже через него можно будет открывать базы, архивные карточки, результаты экспертиз и служебную переписку.'
      }
    ]
  },
  {
    src: './board.png',
    label: 'Доска расследования',
    alt: 'Доска расследования в кабинете',
    hotspots: [
      {
        x: 19, y: 17, w: 62, h: 60,
        title: 'Доска расследования',
        text: 'Пока доска пуста. Во время дела сюда будут добавляться фотографии, улики, показания и связи между людьми. Игрок сможет собирать собственную версию событий.'
      }
    ]
  },
  {
    src: './locker.png',
    label: 'Архивный шкаф',
    alt: 'Архивный шкаф в кабинете следователя',
    hotspots: [
      {
        x: 24, y: 10, w: 52, h: 76,
        title: 'Архив',
        text: 'Здесь будут храниться закрытые и текущие дела. Из архива можно будет выбирать следующее расследование и возвращаться к уже изученным материалам.'
      }
    ]
  }
];

const sceneEl = document.getElementById('scene');
const currentImage = document.getElementById('sceneImage');
const nextImage = document.getElementById('nextImage');
const hotspotsEl = document.getElementById('hotspots');
const sceneLabel = document.getElementById('sceneLabel');
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

let currentIndex = Number(localStorage.getItem('things-of-the-past-room')) || 0;
if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= scenes.length) currentIndex = 0;
let isTurning = false;
let observationTimer = null;
let touchStartX = null;

for (const scene of scenes) {
  const image = new Image();
  image.src = scene.src;
}

function renderScene() {
  const scene = scenes[currentIndex];
  currentImage.src = scene.src;
  currentImage.alt = scene.alt;
  sceneLabel.textContent = scene.label;
  renderHotspots(scene.hotspots);
}

function renderHotspots(hotspots) {
  hotspotsEl.innerHTML = '';
  for (const item of hotspots) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hotspot';
    button.setAttribute('aria-label', `Осмотреть: ${item.title}`);
    button.style.left = `${item.x}%`;
    button.style.top = `${item.y}%`;
    button.style.width = `${item.w}%`;
    button.style.height = `${item.h}%`;
    button.addEventListener('mouseenter', () => showObservation(item.title));
    button.addEventListener('focus', () => showObservation(item.title));
    button.addEventListener('click', () => openModal('Осмотр', item.title, item.text));
    hotspotsEl.appendChild(button);
  }
}

function rotate(direction) {
  if (isTurning || modal.classList.contains('is-open')) return;
  isTurning = true;
  hotspotsEl.style.pointerEvents = 'none';

  const nextIndex = (currentIndex + direction + scenes.length) % scenes.length;
  const nextScene = scenes[nextIndex];
  nextImage.src = nextScene.src;
  nextImage.alt = nextScene.alt;

  sceneEl.classList.add(direction > 0 ? 'is-turning-right' : 'is-turning-left');
  sceneLabel.style.opacity = '0';

  window.setTimeout(() => {
    currentIndex = nextIndex;
    currentImage.src = nextScene.src;
    currentImage.alt = nextScene.alt;
    sceneEl.classList.remove('is-turning-right', 'is-turning-left');
    sceneLabel.textContent = nextScene.label;
    sceneLabel.style.opacity = '';
    renderHotspots(nextScene.hotspots);
    hotspotsEl.style.pointerEvents = '';
    localStorage.setItem('things-of-the-past-room', String(currentIndex));
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

turnLeft.addEventListener('click', () => rotate(-1));
turnRight.addEventListener('click', () => rotate(1));
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
helpButton.addEventListener('click', toggleHelp);

document.querySelectorAll('[data-panel]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.panel === 'case') {
      openModal('Материалы', 'Текущее дело', 'Дело пока не выбрано. В следующем этапе здесь появится первое реальное архивное расследование и карточка с исходными материалами.');
    } else {
      openModal('Блокнот', 'Записи следователя', 'Записей пока нет. Во время расследования сюда будут автоматически попадать важные наблюдения, а позже игрок сможет добавлять собственные заметки.');
    }
  });
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeModal();
    help.classList.remove('is-open');
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
