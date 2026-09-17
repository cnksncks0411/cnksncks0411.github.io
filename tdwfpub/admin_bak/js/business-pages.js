(() => {
  const pageTitles = {
    evaluation: "평가관리",
    "field-status": "선발부문별 지원현황",
    "type-status": "전형유형별 지원현황",
    "preselect-assign": "예비선발자지정현황",
    "preselect-manage": "예비선발자 관리",
    "document-review": "서류심사 관리",
    "preselect-status": "예비선발자 현황",
    "final-manage": "최종선발자관리",
    "final-approval": "최종선발자결재",
    "final-status": "최종선발자 현황",
  };

  const target = document.querySelector("[data-business-page]");
  const pageTitle = pageTitles[document.body.dataset.page];

  if (document.body.dataset.section !== "regular" || !target || !pageTitle) return;

  document.title = `${pageTitle} | 화물복지재단 관리자`;
  target.innerHTML = `
    <div class="page-title">
      <h1>${pageTitle}</h1>
      <nav class="breadcrumb" aria-label="현재 위치">
        <a href="/tdwfpub/admin_bak/admin-main.html">Home</a>
        <span class="material-symbols-rounded" aria-hidden="true">chevron_forward</span>
        <a href="/tdwfpub/admin_bak/regular/evaluation-list.html">정기사업관리</a>
        <span class="material-symbols-rounded" aria-hidden="true">chevron_forward</span>
        <span aria-current="page">${pageTitle}</span>
      </nav>
    </div>`;
})();
