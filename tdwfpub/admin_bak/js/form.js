(() => {
  /**
   * 파일 크기 표시
   */
  const formatFileSize = (size) => {
    if (size >= 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(1)}MB`;
    }
    if (size >= 1024) {
      return `${Math.ceil(size / 1024)}KB`;
    }
    return `${size}B`;
  };

  /**
   * 첨부파일 컴포넌트 내부 요소 조회
   */
  const getFileUploadElements = (fileUpload) => {
    const getElement = (name) => fileUpload.querySelector(`[data-file-${name}]`);

    return {
      input: getElement('input'),
      select: getElement('select'),
      list: getElement('list'),
      deleteButton: getElement('delete'),
      summary: getElement('summary'),
      actions: getElement('actions'),
    };
  };

  /**
   * 실제 파일 입력값 갱신
   */
  const syncFileInput = (input, selectedFiles) => {
    const dataTransfer = new DataTransfer();

    selectedFiles.forEach((file) => {
      dataTransfer.items.add(file);
    });

    input.files = dataTransfer.files;
  };

  /**
   * 첨부파일 행 생성
   */
  const createFileRow = (file, index) => {
    const row = document.createElement('tr');
    const checkCell = document.createElement('td');
    const checkLabel = document.createElement('label');
    const checkbox = document.createElement('input');
    const checkText = document.createElement('span');
    const nameCell = document.createElement('td');
    const sizeCell = document.createElement('td');
    const statusCell = document.createElement('td');

    checkLabel.className = 'check-label';
    checkbox.type = 'checkbox';
    checkbox.dataset.fileCheck = '';
    checkbox.value = index;
    checkbox.setAttribute('aria-label', `${file.name} 선택`);
    checkText.className = 'check-label-text';
    nameCell.className = 'board-file-name-cell';
    nameCell.title = file.name;
    nameCell.textContent = file.name;
    sizeCell.textContent = formatFileSize(file.size);
    statusCell.className = 'board-file-status is-waiting';
    statusCell.textContent = '대기';
    // 업로드 상태별 문구: 업로드중, 완료, 실패

    checkLabel.append(checkbox, checkText);
    checkCell.appendChild(checkLabel);
    row.append(checkCell, nameCell, sizeCell, statusCell);
    return row;
  };

  /**
   * 첨부파일 목록 렌더링
   */
  const renderFileList = (upload, selectedFiles) => {
    upload.list.innerHTML = '';

    const totalSize = selectedFiles.reduce((sum, file) => {
      return sum + file.size;
    }, 0);

    if (upload.summary) {
      upload.summary.textContent = `${selectedFiles.length}개의 파일 (${formatFileSize(totalSize)})`;
      upload.summary.hidden = !selectedFiles.length;
    }

    if (upload.actions) {
      upload.actions.hidden = !selectedFiles.length;
    }

    if (!selectedFiles.length) {
      upload.list.innerHTML = '<tr class="board-file-empty-row"><td colspan="4">선택된 파일이 없습니다.</td></tr>';
      return;
    }

    selectedFiles.forEach((file, index) => {
      upload.list.appendChild(createFileRow(file, index));
    });
  };

  /**
   * 첨부파일 컴포넌트 이벤트 연결
   */
  const bindFileUpload = (fileUpload) => {
    const upload = getFileUploadElements(fileUpload);
    let selectedFiles = [];

    if (!upload.input || !upload.select || !upload.list || !upload.deleteButton) return;

    fileUpload.dataset.fileUploadBound = 'true';

    upload.select.addEventListener('click', () => {
      upload.input.click();
    });

    upload.input.addEventListener('change', () => {
      selectedFiles = selectedFiles.concat(Array.from(upload.input.files));
      syncFileInput(upload.input, selectedFiles);
      renderFileList(upload, selectedFiles);
    });

    upload.deleteButton.addEventListener('click', () => {
      const checkedIndexes = Array.from(upload.list.querySelectorAll('[data-file-check]:checked')).map((checkbox) => {
        return Number(checkbox.value);
      });

      selectedFiles = selectedFiles.filter((file, index) => {
        return !checkedIndexes.includes(index);
      });
      syncFileInput(upload.input, selectedFiles);
      renderFileList(upload, selectedFiles);
    });
  };

  /**
   * 첨부파일 컴포넌트 목록 이벤트 연결
   */
  const bindFileUploads = () => {
    const fileUploads = document.querySelectorAll('[data-file-upload]:not([data-file-upload-bound])');

    fileUploads.forEach(bindFileUpload);
  };

  /**
   * 라디오 선택값 기준 연결 필드 상태 갱신
   */
  const updateDependentField = (control) => {
    const target = document.querySelector(`[data-dependent-target="${control.dataset.dependentControl}"]`);
    const checked = control.querySelector('input[type="radio"]:checked');
    const enabledValue = control.dataset.dependentEnabledValue || 'true';

    if (!target || !checked) return;

    target.disabled = checked.value !== enabledValue;
  };

  /**
   * 라디오 선택값 기준 연결 필드 이벤트 연결
   */
  const bindDependentFields = () => {
    const controls = document.querySelectorAll('[data-dependent-control]:not([data-dependent-control-bound])');

    controls.forEach((control) => {
      control.dataset.dependentControlBound = 'true';
      control.addEventListener('change', () => updateDependentField(control));
      updateDependentField(control);
    });
  };

  /**
   * 이메일 도메인 선택값 기준 입력 필드 상태 갱신
   */
  const updateEmailDomainField = (control) => {
    const target = document.getElementById(control.dataset.emailDomainControl);
    const directValue = control.dataset.emailDomainDirectValue || 'direct';
    const isDirectInput = control.value === directValue;

    if (!target) return;

    target.readOnly = !isDirectInput;
    target.value = isDirectInput ? '' : control.value;

    if (isDirectInput) target.focus();
  };

  /**
   * 이메일 도메인 선택 이벤트 연결
   */
  const bindEmailDomainFields = () => {
    const controls = document.querySelectorAll(
      '[data-email-domain-control]:not([data-email-domain-control-bound])',
    );

    controls.forEach((control) => {
      control.dataset.emailDomainControlBound = 'true';
      control.addEventListener('change', () => updateEmailDomainField(control));
      updateEmailDomainField(control);
    });
  };

  /**
   * 날짜 선택 컴포넌트 이벤트 연결
   */
  const bindDatepickers = () => {
    const datepickers = document.querySelectorAll('[data-datepicker-wrap]:not([data-datepicker-bound])');

    if (!window.flatpickr) return;

    datepickers.forEach((datepicker) => {
      const input = datepicker.querySelector('[data-datepicker-input]');
      const toggleButtons = datepicker.querySelectorAll('[data-datepicker-toggle]');

      if (!input) return;

      datepicker.dataset.datepickerBound = 'true';

      toggleButtons.forEach((button) => {
        button.disabled = input.disabled;
      });

      if (input.disabled) return;

      const instance = window.flatpickr(datepicker, {
        allowInput: true,
        dateFormat: input.dataset.datepickerFormat || 'Y-m-d',
        disableMobile: true,
        locale: window.flatpickr.l10ns && window.flatpickr.l10ns.ko ? window.flatpickr.l10ns.ko : undefined,
        static: true,
        wrap: true,
      });

      datepicker._adminDatepicker = instance;
    });
  };

  /**
   * 날짜 선택 값 초기화 이벤트 연결
   */
  const bindDatepickerClear = () => {
    const clearButtons = document.querySelectorAll('[data-datepicker-clear]:not([data-datepicker-clear-bound])');

    clearButtons.forEach((button) => {
      button.dataset.datepickerClearBound = 'true';
      button.addEventListener('click', () => {
        const dateRange = button.closest('.board-search-date-range');

        if (!dateRange) return;

        dateRange.querySelectorAll('[data-datepicker-wrap]').forEach((datepicker) => {
          const input = datepicker.querySelector('[data-datepicker-input]');

          if (!input || input.disabled) return;

          if (datepicker._adminDatepicker) {
            datepicker._adminDatepicker.clear();
            return;
          }

          input.value = '';
        });
      });
    });
  };

  /**
   * 날짜 선택 오늘 값 설정 이벤트 연결
   */
  const bindDatepickerToday = () => {
    const todayButtons = document.querySelectorAll('[data-datepicker-today]:not([data-datepicker-today-bound])');

    todayButtons.forEach((button) => {
      button.dataset.datepickerTodayBound = 'true';
      button.addEventListener('click', () => {
        const dateRange = button.closest('.board-search-date-range');
        const datepicker = dateRange ? dateRange.querySelector('[data-datepicker-wrap]') : null;
        const input = datepicker ? datepicker.querySelector('[data-datepicker-input]') : null;

        if (!datepicker || !input || input.disabled) return;

        if (datepicker._adminDatepicker) {
          datepicker._adminDatepicker.setDate(new Date(), true);
          return;
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');

        input.value = `${year}-${month}-${date}`;
      });
    });
  };

  /**
   * 목록 체크박스 전체 선택 이벤트 연결
   */
  const bindCheckAll = () => {
    const checkGroups = document.querySelectorAll('[data-check-group]:not([data-check-group-bound])');

    checkGroups.forEach((checkGroup) => {
      const checkAll = checkGroup.querySelector('[data-check-all]');
      const checkItems = Array.from(checkGroup.querySelectorAll('[data-check-item]'));

      if (!checkAll || !checkItems.length) return;

      const getEnabledItems = () => checkItems.filter((checkItem) => !checkItem.disabled);
      const syncCheckAll = () => {
        const enabledItems = getEnabledItems();
        const checkedCount = enabledItems.filter((checkItem) => checkItem.checked).length;

        checkAll.checked = enabledItems.length > 0 && checkedCount === enabledItems.length;
        checkAll.indeterminate = checkedCount > 0 && checkedCount < enabledItems.length;
      };

      checkGroup.dataset.checkGroupBound = 'true';
      checkAll.addEventListener('change', () => {
        getEnabledItems().forEach((checkItem) => {
          checkItem.checked = checkAll.checked;
        });
        checkAll.indeterminate = false;
      });

      checkItems.forEach((checkItem) => {
        checkItem.addEventListener('change', syncCheckAll);
      });

      syncCheckAll();
    });
  };

  /**
   * 하단 상세 패널 표시
   */
  const bindDetailPanels = () => {
    const openButtons = document.querySelectorAll('[data-detail-open]:not([data-detail-open-bound])');

    openButtons.forEach((button) => {
      const targetId = button.getAttribute('aria-controls');
      const detailPanel = targetId ? document.getElementById(targetId) : null;

      if (!detailPanel) return;

      button.dataset.detailOpenBound = 'true';
      button.addEventListener('click', () => {
        const content = detailPanel.closest('[data-content]');
        const targetButtons = Array.from(document.querySelectorAll('[data-detail-open]')).filter((openButton) => {
          return openButton.getAttribute('aria-controls') === targetId;
        });

        detailPanel.hidden = false;
        targetButtons.forEach((openButton) => openButton.setAttribute('aria-expanded', 'false'));
        button.setAttribute('aria-expanded', 'true');

        const autofocusTarget = detailPanel.querySelector('[autofocus]:not(:disabled)');
        if (autofocusTarget) autofocusTarget.focus({preventScroll: true});

        if (!content) return;

        const targetTop = detailPanel.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop;
        content.scrollTo({top: Math.max(targetTop - 24, 0), behavior: 'smooth'});
      });
    });
  };

  /**
   * 관리자 폼 인터랙션 초기화
   */
  const initAdminForm = () => {
    bindFileUploads();
    bindDependentFields();
    bindEmailDomainFields();
    bindDatepickers();
    bindDatepickerClear();
    bindDatepickerToday();
    bindCheckAll();
    bindDetailPanels();
  };

  window.initAdminForm = initAdminForm;
})();
