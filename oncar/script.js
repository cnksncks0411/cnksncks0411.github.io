const HEADLINE_VARIANTS = ["a", "b", "c"];

document.addEventListener("DOMContentLoaded", () => {
  initHeadlineTest();
  initScrollReveal();
  initCountUps();
  initComparisonSlider();
  initSmoothButtons();
  initParallax();
  initForm();
  initTracking();
  initHeatmapHook();
});

function initHeadlineTest() {
  const variants = Array.from(document.querySelectorAll(".headline-variant"));
  const title = document.querySelector(".hero-title");

  if (!variants.length || !title) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const forced = params.get("ab");
  const storageKey = "onka-headline-variant";
  let selected = forced && HEADLINE_VARIANTS.includes(forced)
    ? forced
    : window.sessionStorage.getItem(storageKey);

  if (!selected) {
    selected = HEADLINE_VARIANTS[Math.floor(Math.random() * HEADLINE_VARIANTS.length)];
    window.sessionStorage.setItem(storageKey, selected);
  }

  variants.forEach((variant) => {
    variant.classList.toggle("is-active", variant.dataset.variant === selected);
  });

  syncHeroTitleHeight(title, variants);
  window.addEventListener("resize", () => syncHeroTitleHeight(title, variants));
  trackEvent("headline_exposed", { variant: selected });
}

function syncHeroTitleHeight(title, variants) {
  const heights = variants.map((variant) => {
    const wasActive = variant.classList.contains("is-active");
    if (!wasActive) {
      variant.classList.add("is-active");
    }

    const height = variant.getBoundingClientRect().height;

    if (!wasActive) {
      variant.classList.remove("is-active");
    }

    return height;
  });

  title.style.minHeight = `${Math.ceil(Math.max(...heights))}px`;
}

function initScrollReveal() {
  const targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: "0px 0px -10% 0px"
  });

  targets.forEach((target) => observer.observe(target));
}

function initCountUps() {
  const counters = document.querySelectorAll(".count-up");
  if (!counters.length) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.counted === "true") {
        return;
      }

      animateNumber(entry.target, Number(entry.target.dataset.count));
      entry.target.dataset.counted = "true";
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.4
  });

  counters.forEach((counter) => observer.observe(counter));
}

function animateNumber(element, target) {
  const duration = 1200;
  const start = performance.now();

  const step = (timestamp) => {
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent = String(target);
    }
  };

  window.requestAnimationFrame(step);
}

function initComparisonSlider() {
  const range = document.getElementById("comparisonRange");
  const after = document.getElementById("comparisonAfter");
  const handle = document.getElementById("comparisonHandle");

  if (!range || !after || !handle) {
    return;
  }

  const updateSlider = (value) => {
    const nextValue = Math.max(0, Math.min(100, Number(value)));

    if (window.innerWidth < 980) {
      after.style.height = `${100 - nextValue}%`;
      handle.style.top = `${nextValue}%`;
      handle.style.left = "50%";
    } else {
      after.style.width = `${100 - nextValue}%`;
      handle.style.left = `${nextValue}%`;
      handle.style.top = "50%";
    }
  };

  updateSlider(range.value);
  range.addEventListener("input", (event) => {
    updateSlider(event.target.value);
  });

  window.addEventListener("resize", () => updateSlider(range.value));
}

function initSmoothButtons() {
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scrollTarget);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function initParallax() {
  const visual = document.querySelector("[data-parallax]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!visual || reducedMotion || window.innerWidth < 980) {
    return;
  }

  const updateParallax = () => {
    const rect = visual.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const visualCenter = rect.top + rect.height / 2;
    const distance = (viewportCenter - visualCenter) / window.innerHeight;
    visual.style.transform = `translate3d(0, ${distance * 16}px, 0)`;
  };

  updateParallax();
  window.addEventListener("scroll", updateParallax, { passive: true });
  window.addEventListener("resize", updateParallax);
}

function initForm() {
  const form = document.getElementById("leadForm");
  const feedback = document.getElementById("formFeedback");
  const success = document.getElementById("formSuccess");

  if (!form || !feedback || !success) {
    return;
  }

  const fields = Array.from(form.querySelectorAll("input"));

  fields.forEach((field) => {
    field.addEventListener("focus", () => {
      trackEvent("form_field_focus", { field: field.name });
    }, { once: true });

    field.addEventListener("change", () => {
      trackEvent("form_field_change", { field: field.name });
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const payload = Object.fromEntries(new FormData(form).entries());
    const errorMessage = validateLead(payload);

    feedback.className = "form-feedback";
    feedback.textContent = "";

    if (errorMessage) {
      feedback.textContent = errorMessage;
      feedback.classList.add("is-error");
      trackEvent("form_validation_error", { message: errorMessage });
      return;
    }

    trackEvent("form_submit", payload);
    form.hidden = true;
    success.hidden = false;
    trackEvent("form_success_view");
  });
}

function validateLead(payload) {
  if (!payload.name?.trim()) {
    return "이름을 입력해주세요.";
  }

  const phone = (payload.phone || "").replace(/\D/g, "");
  if (phone.length < 10 || phone.length > 11) {
    return "연락처를 정확히 입력해주세요.";
  }

  if (!payload.model?.trim()) {
    return "원하는 차종을 입력해주세요.";
  }

  return "";
}

function initTracking() {
  window.dataLayer = window.dataLayer || [];
  window.onkaTrackingLog = window.onkaTrackingLog || [];

  document.querySelectorAll(".track-click").forEach((element) => {
    element.addEventListener("click", () => {
      const eventName = element.dataset.track || "cta_click";
      trackEvent(eventName, {
        text: element.textContent.trim()
      });
    });
  });
}

function trackEvent(name, detail = {}) {
  const payload = {
    event: name,
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
    ...detail
  };

  window.dataLayer = window.dataLayer || [];
  window.onkaTrackingLog = window.onkaTrackingLog || [];
  window.dataLayer.push(payload);
  window.onkaTrackingLog.push(payload);
}

function initHeatmapHook() {
  const config = window.ONKA_CONFIG || {};

  if (config.heatmapVendor !== "clarity" || !config.clarityId) {
    return;
  }

  window.clarity = window.clarity || function clarity() {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${config.clarityId}`;
  script.referrerPolicy = "strict-origin-when-cross-origin";
  document.head.appendChild(script);

  trackEvent("heatmap_loaded", { vendor: "clarity" });
}
