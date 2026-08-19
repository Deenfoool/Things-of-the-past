(() => {
  const CHARACTER_LAYOUT_KEY = 'things-of-the-past-character-layout-v1';

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
    }
  };

  const baseCharacters = [
    {
      id: 'market-side-worker',
      type: 'market-worker',
      roomId: 'market-main',
      sceneIndex: 1,
      name: 'Работник рынка',
      dialogueId: 'market-worker-first',
      variantId: 'idle-seated',
      x: 20.6,
      y: 55.6,
      w: 18.8,
      h: 50,
      rotation: 0,
      flipX: false,
      visible: true,
      requiresCase: 'lyublino-1994'
    }
  ];

  let characters = mergeSavedCharacters();
  let selectedCharacterId = null;
  let dragState = null;

  const layer = document.createElement('div');
  layer.className = 'character-layer';
  layer.id = 'characterLayer';
  sceneEl.appendChild(layer);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readSavedCharacters() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHARACTER_LAYOUT_KEY) || 'null');
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function mergeSavedCharacters() {
    const saved = readSavedCharacters();
    if (!saved) return clone(baseCharacters);

    const byId = new Map(baseCharacters.map(character => [character.id, clone(character)]));
    saved.forEach(character => {
      if (!character?.id) return;
      byId.set(character.id, { ...(byId.get(character.id) || defaultCharacter(character.type)), ...character });
    });
    return Array.from(byId.values());
  }

  function saveCharacters() {
    localStorage.setItem(CHARACTER_LAYOUT_KEY, JSON.stringify(characters.map(serializableCharacter)));
    window.dispatchEvent(new CustomEvent('characters:change', { detail: { characters: list() } }));
  }

  function serializableCharacter(character) {
    const { requiresCase, ...record } = character;
    return record;
  }

  function defaultCharacter(type = 'market-worker') {
    const definition = characterTypes[type] || characterTypes['market-worker'];
    const variant = definition.variants[0];
    return {
      id: `npc-${Date.now().toString(36)}`,
      type,
      roomId: currentRoomId,
      sceneIndex: currentIndex,
      name: definition.defaultName,
      dialogueId: definition.dialogueId,
      variantId: variant.id,
      x: 50,
      y: 55,
      w: 18,
      h: 42,
      rotation: 0,
      flipX: false,
      visible: true
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

  function renderCharacters() {
    layer.innerHTML = '';
    for (const character of currentCharacters(true)) {
      const hidden = isCharacterHidden(character);
      const variant = characterVariant(character);
      const button = document.createElement('button');
      button.className = 'scene-character';
      button.type = 'button';
      button.dataset.characterId = character.id;
      button.dataset.dialogueId = character.dialogueId || '';
      button.dataset.variantId = variant.id;
      button.setAttribute('aria-label', character.name);
      button.hidden = hidden && !game.classList.contains('is-character-debug');
      button.classList.toggle('is-selected', character.id === selectedCharacterId);
      button.classList.toggle('is-hidden-character', hidden);
      applyGeometry(button, character);
      button.innerHTML = `
        <span class="scene-character__sprite" aria-hidden="true">
          <img src="${variant.sprite}" alt="" draggable="false" />
        </span>
        <span class="scene-character__label">${escapeHtml(character.name)}</span>
        <span class="scene-character__resize" data-character-handle="resize" aria-hidden="true"></span>
        <span class="scene-character__rotate" data-character-handle="rotate" aria-hidden="true"></span>
      `;
      button.addEventListener('pointerdown', event => beginCharacterPointer(event, character, button));
      button.addEventListener('click', event => {
        if (game.classList.contains('is-character-debug')) {
          event.preventDefault();
          event.stopPropagation();
          selectCharacter(character.id);
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (character.dialogueId) window.DialogueSystem?.open?.(character.dialogueId);
      });
      layer.appendChild(button);
    }
  }

  function applyGeometry(element, character) {
    element.style.setProperty('--character-x', `${character.x}%`);
    element.style.setProperty('--character-y', `${character.y}%`);
    element.style.setProperty('--character-w', `${character.w}%`);
    element.style.setProperty('--character-h', `${character.h}%`);
    element.style.setProperty('--character-rotation', `${character.rotation || 0}deg`);
    element.style.setProperty('--character-flip', character.flipX ? '-1' : '1');
  }

  function beginCharacterPointer(event, character, element) {
    if (!game.classList.contains('is-character-debug') || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    selectCharacter(character.id);

    const rect = layer.getBoundingClientRect();
    const handle = event.target.closest('[data-character-handle]')?.dataset.characterHandle || 'move';
    dragState = {
      id: character.id,
      element,
      handle,
      rect,
      startX: event.clientX,
      startY: event.clientY,
      start: clone(character),
      centerX: rect.left + rect.width * character.x / 100,
      centerY: rect.top + rect.height * character.y / 100,
      pointerId: event.pointerId
    };
    element.setPointerCapture?.(event.pointerId);
    element.classList.add('is-dragging');
  }

  function onPointerMove(event) {
    if (!dragState) return;
    const character = get(dragState.id);
    if (!character) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;

    if (dragState.handle === 'resize') {
      character.w = round(clamp(dragState.start.w + dx / dragState.rect.width * 100, 3, 80));
      character.h = round(clamp(dragState.start.h + dy / dragState.rect.height * 100, 3, 90));
    } else if (dragState.handle === 'rotate') {
      const angle = Math.atan2(event.clientY - dragState.centerY, event.clientX - dragState.centerX) * 180 / Math.PI;
      character.rotation = Math.round(angle + 90);
    } else {
      character.x = round(clamp(dragState.start.x + dx / dragState.rect.width * 100, 0, 100));
      character.y = round(clamp(dragState.start.y + dy / dragState.rect.height * 100, 0, 100));
    }

    applyGeometry(dragState.element, character);
    window.dispatchEvent(new CustomEvent('characters:preview', { detail: { character: clone(character) } }));
  }

  function onPointerUp() {
    if (!dragState) return;
    dragState.element.classList.remove('is-dragging');
    dragState = null;
    saveCharacters();
    renderCharacters();
  }

  function list() {
    return characters.map(character => clone(character));
  }

  function listCurrent(includeHidden = true) {
    return currentCharacters(includeHidden).map(character => clone(character));
  }

  function get(id) {
    return characters.find(character => character.id === id) || null;
  }

  function selectCharacter(id) {
    selectedCharacterId = id;
    renderCharacters();
    window.dispatchEvent(new CustomEvent('characters:select', { detail: { id, character: clone(get(id)) } }));
  }

  function addCharacter(type = 'market-worker') {
    const character = defaultCharacter(type);
    characters.push(character);
    selectedCharacterId = character.id;
    saveCharacters();
    renderCharacters();
    return clone(character);
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
    const character = get(id);
    if (!character) return null;
    Object.assign(character, patch);
    if (!characterTypes[character.type]) character.type = 'market-worker';
    const variants = characterTypes[character.type].variants;
    if (!variants.some(variant => variant.id === character.variantId)) character.variantId = variants[0].id;
    saveCharacters();
    renderCharacters();
    return clone(character);
  }

  function resetCharacter(id) {
    const base = baseCharacters.find(character => character.id === id);
    const character = get(id);
    if (!character) return null;
    Object.assign(character, clone(base || defaultCharacter(character.type)));
    character.id = id;
    saveCharacters();
    renderCharacters();
    return clone(character);
  }

  function resetAll() {
    characters = clone(baseCharacters);
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
    get: id => clone(get(id)),
    selectedId: () => selectedCharacterId,
    select: selectCharacter,
    add: addCharacter,
    remove: removeCharacter,
    update: updateCharacter,
    reset: resetCharacter,
    resetAll,
    render: renderCharacters
  };

  renderCharacters();
})();
