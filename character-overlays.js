(() => {
  const CHARACTER_LAYOUT_KEY = 'things-of-the-past-character-layout-v1';
  const GEOMETRY_KEYS = ['x', 'y', 'w', 'h', 'rotation', 'flipX'];

  const characterTypes = {
    'market-worker': {
      title: 'Работник рынка',
      defaultName: 'Работник рынка',
      dialogueId: 'market-worker-first',
      variants: [
        { id: 'idle-seated', label: 'Сидит', sprite: './assets/characters/lyublino-market/market-worker/idle-seated.png' },
        { id: 'shrug-unknown', label: 'Не знаю', sprite: './assets/characters/lyublino-market/market-worker/shrug-unknown.png' },
        { id: 'pointing', label: 'Указывает', sprite: './assets/characters/lyublino-market/market-worker/pointing.png' },
        { id: 'look-away', label: 'Смотрит в сторону', sprite: './assets/characters/lyublino-market/market-worker/look-away.png' }
      ]
    },
    'criminalist-market': {
      title: 'Криминалист',
      defaultName: 'Криминалист',
      dialogueId: '',
      variants: [
        { id: 'leaned-over', label: 'Осматривает погибшего', sprite: './assets/characters/lyublino-market/criminalist-market/leaned-over.png' },
        { id: 'written', label: 'Делает записи', sprite: './assets/characters/lyublino-market/criminalist-market/written.png' },
        { id: 'turned-around', label: 'Обернулся', sprite: './assets/characters/lyublino-market/criminalist-market/turned-around.png' },
        { id: 'thinks', label: 'Обдумывает', sprite: './assets/characters/lyublino-market/criminalist-market/thinks.png' }
      ]
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function defaultGeometry() {
    return {
      x: 50,
      y: 55,
      w: 18,
      h: 42,
      rotation: 0,
      flipX: false
    };
  }

  function geometryFrom(record, fallback = defaultGeometry()) {
    return {
      x: Number.isFinite(Number(record?.x)) ? Number(record.x) : fallback.x,
      y: Number.isFinite(Number(record?.y)) ? Number(record.y) : fallback.y,
      w: Number.isFinite(Number(record?.w)) ? Number(record.w) : fallback.w,
      h: Number.isFinite(Number(record?.h)) ? Number(record.h) : fallback.h,
      rotation: Number.isFinite(Number(record?.rotation)) ? Number(record.rotation) : fallback.rotation,
      flipX: typeof record?.flipX === 'boolean' ? record.flipX : fallback.flipX
    };
  }

  function createVariantLayouts(type, geometry = defaultGeometry()) {
    const definition = characterTypes[type] || characterTypes['market-worker'];
    return Object.fromEntries(definition.variants.map(variant => [variant.id, clone(geometry)]));
  }

  const baseCharacters = [
    {
      id: 'market-side-worker',
      type: 'market-worker',
      roomId: 'market-main',
      sceneIndex: 1,
      name: 'Работник рынка',
      dialogueId: 'market-worker-first',
      variantId: 'idle-seated',
      variantLayouts: createVariantLayouts('market-worker', {
        x: 20.6,
        y: 55.6,
        w: 18.8,
        h: 50,
        rotation: 0,
        flipX: false
      }),
      visible: true,
      requiresCase: 'lyublino-1994'
    },
    {
      id: 'director-office-criminalist',
      type: 'criminalist-market',
      roomId: 'director-office',
      sceneIndex: 1,
      name: 'Криминалист',
      dialogueId: '',
      variantId: 'leaned-over',
      variantLayouts: {
        'leaned-over': { x: 25.6, y: 44.5, w: 24, h: 49, rotation: 0, flipX: false },
        'written': { x: 25.6, y: 44.3, w: 21, h: 48, rotation: 0, flipX: false },
        'turned-around': { x: 25.6, y: 43.8, w: 19, h: 47, rotation: 0, flipX: false },
        'thinks': { x: 25.6, y: 43.8, w: 19, h: 47, rotation: 0, flipX: false }
      },
      visible: true,
      requiresCase: 'lyublino-1994'
    }
  ];

  let selectedCharacterId = null;
  let dragState = null;

  function normalizeCharacter(record, base = null) {
    const type = characterTypes[record?.type]
      ? record.type
      : (characterTypes[base?.type] ? base.type : 'market-worker');
    const definition = characterTypes[type];
    const validVariantIds = new Set(definition.variants.map(variant => variant.id));
    const fallbackVariantId = definition.variants[0].id;
    const variantId = validVariantIds.has(record?.variantId)
      ? record.variantId
      : (validVariantIds.has(base?.variantId) ? base.variantId : fallbackVariantId);

    const baseGeometry = geometryFrom(base, defaultGeometry());
    const legacyGeometry = geometryFrom(record, baseGeometry);
    const hasLegacyGeometry = GEOMETRY_KEYS.some(key => Object.prototype.hasOwnProperty.call(record || {}, key));
    const baseLayouts = base?.variantLayouts || {};
    const savedLayouts = record?.variantLayouts || {};
    const variantLayouts = {};

    for (const variant of definition.variants) {
      const seed = hasLegacyGeometry
        ? legacyGeometry
        : geometryFrom(baseLayouts[variant.id], baseGeometry);
      variantLayouts[variant.id] = geometryFrom(savedLayouts[variant.id], seed);
    }

    const normalized = {
      ...(base ? clone(base) : {}),
      ...(record ? clone(record) : {}),
      type,
      variantId,
      variantLayouts
    };

    GEOMETRY_KEYS.forEach(key => delete normalized[key]);
    return normalized;
  }

  function readSavedCharacters() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHARACTER_LAYOUT_KEY) || 'null');
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function defaultCharacter(type = 'market-worker') {
    const definition = characterTypes[type] || characterTypes['market-worker'];
    const variant = definition.variants[0];
    return normalizeCharacter({
      id: `npc-${Date.now().toString(36)}`,
      type,
      roomId: currentRoomId,
      sceneIndex: currentIndex,
      name: definition.defaultName,
      dialogueId: definition.dialogueId,
      variantId: variant.id,
      variantLayouts: createVariantLayouts(type, defaultGeometry()),
      visible: true
    });
  }

  function activeGeometry(character, variantId = character?.variantId) {
    if (!character) return defaultGeometry();
    const definition = characterTypes[character.type] || characterTypes['market-worker'];
    const fallbackId = definition.variants[0].id;
    const id = definition.variants.some(variant => variant.id === variantId) ? variantId : fallbackId;
    if (!character.variantLayouts) character.variantLayouts = createVariantLayouts(character.type, defaultGeometry());
    if (!character.variantLayouts[id]) character.variantLayouts[id] = clone(defaultGeometry());
    return character.variantLayouts[id];
  }

  function mergeSavedCharacters() {
    const saved = readSavedCharacters();
    const normalizedBase = baseCharacters.map(character => normalizeCharacter(character));
    if (!saved) return normalizedBase;

    const byId = new Map(normalizedBase.map(character => [character.id, character]));
    saved.forEach(savedCharacter => {
      if (!savedCharacter?.id) return;
      const base = byId.get(savedCharacter.id) || null;
      const fallback = base || defaultCharacter(savedCharacter.type);
      const merged = {
        ...clone(fallback),
        ...clone(savedCharacter),
        variantLayouts: {
          ...(fallback.variantLayouts || {}),
          ...(savedCharacter.variantLayouts || {})
        }
      };

      if (!savedCharacter.variantLayouts && GEOMETRY_KEYS.some(key => Object.prototype.hasOwnProperty.call(savedCharacter, key))) {
        merged.variantLayouts = createVariantLayouts(
          merged.type,
          geometryFrom(savedCharacter, activeGeometry(fallback))
        );
      }

      byId.set(savedCharacter.id, normalizeCharacter(merged, fallback));
    });
    return Array.from(byId.values());
  }

  let characters = mergeSavedCharacters();

  const layer = document.createElement('div');
  layer.className = 'character-layer';
  layer.id = 'characterLayer';
  sceneEl.appendChild(layer);

  function serializableCharacter(character) {
    const { requiresCase, ...record } = character;
    const result = clone(record);
    GEOMETRY_KEYS.forEach(key => delete result[key]);
    return result;
  }

  function saveCharacters() {
    localStorage.setItem(CHARACTER_LAYOUT_KEY, JSON.stringify(characters.map(serializableCharacter)));
    window.dispatchEvent(new CustomEvent('characters:change', { detail: { characters: list() } }));
  }

  function rawGet(id) {
    return characters.find(character => character.id === id) || null;
  }

  function publicCharacter(character) {
    if (!character) return null;
    return {
      ...clone(character),
      ...clone(activeGeometry(character))
    };
  }

  function currentCharacters(includeHidden = false) {
    return characters.filter(character => {
      if (character.roomId !== currentRoomId || character.sceneIndex !== currentIndex) return false;
      return includeHidden || isCharacterVisible(character);
    });
  }

  function isCharacterVisible(character) {
    if (game.classList.contains('is-character-debug')) return true;
    return !isCharacterHidden(character);
  }

  function isCharacterHidden(character) {
    if (character.visible === false) return true;
    if (character.requiresCase && localStorage.getItem('things-of-the-past-case-active') !== character.requiresCase) return true;
    return false;
  }

  function characterVariant(character) {
    const definition = characterTypes[character.type] || characterTypes['market-worker'];
    return definition.variants.find(variant => variant.id === character.variantId) || definition.variants[0];
  }

  function applyGeometry(element, geometry) {
    element.style.setProperty('--character-x', `${geometry.x}%`);
    element.style.setProperty('--character-y', `${geometry.y}%`);
    element.style.setProperty('--character-w', `${geometry.w}%`);
    element.style.setProperty('--character-h', `${geometry.h}%`);
    element.style.setProperty('--character-rotation', `${geometry.rotation || 0}deg`);
    element.style.setProperty('--character-flip', geometry.flipX ? '-1' : '1');
  }

  function renderCharacters() {
    layer.innerHTML = '';
    for (const rawCharacter of currentCharacters(true)) {
      const character = publicCharacter(rawCharacter);
      const hidden = isCharacterHidden(rawCharacter);
      const variant = characterVariant(rawCharacter);
      const button = document.createElement('button');
      button.className = 'scene-character';
      button.type = 'button';
      button.dataset.characterId = rawCharacter.id;
      button.dataset.dialogueId = rawCharacter.dialogueId || '';
      button.dataset.variantId = variant.id;
      button.setAttribute('aria-label', rawCharacter.name);
      button.hidden = hidden && !game.classList.contains('is-character-debug');
      button.classList.toggle('is-selected', rawCharacter.id === selectedCharacterId);
      button.classList.toggle('is-hidden-character', hidden);
      applyGeometry(button, character);
      button.innerHTML = `
        <span class="scene-character__sprite" aria-hidden="true">
          <img src="${variant.sprite}" alt="" draggable="false" />
        </span>
        <span class="scene-character__label">${escapeHtml(rawCharacter.name)}</span>
        <span class="scene-character__resize" data-character-handle="resize" aria-hidden="true"></span>
        <span class="scene-character__rotate" data-character-handle="rotate" aria-hidden="true"></span>
      `;
      button.addEventListener('pointerdown', event => beginCharacterPointer(event, rawCharacter, button));
      button.addEventListener('click', event => {
        if (game.classList.contains('is-character-debug')) {
          event.preventDefault();
          event.stopPropagation();
          selectCharacter(rawCharacter.id);
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (rawCharacter.dialogueId) window.DialogueSystem?.open?.(rawCharacter.dialogueId);
      });
      layer.appendChild(button);
    }
  }

  function beginCharacterPointer(event, character, element) {
    if (!game.classList.contains('is-character-debug') || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    selectCharacter(character.id);

    const rect = layer.getBoundingClientRect();
    const handle = event.target.closest('[data-character-handle]')?.dataset.characterHandle || 'move';
    const geometry = clone(activeGeometry(character));
    dragState = {
      id: character.id,
      variantId: character.variantId,
      element,
      handle,
      rect,
      startX: event.clientX,
      startY: event.clientY,
      start: geometry,
      centerX: rect.left + rect.width * geometry.x / 100,
      centerY: rect.top + rect.height * geometry.y / 100
    };
    element.setPointerCapture?.(event.pointerId);
    element.classList.add('is-dragging');
  }

  function onPointerMove(event) {
    if (!dragState) return;
    const character = rawGet(dragState.id);
    if (!character || character.variantId !== dragState.variantId) return;
    const geometry = activeGeometry(character, dragState.variantId);
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;

    if (dragState.handle === 'resize') {
      geometry.w = round(clamp(dragState.start.w + dx / dragState.rect.width * 100, 3, 80));
      geometry.h = round(clamp(dragState.start.h + dy / dragState.rect.height * 100, 3, 90));
    } else if (dragState.handle === 'rotate') {
      const angle = Math.atan2(event.clientY - dragState.centerY, event.clientX - dragState.centerX) * 180 / Math.PI;
      geometry.rotation = Math.round(angle + 90);
    } else {
      geometry.x = round(clamp(dragState.start.x + dx / dragState.rect.width * 100, 0, 100));
      geometry.y = round(clamp(dragState.start.y + dy / dragState.rect.height * 100, 0, 100));
    }

    applyGeometry(dragState.element, geometry);
    window.dispatchEvent(new CustomEvent('characters:preview', { detail: { character: publicCharacter(character) } }));
  }

  function onPointerUp() {
    if (!dragState) return;
    dragState.element.classList.remove('is-dragging');
    dragState = null;
    saveCharacters();
    renderCharacters();
  }

  function list() {
    return characters.map(character => publicCharacter(character));
  }

  function listCurrent(includeHidden = true) {
    return currentCharacters(includeHidden).map(character => publicCharacter(character));
  }

  function selectCharacter(id) {
    selectedCharacterId = id;
    renderCharacters();
    window.dispatchEvent(new CustomEvent('characters:select', {
      detail: { id, character: publicCharacter(rawGet(id)) }
    }));
  }

  function addCharacter(type = 'market-worker') {
    const character = defaultCharacter(type);
    characters.push(character);
    selectedCharacterId = character.id;
    saveCharacters();
    renderCharacters();
    return publicCharacter(character);
  }

  function removeCharacter(id) {
    const index = characters.findIndex(character => character.id === id);
    if (index < 0) return;
    characters.splice(index, 1);
    selectedCharacterId = currentCharacters(true)[0]?.id || characters[0]?.id || null;
    saveCharacters();
    renderCharacters();
  }

  function updateCharacter(id, patch) {
    const character = rawGet(id);
    if (!character) return null;

    if (!characterTypes[character.type]) character.type = 'market-worker';
    const variants = characterTypes[character.type].variants;
    const previousVariantId = character.variantId;
    const requestedVariantId = variants.some(variant => variant.id === patch.variantId)
      ? patch.variantId
      : previousVariantId;
    const variantChanged = requestedVariantId !== previousVariantId;

    const metadataPatch = { ...patch };
    GEOMETRY_KEYS.forEach(key => delete metadataPatch[key]);
    delete metadataPatch.variantId;
    Object.assign(character, metadataPatch);

    if (variantChanged) {
      character.variantId = requestedVariantId;
    } else {
      const geometry = activeGeometry(character, previousVariantId);
      GEOMETRY_KEYS.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(patch, key)) geometry[key] = patch[key];
      });
    }

    saveCharacters();
    renderCharacters();
    return publicCharacter(character);
  }

  function setVariant(id, variantId) {
    const character = rawGet(id);
    if (!character) return null;
    const variants = characterTypes[character.type]?.variants || characterTypes['market-worker'].variants;
    if (!variants.some(variant => variant.id === variantId)) return publicCharacter(character);
    character.variantId = variantId;
    saveCharacters();
    renderCharacters();
    return publicCharacter(character);
  }

  function resetCharacter(id) {
    const base = baseCharacters.find(character => character.id === id);
    const character = rawGet(id);
    if (!character) return null;
    const replacement = normalizeCharacter(base || defaultCharacter(character.type));
    replacement.id = id;
    const index = characters.findIndex(item => item.id === id);
    characters[index] = replacement;
    saveCharacters();
    renderCharacters();
    return publicCharacter(replacement);
  }

  function resetAll() {
    characters = baseCharacters.map(character => normalizeCharacter(character));
    selectedCharacterId = currentCharacters(true)[0]?.id || characters[0]?.id || null;
    saveCharacters();
    renderCharacters();
  }

  function definitions() {
    return Object.entries(characterTypes).map(([id, definition]) => ({
      id,
      title: definition.title,
      defaultName: definition.defaultName
    }));
  }

  function variantsFor(type) {
    return clone((characterTypes[type] || characterTypes['market-worker']).variants);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function round(value) {
    return Math.round(Number(value) * 10) / 10;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  const observer = new MutationObserver(() => requestAnimationFrame(renderCharacters));
  observer.observe(currentImage, { attributes: true, attributeFilter: ['src'] });
  observer.observe(sceneLabel, { childList: true, characterData: true, subtree: true });

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('storage', event => {
    if (event.key === 'things-of-the-past-case-active') renderCharacters();
  });
  window.addEventListener('investigation:change', renderCharacters);

  window.CharacterOverlays = {
    storageKey: CHARACTER_LAYOUT_KEY,
    definitions,
    variantsFor,
    list,
    listCurrent,
    get: id => publicCharacter(rawGet(id)),
    selectedId: () => selectedCharacterId,
    select: selectCharacter,
    add: addCharacter,
    remove: removeCharacter,
    update: updateCharacter,
    setVariant,
    reset: resetCharacter,
    resetAll,
    render: renderCharacters
  };

  saveCharacters();
  renderCharacters();
})();