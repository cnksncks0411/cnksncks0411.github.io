document.addEventListener('DOMContentLoaded', () => {

    // 1. Header & Logo Scroll Animation
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Scroll Appear Animation (Intersection Observer)
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    const appearElements = document.querySelectorAll('.appear-item');
    appearElements.forEach(el => {
        appearOnScroll.observe(el);
    });

    // 3. Before / After Slider Interaction
    const sliderBox = document.getElementById('beforeAfterSlider');
    const beforeImage = document.getElementById('beforeImageWrapper');
    const handle = document.getElementById('sliderHandle');

    let isSliding = false;

    function slideMove(e) {
        if (!isSliding) return;

        let clientX;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }

        const rect = sliderBox.getBoundingClientRect();
        let xPos = clientX - rect.left;

        // Boundaries
        if (xPos < 0) xPos = 0;
        if (xPos > rect.width) xPos = rect.width;

        const percent = (xPos / rect.width) * 100;

        beforeImage.style.width = `${percent}%`;
        handle.style.left = `${percent}%`;
    }

    sliderBox.addEventListener('mousedown', () => isSliding = true);
    sliderBox.addEventListener('touchstart', () => isSliding = true);

    window.addEventListener('mouseup', () => isSliding = false);
    window.addEventListener('touchend', () => isSliding = false);

    window.addEventListener('mousemove', slideMove);
    window.addEventListener('touchmove', slideMove);

    // 4. FAQ Accordion
    const faqs = document.querySelectorAll('.faq-item');

    faqs.forEach(faq => {
        const qBox = faq.querySelector('.faq-q');
        const aBox = faq.querySelector('.faq-a');
        const icon = qBox.querySelector('.icon');

        qBox.addEventListener('click', () => {
            const isOpen = aBox.style.display === 'block';

            // Close all others
            faqs.forEach(item => {
                item.querySelector('.faq-a').style.display = 'none';
                item.querySelector('.icon').textContent = '+';
            });

            if (!isOpen) {
                aBox.style.display = 'block';
                icon.textContent = '-';
            }
        });
    });

    // 5. Form Submission
    const form = document.getElementById('consultingForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Mock submission
        alert('무료 상담 신청이 완료되었습니다. 담당자가 확인 후 빠른 시일 내에 연락드리겠습니다.');
        form.reset();
    });
});
