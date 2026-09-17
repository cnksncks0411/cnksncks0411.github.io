const adminTabStorageKey = 'twf-admin-open-tabs';
const adminTabMaxCount = 8;
const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let activePopupButton = null;

/**
 * 최대 탭 개수 기준 목록 정리
 */
const limitAdminTabs = (tabs) => {
  return tabs.slice(-adminTabMaxCount);
};

/**
 * 열린 탭 목록 조회
 */
const getStoredAdminTabs = () => {
  try {
    return JSON.parse(localStorage.getItem(adminTabStorageKey)) || [];
  } catch (error) {
    return [];
  }
};

/**
 * 열린 탭 목록 저장
 */
const setStoredAdminTabs = (tabs) => {
  localStorage.setItem(adminTabStorageKey, JSON.stringify(limitAdminTabs(tabs)));
};

/**
 * 탭 주소 경로 조회
 */
const getAdminTabPath = (href) => {
  try {
    return new URL(href, window.location.href).pathname;
  } catch (error) {
    return '';
  }
};

/**
 * 링크 주소 기준 페이지 이름 조회
 */
const getAdminPageNameByHref = (href) => {
  const targetPath = getAdminTabPath(href);

  if (!targetPath) return '';

  const pageLink = Array.from(document.querySelectorAll('[data-nav][href], [data-lnb-page][href]')).find((link) => {
    return getAdminTabPath(link.href) === targetPath;
  });

  if (!pageLink) return '';

  return pageLink.dataset.tabPage || pageLink.dataset.nav || pageLink.dataset.lnbPage || '';
};

/**
 * 탭 페이지 이름 조회
 */
const getAdminTabPageName = (tab) => {
  return tab.page || getAdminPageNameByHref(tab.href);
};

/**
 * 탭 활성 상태 비교
 */
const isSameAdminTabPage = (tab) => {
  const pageName = document.body.dataset.page || '';
  const tabPageName = getAdminTabPageName(tab);

  if (pageName && tabPageName) return pageName === tabPageName;

  return getAdminTabPath(tab.href) === window.location.pathname;
};

/**
 * 관리자 홈 주소 조회
 */
const getAdminHomeHref = () => {
  const homeLink = document.querySelector('[data-nav="home"]');

  if (homeLink) return homeLink.href;

  const adminPathIndex = window.location.pathname.lastIndexOf('/tdwfpub/admin_bak/');

  if (adminPathIndex >= 0) {
    return `${window.location.origin}/tdwfpub/admin_bak/admin-main.html`;
  }

  return new URL('/tdwfpub/admin_bak/admin-main.html', window.location.origin).href;
};

/**
 * 포커스 가능한 요소 조회
 */
const getFocusableItems = (layer) => {
  return Array.from(layer.querySelectorAll(focusableSelector)).filter((item) => item.offsetParent !== null);
};

/**
 * 마지막 열린 탭 주소 조회
 */
const getLastTabHref = (tabs) => {
  const lastTab = tabs[tabs.length - 1];
  return lastTab ? lastTab.href : '';
};

/**
 * 열린 탭 저장
 */
const saveAdminTab = (href, label, pageName = '') => {
  const targetUrl = new URL(href, window.location.href);
  const targetPageName = pageName || getAdminPageNameByHref(targetUrl.href);

  if (targetUrl.pathname.endsWith('/admin-main.html')) return;

  const tabs = getStoredAdminTabs();
  const nextTabs = tabs.filter((tab) => {
    const tabPageName = getAdminTabPageName(tab);

    if (getAdminTabPath(tab.href) === targetUrl.pathname) return false;
    if (targetPageName && tabPageName) return tabPageName !== targetPageName;
    return true;
  });

  nextTabs.push({label, href: targetUrl.href, page: targetPageName});
  setStoredAdminTabs(nextTabs);
};

/**
 * 열린 관리자 페이지 탭 렌더링
 */
const renderAdminTabs = () => {
  const target = document.querySelector('[data-tabs]');

  if (!target) return;

  const storedTabs = getStoredAdminTabs();
  const tabs = limitAdminTabs(storedTabs);

  if (storedTabs.length !== tabs.length) setStoredAdminTabs(tabs);

  target.replaceChildren();
  target.classList.add('tab-bar');
  target.dataset.tabBar = '';
  target.setAttribute('aria-label', '열린 관리자 페이지');
  target.hidden = !tabs.length;

  if (!tabs.length) return;

  const tabList = document.createElement('ul');
  const clearItem = document.createElement('li');
  const clearButton = document.createElement('button');

  tabList.className = 'tab-list';
  clearItem.className = 'tab-item tab-clear-item';
  clearButton.type = 'button';
  clearButton.className = 'btn-tab-clear';
  clearButton.dataset.tabClear = '';
  clearButton.setAttribute('aria-label', '열린 관리자 페이지 탭 전체닫기');
  clearButton.textContent = '전체닫기';
  clearItem.appendChild(clearButton);
  tabList.appendChild(clearItem);

  tabs.forEach((tab) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const closeButton = document.createElement('button');
    const closeIcon = document.createElement('span');

    item.className = 'tab-item';
    item.dataset.tabItem = '';
    item.classList.toggle('active', isSameAdminTabPage(tab));
    link.href = tab.href;
    link.textContent = tab.label;
    closeButton.type = 'button';
    closeButton.className = 'btn-tab-close';
    closeButton.dataset.tabClose = tab.href;
    closeButton.dataset.tabPage = getAdminTabPageName(tab);
    closeButton.setAttribute('aria-label', `${tab.label} 탭 닫기`);
    closeIcon.className = 'material-symbols-rounded';
    closeIcon.setAttribute('aria-hidden', 'true');
    closeIcon.textContent = 'close';

    closeButton.appendChild(closeIcon);
    item.append(link, closeButton);
    tabList.appendChild(item);
  });

  target.appendChild(tabList);
};

/**
 * 현재 페이지 기준 관리자 GNB 활성 상태 갱신
 */
const updateAdminNavActive = () => {
  const sectionName = document.body.dataset.section || '';
  const pageName = document.body.dataset.page || '';

  document.querySelectorAll('[data-nav]').forEach((item) => {
    const navName = item.dataset.nav;
    const isPageActive = pageName && navName === pageName;
    const isSectionActive = sectionName && navName === sectionName;
    const submenuToggle = item.querySelector('[data-submenu-toggle]');
    const isLink = item.matches('a');
    const isActive = isPageActive || isSectionActive;

    item.classList.toggle('active', isActive && isLink);
    item.classList.toggle('is-current', isSectionActive && !isLink);

    if (isLink) {
      if (isActive) {
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    }

    if (submenuToggle) {
      submenuToggle.classList.toggle('active', isSectionActive);
    }
  });
};

/**
 * 현재 페이지 기준 관리자 LNB 활성 상태 갱신
 */
const updateAdminLnbActive = () => {
  const pageName = document.body.dataset.page || '';
  const lnbLinks = document.querySelectorAll('[data-lnb] [data-lnb-page]');

  lnbLinks.forEach((link) => {
    const isActive = pageName && link.dataset.lnbPage === pageName;

    link.classList.toggle('active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

/**
 * 테이블 정렬 버튼 이벤트 연결
 */
const bindTableSort = () => {
  const sortButtons = document.querySelectorAll('[data-table-sort]:not([data-table-sort-bound])');

  sortButtons.forEach((sortButton) => {
    sortButton.dataset.tableSortBound = 'true';
    sortButton.addEventListener('click', () => {
      const isReversed = sortButton.classList.toggle('is-reversed');
      sortButton.setAttribute('aria-pressed', isReversed ? 'true' : 'false');
    });
  });
};

/**
 * 테이블 행 링크 이벤트 연결
 */
const bindTableRowLinks = () => {
  const rows = document.querySelectorAll('[data-row-link]:not([data-row-link-bound])');

  rows.forEach((row) => {
    row.dataset.rowLinkBound = 'true';
    row.addEventListener('click', () => {
      window.location.href = row.dataset.rowLink;
    });
    row.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;

      window.location.href = row.dataset.rowLink;
    });
  });
};

/**
 * 팝업 닫기
 */
const closePopup = (popup) => {
  if (!popup) return;

  popup.classList.remove('is-open');
  popup.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('popup-open');

  if (activePopupButton) {
    activePopupButton.focus();
    activePopupButton = null;
  }
};

/**
 * 팝업 열기
 */
const openPopup = (popup, button) => {
  if (!popup) return;

  activePopupButton = button;
  popup.classList.add('is-open');
  popup.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('popup-open');

  const firstFocusable = getFocusableItems(popup)[0];
  if (firstFocusable) firstFocusable.focus();
};

/**
 * 팝업 이벤트 연결
 */
const bindPopup = () => {
  document.querySelectorAll('[data-popup-open]:not([data-popup-open-bound])').forEach((button) => {
    button.dataset.popupOpenBound = 'true';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const popup = document.getElementById(button.dataset.popupOpen);
      openPopup(popup, button);
    });
  });

  document.querySelectorAll('[data-popup-close]:not([data-popup-close-bound])').forEach((button) => {
    button.dataset.popupCloseBound = 'true';
    button.addEventListener('click', () => {
      closePopup(button.closest('[data-popup]'));
    });
  });

  if (document.documentElement.dataset.popupKeyBound) return;

  document.documentElement.dataset.popupKeyBound = 'true';
  document.addEventListener('keydown', (event) => {
    const openedPopup = document.querySelector('[data-popup][aria-hidden="false"]');

    if (event.key === 'Escape' && openedPopup) {
      closePopup(openedPopup);
    }
  });
};

/**
 * 보드 탭 활성 상태 변경
 */
const setBoardTabActive = (tabGroup, targetId) => {
  tabGroup.querySelectorAll('[data-board-tab]').forEach((tab) => {
    const isActive = tab.dataset.boardTab === targetId;

    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  tabGroup.querySelectorAll('[data-board-tab-panel]').forEach((panel) => {
    panel.hidden = panel.id !== targetId;
  });
};

/**
 * 보드 탭 이벤트 연결
 */
const bindBoardTabs = () => {
  document.querySelectorAll('[data-board-tabs]:not([data-board-tabs-bound])').forEach((tabGroup) => {
    const tabs = tabGroup.querySelectorAll('[data-board-tab]');
    const activeTab = tabGroup.querySelector('[data-board-tab].active') || tabs[0];

    tabGroup.dataset.boardTabsBound = 'true';

    if (activeTab) setBoardTabActive(tabGroup, activeTab.dataset.boardTab);

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        setBoardTabActive(tabGroup, tab.dataset.boardTab);
      });
    });
  });
};

/**
 * 열린 탭 전체삭제 이벤트 연결
 */
const bindTabClear = () => {
  const clearButton = document.querySelector('[data-tab-clear]:not([data-tab-clear-bound])');

  if (!clearButton) return;

  clearButton.dataset.tabClearBound = 'true';
  clearButton.addEventListener('click', () => {
    setStoredAdminTabs([]);
    window.location.href = getAdminHomeHref();
  });
};

/**
 * 열린 탭 닫기 이벤트 연결
 */
const bindTabClose = () => {
  const tabCloseButtons = document.querySelectorAll('[data-tab-close]:not([data-tab-close-bound])');

  tabCloseButtons.forEach((button) => {
    button.dataset.tabCloseBound = 'true';
    button.addEventListener('click', () => {
      const targetHref = button.dataset.tabClose;
      const targetPageName = button.dataset.tabPage || getAdminPageNameByHref(targetHref);
      const tabs = getStoredAdminTabs();
      const nextTabs = tabs.filter((tab) => {
        const tabPageName = getAdminTabPageName(tab);

        if (targetPageName && tabPageName) return tabPageName !== targetPageName;

        return getAdminTabPath(tab.href) !== getAdminTabPath(targetHref);
      });
      const isCurrentTab = targetPageName
        ? targetPageName === (document.body.dataset.page || '')
        : getAdminTabPath(targetHref) === window.location.pathname;

      setStoredAdminTabs(nextTabs);

      if (!isCurrentTab) {
        renderAdminTabs();
        bindTabClear();
        bindTabClose();
        return;
      }

      const nextHref = getLastTabHref(nextTabs) || getAdminHomeHref();
      window.location.href = nextHref;
    });
  });
};

/**
 * 관리자 링크 탭 저장 이벤트 연결
 */
const bindTabStorageLinks = () => {
  const linkSelectors = [
    '[data-lnb-list] a[href]:not([href="#"]):not([data-tab-storage-bound])',
    '[data-menu] a[href]:not([href="#"]):not([data-tab-storage-bound])',
  ];
  const links = document.querySelectorAll(linkSelectors.join(', '));

  links.forEach((link) => {
    link.dataset.tabStorageBound = 'true';
    link.addEventListener('click', () => {
      const tabLabel = link.dataset.tabLabel || link.textContent.trim();
      const tabPageName = link.dataset.tabPage || link.dataset.nav || link.dataset.lnbPage || '';

      saveAdminTab(link.href, tabLabel, tabPageName);
    });
  });
};

/**
 * 열린 탭 컴포넌트 이벤트 연결
 */
const bindTabs = () => {
  renderAdminTabs();
  bindTabClear();
  bindTabClose();
  bindTabStorageLinks();
};

/**
 * 스크롤 대상 확인
 */
const getTopScrollTarget = (content) => {
  if (content.scrollHeight > content.clientHeight) {
    return content;
  }
  return window;
};

/**
 * 스크롤 위치 확인
 */
const getTopScrollPosition = (content) => {
  const target = getTopScrollTarget(content);
  return target === window ? window.scrollY : target.scrollTop;
};

/**
 * 상단 이동 버튼 상태 갱신
 */
const updateTopButton = (content, topButton) => {
  const isVisible = getTopScrollPosition(content) > 120;
  topButton.classList.toggle('is-visible', isVisible);
  topButton.setAttribute('tabindex', isVisible ? '0' : '-1');
};

/**
 * 상단 이동 버튼 이벤트 연결
 */
const bindTopButton = () => {
  const content = document.querySelector('[data-content]');
  const topButton = document.querySelector('[data-top-button]:not([data-top-button-bound])');

  if (!content || !topButton) return;

  topButton.dataset.topButtonBound = 'true';
  topButton.addEventListener('click', () => {
    const target = getTopScrollTarget(content);

    if (target === window) {
      window.scrollTo({top: 0, behavior: 'smooth'});
      return;
    }
    target.scrollTo({top: 0, behavior: 'smooth'});
  });

  content.addEventListener('scroll', () => updateTopButton(content, topButton));
  window.addEventListener('scroll', () => updateTopButton(content, topButton));
  window.addEventListener('resize', () => updateTopButton(content, topButton));
  updateTopButton(content, topButton);
};

/**
 * 좌측 메뉴 접힘 상태 적용
 */
const setLnbCollapsed = (layoutBody, lnbToggle, lnbIcon, isCollapsed) => {
  layoutBody.classList.toggle('is-lnb-collapsed', isCollapsed);
  lnbToggle.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
  lnbToggle.setAttribute('aria-label', isCollapsed ? '좌측 메뉴 펼치기' : '좌측 메뉴 접기');
  if (lnbIcon) lnbIcon.textContent = isCollapsed ? 'menu' : 'menu_open';
};

/**
 * 좌측 메뉴 접힘 이벤트 연결
 */
const bindLnb = () => {
  const layoutBody = document.querySelector('[data-layout-body]');
  const lnbToggle = document.querySelector('[data-lnb-toggle]:not([data-lnb-toggle-bound])');

  if (!layoutBody || !lnbToggle) return;

  const lnbIcon = lnbToggle.querySelector('[data-lnb-toggle-icon]');

  lnbToggle.dataset.lnbToggleBound = 'true';
  lnbToggle.addEventListener('click', () => {
    setLnbCollapsed(layoutBody, lnbToggle, lnbIcon, !layoutBody.classList.contains('is-lnb-collapsed'));
  });
};

/**
 * 모바일 메뉴 구간 확인
 */
const isMobileMenu = () => {
  return window.innerWidth <= 1280;
};

/**
 * 모바일 메뉴 접근성 상태 적용
 */
const setMenuAccessibility = (menu, isOpen) => {
  if (!isMobileMenu()) {
    menu.removeAttribute('aria-hidden');
    menu.inert = false;
    return;
  }

  if (isOpen) {
    menu.removeAttribute('aria-hidden');
    menu.inert = false;
    return;
  }

  menu.setAttribute('aria-hidden', 'true');
  menu.inert = true;
};

/**
 * 하위 메뉴 닫기
 */
const closeSubmenus = () => {
  document.querySelectorAll('[data-submenu-toggle]').forEach((submenuToggle) => {
    const item = submenuToggle.closest('[data-menu-item]');
    if (item) item.classList.remove('is-open');
    submenuToggle.setAttribute('aria-expanded', 'false');
  });
};

/**
 * 데스크톱 하위 메뉴 링크 이동
 */
const moveToSubmenuTarget = (submenuToggle) => {
  const targetHref = submenuToggle.dataset.menuTarget;

  if (!targetHref) return;

  const targetUrl = new URL(targetHref, window.location.href);
  const item = submenuToggle.closest('[data-menu-item]');
  const targetPath = targetUrl.pathname;
  const targetLink = item ? Array.from(item.querySelectorAll('[data-submenu-panel] a[href]:not([href="#"])')).find((link) => {
    return new URL(link.href, window.location.href).pathname === targetPath;
  }) : null;
  const label = targetLink ? targetLink.textContent.trim() : submenuToggle.textContent.trim();

  saveAdminTab(targetUrl.href, label, targetLink ? targetLink.dataset.nav : '');
  window.location.href = targetUrl.href;
};

/**
 * 하위 메뉴 토글 이벤트 연결
 */
const bindSubmenus = () => {
  const submenuToggles = document.querySelectorAll('[data-submenu-toggle]:not([data-submenu-bound])');

  submenuToggles.forEach((submenuToggle) => {
    submenuToggle.dataset.submenuBound = 'true';
    submenuToggle.addEventListener('click', () => {
      if (!isMobileMenu()) {
        moveToSubmenuTarget(submenuToggle);
        return;
      }

      const item = submenuToggle.closest('[data-menu-item]');
      if (!item) return;

      const isOpen = item.classList.toggle('is-open');
      submenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });
};

/**
 * 모바일 메뉴 닫기
 */
const closeMenu = (menu, toggle) => {
  menu.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
  document.documentElement.classList.remove('admin-menu-open');
  closeSubmenus();
  setMenuAccessibility(menu, false);
};

/**
 * 모바일 메뉴 열기
 */
const openMenu = (menu, toggle) => {
  menu.classList.add('is-open');
  toggle.setAttribute('aria-expanded', 'true');
  document.documentElement.classList.add('admin-menu-open');
  setMenuAccessibility(menu, true);
};

/**
 * 모바일 메뉴 이벤트 연결
 */
const bindMenu = () => {
  const menu = document.querySelector('[data-menu]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const close = document.querySelector('[data-menu-close]');

  bindSubmenus();

  if (!menu || !toggle || menu.dataset.menuBound) return;

  menu.dataset.menuBound = 'true';

  toggle.addEventListener('click', () => {
    if (menu.classList.contains('is-open')) {
      closeMenu(menu, toggle);
      return;
    }
    openMenu(menu, toggle);
  });

  if (close) {
    close.addEventListener('click', () => closeMenu(menu, toggle));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu(menu, toggle);
    }
  });

  window.addEventListener('resize', () => {
    setMenuAccessibility(menu, menu.classList.contains('is-open'));
  });

  setMenuAccessibility(menu, false);
};

/**
 * 관리자 공통 인터랙션 초기화
 */
const initAdmin = () => {
  updateAdminNavActive();
  updateAdminLnbActive();
  bindTabs();
  bindTableSort();
  bindTableRowLinks();
  bindPopup();
  bindBoardTabs();
  if (window.initAdminForm) window.initAdminForm();
  bindTopButton();
  bindLnb();
  bindMenu();
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('[data-include]')) return;

  initAdmin();
});

document.addEventListener('admin:include-loaded', initAdmin);
