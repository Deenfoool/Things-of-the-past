(() => {
  const characters = [
    {
      id: 'market-side-worker',
      roomId: 'market-main',
      sceneIndex: 1,
      name: 'Работник рынка',
      dialogueId: 'market-worker-first',
      x: 22,
      y: 51,
      w: 15,
      h: 34,
      visible: () => localStorage.getItem('things-of-the-past-case-active') === 'lyublino-1994'
    }
  ];

  const layer = document.createElement('div');
  layer.className = 'character-layer';
  layer.id = 'characterLayer';
  sceneEl.appendChild(layer);

  function currentCharacters() {
    return characters.filter(character => {
      if (character.roomId !== currentRoomId || character.sceneIndex !== currentIndex) return false;
      return typeof character.visible === 'function' ? character.visible() : character.visible !== false;
    });
  }

  function renderCharacters() {
    layer.innerHTML = '';
    for (const character of currentCharacters()) {
      const button = document.createElement('button');
      button.className = 'scene-character';
      button.type = 'button';
      button.dataset.characterId = character.id;
      button.dataset.dialogueId = character.dialogueId;
      button.setAttribute('aria-label', character.name);
      button.style.setProperty('--character-x', `${character.x}%`);
      button.style.setProperty('--character-y', `${character.y}%`);
      button.style.setProperty('--character-w', `${character.w}%`);
      button.style.setProperty('--character-h', `${character.h}%`);
      button.innerHTML = `
        <span class="scene-character__sprite" aria-hidden="true"><span class="scene-character__body"></span></span>
        <span class="scene-character__label">${escapeHtml(character.name)}</span>
      `;
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        window.DialogueSystem?.open?.(character.dialogueId);
      });
      layer.appendChild(button);
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  const observer = new MutationObserver(() => requestAnimationFrame(renderCharacters));
  observer.observe(currentImage, { attributes: true, attributeFilter: ['src'] });
  observer.observe(sceneLabel, { childList: true, characterData: true, subtree: true });

  window.addEventListener('storage', event => {
    if (event.key === 'things-of-the-past-case-active') renderCharacters();
  });
  window.addEventListener('investigation:change', renderCharacters);

  window.CharacterOverlays = {
    list: () => characters.map(character => ({ ...character, visible: undefined })),
    render: renderCharacters
  };

  renderCharacters();
})();
