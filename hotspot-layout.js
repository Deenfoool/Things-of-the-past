(() => {
  const LAYOUT_VERSION = '2026-08-19-final-01';
  const LAYOUT_VERSION_KEY = 'things-of-the-past-hotspot-layout-version';

  const finalLayouts = {
    'office:0': [
      { id: 'case-folder', title: 'Папка текущего дела', x: 24.7, y: 37.7, w: 24.7, h: 51.8 },
      { id: 'desk-phone', title: 'Служебный телефон', x: 79, y: 12, w: 17, h: 22 },
      { id: 'desk-notes', title: 'Рабочие записи', x: 84.5, y: 45.6, w: 11, h: 20 },
      {
        id: 'custom-mt04b2vu', title: 'Окно', x: 25.1, y: 0, w: 49.4, h: 24.4, custom: true,
        text: 'Окно кабинета следователя. Через него видно улицу и погоду за окном.'
      }
    ],
    'office:1': [
      { id: 'office-computer', title: 'Служебный компьютер', x: 29.1, y: 0.1, w: 40.4, h: 63.9 },
      { id: 'computer-phone', title: 'Телефон', x: 70.4, y: 46.4, w: 17, h: 25 },
      { id: 'computer-folders', title: 'Папки', x: 0, y: 43, w: 17.2, h: 57 },
      {
        id: 'custom-mt04c98g', title: 'Заметки', x: 18.5, y: 41.9, w: 8.8, h: 27.7, custom: true,
        text: 'Небольшие рабочие заметки рядом с компьютером.'
      }
    ],
    'office:2': [
      { id: 'investigation-board', title: 'Доска расследования', x: 5.6, y: 0.5, w: 86.9, h: 84.2 },
      {
        id: 'custom-mt04fy5n', title: 'Папка для доски', x: 12.2, y: 88, w: 19.8, h: 12, custom: true,
        text: 'Папка с материалами, которые можно использовать при работе с доской расследования.'
      }
    ],
    'office:3': [
      { id: 'office-to-corridor', title: 'Выйти в коридор', x: 33.7, y: 0, w: 32.6, h: 100 },
      {
        id: 'custom-mt04eozf', title: 'Вешалка', x: 70.6, y: 0, w: 26.4, h: 83, custom: true,
        text: 'Старая служебная вешалка у двери.'
      }
    ],
    'corridor:0': [
      { id: 'corridor-to-office', title: 'Войти в кабинет', x: 35.5, y: 0, w: 31.5, h: 100 },
      {
        id: 'custom-mt04i0vd', title: 'Тумба', x: 77.4, y: 69.5, w: 18.7, h: 30.5, custom: true,
        text: 'Небольшая тумба в коридоре дежурной части.'
      }
    ],
    'corridor:1': [
      { id: 'duty-officer-window', title: 'Окно дежурного', x: 24, y: 0, w: 52.5, h: 67.8 }
    ],
    'corridor:2': [
      { id: 'evidence-storage', title: 'Хранилище улик', x: 33.2, y: 0, w: 34.6, h: 100 },
      {
        id: 'custom-mt04kkpf', title: 'Стол осмотра улик', x: 68.5, y: 63.3, w: 31.5, h: 26.2, custom: true,
        text: 'Рабочий стол для осмотра и подготовки вещественных доказательств.'
      },
      {
        id: 'custom-mt04leqt', title: 'журнал выдачи', x: 8, y: 32.6, w: 12.4, h: 30.9, custom: true,
        text: 'Журнал, в котором фиксируется выдача вещественных доказательств.'
      },
      {
        id: 'custom-mt04lvth', title: 'Реестр хранения', x: 70, y: 31, w: 19.2, h: 27.8, custom: true,
        text: 'Реестр хранения улик и материалов по делам.'
      }
    ],
    'corridor:3': [
      { id: 'corridor-to-locations', title: 'Выезд на локацию', x: 31.8, y: 0, w: 33.6, h: 100 },
      {
        id: 'custom-mt04iog9', title: 'Карта района', x: 68.9, y: 3.2, w: 24.1, h: 32.9, custom: true,
        text: 'Карта района. Позже на ней можно будет отмечать доступные точки расследования.'
      }
    ]
  };

  function mergeWithMetadata(key, records) {
    const [roomId, indexText] = key.split(':');
    const index = Number(indexText);
    const scene = rooms[roomId]?.scenes?.[index];
    if (!scene) return [];

    const oldBase = baseHotspotsByScene[key] || [];
    const current = scene.hotspots || [];

    return records.map(record => {
      const original = oldBase.find(item => item.id === record.id)
        || current.find(item => item.id === record.id)
        || {};

      return {
        ...clone(original),
        ...record,
        custom: record.custom ?? original.custom ?? false,
        text: record.text ?? original.text
      };
    });
  }

  const baselines = {};

  for (const [key, records] of Object.entries(finalLayouts)) {
    const baseline = mergeWithMetadata(key, records);
    baselines[key] = baseline;
    baseHotspotsByScene[key] = clone(baseline);

    const [roomId, indexText] = key.split(':');
    const index = Number(indexText);
    const scene = rooms[roomId]?.scenes?.[index];
    if (!scene) continue;

    const currentById = new Map((scene.hotspots || []).map(item => [item.id, item]));
    scene.hotspots = (scene.hotspots || []).map(item => {
      const baselineItem = baseline.find(entry => entry.id === item.id);
      if (!baselineItem) return item;
      return {
        ...clone(baselineItem),
        title: item.title ?? baselineItem.title,
        x: item.x ?? baselineItem.x,
        y: item.y ?? baselineItem.y,
        w: item.w ?? baselineItem.w,
        h: item.h ?? baselineItem.h,
        custom: item.custom ?? baselineItem.custom
      };
    });

    for (const baselineItem of baseline) {
      if (!currentById.has(baselineItem.id)) scene.hotspots.push(clone(baselineItem));
    }
  }

  const needsMigration = localStorage.getItem(LAYOUT_VERSION_KEY) !== LAYOUT_VERSION;

  if (needsMigration) {
    for (const [key, baseline] of Object.entries(baselines)) {
      const [roomId, indexText] = key.split(':');
      const index = Number(indexText);
      const scene = rooms[roomId]?.scenes?.[index];
      if (!scene) continue;

      scene.hotspots = clone(baseline);
      hotspotEdits[key] = baseline.map(editableHotspotRecord);
    }

    localStorage.setItem(HOTSPOT_EDITS_KEY, JSON.stringify(hotspotEdits));
    localStorage.setItem(LAYOUT_VERSION_KEY, LAYOUT_VERSION);
  }

  if (debugHotspots) {
    selectedHotspotId = currentScene().hotspots?.[0]?.id || null;
  }

  renderScene();
})();
