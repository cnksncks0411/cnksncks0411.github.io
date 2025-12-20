document.addEventListener('DOMContentLoaded', () => {

    // 1. Scroll Animations (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });

    // 2. Mobile Menu Toggle
    const menuBtn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('nav');

    // Add mobile menu styles dynamically for simplicity
    const mobileStyle = document.createElement('style');
    mobileStyle.innerHTML = `
        .nav.active {
            display: flex;
            position: fixed;
            top: 80px; left: 0; right: 0; bottom: 0;
            background: white;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
            z-index: 999;
        }
        .nav.active .nav-list {
            flex-direction: column;
            font-size: 24px;
        }
    `;
    document.head.appendChild(mobileStyle);

    menuBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
        menuBtn.textContent = nav.classList.contains('active') ? '✕' : '☰';
    });

    // Close menu when link clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            menuBtn.textContent = '☰';
        });
    });

    // 3. Form Submission Handling with Success Modal
    const form = document.getElementById('consultingForm');
    const modal = document.getElementById('successModal');
    const closeModal = document.getElementById('closeModal');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Checkbox Validation
        const checkboxes = form.querySelectorAll('input[name="service"]:checked');
        if (checkboxes.length === 0) {
            alert('필요한 서비스를 최소 1개 이상 선택해주세요.');
            return;
        }

        // Basic Validation
        const btn = form.querySelector('.submit-btn');
        const originalText = btn.textContent;

        btn.textContent = '전송 중...';
        btn.disabled = true;

        // Simulate Network Request
        setTimeout(() => {
            modal.style.display = 'flex';
            form.reset();
            btn.textContent = originalText;
            btn.disabled = false;
        }, 1500);
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 4. Header Scroll Effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

});
