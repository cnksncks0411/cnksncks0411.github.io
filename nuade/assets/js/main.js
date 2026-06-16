(function () {
  var header = document.querySelector("[data-header]");
  var popup = document.querySelector("[data-popup]");
  var closeButton = document.querySelector("[data-popup-close]");
  var todayButton = document.querySelector("[data-popup-today]");
  var popupKey = "nuade_popup_closed_today";

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
    if (event.key === "Escape") hidePopup();
  });
})();
