/**
 * 머티리얼 아이콘 노출 초기화
 */
(() => {
  const showMaterialIcons = () => document.documentElement.classList.add("icons-ready");

  if (!document.fonts || !document.fonts.load) {
    showMaterialIcons();
    return;
  }

  document.fonts
    .load('24px "Material Symbols Rounded"', "arrow_upward")
    .then(showMaterialIcons)
    .catch(showMaterialIcons);
})();

document.addEventListener("DOMContentLoaded", () => {
  let activeSitemapButton = null;
  let activeCommonPopupButton = null;
  let activeLnbPageName = "";

  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /**
   * 일반페이지 상단 이동 버튼 초기화
   */
  const bindFloatingTop = () => {
    document.querySelectorAll("[data-floating-top]:not([data-top-bound])").forEach((button) => {
      button.dataset.topBound = "true";
      button.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });
    });
  };

  /**
   * 열린 공통 드롭다운 닫기
   */
  const closeDropdowns = (except = null, shouldFocus = false) => {
    document.querySelectorAll("[data-dropdown][open]").forEach((item) => {
      if (item === except) return;

      item.open = false;
      if (shouldFocus) item.querySelector("summary")?.focus();
    });
  };

  /**
   * 공통 드롭다운 연결
   */
  const bindDropdown = () => {
    document.querySelectorAll("[data-dropdown]:not([data-dropdown-bound])").forEach((item) => {
      item.dataset.dropdownBound = "true";
      item.addEventListener("toggle", () => {
        if (item.open) closeDropdowns(item);
      });
    });
  };

  /**
   * URL 해시 기준 게시판 탭 활성화
   */
  const bindBoardTabs = () => {
    document.querySelectorAll("[data-category-tabs]:not([data-category-tabs-bound])").forEach((list) => {
      const items = Array.from(list.querySelectorAll("[data-category]"));
      if (!items.length) return;

      list.dataset.categoryTabsBound = "true";

      const activateCategory = () => {
        const hash = window.location.hash.replace("#", "");
        const activeItem = items.find((item) => item.dataset.category === hash) || items[0];

        items.forEach((item) => {
          const isActive = item === activeItem;
          item.classList.toggle("active", isActive);

          if (isActive) {
            item.setAttribute("aria-current", "page");
          } else {
            item.removeAttribute("aria-current");
          }
        });
      };

      activateCategory();
      window.addEventListener("hashchange", activateCategory);
    });
  };

  /**
   * URL 해시 기준 서브 탭과 연결 패널 활성화
   */
  const bindHashTabs = () => {
    document.querySelectorAll("[data-hash-tabs]:not([data-hash-tabs-bound])").forEach((container) => {
      const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
      if (!tabs.length) return;

      container.dataset.hashTabsBound = "true";
      const breadcrumbPrefix = container.dataset.breadcrumbPrefix || "";

      const activateTab = (tab, shouldUpdateHash = true) => {
        tabs.forEach((item) => {
          const isActive = item === tab;
          const panel = document.getElementById(item.getAttribute("aria-controls"));

          item.classList.toggle("active", isActive);
          item.setAttribute("aria-selected", String(isActive));
          item.tabIndex = isActive ? 0 : -1;

          if (panel) panel.hidden = !isActive;
        });

        if (breadcrumbPrefix) {
          const breadcrumbCurrent = document.querySelector("[data-breadcrumb-current]");
          if (breadcrumbCurrent) breadcrumbCurrent.textContent = `${breadcrumbPrefix} | ${tab.textContent.trim()}`;
        }

        if (shouldUpdateHash && tab.dataset.hash) {
          history.replaceState(null, "", `#${tab.dataset.hash}`);
          window.dispatchEvent(new Event("hashchange"));
        }
      };

      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activateTab(tab));
        tab.addEventListener("keydown", (event) => {
          const lastIndex = tabs.length - 1;
          let nextIndex = index;

          if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
          if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
          if (event.key === "Home") nextIndex = 0;
          if (event.key === "End") nextIndex = lastIndex;
          if (nextIndex === index) return;

          event.preventDefault();
          tabs[nextIndex].focus();
          activateTab(tabs[nextIndex]);
        });
      });

      const activateHash = () => {
        const hash = window.location.hash.replace("#", "");
        const activeTab = tabs.find((tab) => tab.dataset.hash === hash) || tabs[0];
        activateTab(activeTab, false);
      };

      activateHash();
      window.addEventListener("hashchange", activateHash);
    });
  };

  /**
   * 개인정보처리방침 이전·다음 버전 전환
   */
  const bindPrivacyVersions = () => {
    document.querySelectorAll("[data-privacy-version-root]:not([data-privacy-version-bound])").forEach((root) => {
      const versionNames = (root.dataset.privacyVersions || "")
        .split(",")
        .map((version) => version.trim())
        .filter(Boolean);
      const panels = versionNames.map((version) => root.querySelector(`[data-privacy-version="${version}"]`));
      const previousButton = root.querySelector("[data-privacy-version-prev]");
      const nextButton = root.querySelector("[data-privacy-version-next]");

      if (!versionNames.length || panels.some((panel) => !panel) || !previousButton || !nextButton) return;

      root.dataset.privacyVersionBound = "true";
      let activeIndex = Math.max(
        0,
        panels.findIndex((panel) => !panel.hidden),
      );

      const activateVersion = (index) => {
        if (index < 0 || index >= panels.length) return;

        activeIndex = index;
        panels.forEach((panel, panelIndex) => {
          panel.hidden = panelIndex !== activeIndex;
        });

        previousButton.hidden = activeIndex === panels.length - 1;
        nextButton.hidden = activeIndex === 0;
        root.dataset.currentPrivacyVersion = versionNames[activeIndex];

        if (window.location.hash) {
          history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        }
      };

      previousButton.addEventListener("click", () => {
        activateVersion(activeIndex + 1);
        if (previousButton.hidden) nextButton.focus();
      });

      nextButton.addEventListener("click", () => {
        activateVersion(activeIndex - 1);
        if (nextButton.hidden) previousButton.focus();
      });

      activateVersion(activeIndex);
    });
  };

  /**
   * 전체메뉴 버튼과 연결된 사이트맵 레이어 조회
   */
  const getSitemapLayer = (button) => {
    const header = button.closest("[data-site-header]");
    let layer = header ? header.nextElementSibling : null;

    while (layer && !layer.matches("[data-sitemap-layer]")) {
      layer = layer.nextElementSibling;
    }

    return layer;
  };

  /**
   * 레이어 안의 실제 포커스 가능 요소 반환
   */
  const getFocusableItems = (layer) =>
    Array.from(layer.querySelectorAll(focusableSelector)).filter((item) => item.offsetParent !== null);

  /**
   * 공통 레이어 팝업 닫기 및 기존 포커스 복원
   */
  const closeCommonPopup = (popup) => {
    if (!popup) return;

    popup.classList.remove("is-open");
    popup.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("popup-open");

    if (activeCommonPopupButton) {
      activeCommonPopupButton.focus();
      activeCommonPopupButton = null;
    }

    // data-popup-close-url 속성이 있으면 팝업을 닫은 뒤 해당 주소로 이동합니다.
    if (popup.dataset.popupCloseUrl) window.location.href = popup.dataset.popupCloseUrl;
  };

  /**
   * 공통 레이어 팝업 열기 및 첫 포커스 요소 이동
   */
  const openCommonPopup = (popup, button) => {
    if (!popup) return;

    activeCommonPopupButton = button;
    popup.classList.add("is-open");
    popup.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("popup-open");

    const firstFocusable = getFocusableItems(popup)[0];
    if (firstFocusable) firstFocusable.focus();
  };

  /**
   * 공통 레이어 팝업 열기, 닫기 이벤트 연결
   */
  const bindCommonPopup = () => {
    document.querySelectorAll("[data-popup-open]:not([data-popup-open-bound])").forEach((button) => {
      button.dataset.popupOpenBound = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const popup = document.getElementById(button.dataset.popupOpen);

        if (popup && button.dataset.popupImageSrc) {
          const image = popup.querySelector("[data-popup-preview-image]");
          const fileName = popup.querySelector("[data-popup-preview-name]");
          const previewName = button.dataset.popupFileName || "첨부 이미지";

          if (image) {
            image.src = button.dataset.popupImageSrc;
            image.alt = `${previewName} 미리보기`;
          }

          if (fileName) fileName.textContent = previewName;
        }

        openCommonPopup(popup, button);
      });
    });

    document.querySelectorAll("[data-popup-close]:not([data-popup-close-bound])").forEach((button) => {
      button.dataset.popupCloseBound = "true";
      button.addEventListener("click", () => {
        closeCommonPopup(button.closest("[data-common-popup]"));
      });
    });
  };

  /**
   * 체크박스 상태에 따른 공통 레이어 팝업 연결
   */
  const bindPopupByCheck = () => {
    document.querySelectorAll("[data-popup-by-check]:not([data-popup-by-check-bound])").forEach((button) => {
      button.dataset.popupByCheckBound = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();

        const checkbox = document.getElementById(button.dataset.popupCheck);
        const popupId = checkbox?.checked ? button.dataset.popupChecked : button.dataset.popupUnchecked;

        if (!popupId) return;
        openCommonPopup(document.getElementById(popupId), button);
      });
    });
  };

  /**
   * 지정 LNB 메뉴를 사이드 영역 상단으로 스크롤
   */
  const scrollLnbMenuToTop = (subSide, target, behavior = "auto") => {
    const menuItem = target.closest("[data-sub-menu-list] > li") || target;
    const heading = subSide.querySelector(":scope > .sub-side-title");
    const headingHeight = heading ? heading.offsetHeight : 0;
    const sideRect = subSide.getBoundingClientRect();
    const itemRect = menuItem.getBoundingClientRect();
    const nextTop = subSide.scrollTop + itemRect.top - sideRect.top - headingHeight;

    subSide.scrollTo({
      top: Math.max(0, nextTop),
      behavior,
    });
  };

  /**
   * 레이아웃 갱신 후 LNB 메뉴 위치 보정
   */
  const scrollLnbMenuToTopAfterLayout = (subSide, target, behavior = "auto") => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollLnbMenuToTop(subSide, target, behavior));
    });
  };

  /**
   * 서브페이지 본문 시작 위치로 즉시 이동
   */
  const scrollSubPageToTop = () => {
    const target =
      document.querySelector('[aria-labelledby="page-title"]') ||
      document.querySelector("[data-sub-content-wrap]") ||
      document.getElementById("main");
    if (!target) return;

    window.scrollTo({
      top: Math.max(0, target.getBoundingClientRect().top + window.scrollY),
      behavior: "auto",
    });
  };

  /**
   * 레이아웃 갱신 후 서브페이지 본문 시작 위치 이동
   */
  const scrollSubPageToTopAfterLayout = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollSubPageToTop);
    });
  };

  /**
   * 현재 페이지명과 해시 기준 LNB 활성 상태 갱신
   */
  const updateLnbActive = (pageName) => {
    const subSide = document.querySelector("[data-sub-side]");
    if (!subSide || !pageName) return;

    subSide.querySelectorAll("[data-lnb-page]").forEach((link) => {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    });

    subSide.querySelectorAll("[data-sub-menu-item]").forEach((item) => {
      item.open = false;
    });

    const hash = window.location.hash.replace("#", "");
    const defaultHashTab = document.querySelector('[data-hash-tabs] [role="tab"][data-hash]');
    // 탭이 없는 상세 페이지는 body의 data-lnb-hash로 활성 메뉴를 지정합니다.
    const activeHash = hash || document.body.dataset.lnbHash || defaultHashTab?.dataset.hash || "";
    let activeLnb = null;

    if (activeHash) {
      activeLnb = subSide.querySelector(`[data-lnb-page="${pageName}"][data-lnb-hash="${activeHash}"]`);
    }

    if (!activeLnb) {
      activeLnb = subSide.querySelector(`[data-lnb-page="${pageName}"]`);
    }

    if (!activeLnb) return;

    activeLnb.classList.add("active");
    activeLnb.setAttribute("aria-current", "page");

    const activeMenu = activeLnb.closest("[data-sub-menu-item]");
    if (activeMenu) activeMenu.open = true;

    scrollLnbMenuToTop(subSide, activeMenu || activeLnb, "auto");

    subSide.querySelectorAll("[data-sub-menu-link]:not([data-lnb-scroll-bound])").forEach((link) => {
      link.dataset.lnbScrollBound = "true";
      link.addEventListener("click", () => scrollLnbMenuToTopAfterLayout(subSide, link));
    });

    subSide.querySelectorAll("[data-lnb-hash]:not([data-lnb-page-scroll-bound])").forEach((link) => {
      link.dataset.lnbPageScrollBound = "true";
      link.addEventListener("click", () => {
        if (link.dataset.lnbPage === pageName) scrollSubPageToTopAfterLayout();
      });
    });

    subSide.querySelectorAll("[data-sub-menu-item]:not([data-lnb-toggle-scroll-bound])").forEach((item) => {
      item.dataset.lnbToggleScrollBound = "true";
      item.addEventListener("toggle", () => {
        if (item.open) scrollLnbMenuToTopAfterLayout(subSide, item);
      });
    });
  };

  /**
   * 열린 사이트맵 레이어 전체 닫기
   */
  const closeSitemap = (shouldFocus = true) => {
    document.querySelectorAll('[data-sitemap-layer][aria-hidden="false"]').forEach((layer) => {
      layer.classList.remove("is-open");
      layer.setAttribute("aria-hidden", "true");
    });

    document.querySelectorAll('[data-menu-all][aria-expanded="true"]').forEach((button) => {
      button.setAttribute("aria-expanded", "false");
    });

    document.documentElement.classList.remove("menu-open");

    if (activeSitemapButton && shouldFocus) {
      activeSitemapButton.focus();
    }

    activeSitemapButton = null;
  };

  /**
   * 사이트맵 레이어 열기 및 닫기 버튼 포커스 이동
   */
  const openSitemap = (layer, button) => {
    activeSitemapButton = button;
    layer.classList.add("is-open");
    layer.setAttribute("aria-hidden", "false");
    button.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("menu-open");

    const closeButton = layer.querySelector("button[data-sitemap-close]");
    if (closeButton) closeButton.focus();
  };

  /**
   * 전체메뉴 열기, 닫기, 하위 토글 이벤트 연결
   */
  const bindSitemap = () => {
    document.querySelectorAll("[data-menu-all]:not([data-sitemap-bound])").forEach((button) => {
      button.dataset.sitemapBound = "true";
      button.addEventListener("click", () => {
        const layer = getSitemapLayer(button);
        if (!layer) return;

        const shouldOpen = !layer.classList.contains("is-open");
        closeSitemap();

        if (shouldOpen) openSitemap(layer, button);
      });
    });

    document.querySelectorAll("[data-sitemap-close]:not([data-sitemap-bound])").forEach((element) => {
      element.dataset.sitemapBound = "true";
      element.addEventListener("click", () => closeSitemap());
    });

    document.querySelectorAll("[data-sitemap-layer]:not([data-sitemap-link-bound])").forEach((layer) => {
      layer.dataset.sitemapLinkBound = "true";
      layer.addEventListener("click", (event) => {
        if (event.target.closest("a[href]")) closeSitemap(false);
      });
    });

    document.querySelectorAll("[data-sitemap-link-item] [data-sitemap-toggle]:not([data-sitemap-bound])").forEach((button) => {
      button.dataset.sitemapBound = "true";
      button.addEventListener("click", () => {
        const group = button.closest("[data-sitemap-link-item]");
        if (!group) return;

        const isOpen = group.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(isOpen));
      });
    });

    document.querySelectorAll("[data-sitemap-menu]:not([data-sitemap-bound])").forEach((button) => {
      button.dataset.sitemapBound = "true";
      button.addEventListener("click", () => {
        const row = button.closest("[data-sitemap-menu-item]");
        if (!row) return;

        const isOpen = row.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(isOpen));
      });
    });
  };

  /**
   * 새창 팝업 열기
   */
  const openPopup = (url, name, width, height, offset = 0, position = null) => {
    if (typeof window.open !== "function") return false;

    // 관리자에서 등록한 위치값이 있으면 계산 없이 입력값 그대로 사용합니다.
    const hasPosition = Array.isArray(position);
    const popupWidth = hasPosition ? width : Math.min(width, window.screen.availWidth - 40);
    const popupHeight = hasPosition ? height : Math.min(height, window.screen.availHeight - 40);
    const popupLeft = hasPosition
      ? position[0]
      : Math.max(0, window.screenX + (window.outerWidth - popupWidth) / 2 + offset);
    const popupTop = hasPosition
      ? position[1]
      : Math.max(0, window.screenY + (window.outerHeight - popupHeight) / 2 + offset);
    const options = [
      "popup=yes",
      `width=${popupWidth}`,
      `height=${popupHeight}`,
      `left=${Math.round(popupLeft)}`,
      `top=${Math.round(popupTop)}`,
      "scrollbars=yes",
      "resizable=yes",
    ].join(",");
    const popup = window.open(url, name, options);

    if (!popup) return false;

    popup.focus();
    return true;
  };

  /**
   * 새창 팝업 연결
   */
  const bindPopup = () => {
    document.querySelectorAll("[data-popup]:not([data-popup-bound])").forEach((trigger) => {
      const [width, height] = (trigger.dataset.size || "600,600").split(",").map(Number);
      const popupUrl = trigger.dataset.popupUrl || trigger.href || "about:blank";

      trigger.dataset.popupBound = "true";
      trigger.addEventListener("click", (event) => {
        event.preventDefault();

        if (!openPopup(popupUrl, trigger.dataset.popup, width, height) && trigger.href) {
          window.location.href = trigger.href;
        }
      });
    });
  };

  /**
   * 새창 팝업 닫기
   */
  const bindPopupClose = () => {
    document.querySelectorAll("[data-close]:not([data-close-bound])").forEach((button) => {
      button.dataset.closeBound = "true";
      button.addEventListener("click", () => window.close());
    });
  };

  /**
   * 사이트 진입 팝업
   */
  const noticeStorage = window.localStorage;

  const showNotices = () => {
    const body = document.body;
    const site = body.dataset.site;
    const notices = Array.from(document.querySelectorAll("[data-notice-id]"));

    if (!site || body.dataset.noticeBound || !notices.length) return;

    body.dataset.noticeBound = "true";

    const pending = notices.filter((item) => {
      const hiddenUntil = Number(noticeStorage?.getItem(`noticeUntil-${site}-${item.dataset.noticeId}`) || 0);

      return hiddenUntil <= Date.now();
    });

    if (!pending.length) return;

    pending.forEach((item, index) => {
      const [width, height] = (item.dataset.size || "600,600").split(",").map(Number);
      // data-position: 관리자 팝업창위치(가로,세로) 입력값. 없으면 화면 가운데로 엽니다.
      const position = item.dataset.position ? item.dataset.position.split(",").map(Number) : null;
      const url = new URL("/tdwfpub/common/include/popup/popup.html", window.location.href);

      url.searchParams.set("site", site);
      url.searchParams.set("noticeId", item.dataset.noticeId);

      openPopup(url.href, `notice-${site}-${item.dataset.noticeId}`, width, height, index * 24, position);
    });
  };

  /**
   * 오늘 하루 팝업 숨기기
   */
  const bindNoticeToday = () => {
    const today = document.querySelector("[data-notice-today]:not([data-notice-bound])");
    const params = new URLSearchParams(window.location.search);
    const site = params.get("site");
    const noticeId = params.get("noticeId");

    if (!today || !site || !noticeId) return;

    today.dataset.noticeBound = "true";

    today.addEventListener("change", () => {
      const noticeKey = `noticeUntil-${site}-${noticeId}`;

      if (!today.checked) {
        noticeStorage?.removeItem(noticeKey);
        return;
      }

      const expires = new Date();
      expires.setHours(24, 0, 0, 0);
      noticeStorage?.setItem(noticeKey, String(expires.getTime()));
    });
  };

  /**
   * 공통 인터랙션 초기화
   */
  const initCommon = () => {
    bindFloatingTop();
    bindDropdown();
    bindBoardTabs();
    bindHashTabs();
    bindPrivacyVersions();
    bindSitemap();
    bindCommonPopup();
    bindPopupByCheck();
    bindPopup();
    bindPopupClose();
    bindNoticeToday();
    showNotices();
  };

  document.addEventListener("keydown", (event) => {
    const openLayer = document.querySelector('[data-sitemap-layer][aria-hidden="false"]');
    const openPopup = document.querySelector('[data-common-popup][aria-hidden="false"]');

    if (event.key === "Escape") {
      closeDropdowns(null, true);
      closeSitemap();
      closeCommonPopup(openPopup);
      return;
    }

    if (!openLayer || event.key !== "Tab") return;

    const focusableItems = getFocusableItems(openLayer);
    const firstItem = focusableItems[0];
    const lastItem = focusableItems[focusableItems.length - 1];

    if (!firstItem || !lastItem) return;

    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-dropdown]")) return;
    closeDropdowns();
  });

  document.addEventListener("include:component-loaded", (event) => {
    const { componentName, pageName } = event.detail || {};

    if (!pageName || !componentName || !componentName.startsWith("lnb-")) return;

    activeLnbPageName = pageName;
    updateLnbActive(pageName);
  });

  window.addEventListener("hashchange", () => {
    if (activeLnbPageName) updateLnbActive(activeLnbPageName);
  });

  initCommon();

  document.addEventListener("include:loaded", initCommon);
});
