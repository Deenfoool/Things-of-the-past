#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (error) {
    const bundledNodeModules = process.env.CODEX_NODE_MODULES;
    if (bundledNodeModules) {
      process.env.NODE_PATH = [process.env.NODE_PATH, bundledNodeModules].filter(Boolean).join(process.platform === 'win32' ? ';' : ':');
      require('module').Module._initPaths();
      return require('playwright');
    }
    throw error;
  }
}

function defaultBrowserPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (process.platform === 'win32') return 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  return undefined;
}

function ensureServer(url) {
  const check = spawnSync(process.execPath, ['-e', `
    fetch(${JSON.stringify(url)})
      .then(response => process.exit(response.ok ? 0 : 1))
      .catch(() => process.exit(1));
  `], { stdio: 'ignore' });
  if (check.status !== 0) throw new Error(`Dev server is not reachable at ${url}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const baseUrl = process.env.GAME_URL || 'http://localhost:8000/';
  ensureServer(baseUrl);

  const { chromium } = loadPlaywright();
  const launchOptions = { headless: true };
  const executablePath = defaultBrowserPath();
  if (executablePath) launchOptions.executablePath = executablePath;

  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('things-of-the-past-hotspot-edits-v1', '{"dev":"keep"}');
    localStorage.setItem('things-of-the-past-hotspot-layout-version', 'dev-version-keep');
    localStorage.setItem('things-of-the-past-character-layout-v1', '[{"id":"dev-npc","roomId":"office"}]');
  });

  await page.click('[data-menu-new]');
  await page.waitForTimeout(120);

  const devKeysAfterNewGame = await page.evaluate(() => ({
    edits: localStorage.getItem('things-of-the-past-hotspot-edits-v1'),
    layout: localStorage.getItem('things-of-the-past-hotspot-layout-version'),
    characters: localStorage.getItem('things-of-the-past-character-layout-v1'),
    saveStarted: localStorage.getItem('things-of-the-past-save-started')
  }));

  await page.evaluate(() => changeRoom('corridor', 1));
  await page.waitForTimeout(450);
  await page.click('[data-hotspot-id="duty-officer-window"]');
  await page.waitForTimeout(100);
  await page.click('#modalClose');

  await page.evaluate(() => changeRoom('corridor', 3));
  await page.waitForTimeout(450);
  await page.click('[data-hotspot-id="corridor-to-locations"]');
  await page.waitForTimeout(100);
  await page.click('[data-travel-location="lyublino-market"]');
  await page.waitForTimeout(550);

  const marketViews = [];
  for (let i = 0; i < 4; i += 1) {
    marketViews.push(await page.evaluate(() => ({
      room: currentRoomId,
      index: currentIndex,
      label: sceneLabel.textContent,
      hotspotCount: document.querySelectorAll('.hotspot').length,
      characterCount: document.querySelectorAll('.scene-character').length
    })));
    await page.evaluate(() => rotate(1));
    await page.waitForTimeout(480);
  }

  await page.evaluate(() => changeRoom('market-yard', 0));
  await page.waitForTimeout(500);
  const yardViews = [];
  for (let i = 0; i < 4; i += 1) {
    yardViews.push(await page.evaluate(() => ({
      room: currentRoomId,
      index: currentIndex,
      label: sceneLabel.textContent,
      hotspotCount: document.querySelectorAll('.hotspot').length
    })));
    await page.evaluate(() => rotate(1));
    await page.waitForTimeout(480);
  }

  await page.evaluate(() => changeRoom('director-office', 1));
  await page.waitForTimeout(500);
  await page.click('[data-hotspot-id="director-office-seated-victim"]');
  await page.waitForTimeout(80);
  await page.click('#modalClose');

  await page.evaluate(() => changeRoom('director-office', 3));
  await page.waitForTimeout(500);
  const officeFourth = await page.evaluate(() => ({
    src: document.querySelector('#sceneImage').getAttribute('src'),
    coveredHotspot: Boolean(document.querySelector('[data-hotspot-id="director-office-covered-form"]')),
    textHasCovered: document.body.textContent.includes('Накрытая фигура')
  }));

  await page.evaluate(() => changeRoom('market-main', 1));
  await page.waitForTimeout(500);
  const character = await page.evaluate(() => ({
    hotspotExists: Boolean(document.querySelector('[data-hotspot-id="market-side-worker"]')),
    spriteExists: Boolean(document.querySelector('[data-character-id="market-side-worker"]')),
    dialogueId: document.querySelector('[data-character-id="market-side-worker"]')?.dataset.dialogueId || null,
    canonicalDialogueRegistered: window.DialogueSystem?.has?.('market-worker-first') || false,
    arkhipovDialogueRegistered: window.DialogueSystem?.has?.('arkhipov-hospital') || false
  }));

  await page.click('[data-character-id="market-side-worker"]');
  await page.waitForTimeout(100);
  const earlyWorkerDialogue = await page.evaluate(() => ({
    open: document.querySelector('#dialogueUi')?.classList.contains('is-open'),
    availableQuestions: document.querySelectorAll('[data-dialogue-question]').length,
    placeholderText: document.querySelector('#dialogueLog')?.textContent.includes('Development placeholder') || false,
    twoMenFact: window.InvestigationState.get().facts.some(fact => fact.id === 'two-men-reported-market')
  }));
  await page.click('.dialogue-ui__close');

  await page.evaluate(() => {
    window.InvestigationState.addFact({
      id: 'victim-firearm-injuries-preliminary',
      title: 'Smoke forensic prerequisite',
      status: 'established',
      text: 'Smoke test prerequisite.'
    });
    window.InvestigationState.upsertPerson({
      id: 'wounded-unknown',
      role: 'Раненый',
      name: 'Алексей Архипов',
      status: 'established',
      note: 'Smoke test hospital unlock.'
    });
  });
  await page.waitForTimeout(150);

  const hospitalState = await page.evaluate(() => {
    const location = window.InvestigationState.get().locations.find(item => item.id === 'hospital-ward');
    const registry = window.FieldLocations?.get?.('hospital-ward');
    return {
      unlocked: Boolean(location?.unlocked),
      title: location?.title || null,
      registryTitle: registry?.title || null,
      artReady: Boolean(registry?.artReady),
      sketchUiExists: Boolean(document.querySelector('#compositeSketchUi'))
    };
  });

  await page.evaluate(() => changeRoom('office', 0));
  await page.waitForTimeout(500);
  await page.click('[data-hotspot-id="case-folder"]');
  await page.waitForTimeout(80);
  const folder = await page.evaluate(() => ({
    open: document.querySelector('#deskUi')?.classList.contains('is-open'),
    hasArkhipov: document.querySelector('#deskUiBody')?.textContent.includes('Алексей Архипов') || false
  }));
  await page.click('.desk-ui__close');

  await page.evaluate(() => changeRoom('office', 2));
  await page.waitForTimeout(600);
  const board = await page.evaluate(() => ({
    visible: document.querySelector('#boardWallLayer')?.classList.contains('is-visible'),
    cardCount: document.querySelectorAll('.board-wall-card').length,
    hasArkhipov: document.querySelector('#boardWallCards')?.textContent.includes('Алексей Архипов') || false
  }));

  await page.evaluate(() => changeRoom('corridor', 2));
  await page.waitForTimeout(500);
  await page.click('[data-hotspot-id="evidence-storage"]');
  await page.waitForTimeout(80);
  const evidence = await page.evaluate(() => ({
    open: document.querySelector('#evidenceUi')?.classList.contains('is-open'),
    hasBulletImpact: document.querySelector('#evidenceUiBody')?.textContent.includes('Следы выстрелов в кабинете')
  }));

  await browser.close();

  assert(devKeysAfterNewGame.edits === '{"dev":"keep"}', 'New Game removed developer hotspot edits');
  assert(devKeysAfterNewGame.layout === 'dev-version-keep', 'New Game removed developer layout version');
  assert(devKeysAfterNewGame.characters === '[{"id":"dev-npc","roomId":"office"}]', 'New Game removed developer character layout');
  assert(devKeysAfterNewGame.saveStarted === '1', 'New Game did not start a player save');
  assert(marketViews.length === 4 && marketViews.every(view => view.room === 'market-main' && view.hotspotCount >= 3), 'Market 4-view route failed');
  assert(marketViews.some(view => view.index === 1 && view.characterCount === 1), 'Market worker overlay is missing on side stalls view');
  assert(yardViews.length === 4 && yardViews.every(view => view.room === 'market-yard' && view.hotspotCount >= 3), 'Market yard 4-view route failed');
  assert(officeFourth.src.includes('04-neutral-wall.png'), 'Director office fourth view is not neutral wall');
  assert(!officeFourth.coveredHotspot && !officeFourth.textHasCovered, 'Director office still exposes covered body state');
  assert(!character.hotspotExists && character.spriteExists && character.dialogueId === 'market-worker-first', 'Market worker is not handled by character overlay');
  assert(character.canonicalDialogueRegistered && character.arkhipovDialogueRegistered, 'Canonical case dialogues were not registered');
  assert(earlyWorkerDialogue.open && earlyWorkerDialogue.availableQuestions === 0, 'Market worker revealed case questions before Arkhipov branch');
  assert(!earlyWorkerDialogue.placeholderText && !earlyWorkerDialogue.twoMenFact, 'Market worker still behaves like development placeholder or wrote facts too early');
  assert(hospitalState.unlocked && hospitalState.title === 'Городская больница', 'Hospital location did not unlock after Arkhipov identification');
  assert(hospitalState.registryTitle === 'Городская больница' && hospitalState.sketchUiExists, 'Hospital module did not register correctly');
  assert(folder.open && folder.hasArkhipov, 'Case folder did not reflect Arkhipov identification');
  assert(board.visible && board.cardCount >= 6 && board.hasArkhipov, 'Board did not reflect Arkhipov identification');
  assert(evidence.open && !evidence.hasBulletImpact, 'Evidence room shows non-inspectable placeholder evidence');
  assert(errors.length === 0, `Browser console/page errors: ${errors.join('; ')}`);

  console.log(JSON.stringify({
    ok: true,
    checked: {
      newGamePreservesDeveloperKeys: true,
      marketViews: marketViews.map(view => view.label),
      yardViews: yardViews.map(view => view.label),
      canonicalWitnessDialogueGate: true,
      hospitalUnlock: hospitalState,
      directorOfficeNeutralFourthView: true,
      evidenceRoomHasNoPlaceholderEvidence: true
    }
  }, null, 2));
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
