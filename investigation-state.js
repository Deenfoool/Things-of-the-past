(() => {
  const STORAGE_KEY = 'things-of-the-past-investigation-state-v1';
  const LEGACY_CASE_KEY = 'things-of-the-past-case-active';
  const CASE_ID = 'lyublino-1994';
  const STATE_VERSION = 2;
  const KNOWLEDGE_STATUSES = new Set(['unknown', 'claim', 'observed', 'established', 'corroborated', 'interviewed', 'refuted']);

  const starterState = () => ({
    version: STATE_VERSION,
    activeCaseId: null,
    facts: [],
    people: [],
    evidence: [],
    locations: [],
    timeline: [],
    updatedAt: Date.now()
  });

  const starterCaseData = {
    facts: [
      { id: 'incident-shooting', title: 'Стрельба', status: 'claim', text: 'Поступило сообщение о стрельбе на Люблинском рынке.' },
      { id: 'time-around-noon', title: 'Около полудня', status: 'claim', text: 'Ориентировочное время исходного сообщения.' }
    ],
    people: [
      { id: 'victim-unknown', role: 'Погибший', name: null, status: 'unknown' },
      { id: 'wounded-unknown', role: 'Раненый', name: null, status: 'unknown' }
    ],
    locations: [
      { id: 'lyublino-market', title: 'Люблинский рынок', kind: 'crime-scene', unlocked: true, visited: false, artReady: false, roomId: null }
    ],
    timeline: [
      { id: 'dispatch-call', time: '24 августа 1994, около полудня', title: 'Сообщение о стрельбе', status: 'claim' }
    ]
  };

  let state = read();
  const listeners = new Set();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeStatus(value, fallback = 'unknown') {
    return KNOWLEDGE_STATUSES.has(value) ? value : fallback;
  }

  function normalizeRecord(record, fallbackStatus = null) {
    const normalized = clone(record || {});
    if (fallbackStatus !== null || Object.prototype.hasOwnProperty.call(normalized, 'status')) {
      normalized.status = normalizeStatus(normalized.status, fallbackStatus || 'unknown');
    }
    return normalized;
  }

  function migrate(parsed) {
    const migrated = starterState();
    if (!parsed || typeof parsed !== 'object') return migrated;

    migrated.activeCaseId = parsed.activeCaseId || null;
    migrated.facts = Array.isArray(parsed.facts) ? parsed.facts.map(item => normalizeRecord(item, 'claim')) : [];
    migrated.people = Array.isArray(parsed.people) ? parsed.people.map(item => normalizeRecord(item, 'unknown')) : [];
    migrated.evidence = Array.isArray(parsed.evidence) ? parsed.evidence.map(item => clone(item)) : [];
    migrated.locations = Array.isArray(parsed.locations) ? parsed.locations.map(item => clone(item)) : [];
    migrated.timeline = Array.isArray(parsed.timeline) ? parsed.timeline.map(item => normalizeRecord(item, 'claim')) : [];
    migrated.updatedAt = Number(parsed.updatedAt) || Date.now();
    migrated.version = STATE_VERSION;
    return migrated;
  }

  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      const migrated = migrate(parsed);
      if (parsed && parsed.version !== STATE_VERSION) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }
      return migrated;
    } catch {
      return starterState();
    }
  }

  function dispatchDomainEvent(name, payload, snapshot) {
    if (!name) return;
    const detail = { ...clone(payload || {}), state: snapshot };
    window.dispatchEvent(new CustomEvent(name, { detail }));
    window.dispatchEvent(new CustomEvent(`investigation:${name}`, { detail }));
  }

  function save(reason = 'update', domainEvent = null, payload = null) {
    state.version = STATE_VERSION;
    state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const snapshot = clone(state);
    listeners.forEach(listener => listener(snapshot, reason));
    window.dispatchEvent(new CustomEvent('investigation:change', { detail: { state: snapshot, reason } }));
    dispatchDomainEvent(domainEvent, payload, snapshot);
  }

  function upsert(collection, record) {
    const normalized = clone(record);
    const index = collection.findIndex(item => item.id === normalized.id);
    if (index === -1) {
      collection.push(normalized);
      return { created: true, previous: null, current: clone(normalized) };
    }

    const previous = clone(collection[index]);
    collection[index] = { ...collection[index], ...normalized };
    return { created: false, previous, current: clone(collection[index]) };
  }

  function seedCase() {
    if (state.activeCaseId === CASE_ID) return false;
    state = starterState();
    state.activeCaseId = CASE_ID;
    starterCaseData.facts.forEach(item => upsert(state.facts, normalizeRecord(item, 'claim')));
    starterCaseData.people.forEach(item => upsert(state.people, normalizeRecord(item, 'unknown')));
    starterCaseData.locations.forEach(item => upsert(state.locations, item));
    starterCaseData.timeline.forEach(item => upsert(state.timeline, normalizeRecord(item, 'claim')));
    save('case-activated', 'case-activated', { caseId: CASE_ID });
    return true;
  }

  function syncLegacyCase() {
    if (localStorage.getItem(LEGACY_CASE_KEY) === CASE_ID) seedCase();
    return clone(state);
  }

  function addFact(record) {
    const result = upsert(state.facts, normalizeRecord(record, 'claim'));
    const eventName = result.created ? 'fact-discovered' : 'fact-updated';
    save('fact', eventName, { record: result.current, previous: result.previous });
    return clone(result.current);
  }

  function upsertPerson(record) {
    const result = upsert(state.people, normalizeRecord(record, 'unknown'));
    const becameIdentified = Boolean(result.current?.name) && result.previous?.name !== result.current.name;
    const eventName = becameIdentified ? 'person-identified' : result.created ? 'person-added' : 'person-updated';
    save('person', eventName, { record: result.current, previous: result.previous });
    return clone(result.current);
  }

  function addEvidence(record) {
    const result = upsert(state.evidence, { status: 'found', ...clone(record) });
    const eventName = result.created ? 'evidence-added' : 'evidence-updated';
    save('evidence', eventName, { record: result.current, previous: result.previous });
    return clone(result.current);
  }

  function unlockLocation(record) {
    const prepared = { unlocked: true, visited: false, artReady: false, ...clone(record) };
    const existing = state.locations.find(item => item.id === prepared.id);
    const wasUnlocked = Boolean(existing?.unlocked);
    const result = upsert(state.locations, prepared);
    const eventName = !wasUnlocked && result.current.unlocked ? 'location-unlocked' : result.created ? 'location-added' : 'location-updated';
    save('location', eventName, { record: result.current, previous: result.previous });
    return clone(result.current);
  }

  function markLocationVisited(id) {
    const location = state.locations.find(item => item.id === id);
    if (!location || location.visited) return location ? clone(location) : null;
    location.visited = true;
    save('location-visited', 'location-visited', { record: clone(location) });
    return clone(location);
  }

  function addTimeline(record) {
    const result = upsert(state.timeline, normalizeRecord(record, 'claim'));
    const eventName = result.created ? 'timeline-added' : 'timeline-updated';
    save('timeline', eventName, { record: result.current, previous: result.previous });
    return clone(result.current);
  }

  function setLocationRuntime(id, runtime = {}) {
    const location = state.locations.find(item => item.id === id);
    if (!location) return null;

    const patch = clone(runtime);
    const changed = Object.entries(patch).some(([key, value]) => !Object.is(location[key], value));
    if (!changed) return clone(location);

    const previous = clone(location);
    Object.assign(location, patch);
    save('location-runtime', 'location-updated', { record: clone(location), previous });
    return clone(location);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function reset() {
    state = starterState();
    localStorage.removeItem(STORAGE_KEY);
    save('reset', 'investigation-reset', {});
  }

  syncLegacyCase();

  window.InvestigationState = {
    version: STATE_VERSION,
    statuses: Array.from(KNOWLEDGE_STATUSES),
    get: () => clone(state),
    syncLegacyCase,
    activateFirstCase: seedCase,
    addFact,
    upsertPerson,
    addEvidence,
    unlockLocation,
    markLocationVisited,
    addTimeline,
    setLocationRuntime,
    subscribe,
    reset
  };
})();
