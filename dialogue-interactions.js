(() => {
  const ASKED_KEY = 'things-of-the-past-dialogue-asked-v1';

  const dialogues = {
    'market-worker-first': {
      id: 'market-worker-first',
      speakerId: 'market-worker-unknown',
      name: 'Работник рынка',
      role: 'Свидетель',
      portrait: 'Р',
      intro: 'Мужчина держится у закрытой торговой точки и старается не смотреть в сторону администрации.',
      greeting: 'Я работаю тут рядом. Самого момента не видел, но шум был такой, что все сразу притихли.',
      questions: [
        {
          id: 'heard-shots',
          text: 'Что вы слышали перед тем, как приехала милиция?',
          response: 'Сначала несколько резких хлопков со стороны администрации. Потом крики, люди побежали к выходу. Я не полез туда, только видел, как народ расступался.',
          discoveries: {
            fact: {
              id: 'worker-heard-shots-admin-side',
              title: 'Свидетель слышал хлопки со стороны администрации',
              status: 'claim',
              text: 'Работник рынка утверждает, что слышал несколько резких хлопков со стороны административной части, после чего началась паника.'
            },
            person: {
              id: 'market-worker-unknown',
              role: 'Свидетель',
              name: null,
              status: 'interviewed',
              note: 'Работник боковой торговой зоны. Слышал хлопки со стороны администрации, но стрелявшего не видел.'
            },
            timeline: {
              id: 'worker-heard-shots',
              time: '24 августа 1994, до приезда милиции',
              title: 'Свидетель слышит хлопки',
              status: 'claim',
              text: 'Показание работника: хлопки прозвучали со стороны административной части рынка.'
            }
          }
        },
        {
          id: 'saw-suspect',
          text: 'Вы видели, кто выбегал от администрации?',
          response: 'Нет, лиц не видел. Только движение у прохода и как несколько человек резко уходили в сторону двора. Я не уверен, были ли они связаны со стрельбой.',
          discoveries: {
            fact: {
              id: 'worker-saw-movement-yard',
              title: 'Свидетель видел движение к двору',
              status: 'claim',
              text: 'Работник рынка сообщает о движении у прохода к двору после хлопков, но не может уверенно связать этих людей со стрельбой.'
            }
          }
        },
        {
          id: 'about-office',
          requiresFact: 'victim-found-director-office',
          text: 'Кто обычно находился в кабинете администрации?',
          response: 'Туда без дела не ходили. Бумаги, вопросы аренды, директорские разговоры. Кто именно был внутри сегодня, я не видел.',
          discoveries: {
            fact: {
              id: 'admin-office-controlled-access',
              title: 'Кабинет администрации не был проходным местом',
              status: 'claim',
              text: 'По словам работника рынка, в административный кабинет обычно не заходили без дела; кто был внутри в момент стрельбы, он не видел.'
            }
          }
        }
      ]
    }
  };

  const panel = document.createElement('section');
  panel.className = 'dialogue-ui';
  panel.id = 'dialogueUi';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <button class="dialogue-ui__backdrop" type="button" aria-label="Закрыть разговор"></button>
    <div class="dialogue-ui__panel" role="dialog" aria-modal="true" aria-labelledby="dialogueTitle">
      <aside class="dialogue-ui__person">
        <div class="dialogue-ui__portrait" id="dialoguePortrait" aria-hidden="true"></div>
        <div>
          <span id="dialogueRole"></span>
          <strong id="dialogueName"></strong>
          <p id="dialogueIntro"></p>
        </div>
      </aside>
      <section class="dialogue-ui__main">
        <header class="dialogue-ui__header">
          <div><span>Разговор</span><h2 id="dialogueTitle">Показания</h2></div>
          <button class="dialogue-ui__close" type="button" aria-label="Закрыть">×</button>
        </header>
        <div class="dialogue-ui__log" id="dialogueLog"></div>
        <div class="dialogue-ui__choices" id="dialogueChoices"></div>
      </section>
    </div>
  `;

  game.appendChild(panel);

  const portrait = panel.querySelector('#dialoguePortrait');
  const role = panel.querySelector('#dialogueRole');
  const name = panel.querySelector('#dialogueName');
  const intro = panel.querySelector('#dialogueIntro');
  const log = panel.querySelector('#dialogueLog');
  const choices = panel.querySelector('#dialogueChoices');
  const closeButton = panel.querySelector('.dialogue-ui__close');
  const backdrop = panel.querySelector('.dialogue-ui__backdrop');

  let activeDialogue = null;
  let transcript = [];

  function readAsked() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ASKED_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveAsked(value) {
    localStorage.setItem(ASKED_KEY, JSON.stringify(value));
  }

  function hasFact(id) {
    if (!id) return true;
    const state = window.InvestigationState?.syncLegacyCase?.() || window.InvestigationState?.get?.();
    return Boolean(state?.facts?.some(fact => fact.id === id));
  }

  function askedSet(dialogueId) {
    const asked = readAsked();
    return new Set(asked[dialogueId] || []);
  }

  function markAsked(dialogueId, questionId) {
    const asked = readAsked();
    const ids = new Set(asked[dialogueId] || []);
    ids.add(questionId);
    asked[dialogueId] = Array.from(ids);
    saveAsked(asked);
  }

  function open(dialogueId) {
    if (typeof debugHotspots !== 'undefined' && debugHotspots) return;
    const dialogue = dialogues[dialogueId];
    if (!dialogue) return;

    activeDialogue = dialogue;
    transcript = [{ kind: 'npc', text: dialogue.greeting }];
    portrait.textContent = dialogue.portrait || '?';
    role.textContent = dialogue.role;
    name.textContent = dialogue.name;
    intro.textContent = dialogue.intro;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    render();
    closeButton.focus();
  }

  function close() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    activeDialogue = null;
    transcript = [];
  }

  function render() {
    if (!activeDialogue) return;
    const asked = askedSet(activeDialogue.id);
    log.innerHTML = transcript.map(line => `<div class="dialogue-ui__line is-${line.kind}">${escapeHtml(line.text)}</div>`).join('');
    log.scrollTop = log.scrollHeight;

    const available = activeDialogue.questions.filter(question => hasFact(question.requiresFact));
    choices.innerHTML = available.length
      ? available.map(question => `<button class="dialogue-ui__choice ${asked.has(question.id) ? 'is-asked' : ''}" type="button" data-dialogue-question="${question.id}">${escapeHtml(question.text)}</button>`).join('')
      : '<div class="dialogue-ui__empty">Сейчас больше не о чем спросить.</div>';

    choices.querySelectorAll('[data-dialogue-question]').forEach(button => {
      button.addEventListener('click', () => askQuestion(button.dataset.dialogueQuestion));
    });
  }

  function askQuestion(questionId) {
    const question = activeDialogue?.questions.find(item => item.id === questionId);
    if (!question) return;

    transcript.push({ kind: 'player', text: question.text });
    transcript.push({ kind: 'npc', text: question.response });
    markAsked(activeDialogue.id, question.id);
    applyDiscoveries(question.discoveries || {});
    render();
  }

  function applyDiscoveries(discoveries) {
    if (!window.InvestigationState) return;
    window.InvestigationState.syncLegacyCase?.();
    if (discoveries.fact) window.InvestigationState.addFact(discoveries.fact);
    if (discoveries.person) window.InvestigationState.upsertPerson(discoveries.person);
    if (discoveries.evidence) window.InvestigationState.addEvidence(discoveries.evidence);
    if (discoveries.location) window.InvestigationState.unlockLocation(discoveries.location);
    if (discoveries.timeline) window.InvestigationState.addTimeline(discoveries.timeline);
    transcript.push({ kind: 'system', text: 'Сведения добавлены в материалы дела.' });
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  closeButton.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('is-open')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }
  }, true);

  window.DialogueSystem = { open };
})();
