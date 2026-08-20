(() => {
  const STORAGE_KEY = 'things-of-the-past-character-sprite-masks-v1';
  const DEFAULT_BRUSH_PERCENT = 6;
  const committedMasks = {};

  const game = document.getElementById('game');
  const characterPanel = document.getElementById('characterEditorPanel');
  const characterSelect = document.getElementById('characterSelect');
  const characterVariantSelect = document.getElementById('characterVariantSelect');
  const characterLayer = document.getElementById('characterLayer');

  if (!game || !characterPanel || !characterLayer) return;

  let maskEdits = readMaskEdits();
  let editEnabled = false;
  let tool = 'erase';
  let brushPercent = DEFAULT_BRUSH_PERCENT;
  let activeStroke = null;
  let statusTimer = null;
  let previewImage = null;
  let previewKey = '';

  injectControls();

  const editToggle = document.getElementById('spriteMaskEditToggle');
  const eraseButton = document.getElementById('spriteMaskErase');
  const restoreButton = document.getElementById('spriteMaskRestore');
  const brushInput = document.getElementById('spriteMaskBrush');
  const brushValue = document.getElementById('spriteMaskBrushValue');
  const undoButton = document.getElementById('spriteMaskUndo');
  const resetButton = document.getElementById('spriteMaskReset');
  const copyButton = document.getElementById('spriteMaskCopy');
  const spriteName = document.getElementById('spriteMaskSpriteName');
  const status = document.getElementById('spriteMaskStatus');
  const preview = document.getElementById('spriteMaskPreview');
  const previewCanvas = document.getElementById('spriteMaskPreviewCanvas');
  const previewEmpty = document.getElementById('spriteMaskPreviewEmpty');

  function injectControls() {
    if (document.getElementById('spriteMaskEditor')) return;

    const block = document.createElement('section');
    block.className = 'sprite-mask-editor';
    block.id = 'spriteMaskEditor';
    block.innerHTML = `
      <div class="sprite-mask-editor__heading">
        <div>
          <strong>Редактор PNG</strong>
          <small id="spriteMaskSpriteName">Выбери NPC и кадр</small>
        </div>
        <button id="spriteMaskEditToggle" type="button" aria-pressed="false">Редактировать</button>
      </div>

      <div class="sprite-mask-editor__preview" id="spriteMaskPreview">
        <canvas id="spriteMaskPreviewCanvas" aria-label="Редактируемый PNG-кадр"></canvas>
        <span id="spriteMaskPreviewEmpty">Выбери NPC и нужный кадр</span>
      </div>

      <div class="sprite-mask-editor__tools" role="group" aria-label="Инструмент маски">
        <button id="spriteMaskErase" class="is-active" type="button">Ластик</button>
        <button id="spriteMaskRestore" type="button">Обратный ластик</button>
      </div>

      <label class="sprite-mask-editor__brush">
        <span>Размер кисти <strong id="spriteMaskBrushValue">${DEFAULT_BRUSH_PERCENT}%</strong></span>
        <input id="spriteMaskBrush" type="range" min="1" max="24" step="1" value="${DEFAULT_BRUSH_PERCENT}" />
      </label>

      <div class="sprite-mask-editor__actions">
        <button id="spriteMaskUndo" type="button">Отменить мазок</button>
        <button id="spriteMaskReset" type="button">Вернуть оригинал</button>
        <button id="spriteMaskCopy" type="button">Скопировать маску</button>
      </div>

      <p class="sprite-mask-editor__hint">Нажми «Редактировать» и работай кистью в большом превью выше. Ластик скрывает пиксели, обратный ластик возвращает их из исходного PNG. Каждый кадр хранит свою маску отдельно.</p>
      <span class="sprite-mask-editor__status" id="spriteMaskStatus" role="status" aria-live="polite">Маска сохраняется в браузере</span>
    `;

    const hint = characterPanel.querySelector('.hotspot-editor__hint');
    characterPanel.insertBefore(block, hint || null);
  }

  function readMaskEdits() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveMaskEdits() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maskEdits));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function canonicalSpriteKey(src) {
    if (!src) return '';
    let value = String(src).split('?')[0].split('#')[0].replaceAll('\\', '/');
    const assetsIndex = value.indexOf('assets/');
    if (assetsIndex >= 0) value = `./${value.slice(assetsIndex)}`;
    return value.replace(/\.webp$/i, '.png');
  }

  function effectiveStrokes(key) {
    if (Object.prototype.hasOwnProperty.call(maskEdits, key)) return maskEdits[key];
    return committedMasks[key] || [];
  }

  function editableStrokes(key) {
    if (!Object.prototype.hasOwnProperty.call(maskEdits, key)) {
      maskEdits[key] = clone(effectiveStrokes(key));
    }
    return maskEdits[key];
  }

  function selectedCharacterElement() {
    const id = characterSelect?.value || window.CharacterOverlays?.selectedId?.();
    if (!id) return null;
    return Array.from(characterLayer.querySelectorAll('.scene-character'))
      .find(element => element.dataset.characterId === id) || null;
  }

  function selectedSourceImage() {
    return selectedCharacterElement()?.querySelector('.scene-character__sprite img') || null;
  }

  function selectedSpriteKey() {
    const img = selectedSourceImage();
    return img ? canonicalSpriteKey(img.getAttribute('src') || img.src) : '';
  }

  function decorateAllSprites() {
    characterLayer.querySelectorAll('.scene-character__sprite img').forEach(decorateSprite);
    syncSelection();
  }

  function decorateSprite(img) {
    if (img.dataset.spriteMaskDecorated === '1') return;
    img.dataset.spriteMaskDecorated = '1';

    const canvas = document.createElement('canvas');
    canvas.className = 'sprite-mask-canvas';
    canvas.dataset.spriteMaskKey = canonicalSpriteKey(img.getAttribute('src') || img.src);
    img.insertAdjacentElement('afterend', canvas);

    const render = () => {
      renderSprite(img, canvas);
      img.classList.add('sprite-mask-source');
    };

    if (img.complete && img.naturalWidth) render();
    else img.addEventListener('load', render, { once: true });
  }

  function renderSprite(img, canvas) {
    if (!img.naturalWidth || !img.naturalHeight) return;
    drawMaskedImage(img, canvas, effectiveStrokes(canvas.dataset.spriteMaskKey));
  }

  function drawMaskedImage(img, canvas, strokes) {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) return;

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
    context.drawImage(img, 0, 0, width, height);

    if (!strokes?.length) return;

    const mask = document.createElement('canvas');
    mask.width = width;
    mask.height = height;
    const maskContext = mask.getContext('2d');
    if (!maskContext) return;

    maskContext.fillStyle = '#fff';
    maskContext.fillRect(0, 0, width, height);
    strokes.forEach(stroke => paintMaskStroke(maskContext, stroke, width, height));

    context.globalCompositeOperation = 'destination-in';
    context.drawImage(mask, 0, 0);
    context.globalCompositeOperation = 'source-over';
  }

  function paintMaskStroke(context, stroke, width, height) {
    const points = Array.isArray(stroke?.points) ? stroke.points : [];
    if (!points.length) return;

    const radius = Math.max(1, Number(stroke.radius || 0.04) * Math.min(width, height));
    const restoring = stroke.mode === 'restore';

    context.save();
    context.globalCompositeOperation = restoring ? 'source-over' : 'destination-out';
    context.strokeStyle = '#fff';
    context.fillStyle = '#fff';
    context.lineWidth = radius * 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (points.length === 1) {
      const [x, y] = points[0];
      context.beginPath();
      context.arc(x * width, y * height, radius, 0, Math.PI * 2);
      context.fill();
    } else {
      context.beginPath();
      points.forEach(([x, y], index) => {
        const px = x * width;
        const py = y * height;
        if (index === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      });
      context.stroke();
    }

    context.restore();
  }

  function syncSelection() {
    const img = selectedSourceImage();
    const key = img ? canonicalSpriteKey(img.getAttribute('src') || img.src) : '';

    if (!img || !key) {
      previewImage = null;
      previewKey = '';
      clearPreview();
      syncUi();
      return;
    }

    previewImage = img;
    previewKey = key;

    const render = () => {
      renderPreview();
      syncUi();
    };

    if (img.complete && img.naturalWidth) render();
    else img.addEventListener('load', render, { once: true });
  }

  function clearPreview() {
    if (previewCanvas) {
      const context = previewCanvas.getContext('2d');
      context?.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewCanvas.width = 1;
      previewCanvas.height = 1;
    }
    preview?.classList.add('is-empty');
  }

  function renderPreview() {
    if (!previewCanvas || !previewImage || !previewImage.naturalWidth || !previewKey) {
      clearPreview();
      return;
    }

    preview.classList.remove('is-empty');
    drawMaskedImage(previewImage, previewCanvas, effectiveStrokes(previewKey));
  }

  function pointerPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return [
      clamp((event.clientX - rect.left) / rect.width, 0, 1),
      clamp((event.clientY - rect.top) / rect.height, 0, 1)
    ];
  }

  function beginMaskStroke(event) {
    if (!editEnabled || !previewKey || !previewImage || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const point = pointerPoint(previewCanvas, event);
    if (!point) return;

    const stroke = {
      mode: tool,
      radius: round4(brushPercent / 100),
      points: [point.map(round4)]
    };

    editableStrokes(previewKey).push(stroke);
    activeStroke = { key: previewKey, stroke, pointerId: event.pointerId };
    previewCanvas.setPointerCapture?.(event.pointerId);
    renderCurrentMask();
    setStatus(tool === 'restore' ? 'Восстанавливаю пиксели…' : 'Стираю пиксели…');
  }

  function continueMaskStroke(event) {
    if (!activeStroke || activeStroke.pointerId !== event.pointerId || activeStroke.key !== previewKey) return;

    event.preventDefault();
    event.stopPropagation();

    const point = pointerPoint(previewCanvas, event);
    if (!point) return;

    const points = activeStroke.stroke.points;
    const previous = points[points.length - 1];
    const dx = point[0] - previous[0];
    const dy = point[1] - previous[1];
    if (Math.hypot(dx, dy) < 0.0025) return;

    points.push(point.map(round4));
    renderCurrentMask();
  }

  function endMaskStroke(event) {
    if (!activeStroke || activeStroke.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    activeStroke = null;
    saveMaskEdits();
    renderCurrentMask();
    setStatus('Маска кадра сохранена', true);
    syncUi();
  }

  function renderCurrentMask() {
    renderPreview();
    renderMatchingSprites(previewKey);
  }

  function renderMatchingSprites(key) {
    characterLayer.querySelectorAll('.sprite-mask-canvas').forEach(canvas => {
      if (canvas.dataset.spriteMaskKey !== key) return;
      const img = canvas.previousElementSibling;
      if (img instanceof HTMLImageElement) renderSprite(img, canvas);
    });
  }

  function renderAllSprites() {
    characterLayer.querySelectorAll('.sprite-mask-canvas').forEach(canvas => {
      const img = canvas.previousElementSibling;
      if (img instanceof HTMLImageElement) renderSprite(img, canvas);
    });
    renderPreview();
  }

  function setEditing(value) {
    editEnabled = Boolean(value) && Boolean(previewImage) && game.classList.contains('is-character-debug');
    game.classList.toggle('is-sprite-mask-edit', editEnabled);
    preview?.classList.toggle('is-editing', editEnabled);
    editToggle?.classList.toggle('is-active', editEnabled);
    editToggle?.setAttribute('aria-pressed', String(editEnabled));
    if (editToggle) editToggle.textContent = editEnabled ? 'Готово' : 'Редактировать';
    syncUi();
  }

  function setTool(nextTool) {
    tool = nextTool === 'restore' ? 'restore' : 'erase';
    eraseButton?.classList.toggle('is-active', tool === 'erase');
    restoreButton?.classList.toggle('is-active', tool === 'restore');
    preview?.classList.toggle('is-restore', tool === 'restore');
    setStatus(tool === 'restore' ? 'Обратный ластик: возвращает исходные пиксели' : 'Ластик: скрывает пиксели');
  }

  function undoStroke() {
    if (!previewKey) return;
    const strokes = editableStrokes(previewKey);
    if (!strokes.length) {
      setStatus('Отменять нечего');
      return;
    }
    strokes.pop();
    saveMaskEdits();
    renderCurrentMask();
    setStatus('Последний мазок отменён', true);
    syncUi();
  }

  function resetSprite() {
    if (!previewKey) return;
    maskEdits[previewKey] = [];
    saveMaskEdits();
    renderCurrentMask();
    setStatus('Кадр возвращён к оригиналу', true);
    syncUi();
  }

  async function copyMask() {
    if (!previewKey) return;
    const payload = JSON.stringify({ sprite: previewKey, strokes: effectiveStrokes(previewKey) }, null, 2);
    let copied = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(payload);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      const exportArea = document.getElementById('characterExport');
      if (exportArea) {
        exportArea.value = payload;
        exportArea.focus();
        exportArea.select();
        try {
          copied = document.execCommand('copy');
        } catch {
          copied = false;
        }
      }
    }

    setStatus(copied ? 'Маска скопирована — можешь отправить мне' : 'JSON маски помещён в поле экспорта', copied);
  }

  function syncUi() {
    const available = Boolean(previewImage && previewKey);
    const strokes = available ? effectiveStrokes(previewKey) : [];

    if (spriteName) {
      spriteName.textContent = available
        ? `${previewKey.split('/').pop()} · мазков: ${strokes.length}`
        : 'Выбери NPC и кадр';
    }
    if (previewEmpty) previewEmpty.hidden = available;
    if (previewCanvas) previewCanvas.hidden = !available;

    [editToggle, eraseButton, restoreButton, brushInput, undoButton, resetButton, copyButton].forEach(control => {
      if (control) control.disabled = !available;
    });

    if (!available && editEnabled) setEditing(false);
  }

  function setStatus(text, success = false) {
    if (!status) return;
    clearTimeout(statusTimer);
    status.textContent = text;
    status.classList.toggle('is-success', success);
    statusTimer = window.setTimeout(() => {
      status.textContent = 'Маска сохраняется отдельно для каждого PNG-кадра';
      status.classList.remove('is-success');
    }, 3000);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function round4(value) {
    return Math.round(Number(value) * 10000) / 10000;
  }

  editToggle?.addEventListener('click', () => setEditing(!editEnabled));
  eraseButton?.addEventListener('click', () => setTool('erase'));
  restoreButton?.addEventListener('click', () => setTool('restore'));
  brushInput?.addEventListener('input', () => {
    brushPercent = Number(brushInput.value) || DEFAULT_BRUSH_PERCENT;
    if (brushValue) brushValue.textContent = `${brushPercent}%`;
  });
  undoButton?.addEventListener('click', undoStroke);
  resetButton?.addEventListener('click', resetSprite);
  copyButton?.addEventListener('click', copyMask);

  previewCanvas?.addEventListener('pointerdown', beginMaskStroke);
  previewCanvas?.addEventListener('pointermove', continueMaskStroke);
  previewCanvas?.addEventListener('pointerup', endMaskStroke);
  previewCanvas?.addEventListener('pointercancel', endMaskStroke);

  characterSelect?.addEventListener('change', () => requestAnimationFrame(() => {
    setEditing(false);
    syncSelection();
  }));
  characterVariantSelect?.addEventListener('change', () => requestAnimationFrame(() => {
    setEditing(false);
    decorateAllSprites();
  }));

  window.addEventListener('characters:select', () => requestAnimationFrame(() => {
    setEditing(false);
    decorateAllSprites();
  }));
  window.addEventListener('characters:change', () => requestAnimationFrame(decorateAllSprites));

  const layerObserver = new MutationObserver(() => requestAnimationFrame(decorateAllSprites));
  layerObserver.observe(characterLayer, { childList: true, subtree: true });

  const gameObserver = new MutationObserver(() => {
    if (!game.classList.contains('is-character-debug') && editEnabled) setEditing(false);
  });
  gameObserver.observe(game, { attributes: true, attributeFilter: ['class'] });

  window.SpriteMaskEditor = {
    storageKey: STORAGE_KEY,
    render: renderAllSprites,
    getMask: sprite => clone(effectiveStrokes(canonicalSpriteKey(sprite))),
    clearMask: sprite => {
      const key = canonicalSpriteKey(sprite);
      maskEdits[key] = [];
      saveMaskEdits();
      renderMatchingSprites(key);
      if (previewKey === key) renderPreview();
    }
  };

  decorateAllSprites();
  syncSelection();
})();