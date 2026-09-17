document.addEventListener("DOMContentLoaded", () => {
  /**
   * 지원사업 카테고리 필터 초기화
   */
  const bindApplyFilter = () => {
    document.querySelectorAll("[data-apply-filter]:not([data-apply-filter-bound])").forEach((section) => {
      section.dataset.applyFilterBound = "true";

      const buttons = Array.from(section.querySelectorAll("[data-filter-button]"));
      const cards = Array.from(section.querySelectorAll("[data-filter-card][data-category]"));
      const countText = section.querySelector("[data-filter-count]");
      const emptyText = section.querySelector("[data-filter-empty]");

      if (!buttons.length || !cards.length) return;

      /**
       * 지원사업 카테고리 필터 적용 및 노출 개수 갱신
       */
      const setApplyFilter = (button) => {
        const filter = button.dataset.filter || "all";
        let visibleCount = 0;

        buttons.forEach((item) => {
          const isActive = item === button;

          item.classList.toggle("active", isActive);
          item.setAttribute("aria-pressed", String(isActive));
        });

        cards.forEach((card) => {
          const isVisible = filter === "all" || card.dataset.category === filter;

          card.hidden = !isVisible;
          if (isVisible) visibleCount += 1;
        });

        if (countText) countText.textContent = `${visibleCount}개 사업`;
        if (emptyText) emptyText.hidden = visibleCount !== 0;
      };

      buttons.forEach((button) => {
        button.addEventListener("click", () => setApplyFilter(button));
      });

      const activeButton = buttons.find((button) => button.classList.contains("active")) || buttons[0];

      if (activeButton) setApplyFilter(activeButton);
    });
  };

  /**
   * 회원정보 인증 패널
   */
  const bindAuthPanel = () => {
    document.querySelectorAll("[data-auth-toggle]:not([data-auth-bound])").forEach((button) => {
      const panelId = button.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;

      if (!panel) return;

      button.dataset.authBound = "true";
      button.addEventListener("click", () => {
        if (!panel.hidden) return;

        panel.hidden = false;
        button.setAttribute("aria-expanded", "true");
        button.closest("[data-auth-card]")?.classList.add("is-active");

        requestAnimationFrame(() => {
          panel.querySelector("input")?.focus();
        });
      });
    });
  };

  /**
   * 회원가입 약관 전체동의 상태 연결
   */
  const bindJoinAgreement = () => {
    document.querySelectorAll("[data-agree]:not([data-agree-bound])").forEach((form) => {
      const agreeAll = form.querySelector("[data-agree-all]");
      const agreeItems = Array.from(form.querySelectorAll("[data-agree-item]"));

      if (!agreeAll || !agreeItems.length) return;

      form.dataset.agreeBound = "true";

      const updateAgreeAll = () => {
        const checkedCount = agreeItems.filter((item) => item.checked).length;

        agreeAll.checked = checkedCount === agreeItems.length;
        agreeAll.indeterminate = checkedCount > 0 && checkedCount < agreeItems.length;
      };

      agreeAll.addEventListener("change", () => {
        agreeItems.forEach((item) => {
          item.checked = agreeAll.checked;
        });

        agreeAll.indeterminate = false;
      });

      agreeItems.forEach((item) => {
        item.addEventListener("change", updateAgreeAll);
      });

      updateAgreeAll();
    });
  };

  /**
   * 사업신청 검증 유형 선택 영역
   */
  const bindVerificationSwitch = () => {
    document.querySelectorAll("[data-verification-switch]:not([data-verification-switch-bound])").forEach((group) => {
      const buttons = Array.from(group.querySelectorAll("[data-verification-button]")).filter(
        (button) => button.closest("[data-verification-switch]") === group,
      );
      const panels = Array.from(group.querySelectorAll("[data-verification-panel]")).filter(
        (panel) => panel.closest("[data-verification-switch]") === group,
      );
      const empty = Array.from(group.querySelectorAll("[data-verification-empty]")).find(
        (item) => item.closest("[data-verification-switch]") === group,
      );

      if (!buttons.length || !panels.length) return;

      group.dataset.verificationSwitchBound = "true";

      const setVerificationPanel = (button) => {
        const panelId = button?.getAttribute("aria-controls") || "";

        buttons.forEach((item) => {
          const isActive = item === button;

          item.classList.toggle("active", isActive);
          item.setAttribute("aria-pressed", String(isActive));
        });

        panels.forEach((panel) => {
          panel.hidden = panel.id !== panelId;
        });

        if (empty) empty.hidden = Boolean(panelId);
      };

      buttons.forEach((button) => {
        button.addEventListener("click", () => setVerificationPanel(button));
      });

      const activeButton = buttons.find((button) => button.classList.contains("active"));

      setVerificationPanel(activeButton);
    });
  };

  /**
   * 검증 입력 영역과 조회 결과 영역 전환
   */
  const bindVerifyToggle = () => {
    document.querySelectorAll("[data-verify-toggle]:not([data-verify-toggle-bound])").forEach((group) => {
      const views = Array.from(group.querySelectorAll("[data-verify-view]")).filter(
        (view) => view.closest("[data-verify-toggle]") === group,
      );
      const buttons = Array.from(group.querySelectorAll("[data-verify-show]")).filter(
        (button) => button.closest("[data-verify-toggle]") === group,
      );

      if (!views.length || !buttons.length) return;

      group.dataset.verifyToggleBound = "true";

      const setVerifyView = (viewName) => {
        views.forEach((view) => {
          view.hidden = view.dataset.verifyView !== viewName;
        });
      };

      buttons.forEach((button) => {
        button.addEventListener("click", () => setVerifyView(button.dataset.verifyShow));
      });
    });
  };

  /**
   * 버튼 클릭 시 숨겨진 대상 영역 노출
   */
  const bindRevealTarget = () => {
    document.querySelectorAll("[data-reveal-target]:not([data-reveal-target-bound])").forEach((button) => {
      const target = document.getElementById(button.dataset.revealTarget);

      if (!target) return;

      button.dataset.revealTargetBound = "true";
      button.addEventListener("click", () => {
        target.hidden = false;
      });
    });
  };

  /**
   * 이메일 도메인 선택값에 따른 입력 필드 상태 변경
   */
  const bindEmailDomainFields = () => {
    document
      .querySelectorAll("[data-email-domain-control]:not([data-email-domain-control-bound])")
      .forEach((control) => {
        const target = document.getElementById(control.dataset.emailDomainControl);
        const directValue = control.dataset.emailDomainDirectValue || "direct";

        if (!target) return;

        control.dataset.emailDomainControlBound = "true";

        const updateEmailDomainField = () => {
          const isDirectInput = control.value === directValue;

          target.readOnly = !isDirectInput;
          target.value = isDirectInput ? "" : control.value;

          if (isDirectInput) target.focus();
        };

        control.addEventListener("change", updateEmailDomainField);
        updateEmailDomainField();
      });
  };

  /**
   * 지원사업 인터랙션 초기화
   */
  const initApply = () => {
    bindApplyFilter();
    bindAuthPanel();
    bindJoinAgreement();
    bindVerificationSwitch();
    bindVerifyToggle();
    bindRevealTarget();
    bindEmailDomainFields();
  };

  initApply();
  document.addEventListener("include:loaded", initApply);
});
