(() => {
  const CASE_ID = 'lyublino-1994';
  const BODY_FACT_ID = 'victim-found-director-office';
  const DESK_LEAD_ID = 'desk-name-vladimir-zhdanov';
  const VICTIM_PERSON_ID = 'victim-unknown';
  const IDENTIFIED_TIMELINE_ID = 'victim-identified-zhdanov';
  const FORENSIC_FACT_ID = 'victim-firearm-injuries-preliminary';
  const FORENSIC_TIMELINE_ID = 'criminalist-preliminary-exam';

  function state() {
    return window.InvestigationState?.syncLegacyCase?.() || window.InvestigationState?.get?.() || null;
  }

  function activeCase() {
    return localStorage.getItem('things-of-the-past-case-active') === CASE_ID;
  }

  function hasFact(id) {
    return Boolean(state()?.facts?.some(item => item.id === id));
  }

  function victim() {
    return state()?.people?.find(item => item.id === VICTIM_PERSON_ID) || null;
  }

  function identityEstablished() {
    const person = victim();
    return person?.status === 'established' && person?.name === 'Владимир Жданов';
  }

  function show(eyebrow, title, text) {
    if (typeof openModal === 'function') openModal(eyebrow, title, text);
  }

  function inspectDeskIdentityLead() {
    if (!activeCase() || !window.InvestigationState) return false;

    if (!hasFact(BODY_FACT_ID)) {
      show(
        'Осмотр',
        'Рабочий стол',
        'На столе много служебных бумаг. Сначала нужно зафиксировать погибшего и понять, к кому относятся документы.'
      );
      return true;
    }

    if (identityEstablished()) {
      show(
        'Осмотр',
        'Рабочие документы',
        'Документы относятся к Владимиру Жданову, директору Люблинского рынка. Личность погибшего уже подтверждена.'
      );
      return true;
    }

    if (hasFact(DESK_LEAD_ID)) {
      show(
        'Зацепка',
        'Имя в рабочем документе',
        'На рабочем документе указано имя «Владимир Жданов» и должность директора рынка. Это ещё не подтверждает, что погибший — именно он. Нужно сверить сведения у сотрудников администрации.'
      );
      return true;
    }

    window.InvestigationState.addFact({
      id: DESK_LEAD_ID,
      title: 'Имя в рабочем документе',
      status: 'claim',
      text: 'На рабочем документе в кабинете указано имя «Владимир Жданов», директор Люблинского рынка. Принадлежность документа погибшему ещё нужно подтвердить.',
      sourceType: 'fiction-bridge',
      sourceNote: 'Игровая связка. Источники подтверждают личность и должность Жданова, но не описывают конкретный документ идентификации.'
    });

    show(
      'Новая зацепка',
      'Имя в рабочем документе',
      'В одной из рабочих бумаг указано: «Владимир Жданов», директор Люблинского рынка. Документ лежал на его рабочем столе, но одной бумаги недостаточно для официального установления личности. Нужно подтверждение сотрудников.'
    );
    return true;
  }

  function confirmIdentityAtDutyWindow() {
    if (!activeCase() || !window.InvestigationState) return false;

    if (!hasFact(BODY_FACT_ID)) {
      show(
        'Администрация',
        'Служебное окно',
        'Сотрудники заняты из-за происшествия. Сначала осмотрите кабинет и зафиксируйте погибшего.'
      );
      return true;
    }

    if (identityEstablished()) {
      show(
        'Администрация',
        'Личность подтверждена',
        'Сотрудники уже подтвердили: погибший — Владимир Жданов, директор Люблинского рынка.'
      );
      return true;
    }

    if (!hasFact(DESK_LEAD_ID)) {
      show(
        'Администрация',
        'Нужно уточнить, о ком речь',
        'Сейчас сотрудники отвечают на десятки вопросов. Сначала найдите в кабинете документ или другую зацепку, по которой можно назвать человека для подтверждения.'
      );
      return true;
    }

    window.InvestigationState.addFact({
      id: DESK_LEAD_ID,
      title: 'Имя в рабочем документе',
      status: 'corroborated',
      text: 'Имя «Владимир Жданов» в рабочем документе подтверждено сотрудниками администрации.',
      sourceType: 'fiction-bridge'
    });

    window.InvestigationState.upsertPerson({
      id: VICTIM_PERSON_ID,
      role: 'Погибший',
      name: 'Владимир Жданов',
      status: 'established',
      occupation: 'Директор Люблинского рынка',
      note: 'Владимир Жданов, директор Люблинского рынка. Личность подтверждена после сверки рабочих документов с сотрудниками администрации.'
    });

    window.InvestigationState.addTimeline({
      id: IDENTIFIED_TIMELINE_ID,
      time: '24 августа 1994, первичный выезд',
      title: 'Установлена личность погибшего',
      status: 'established',
      text: 'Погибший в кабинете установлен как Владимир Жданов, директор Люблинского рынка.'
    });

    show(
      'Личность установлена',
      'Владимир Жданов',
      'Сотрудники администрации подтверждают: кабинет и найденные рабочие документы принадлежат Владимиру Жданову, директору Люблинского рынка. Погибший установлен как Владимир Жданов.'
    );
    patchBoardVictimCard();
    return true;
  }

  function registerPreliminaryForensics() {
    if (!window.InvestigationState || hasFact(FORENSIC_FACT_ID)) return false;

    window.InvestigationState.addFact({
      id: FORENSIC_FACT_ID,
      title: 'Огнестрельные повреждения',
      status: 'established',
      text: 'При первичном осмотре криминалист подтвердил огнестрельный характер повреждений у Владимира Жданова. Точное число, локализация и направление выстрелов пока не зафиксированы в доступном заключении.',
      sourceType: 'scene-examination',
      sourceRefs: ['S3', 'S4'],
      sourceNote: 'Поздние источники описывают конкретные попадания, но игра намеренно не раскрывает их до отдельной фиксации/заключения.'
    });

    window.InvestigationState.addTimeline({
      id: FORENSIC_TIMELINE_ID,
      time: '24 августа 1994, первичный осмотр',
      title: 'Получен предварительный вывод криминалиста',
      status: 'established',
      text: 'Подтверждён огнестрельный характер повреждений. Детальная схема ранений ожидает отдельной фиксации.'
    });

    window.CharacterOverlays?.setVariant?.('director-office-criminalist', 'written');
    return true;
  }

  function talkToCriminalist() {
    if (!activeCase()) return false;

    if (!hasFact(BODY_FACT_ID)) {
      show(
        'Криминалист',
        'Первичный осмотр',
        '«Я пока фиксирую обстановку. Осмотрите погибшего и рабочее место, потом сверим, что у нас есть.»'
      );
      return true;
    }

    if (!hasFact(DESK_LEAD_ID)) {
      show(
        'Криминалист',
        'Личность пока не установлена',
        '«По человеку пока без имени. Посмотрите рабочие бумаги — в таком кабинете должна быть служебная документация.»'
      );
      return true;
    }

    if (!identityEstablished()) {
      show(
        'Криминалист',
        'Нужно подтверждение',
        '«Имя в бумагах — это зацепка, не идентификация. Сверьте его у сотрудников администрации.»'
      );
      return true;
    }

    if (registerPreliminaryForensics()) {
      show(
        'Новый факт',
        'Предварительный осмотр криминалиста',
        '«По первичному осмотру повреждения огнестрельные. Точное число попаданий, их расположение и направление сейчас не фиксируйте как окончательный вывод — сначала закончим схему и оформим заключение.»'
      );
      return true;
    }

    window.CharacterOverlays?.setVariant?.('director-office-criminalist', 'written');
    show(
      'Криминалист',
      'Фиксация продолжается',
      '«Предварительный вывод у вас есть: повреждения огнестрельные. По числу и расположению пока не спешите — это пойдёт отдельным результатом после фиксации.»'
    );
    return true;
  }

  function patchBoardVictimCard() {
    if (!identityEstablished()) return;
    const card = document.querySelector('#boardWallCards [data-card-id="dead-unknown"]');
    if (!card) return;

    const title = card.querySelector('strong');
    const text = card.querySelector('p');
    const status = card.querySelector('small');
    if (title) title.textContent = 'Владимир Жданов';
    if (text) text.textContent = 'Директор Люблинского рынка. Погибший.';
    if (status) status.textContent = 'Личность установлена';
  }

  document.addEventListener('click', event => {
    const hotspot = event.target.closest?.('[data-hotspot-id]');
    if (hotspot && typeof debugHotspots !== 'undefined' && !debugHotspots) {
      const id = hotspot.dataset.hotspotId;
      let handled = false;
      if (id === 'director-office-desk') handled = inspectDeskIdentityLead();
      if (id === 'director-office-duty-window') handled = confirmIdentityAtDutyWindow();
      if (handled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }

    const character = event.target.closest?.('.scene-character[data-character-id="director-office-criminalist"]');
    if (character && !game.classList.contains('is-character-debug')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      talkToCriminalist();
      return;
    }

    const boardVictim = event.target.closest?.('#boardWallCards [data-card-id="dead-unknown"]');
    if (boardVictim && identityEstablished()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      show(
        'Лицо',
        'Владимир Жданов',
        'Владимир Жданов — директор Люблинского рынка. Погибший в служебном кабинете.\n\nСтатус: личность установлена.'
      );
    }
  }, true);

  window.addEventListener('investigation:change', () => requestAnimationFrame(patchBoardVictimCard));

  const boardCards = document.getElementById('boardWallCards');
  if (boardCards) {
    const observer = new MutationObserver(() => requestAnimationFrame(patchBoardVictimCard));
    observer.observe(boardCards, { childList: true });
  }

  requestAnimationFrame(patchBoardVictimCard);
})();
