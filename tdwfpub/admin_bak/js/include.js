(() => {
  const componentFiles = {
    "header": "/tdwfpub/admin_bak/include/header.html",
    "footer": "/tdwfpub/admin_bak/include/footer.html",
    "lnb-community": "/tdwfpub/admin_bak/include/lnb-community.html",
    "lnb-partner": "/tdwfpub/admin_bak/include/lnb-partner.html",
    "lnb-user": "/tdwfpub/admin_bak/include/lnb-user.html",
    "lnb-system": "/tdwfpub/admin_bak/include/lnb-system.html",
    "lnb-basic": "/tdwfpub/admin_bak/include/lnb-basic.html",
    "lnb-recruitment": "/tdwfpub/admin_bak/include/lnb-recruitment.html",
    "lnb-regular": "/tdwfpub/admin_bak/include/lnb-regular.html",
    "lnb-followup": "/tdwfpub/admin_bak/include/lnb-followup.html",
    "lnb-transfer": "/tdwfpub/admin_bak/include/lnb-transfer.html",
    "lnb-site": "/tdwfpub/admin_bak/include/lnb-site.html",
    "lnb-report": "/tdwfpub/admin_bak/include/lnb-report.html",
  };

  /**
   * data-include 대상 관리자 컴포넌트 로드
   */
  const loadComponent = async (target) => {
    const componentName = target.dataset.include;
    const fileName = componentFiles[componentName];
    const pageName = target.dataset.page || "";

    if (!fileName) {
      target.removeAttribute("data-include");
      return;
    }

    const response = await fetch(fileName);
    const html = await response.text();

    const template = document.createElement("template");
    template.innerHTML = html;

    target.replaceWith(template.content);
    document.dispatchEvent(
      new CustomEvent("admin:component-loaded", {
        detail: {
          componentName,
          pageName,
        },
      }),
    );
  };

  /**
   * 문서 안의 모든 관리자 include 컴포넌트 순차 로드
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
    document.dispatchEvent(new CustomEvent("admin:include-loaded"));
  });
})();
