// ==========================================
// [설정] 구글 Apps Script 배포 URL을 아래에 입력하세요.
// 예: 'https://script.google.com/macros/s/AKfycbx.../exec'
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQNWJ63FwLh36x1Iq4vgCq6sTWdvuEw0yrbT6txsD09U3RcwNDdZEUyGOZHKNEvtvtDg/exec';
// ==========================================

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
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });

    // 2. Mobile Menu Toggle
    const menuBtn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('nav');

    // Add mobile menu styles dynamically
    const mobileStyle = document.createElement('style');
    mobileStyle.innerHTML = `
        .nav.active {
            display: flex;
            position: fixed;
            top: 80px; left: 0; right: 0; bottom: 0;
            background: white; /* 95% opacity applied in CSS, keep header consistent */
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
            z-index: 999;
        }
        .nav.active .nav-list {
            flex-direction: column;
            font-size: 24px;
            gap: 30px;
        }
    `;
    document.head.appendChild(mobileStyle);

    menuBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
        menuBtn.textContent = nav.classList.contains('active') ? '✕' : '☰';
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            menuBtn.textContent = '☰';
        });
    });

    // 3. Form Submission Handling (Google Sheets)
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

        // 2. Prepare Data
        const btn = form.querySelector('.submit-btn');
        const originalText = btn.textContent;

        // 로딩 스피너와 함께 '전송 중...' 표시
        btn.innerHTML = '<span class="spinner"></span> 전송 중...';
        btn.disabled = true;

        const formData = new FormData(form);
        const data = {};

        // Handle standard fields
        formData.forEach((value, key) => {
            if (key === 'service') {
                // Checkboxes are handled separately to creates an array
                if (!data[key]) {
                    data[key] = [];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });

        // 3. Send to Google Apps Script
        if (GOOGLE_SCRIPT_URL.includes('ENTER_YOUR') || GOOGLE_SCRIPT_URL === '') {
            alert('오류: 구글 스프레드시트 연동 URL이 설정되지 않았습니다.');
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        // CORS 모드로 변경하여 에러 응답을 감지하도록 수정
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            // mode: 'no-cors' 제거 -> 표준 CORS 요청으로 변경
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // GAS는 text/plain을 좋아함
            },
        })
            .then(response => {
                if (!response.ok) {
                    // 403, 404, 500 등 오류 발생 시 에러 던짐
                    throw new Error(`Server returned ${response.status} ${response.statusText}`);
                }
                return response.json(); // 성공 시 JSON 응답 파싱
            })
            .then(result => {
                if (result.result === 'success') {
                    modal.style.display = 'flex'; // 성공 시 모달 표시
                    form.reset();
                } else {
                    throw new Error(result.error || 'Unknown error from script');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('전송 실패: ' + error.message + '\n\nApps Script 배포 시 "액세스 권한이 있는 사용자"를 "모든 사용자"로 설정했는지 확인해주세요.');
            })
            .finally(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            });
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

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
