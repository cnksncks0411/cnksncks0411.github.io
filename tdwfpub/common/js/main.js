document.addEventListener("DOMContentLoaded", () => {
  /**
   * 탭 키보드 이동 이벤트 연결
   */
  const bindTabKeyboard = (tabs, activateTab) => {
    tabs.forEach((tab, index) => {
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
  };

  /**
   * 기본 탭과 연결 패널 활성화
   */
  const setTabActive = (tabs, tab) => {
    tabs.forEach((item) => {
      const isActive = item === tab;
      const panel = document.getElementById(item.getAttribute("aria-controls"));

      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
      item.tabIndex = isActive ? 0 : -1;

      if (panel) panel.hidden = !isActive;
    });
  };

  /**
   * 해시와 연결되지 않은 탭 UI 초기화
   */
  const bindSimpleTabs = (selector) => {
    document.querySelectorAll(`${selector}:not([data-simple-tabs-bound])`).forEach((container) => {
      const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
      if (!tabs.length) return;

      container.dataset.simpleTabsBound = "true";

      /**
       * 선택한 탭과 연결 패널 활성화
       */
      const activateTab = (tab) => setTabActive(tabs, tab);

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => activateTab(tab));
      });

      bindTabKeyboard(tabs, activateTab);
    });
  };

  /**
   * 메인 비주얼 슬라이드 초기화
   */
  const bindHomeVisualSlider = () => {
    const homeVisualSlider = document.querySelector("[data-home-visual-slider]");
    if (!homeVisualSlider || !window.Swiper || homeVisualSlider.dataset.homeVisualBound) return;

    const currentText = document.querySelector("[data-home-visual-current]");
    const totalText = document.querySelector("[data-home-visual-total]");
    const prevButton = document.querySelector("[data-home-visual-prev]");
    const nextButton = document.querySelector("[data-home-visual-next]");
    const toggleButton = document.querySelector("[data-home-visual-toggle]");
    const toggleIcon = toggleButton ? toggleButton.querySelector("[data-home-visual-toggle-icon]") : null;
    const slideTotal = homeVisualSlider.querySelectorAll("[data-home-visual-slide]").length;

    homeVisualSlider.dataset.homeVisualBound = "true";

    /**
     * 슬라이드 번호 두 자리 문자열 변환
     */
    const formatSlideNumber = (number) => String(number).padStart(2, "0");

    if (totalText) totalText.textContent = formatSlideNumber(slideTotal);

    const homeSwiper = new Swiper(homeVisualSlider, {
      loop: true,
      speed: 1000,
      navigation: {
        prevEl: prevButton,
        nextEl: nextButton,
      },
      a11y: {
        prevSlideMessage: "이전 안내",
        nextSlideMessage: "다음 안내",
      },
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
      },
      on: {
        init(swiper) {
          if (currentText) currentText.textContent = formatSlideNumber(swiper.realIndex + 1);
        },
        slideChange(swiper) {
          if (currentText) currentText.textContent = formatSlideNumber(swiper.realIndex + 1);
        },
      },
    });

    if (toggleButton && toggleIcon) {
      toggleButton.addEventListener("click", () => {
        const isRunning = homeSwiper.autoplay.running;

        if (isRunning) {
          homeSwiper.autoplay.stop();
          toggleIcon.textContent = "play_arrow";
          toggleButton.setAttribute("aria-label", "재생");
          return;
        }

        homeSwiper.autoplay.start();
        toggleIcon.textContent = "pause";
        toggleButton.setAttribute("aria-label", "일시정지");
      });
    }
  };

  /**
   * 회의실 이미지 슬라이드 초기화
   */
  const bindMeetingRoomSlider = () => {
    const meetingRoomSlider = document.querySelector("[data-meeting-room-slider]");
    if (!meetingRoomSlider || !window.Swiper || meetingRoomSlider.dataset.meetingRoomBound) return;

    const prevButton = document.querySelector("[data-meeting-room-prev]");
    const nextButton = document.querySelector("[data-meeting-room-next]");
    const pagination = document.querySelector("[data-meeting-room-pagination]");

    meetingRoomSlider.dataset.meetingRoomBound = "true";

    new Swiper(meetingRoomSlider, {
      loop: true,
      speed: 600,
      navigation: {
        prevEl: prevButton,
        nextEl: nextButton,
      },
      pagination: {
        el: pagination,
        clickable: true,
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      a11y: {
        prevSlideMessage: "이전 회의실 이미지",
        nextSlideMessage: "다음 회의실 이미지",
      },
    });
  };

  /**
   * 임원소개 조직도 이미지맵과 정보 표 연결
   */
  const bindExecutivesMap = () => {
    const mapImage = document.querySelector("[data-executives-map-image]");
    const imageMap = document.querySelector("[data-executives-map]");
    if (!mapImage || !imageMap || imageMap.dataset.executivesMapBound) return;

    const areas = Array.from(imageMap.querySelectorAll("[data-executives-target]"));
    const panels = Array.from(document.querySelectorAll("[data-executives-panel]"));
    if (!areas.length || !panels.length) return;

    imageMap.dataset.executivesMapBound = "true";

    /**
     * 반응형 이미지 크기에 맞춰 이미지맵 좌표 조정
     */
    const resizeMapAreas = () => {
      const baseWidth = mapImage.naturalWidth || Number(mapImage.getAttribute("width"));
      const baseHeight = mapImage.naturalHeight || Number(mapImage.getAttribute("height"));
      if (!baseWidth || !baseHeight || !mapImage.clientWidth || !mapImage.clientHeight) return;

      const scaleX = mapImage.clientWidth / baseWidth;
      const scaleY = mapImage.clientHeight / baseHeight;

      areas.forEach((area) => {
        const originalCoords = area.dataset.originalCoords.split(",").map(Number);
        area.coords = originalCoords
          .map((coordinate, index) => Math.round(coordinate * (index % 2 === 0 ? scaleX : scaleY)))
          .join(",");
      });
    };

    /**
     * 선택한 조직에 해당하는 정보 표 노출
     */
    const activatePanel = (area) => {
      const targetId = area.dataset.executivesTarget;

      panels.forEach((panel) => {
        panel.hidden = panel.id !== targetId;
      });

      areas.forEach((item) => {
        if (item === area) item.setAttribute("aria-current", "true");
        else item.removeAttribute("aria-current");
      });
    };

    areas.forEach((area) => {
      area.addEventListener("click", (event) => {
        event.preventDefault();
        activatePanel(area);
      });
    });

    if (mapImage.complete) resizeMapAreas();
    else mapImage.addEventListener("load", resizeMapAreas, { once: true });

    if (window.ResizeObserver) {
      const mapResizeObserver = new ResizeObserver(resizeMapAreas);
      mapResizeObserver.observe(mapImage);
    } else {
      window.addEventListener("resize", resizeMapAreas);
    }
  };

  /**
   * 메인 전용 인터랙션 초기화
   */
  const initMain = () => {
    bindSimpleTabs("[data-simple-tabs]");
    bindHomeVisualSlider();
    bindMeetingRoomSlider();
    bindExecutivesMap();
  };

  initMain();

  document.addEventListener("include:loaded", initMain);
});
