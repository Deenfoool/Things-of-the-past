(() => {
  const CASE_ID = 'lyublino-1994';
  const ARKHIPOV_PURSUIT_FACT = 'arkhipov-pursuit';
  const ARKHIPOV_DESCRIPTION_FACT = 'arkhipov-suspect-description';
  const TWO_MEN_FACT = 'two-men-reported-market';

  if (!window.DialogueSystem?.register) return;

  window.DialogueSystem.register([
    {
      id: 'arkhipov-hospital',
      speakerId: 'alexey-arkhipov',
      name: 'Алексей Архипов',
      role: 'Раненый · свидетель',
      portrait: 'А',
      sourceType: 'witness-reconstruction',
      intro: 'Архипов пришёл в сознание. Разговор короткий: врач разрешил задать только несколько вопросов. Реплики — игровая реконструкция на основе публично подтверждённых обстоятельств, а не дословная историческая цитата.',
      greeting: '«Да, я помню, что произошло у администрации. Спрашивайте, пока врач не выгнал вас из палаты.»',
      questions: [
        {
          id: 'what-happened-after-shots',
          text: 'Что произошло, когда вы оказались у администрации?',
          response: '«Я увидел человека, который уходил от административной части, и попытался его остановить. Тогда меня ранили выстрелом.»',
          discoveries: {
            fact: {
              id: ARKHIPOV_PURSUIT_FACT,
              title: 'Архипов пытался остановить убегавшего',
              status: 'claim',
              text: 'Алексей Архипов сообщил, что попытался остановить человека, покидавшего административную часть рынка, и в этот момент был ранен выстрелом.',
              sourceType: 'witness-reconstruction',
              sourceRefs: ['S1', 'S2', 'S3', 'S4'],
              sourceNote: 'Публичные источники устойчиво сообщают, что Архипов пытался задержать убегавшего/убегавших и был ранен. Формулировка реплики является игровой реконструкцией.'
            },
            person: {
              id: 'wounded-unknown',
              role: 'Раненый / свидетель',
              name: 'Алексей Архипов',
              status: 'interviewed',
              note: 'Алексей Архипов ранен при попытке остановить человека, покидавшего административную часть. Получены первые показания; точные обстоятельства требуют проверки.'
            },
            timeline: {
              id: 'arkhipov-first-interview',
              time: '24 августа 1994, больница',
              title: 'Получены первые показания Архипова',
              status: 'claim',
              text: 'Архипов сообщил, что попытался остановить человека, уходившего от администрации, и был ранен выстрелом.'
            }
          },
          systemNote: 'Показание Архипова записано как версия свидетеля и требует проверки.'
        },
        {
          id: 'suspect-appearance',
          requiresFact: ARKHIPOV_PURSUIT_FACT,
          text: 'Вы успели рассмотреть этого человека?',
          response: '«Молодой. Волосы тёмные. Одежду помню лучше лица: белый свитер с рисунком и светло-голубые джинсы.»',
          discoveries: {
            fact: {
              id: ARKHIPOV_DESCRIPTION_FACT,
              title: 'Предварительное описание нападавшего',
              status: 'claim',
              text: 'По реконструированному опросу Архипов описывает нападавшего как молодого темноволосого мужчину в белом свитере с рисунком и голубых джинсах. Черты лица остаются недостаточно определёнными.',
              sourceType: 'fiction-bridge-to-published-eyewitness-description',
              sourceRefs: ['S1'],
              sourceNote: 'S1 сообщает, что оперативники по показаниям очевидцев получили приблизительный портрет: молодой брюнет, белый свитер с рисунком, голубые джинсы. Источник не приписывает описание именно Архипову, поэтому реплика — игровая связка.'
            }
          },
          systemNote: 'Описание записано как показание свидетеля. Этого достаточно для предварительного фоторобота, но не для установления личности.'
        },
        {
          id: 'how-many-people',
          requiresFact: ARKHIPOV_PURSUIT_FACT,
          text: 'Сколько человек вы видели?',
          response: '«Про того, кого пытался остановить, я уверен. Насчёт второго сейчас утверждать не буду — там всё произошло слишком быстро.»',
          discoveries: {
            fact: {
              id: 'arkhipov-number-uncertain',
              title: 'Число участников требует проверки',
              status: 'claim',
              text: 'Архипов уверенно говорит только о человеке, которого пытался остановить. Это не исключает второго участника и требует сверки с другими показаниями.',
              sourceType: 'fiction-bridge-for-contradiction',
              sourceRefs: ['S1', 'S2', 'S3', 'S4'],
              sourceNote: 'Связка введена специально, чтобы не смешивать противоречащие публикации о числе людей и их положении.'
            }
          },
          systemNote: 'В материалах отмечено: число участников пока не установлено.'
        },
        {
          id: 'wound-location',
          text: 'Куда именно вас ранило?',
          response: '«Это лучше спросить у врачей. Я не хочу сейчас утверждать то, в чём могу ошибиться.»',
          systemNote: 'Точная локализация и тяжесть ранения не записаны: публичные источники противоречат друг другу.'
        }
      ]
    },
    {
      id: 'market-worker-first',
      speakerId: 'market-worker-composite',
      name: 'Работник рынка',
      role: 'Свидетель',
      portrait: 'Р',
      sourceType: 'composite-witness-reconstruction',
      intro: 'Составной неназванный свидетель рынка. Его реплики используются только для сведений, присутствующих в публичных материалах; это не историческая цитата конкретного человека.',
      greeting: '«Если спрашиваете про административную часть после стрельбы — расскажу только то, что видел сам.»',
      questions: [
        {
          id: 'two-men-near-administration',
          requiresFact: ARKHIPOV_PURSUIT_FACT,
          text: 'После стрельбы вы видели людей у администрации?',
          response: '«Видел двух мужчин, которые быстро покидали административную часть. Больше уверенно сказать не могу.»',
          discoveries: {
            fact: {
              id: TWO_MEN_FACT,
              title: 'Сообщение о двух мужчинах',
              status: 'claim',
              text: 'Работник рынка сообщил, что после стрельбы видел двух мужчин, быстро покидавших административную часть. Показание требует проверки.',
              sourceType: 'composite-witness-reconstruction',
              sourceRefs: ['S1', 'S3', 'S4'],
              sourceNote: 'Публичные материалы указывают на двух мужчин, но не называют этого конкретного NPC свидетелем. Персонаж является составной игровой реконструкцией.'
            },
            timeline: {
              id: 'market-worker-two-men-claim',
              time: '24 августа 1994, повторный опрос на рынке',
              title: 'Получено сообщение о двух мужчинах',
              status: 'claim',
              text: 'Неназванный работник рынка сообщил о двух мужчинах у административной части после стрельбы.'
            }
          },
          systemNote: 'Показание занесено как неподтверждённая версия свидетеля.'
        },
        {
          id: 'both-left-office',
          requiresFact: TWO_MEN_FACT,
          text: 'Вы видели, что оба вышли именно из кабинета?',
          response: '«Нет. Я видел их у административной части уже после шума. Кто именно входил в кабинет, утверждать не буду.»',
          systemNote: 'Это показание не устанавливает, сколько человек находилось непосредственно в кабинете.'
        }
      ]
    }
  ]);

  function activeCase() {
    return localStorage.getItem('things-of-the-past-case-active') === CASE_ID;
  }

  function hasFact(id) {
    const state = window.InvestigationState?.get?.();
    return Boolean(state?.facts?.some(item => item.id === id));
  }

  function syncWorkerPose() {
    if (!activeCase() || !window.CharacterOverlays) return;
    if (hasFact(TWO_MEN_FACT)) {
      window.CharacterOverlays.setVariant?.('market-side-worker', 'look-away');
    } else if (hasFact(ARKHIPOV_PURSUIT_FACT)) {
      window.CharacterOverlays.setVariant?.('market-side-worker', 'shrug-unknown');
    }
  }

  window.addEventListener('investigation:change', syncWorkerPose);
  requestAnimationFrame(syncWorkerPose);
})();
