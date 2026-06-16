(function () {
  var header = document.querySelector("[data-header]");
  var popup = document.querySelector("[data-popup]");
  var closeButton = document.querySelector("[data-popup-close]");
  var todayButton = document.querySelector("[data-popup-today]");
  var inquiryForm = document.querySelector("[data-inquiry-form]");
  var formStatus = document.querySelector("[data-form-status]");
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var nav = document.querySelector(".gnb");
  var boardFilter = document.querySelector("[data-board-filter]");
  var boardList = document.querySelector("[data-board-list]");
  var pagination = document.querySelector("[data-pagination]");
  var popupKey = "nuade_popup_closed_today";
  var boardState = { filter: "all", page: 1, perPage: 10 };

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  }

  function todayValue() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function hidePopup() {
    if (!popup) return;
    popup.hidden = true;
    document.body.classList.remove("popup-open");
  }

  function showPopup() {
    if (!popup || localStorage.getItem(popupKey) === todayValue()) return;
    window.setTimeout(function () {
      popup.hidden = false;
      document.body.classList.add("popup-open");
    }, 700);
  }

  function closeMenu() {
    if (!menuToggle || !nav) return;
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "메뉴 열기");
  }

  function toggleMenu() {
    if (!menuToggle || !nav) return;
    var isOpen = document.body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
  showPopup();

  if (closeButton) {
    closeButton.addEventListener("click", hidePopup);
  }

  if (todayButton) {
    todayButton.addEventListener("click", function () {
      localStorage.setItem(popupKey, todayValue());
      hidePopup();
    });
  }

  if (popup) {
    popup.addEventListener("click", function (event) {
      if (event.target === popup) hidePopup();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      hidePopup();
      closeMenu();
    }
  });

  if (inquiryForm) {
    inquiryForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (formStatus) formStatus.hidden = false;
      inquiryForm.reset();
    });
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMenu);
  }

  if (nav) {
    nav.addEventListener("click", function (event) {
      if (event.target.tagName === "A") closeMenu();
    });
  }

  window.addEventListener("resize", function () {
    if (window.innerWidth > 720) closeMenu();
  });

  function boardItems() {
    if (!boardList) return [];
    return Array.prototype.slice.call(boardList.querySelectorAll(".board-row:not(.board-head)"));
  }

  function renderBoard() {
    if (!boardList || !pagination) return;
    var filtered = boardItems().filter(function (item) {
      return boardState.filter === "all" || item.dataset.type === boardState.filter;
    });
    var pages = Math.max(1, Math.ceil(filtered.length / boardState.perPage));
    if (boardState.page > pages) boardState.page = pages;
    var start = (boardState.page - 1) * boardState.perPage;
    var end = start + boardState.perPage;

    boardItems().forEach(function (item) {
      item.hidden = true;
    });
    filtered.slice(start, end).forEach(function (item) {
      item.hidden = false;
    });

    pagination.innerHTML = "";
    for (var i = 1; i <= pages; i += 1) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = String(i);
      button.dataset.page = String(i);
      button.setAttribute("aria-current", i === boardState.page ? "page" : "false");
      pagination.appendChild(button);
    }
  }

  if (boardFilter) {
    boardFilter.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-filter]");
      if (!button) return;
      boardState.filter = button.dataset.filter;
      boardState.page = 1;
      Array.prototype.forEach.call(boardFilter.querySelectorAll("button"), function (item) {
        item.setAttribute("aria-pressed", String(item === button));
      });
      renderBoard();
    });
  }

  if (pagination) {
    pagination.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-page]");
      if (!button) return;
      boardState.page = Number(button.dataset.page);
      renderBoard();
    });
  }

  renderBoard();
})();
