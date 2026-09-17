(() => {
  const componentFiles = {
    "header": "/cooperation/include/header.html",
    "footer": "/cooperation/include/footer.html",
    "lnb-recruitment": "/cooperation/include/lnb-recruitment.html",
    "lnb-screening": "/cooperation/include/lnb-screening.html",
    "lnb-partner": "/cooperation/include/lnb-partner.html",
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
