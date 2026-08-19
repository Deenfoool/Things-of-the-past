(() => {
  const STORAGE_KEY = 'things-of-the-past-investigation-state-v1';
  const LEGACY_CASE_KEY = 'things-of-the-past-case-active';
  const CASE_ID = 'lyublino-1994';

  const starterState = () => ({
    version: 1,
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

  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : starterState();
    } catch {
      return starterState();
    }
  }

  function save(reason = 'update') {
    state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const snapshot = clone(state);
    listeners.forEach(listener => listener(snapshot, reason));
    window.dispatchEvent(new CustomEvent('investigation:change', { detail: { state: snapshot, reason } }));
  }

  function upsert(collection, record) {
    const index = collection.findIndex(item => item.id === record.id);
    if (index === -1) collection.push(clone(record));
    else collection[index] = { ...collection[index], ...clone(record) };
  }

  function seedCase() {
    if (state.activeCaseId === CASE_ID) return false;
    state = starterState();
    state.activeCaseId = CASE_ID;
    starterCaseData.facts.forEach(item => upsert(state.facts, item));
    starterCaseData.people.forEach(item => upsert(state.people, item));
    starterCaseData.locations.forEach(item => upsert(state.locations, item));
    starterCaseData.timeline.forEach(item => upsert(state.timeline, item));
    save('case-activated');
    return true;
  }

  function syncLegacyCase() {
    if (localStorage.getItem(LEGACY_CASE_KEY) === CASE_ID) seedCase();
    return clone(state);
  }

  function addFact(record) {
    upsert(state.facts, record);
    save('fact');
  }

  function upsertPerson(record) {
    upsert(state.people, record);
    save('person');
  }

  function addEvidence(record) {
    upsert(state.evidence, { status: 'found', ...record });
    save('evidence');
  }

  function unlockLocation(record) {
    upsert(state.locations, { unlocked: true, visited: false, artReady: false, ...record });
    save('location');
  }

  function markLocationVisited(id) {
    const location = state.locations.find(item => item.id === id);
    if (!location) return;
    location.visited = true;
    save('location-visited');
  }

  function addTimeline(record) {
    upsert(state.timeline, record);
    save('timeline');
  }

  function setLocationRuntime(id, runtime = {}) {
    const location = state.locations.find(item => item.id === id);
    if (!location) return;
    Object.assign(location, runtime);
    save('location-runtime');
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function reset() {
    state = starterState();
    localStorage.removeItem(STORAGE_KEY);
    save('reset');
  }

  syncLegacyCase();

  window.InvestigationState = {
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
