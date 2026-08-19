(() => {
  const FIELD_LAYOUT_VERSION = '2026-08-20-field-01';
  const FIELD_LAYOUT_VERSION_KEY = 'things-of-the-past-field-hotspot-layout-version';

  const fieldLayouts = {
    'market-main:0': [
      { id: 'market-main-counter', title: 'Центральный прилавок', x: 27.4, y: 53.4, w: 48.9, h: 30.5 },
      { id: 'market-main-scales', title: 'Весы', x: 47.9, y: 28.1, w: 12.8, h: 26.1 },
      { id: 'market-main-notices', title: 'Объявления', x: 41.2, y: 14, w: 17.7, h: 24 }
    ],
    'market-main:1': [
      { id: 'market-side-bench', title: 'Скамья', x: 5.7, y: 60.2, w: 30.2, h: 35.8 },
      { id: 'market-side-shutter', title: 'Закрытый роллет', x: 39.7, y: 0, w: 24.5, h: 52.4 },
      { id: 'market-side-crates', title: 'Ящики у прилавка', x: 51.3, y: 57.5, w: 38.3, h: 32.1 }
    ],
    'market-main:3': [
      { id: 'market-to-yard', title: 'Выйти во двор рынка', x: 35.4, y: 2.3, w: 31.3, h: 72.8 },
      { id: 'market-exit-threshold', title: 'Порог прохода', x: 34.2, y: 68.7, w: 32.7, h: 20.3 },
      { id: 'market-exit-crates', title: 'Ящики у выхода', x: 77, y: 63.6, w: 23, h: 36 }
    ],

    'director-office:0': [
      { id: 'director-office-to-market', title: 'Вернуться к административной стороне', x: 35.7, y: 3.1, w: 23, h: 94.8 },
      { id: 'director-office-coat-rack', title: 'Вешалка', x: 14.6, y: 5, w: 16, h: 74.7 },
      { id: 'director-office-duty-window', title: 'Служебное окно', x: 65.8, y: 20.7, w: 15.6, h: 34.1 }
    ],
    'director-office:1': [
      { id: 'director-office-seated-victim', title: 'Сидящий мужчина', x: 41.8, y: 41.7, w: 20, h: 29 },
      { id: 'director-office-desk', title: 'Рабочий стол', x: 16.4, y: 72.5, w: 67.8, h: 16.1 },
      { id: 'director-office-phone', title: 'Телефон', x: 21.2, y: 62.4, w: 12.7, h: 14.7 },
      { id: 'director-office-wall-portrait', title: 'Портрет на стене', x: 58.2, y: 13.1, w: 9, h: 17 },
      { id: 'director-office-window', title: 'Окно', x: 84, y: 11, w: 14, h: 45 }
    ],

    'market-yard:0': [
      { id: 'yard-to-market-main', title: 'Вернуться в торговую зону', x: 39.3, y: 21.6, w: 24.1, h: 61.1 },
      { id: 'yard-handcarts', title: 'Тележки', x: 4.7, y: 51.4, w: 23.3, h: 42.2 },
      { id: 'yard-crates-market-door', title: 'Ящики у входа', x: 78.5, y: 51.5, w: 21.5, h: 48.5 }
    ],
    'market-yard:1': [
      { id: 'yard-storage-doors', title: 'Складские двери', x: 32, y: 20, w: 31, h: 59 },
      { id: 'yard-notice-board', title: 'Доска объявлений', x: 11.4, y: 17.7, w: 13.3, h: 25 },
      { id: 'yard-covered-crates', title: 'Накрытые ящики', x: 63.5, y: 48.8, w: 19.8, h: 33.7 }
    ],
    'market-yard:2': [
      { id: 'yard-service-gate', title: 'Ворота', x: 30.9, y: 15.2, w: 52.2, h: 70.4 },
      { id: 'yard-gate-cart', title: 'Ручная тележка', x: 17.9, y: 43, w: 12.3, h: 48.2 },
      { id: 'yard-gate-view', title: 'Внешние ряды', x: 38, y: 26, w: 25, h: 21 }
    ],
    'market-yard:3': [
      { id: 'yard-to-corridor', title: 'Уехать в дежурную часть', x: 0, y: 36, w: 19.2, h: 50 },
      { id: 'yard-open-gate', title: 'Открытые ворота', x: 20.8, y: 25.5, w: 23.1, h: 48.7 },
      { id: 'yard-car-crates', title: 'Ящики у стены', x: 59, y: 55, w: 22.8, h: 41.2 }
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

  for (const [key, records] of Object.entries(fieldLayouts)) {
    const baseline = mergeWithMetadata(key, records);
    baselines[key] = baseline;
    baseHotspotsByScene[key] = clone(baseline);
  }

  const needsMigration = localStorage.getItem(FIELD_LAYOUT_VERSION_KEY) !== FIELD_LAYOUT_VERSION;

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
    localStorage.setItem(FIELD_LAYOUT_VERSION_KEY, FIELD_LAYOUT_VERSION);
  }

  if (debugHotspots) {
    selectedHotspotId = currentScene().hotspots?.[0]?.id || null;
  }

  renderScene();
})();
