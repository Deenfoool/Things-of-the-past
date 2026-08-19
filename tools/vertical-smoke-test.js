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
  if (check.status !== 0) {
    throw new Error(`Dev server is not reachable at ${url}`);
  }
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
  });

  await page.click('[data-menu-new]');
  await page.waitForTimeout(100);
  const devKeysAfterNewGame = await page.evaluate(() => ({
    edits: localStorage.getItem('things-of-the-past-hotspot-edits-v1'),
    layout: localStorage.getItem('things-of-the-past-hotspot-layout-version'),
    saveStarted: localStorage.getItem('things-of-the-past-save-started')
  }));

  await page.evaluate(() => changeRoom('corridor', 1));
  await page.waitForTimeout(500);
  await page.click('[data-hotspot-id="duty-officer-window"]');
  await page.waitForTimeout(100);
  await page.click('#modalClose');

  await page.evaluate(() => changeRoom('corridor', 3));
  await page.waitForTimeout(500);
  await page.click('[data-hotspot-id="corridor-to-locations"]');
  await page.waitForTimeout(100);
  await page.click('[data-travel-location="lyublino-market"]');
  await page.waitForTimeout(600);

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
    await page.waitForTimeout(520);
  }

  await page.evaluate(() => changeRoom('market-yard', 0));
  await page.waitForTimeout(550);
  const yardViews = [];
  for (let i = 0; i < 4; i += 1) {
    yardViews.push(await page.evaluate(() => ({
      room: currentRoomId,
      index: currentIndex,
      label: sceneLabel.textContent,
      hotspotCount: document.querySelectorAll('.hotspot').length
    })));
    await page.evaluate(() => rotate(1));
    await page.waitForTimeout(520);
  }

  await page.evaluate(() => changeRoom('director-office', 1));
  await page.waitForTimeout(550);
  await page.click('[data-hotspot-id="director-office-seated-victim"]');
  await page.waitForTimeout(100);
  await page.click('#modalClose');

  await page.evaluate(() => changeRoom('director-office', 3));
  await page.waitForTimeout(550);
  const officeFourth = await page.evaluate(() => ({
    src: document.querySelector('#sceneImage').getAttribute('src'),
    coveredHotspot: Boolean(document.querySelector('[data-hotspot-id="director-office-covered-form"]')),
    textHasCovered: document.body.textContent.includes('Накрытая фигура')
  }));

  await page.evaluate(() => changeRoom('market-main', 1));
  await page.waitForTimeout(550);
  const character = await page.evaluate(() => ({
    hotspotExists: Boolean(document.querySelector('[data-hotspot-id="market-side-worker"]')),
    spriteExists: Boolean(document.querySelector('[data-character-id="market-side-worker"]')),
    dialogueId: document.querySelector('[data-character-id="market-side-worker"]')?.dataset.dialogueId || null
  }));

  await page.click('[data-character-id="market-side-worker"]');
  await page.waitForTimeout(100);
  await page.click('[data-dialogue-question="heard-shots"]');
  await page.waitForTimeout(100);
  const dialogueState = await page.evaluate(() => ({
    open: document.querySelector('#dialogueUi')?.classList.contains('is-open'),
    factWritten: window.InvestigationState.get().facts.some(fact => fact.id === 'worker-heard-shots-admin-side'),
    personWritten: window.InvestigationState.get().people.some(person => person.id === 'market-worker-unknown'),
    placeholderText: document.querySelector('#dialogueLog')?.textContent.includes('Development placeholder')
  }));
  await page.click('.dialogue-ui__close');

  await page.evaluate(() => changeRoom('office', 0));
  await page.waitForTimeout(550);
  await page.click('[data-hotspot-id="case-folder"]');
  await page.waitForTimeout(100);
  const folder = await page.evaluate(() => ({
    open: document.querySelector('#deskUi')?.classList.contains('is-open'),
    hasVictimObserved: document.querySelector('#deskUiBody')?.textContent.includes('обнаружен')
  }));
  await page.click('.desk-ui__close');

  await page.evaluate(() => changeRoom('office', 2));
  await page.waitForTimeout(650);
  const board = await page.evaluate(() => ({
    visible: document.querySelector('#boardWallLayer')?.classList.contains('is-visible'),
    cardCount: document.querySelectorAll('.board-wall-card').length,
    hasPlaceholderWitness: document.body.textContent.includes('Работник боковой торговой зоны')
  }));

  await page.evaluate(() => changeRoom('corridor', 2));
  await page.waitForTimeout(550);
  await page.click('[data-hotspot-id="evidence-storage"]');
  await page.waitForTimeout(100);
  const evidence = await page.evaluate(() => ({
    open: document.querySelector('#evidenceUi')?.classList.contains('is-open'),
    hasBulletImpact: document.querySelector('#evidenceUiBody')?.textContent.includes('Следы выстрелов в кабинете')
  }));

  await browser.close();

  assert(devKeysAfterNewGame.edits === '{"dev":"keep"}', 'New Game removed developer hotspot edits');
  assert(devKeysAfterNewGame.layout === 'dev-version-keep', 'New Game removed developer layout version');
  assert(devKeysAfterNewGame.saveStarted === '1', 'New Game did not start a player save');
  assert(marketViews.length === 4 && marketViews.every(view => view.room === 'market-main' && view.hotspotCount >= 3), 'Market 4-view route failed');
  assert(marketViews.some(view => view.index === 1 && view.characterCount === 1), 'Market worker overlay is missing on side stalls view');
  assert(yardViews.length === 4 && yardViews.every(view => view.room === 'market-yard' && view.hotspotCount >= 3), 'Market yard 4-view route failed');
  assert(officeFourth.src.includes('04-neutral-wall.png'), 'Director office fourth view is not neutral wall');
  assert(!officeFourth.coveredHotspot && !officeFourth.textHasCovered, 'Director office still exposes covered body state');
  assert(!character.hotspotExists && character.spriteExists && character.dialogueId === 'market-worker-first', 'Market worker is not handled by character overlay');
  assert(dialogueState.open && dialogueState.placeholderText, 'Development dialogue placeholder did not open correctly');
  assert(!dialogueState.factWritten && !dialogueState.personWritten, 'Development dialogue wrote canonical investigation state');
  assert(folder.open && folder.hasVictimObserved, 'Case folder did not reflect victim observation');
  assert(board.visible && board.cardCount >= 6 && !board.hasPlaceholderWitness, 'Board state failed smoke check');
  assert(evidence.open && !evidence.hasBulletImpact, 'Evidence room shows non-inspectable placeholder evidence');
  assert(errors.length === 0, `Browser console/page errors: ${errors.join('; ')}`);

  console.log(JSON.stringify({
    ok: true,
    checked: {
      newGamePreservesDeveloperKeys: true,
      marketViews: marketViews.map(view => view.label),
      yardViews: yardViews.map(view => view.label),
      characterOverlay: character.dialogueId,
      developmentDialogueDoesNotWriteState: true,
      directorOfficeNeutralFourthView: true,
      evidenceRoomHasNoPlaceholderEvidence: true
    }
  }, null, 2));
})().catch(async error => {
  console.error(error.message);
  process.exit(1);
});
