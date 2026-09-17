(() => {
  const componentFiles = {
    "header": "/tdwfpub/admin/include/header.html",
    "footer": "/tdwfpub/admin/include/footer.html",
    "lnb-community": "/tdwfpub/admin/include/lnb-community.html",
    "lnb-partner": "/tdwfpub/admin/include/lnb-partner.html",
    "lnb-user": "/tdwfpub/admin/include/lnb-user.html",
    "lnb-system": "/tdwfpub/admin/include/lnb-system.html",
    "lnb-basic": "/tdwfpub/admin/include/lnb-basic.html",
    "lnb-recruitment": "/tdwfpub/admin/include/lnb-recruitment.html",
    "lnb-screening": "/tdwfpub/admin/include/lnb-screening.html",
    "lnb-followup": "/tdwfpub/admin/include/lnb-followup.html",
    "lnb-followup-ended": "/tdwfpub/admin/include/lnb-followup-ended.html",
    "lnb-transfer": "/tdwfpub/admin/include/lnb-transfer.html",
    "lnb-site": "/tdwfpub/admin/include/lnb-site.html",
    "lnb-report": "/tdwfpub/admin/include/lnb-report.html",
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
