(function () {
  const questionList = document.querySelector('[data-survey-question-list]');
  const questionCount = document.querySelector('[data-survey-question-count]');
  const createButton = document.querySelector('[data-survey-question-create]');
  const emptyMessage = document.querySelector('[data-survey-question-empty]');
  const sourceQuestion = questionList?.querySelector('[data-survey-question-item]');

  if (!questionList || !questionCount || !sourceQuestion) return;

  // 수정모드 진입 : ?mode=modify 파라미터 붙으면 수정 화면으로 동작합니다.
  const isModifyMode = new URLSearchParams(window.location.search).get('mode') === 'modify';

  // 질문 1 영역을 원본으로 복제해서 마크업 보관
  const questionMarkup = sourceQuestion.innerHTML;

  /**
   * 질문 번호 치환
   */
  const setQuestionIndex = (markup, index) => {
    return markup
      .replace(/surveyQuestion(Type)?1/g, (match, type) => `surveyQuestion${type || ''}${index}`)
      .replace(/질문 1/g, `질문 ${index}`);
  };

  /**
   * 질문유형 선택값 기준 보기 입력 행 노출 이벤트 연결
   */
  const bindQuestionType = (question) => {
    const typeField = question.querySelector('[data-survey-question-type]');
    const optionRows = question.querySelectorAll('[data-survey-question-option]');

    if (!typeField) return;

    const render = () => {
      optionRows.forEach((row) => {
        row.hidden = row.dataset.surveyQuestionOption !== typeField.value;
      });
    };

    typeField.addEventListener('change', render);
    render();
  };

  /**
   * 질문 영역 생성
   */
  const createQuestion = (index) => {
    const question = sourceQuestion.cloneNode(false);

    question.innerHTML = setQuestionIndex(questionMarkup, index);
    bindQuestionType(question);
    return question;
  };

  /**
   * 문항수 기준 질문 영역 생성 및 노출
   */
  const renderQuestions = (count) => {
    const questions = Array.from(questionList.querySelectorAll('[data-survey-question-item]'));

    // 복제 원본은 남겨 두고 초과한 영역만 제거
    questions.slice(Math.max(count, 1)).forEach((question) => {
      question.remove();
    });

    for (let index = questions.length; index < count; index += 1) {
      questionList.appendChild(createQuestion(index + 1));
    }

    questionList.querySelectorAll('[data-survey-question-item]').forEach((question, index) => {
      question.hidden = index >= count;
    });

    if (emptyMessage) {
      emptyMessage.hidden = count > 0;
    }
  };

  /**
   * 등록 · 수정 화면별 영역 노출
   */
  const renderMode = () => {
    document.querySelectorAll('[data-survey-mode]').forEach((element) => {
      element.hidden = element.dataset.surveyMode !== (isModifyMode ? 'modify' : 'write');
    });
  };

  renderMode();
  bindQuestionType(sourceQuestion);

  if (isModifyMode) {
    // 수정 화면은 생성하기 버튼 없이 저장된 문항수만큼 바로 노출
    questionCount.addEventListener('change', () => {
      renderQuestions(Number(questionCount.value));
    });

    renderQuestions(Number(questionCount.value));
    return;
  }

  createButton?.addEventListener('click', () => {
    renderQuestions(Number(questionCount.value));

    if (!questionCount.value) questionCount.focus();
  });
})();
