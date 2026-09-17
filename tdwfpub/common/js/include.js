(() => {
  const componentFiles = {
    "header-main": "main/header.html",
    "sitemap-main": "main/sitemap.html",
    "header-apply": "apply/header.html",
    "sitemap-apply": "apply/sitemap.html",
    "lnb-foundation": "main/lnb-foundation.html",
    "lnb-business": "main/lnb-business.html",
    "lnb-notice": "main/lnb-notice.html",
    "lnb-archive": "main/lnb-archive.html",
    "lnb-apply-business": "apply/lnb-business.html",
    "lnb-apply-member": "apply/lnb-member.html",
    "lnb-apply-mypage": "apply/lnb-mypage.html",
    "lnb-apply-info": "apply/lnb-info.html",
    "floating-main": "main/floating.html",
    "floating-apply": "apply/floating.html",
    "login-popup": "popup/login.html",
    "footer-common": "footer.html",
  };

  /**
   * 페이지에 명시된 GNB 대메뉴 섹션 반환
   */
  const getPageSection = () => {
    const main = document.getElementById("main");
    return document.body?.dataset.section || main?.dataset.section || "";
  };

  /**
   * 현재 URL 기준 헤더 GNB 활성 상태 갱신
   */
  const updateHeaderActive = () => {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;

    const currentSection = getPageSection();
    const links = Array.from(header.querySelectorAll("[data-gnb-item] a"));
    const topItems = Array.from(header.querySelectorAll("[data-gnb-item][data-section]"));

    links.forEach((link) => {
      link.classList.remove("active");
      link.removeAttribute("aria-current");

      const item = link.closest("[data-gnb-item]");
      if (item && link.parentElement === item) item.classList.remove("active");
    });

    const activeGnb = topItems.find((item) => item.dataset.section === currentSection);
    if (!activeGnb) return;

    const activeLink = activeGnb.querySelector(":scope > a");
    if (!activeLink) return;

    activeGnb.classList.add("active");
    activeLink.classList.add("active");
    activeLink.setAttribute("aria-current", "page");
  };

  /**
   * data-include 대상 컴포넌트 로드 및 토큰 치환
   */
  const loadComponent = async (target) => {
    const componentName = target.dataset.include;
    const fileName = componentFiles[componentName];
    const pageName = target.dataset.page || "";

    if (!fileName) return;

    const response = await fetch(`/common/include/${fileName}`);
    const html = await response.text();

    const template = document.createElement("template");
    template.innerHTML = html;

    target.replaceWith(template.content);
    document.dispatchEvent(
      new CustomEvent("include:component-loaded", {
        detail: {
          componentName,
          pageName,
        },
      }),
    );

    if (componentName === "header-main" || componentName === "header-apply") {
      updateHeaderActive();
    }
  };

  /**
   * 문서 안의 모든 include 컴포넌트 순차 로드
   */
  const loadIncludes = async () => {
    let targets = Array.from(document.querySelectorAll("[data-include]"));

    while (targets.length) {
      await Promise.all(targets.map(loadComponent));
      targets = Array.from(document.querySelectorAll("[data-include]"));
    }
  };

  document.addEventListener("DOMContentLoaded", async () => {
    await loadIncludes();
    document.dispatchEvent(new CustomEvent("include:loaded"));
  });
})();
