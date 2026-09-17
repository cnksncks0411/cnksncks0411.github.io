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

      // 비활성화
      const isLocked = input.disabled || input.readOnly;

      toggleButtons.forEach((button) => {
        button.disabled = isLocked;
      });

      if (isLocked) return;

      const instance = window.flatpickr(datepicker, {
        allowInput: true,
        dateFormat: input.dataset.datepickerFormat || 'Y-m-d',
        disableMobile: true,
        locale: window.flatpickr.l10ns && window.flatpickr.l10ns.ko ? window.flatpickr.l10ns.ko : undefined,
        // 달력이 열리는 위치. data-datepicker-position="auto right" 형태로 개별 지정합니다.
        position: input.dataset.datepickerPosition || 'auto left',
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
        targetButtons.forEach((openButton) => {
          openButton.setAttribute('aria-expanded', 'false');
          openButton.classList.remove('active');
        });
        button.setAttribute('aria-expanded', 'true');
        button.classList.add('active');

        const autofocusTarget = detailPanel.querySelector('[autofocus]:not(:disabled)');
        if (autofocusTarget) autofocusTarget.focus({preventScroll: true});

        if (!content) return;

        const targetTop = detailPanel.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop;
        content.scrollTo({top: Math.max(targetTop - 24, 0), behavior: 'smooth'});
      });

      if (button.matches('tr[role="button"]')) {
        button.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;

          event.preventDefault();
          button.click();
        });
      }
    });
  };

  /**
   * 체크 상태 기준 연결 영역 노출 이벤트 연결
   */
  const bindCheckToggles = () => {
    const controls = document.querySelectorAll('[data-check-toggle]:not([data-check-toggle-bound])');

    controls.forEach((control) => {
      const target = document.getElementById(control.dataset.checkToggle);

      if (!target) return;

      const render = () => {
        target.hidden = !control.checked;
      };

      control.dataset.checkToggleBound = 'true';
      control.addEventListener('change', render);
      render();
    });
  };

  /**
   * 체크 상태 기준 연결 입력창 활성화 이벤트 연결
   */
  const bindCheckEnables = () => {
    const controls = document.querySelectorAll('[data-check-enable]:not([data-check-enable-bound])');

    controls.forEach((control) => {
      const target = document.getElementById(control.dataset.checkEnable);

      if (!target) return;

      const render = () => {
        target.disabled = !control.checked;

        // 체크 해제 시 입력값도 함께 비웁니다.
        if (!control.checked) target.value = '';
      };

      control.dataset.checkEnableBound = 'true';
      control.addEventListener('change', render);
      render();
    });
  };

  /**
   * 반복 영역 템플릿의 __SEQ__ 자리를 문서에 없는 번호로 치환
   */
  const REPEAT_SEQ_TOKEN = '__SEQ__';
  let repeatSeq = 0;

  const fillRepeatSeq = (markup) => {
    const sample = markup.match(/id="([^"]*__SEQ__[^"]*)"/);

    do {
      repeatSeq += 1;
    } while (sample && document.getElementById(sample[1].replace(REPEAT_SEQ_TOKEN, repeatSeq)));

    return markup.split(REPEAT_SEQ_TOKEN).join(repeatSeq);
  };

  /**
   * 반복 영역 추가 이벤트 연결
   * data-repeat-add 에 템플릿 id, data-repeat-target 에 추가될 영역 id를 지정합니다.
   */
  const bindRepeatAdds = () => {
    const buttons = document.querySelectorAll('[data-repeat-add]:not([data-repeat-add-bound])');

    buttons.forEach((button) => {
      const template = document.getElementById(button.dataset.repeatAdd);
      const target = document.getElementById(button.dataset.repeatTarget);

      if (!template || !target) return;

      button.dataset.repeatAddBound = 'true';
      button.addEventListener('click', () => {
        target.insertAdjacentHTML('beforeend', fillRepeatSeq(template.innerHTML));

        // 새로 추가된 영역의 인터랙션을 다시 연결합니다.
        initAdminForm();
      });
    });
  };

  /**
   * 반복 영역 삭제 이벤트 연결
   * 버튼이 속한 data-repeat-item 영역을 제거합니다.
   */
  const bindRepeatRemoves = () => {
    const buttons = document.querySelectorAll('[data-repeat-remove]:not([data-repeat-remove-bound])');

    buttons.forEach((button) => {
      button.dataset.repeatRemoveBound = 'true';
      button.addEventListener('click', () => {
        button.closest('[data-repeat-item]')?.remove();
      });
    });
  };

  /**
   * 사용 여부 체크 기준 연결 영역 잠금 이벤트 연결
   * data-lock-target 에 잠글 영역 id 를 지정합니다.
   * 체크 해제 시 대상 영역의 입력 요소를 모두 선택불가 상태로 변경합니다.
   */
  const bindLockToggles = () => {
    const controls = document.querySelectorAll('[data-lock-target]:not([data-lock-target-bound])');

    controls.forEach((control) => {
      const target = document.getElementById(control.dataset.lockTarget);

      if (!target) return;

      const render = () => {
        target.querySelectorAll('input, select, textarea, button').forEach((field) => {
          // 잠금 여부를 결정하는 체크박스 자신은 제외합니다.
          if (field === control) return;

          field.disabled = !control.checked;
        });
      };

      control.dataset.lockTargetBound = 'true';
      control.addEventListener('change', render);
      render();
    });
  };

  /**
   * 목록 전체 선택 / 해제 버튼 이벤트 연결
   * data-check-bulk 에 대상 영역 id, data-check-bulk-value 에 true(선택) / false(해제) 를 지정하고
   * 대상 체크박스에는 data-check-bulk-item 을 붙입니다.
   */
  const bindCheckBulks = () => {
    const buttons = document.querySelectorAll('[data-check-bulk]:not([data-check-bulk-bound])');

    buttons.forEach((button) => {
      const target = document.getElementById(button.dataset.checkBulk);

      if (!target) return;

      button.dataset.checkBulkBound = 'true';
      button.addEventListener('click', () => {
        const isChecked = button.dataset.checkBulkValue !== 'false';

        target.querySelectorAll('[data-check-bulk-item]:not(:disabled)').forEach((checkbox) => {
          checkbox.checked = isChecked;
        });
      });
    });
  };

  /**
   * 목록 선택 시 연결 영역 표출 이벤트 연결
   * data-area-group 안에서 data-area-select 버튼을 누르면
   * 해당 id 의 data-area-panel 만 표시합니다.
   */
  const bindAreaSelects = () => {
    const buttons = document.querySelectorAll('[data-area-select]:not([data-area-select-bound])');

    buttons.forEach((button) => {
      const group = button.closest('[data-area-group]');

      if (!group) return;

      button.dataset.areaSelectBound = 'true';
      button.addEventListener('click', () => {
        group.querySelectorAll('[data-area-select]').forEach((item) => {
          item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
        });

        group.querySelectorAll('[data-area-panel]').forEach((panel) => {
          panel.hidden = panel.id !== button.dataset.areaSelect;
        });
      });
    });
  };

  /**
   * 선택값 기준 연결 셀렉트 활성화 이벤트 연결
   * 상위 셀렉트가 미선택 상태이면 하위 셀렉트를 비활성화합니다.
   */
  const bindSelectEnables = () => {
    const controls = document.querySelectorAll('[data-select-enable]:not([data-select-enable-bound])');

    controls.forEach((control) => {
      const target = document.getElementById(control.dataset.selectEnable);

      if (!target) return;

      const render = () => {
        target.disabled = !control.value;

        // 상위 셀렉트가 미선택으로 돌아가면 하위 선택값도 초기화합니다.
        if (!control.value) target.selectedIndex = 0;
      };

      control.dataset.selectEnableBound = 'true';
      control.addEventListener('change', render);
      render();
    });
  };

  /**
   * 선택값 기준 연결 영역 노출 이벤트 연결
   */
  const bindSelectToggles = () => {
    const controls = document.querySelectorAll('[data-select-toggle]:not([data-select-toggle-bound])');

    controls.forEach((control) => {
      const target = document.getElementById(control.dataset.selectToggle);
      const shownValue = control.dataset.selectToggleValue || 'direct';

      if (!target) return;

      const render = () => {
        target.hidden = control.value !== shownValue;
      };

      control.dataset.selectToggleBound = 'true';
      control.addEventListener('change', render);
      render();
    });
  };

  /**
   * 키워드 입력 자동완성 목록 연결
   */
  const bindSuggestFields = () => {
    const suggests = document.querySelectorAll('[data-suggest]:not([data-suggest-bound])');

    suggests.forEach((suggest) => {
      const input = suggest.querySelector('[data-suggest-input]');
      const list = suggest.querySelector('[data-suggest-list]');

      if (!input || !list) return;

      const items = Array.from(list.querySelectorAll('[data-suggest-item]'));
      const empty = list.querySelector('[data-suggest-empty]');

      suggest.dataset.suggestBound = 'true';

      const closeList = () => {
        list.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        items.forEach((item) => item.classList.remove('active'));
      };

      const selectItem = (item) => {
        input.value = item.textContent.trim();
        closeList();
        input.focus();
      };

      const moveActive = (step) => {
        const visible = items.filter((item) => !item.hidden);

        if (!visible.length) return;

        const current = visible.findIndex((item) => item.classList.contains('active'));
        const next = (current + step + visible.length) % visible.length;

        visible.forEach((item) => item.classList.remove('active'));
        visible[next].classList.add('active');
        visible[next].scrollIntoView({block: 'nearest'});
      };

      input.addEventListener('input', () => {
        const keyword = input.value.trim().toLowerCase();

        if (!keyword) {
          closeList();
          return;
        }

        let matched = 0;

        items.forEach((item) => {
          const isMatched = item.textContent.trim().toLowerCase().includes(keyword);

          item.hidden = !isMatched;
          item.classList.remove('active');

          if (isMatched) matched += 1;
        });

        if (empty) empty.hidden = matched > 0;

        list.hidden = false;
        input.setAttribute('aria-expanded', 'true');
      });

      input.addEventListener('keydown', (event) => {
        if (list.hidden) return;

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          moveActive(event.key === 'ArrowDown' ? 1 : -1);
          return;
        }

        if (event.key === 'Enter') {
          const active = items.find((item) => item.classList.contains('active'));

          if (!active) return;

          event.preventDefault();
          selectItem(active);
          return;
        }

        if (event.key === 'Escape') closeList();
      });

      items.forEach((item) => {
        item.addEventListener('click', () => selectItem(item));
      });

      document.addEventListener('click', (event) => {
        if (suggest.contains(event.target)) return;

        closeList();
      });
    });
  };

  /**
   * 입력값 기준 새 창 미리보기 이벤트 연결
   */
  const bindWindowPreviews = () => {
    const buttons = document.querySelectorAll('[data-window-preview]:not([data-window-preview-bound])');

    buttons.forEach((button) => {
      // data-window-left 등에는 값을 읽어올 입력창 id 를 지정합니다.
      const getSize = (key, defaultValue) => {
        const field = document.getElementById(button.dataset[key] || '');
        const value = Number.parseInt(field ? field.value : '', 10);

        return Number.isNaN(value) ? defaultValue : value;
      };

      button.dataset.windowPreviewBound = 'true';
      button.addEventListener('click', () => {
        const width = getSize('windowWidth', 400);
        const height = getSize('windowHeight', 500);
        const left = getSize('windowLeft', 0);
        const top = getSize('windowTop', 0);

        window.open(
          button.dataset.windowPreview,
          button.dataset.windowName || 'preview',
          `popup=yes,width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
        );
      });
    });
  };

  /**
   * 트리 모두열기 / 모두닫기 이벤트 연결
   */
  const bindTreeToggles = () => {
    const trees = document.querySelectorAll('[data-menu-tree]:not([data-menu-tree-bound])');

    trees.forEach((tree) => {
      const setOpen = (isOpen) => {
        tree.querySelectorAll('details').forEach((item) => {
          item.open = isOpen;
        });
      };

      tree.dataset.menuTreeBound = 'true';
      tree.querySelector('[data-tree-open-all]')?.addEventListener('click', () => setOpen(true));
      tree.querySelector('[data-tree-close-all]')?.addEventListener('click', () => setOpen(false));
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
    bindCheckToggles();
    bindCheckEnables();
    bindLockToggles();
    bindCheckBulks();
    bindAreaSelects();
    bindRepeatAdds();
    bindRepeatRemoves();
    bindSelectEnables();
    bindSelectToggles();
    bindSuggestFields();
    bindWindowPreviews();
    bindTreeToggles();
  };

  window.initAdminForm = initAdminForm;
})();
