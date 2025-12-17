/**
 * 매출 성장 솔루션 & 인플루언서 마케팅 컨설팅 랜딩페이지
 * JavaScript - Animations, Interactions, Form Handling
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initScrollAnimations();
    initPainPointScroll();
    initComparisonSlider();
    initTimelineAnimation();
    initReviewsCarousel();
    initFormHandling();
    initConfetti();
});

/**
 * Scroll-triggered Animations
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Keep observing for re-animation if needed
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });

    // Add CSS for animate-on-scroll
    const style = document.createElement('style');
    style.textContent = `
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .animate-on-scroll.visible {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

/**
 * Pain Point Section - Sequential Reveal on Scroll
 */
function initPainPointScroll() {
    const painScenes = document.querySelectorAll('.pain-scene, .pain-conclusion');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // Allow fade out when scrolling away
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    painScenes.forEach(scene => {
        observer.observe(scene);
    });
}

/**
 * Before/After Comparison Slider
 */
function initComparisonSlider() {
    const slider = document.querySelector('.comparison-slider');
    const handle = document.getElementById('sliderHandle');
    const beforeSide = document.getElementById('comparisonBefore');
    const afterSide = document.getElementById('comparisonAfter');

    if (!slider || !handle || !beforeSide || !afterSide) return;

    let isDragging = false;
    let sliderRect;

    // Only activate on desktop
    if (window.innerWidth < 769) return;

    // Set initial position
    const setPosition = (percentage) => {
        const clampedPercentage = Math.max(10, Math.min(90, percentage));
        handle.style.left = `${clampedPercentage}%`;
        beforeSide.style.clipPath = `inset(0 ${100 - clampedPercentage}% 0 0)`;
        afterSide.style.clipPath = `inset(0 0 0 ${clampedPercentage}%)`;
    };

    // Initialize
    setPosition(50);

    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        sliderRect = slider.getBoundingClientRect();
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const x = e.clientX - sliderRect.left;
        const percentage = (x / sliderRect.width) * 100;
        setPosition(percentage);
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch support
    handle.addEventListener('touchstart', (e) => {
        isDragging = true;
        sliderRect = slider.getBoundingClientRect();
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        const x = e.touches[0].clientX - sliderRect.left;
        const percentage = (x / sliderRect.width) * 100;
        setPosition(percentage);
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });
}

/**
 * Timeline Animation - Draw line and reveal steps
 */
function initTimelineAnimation() {
    const timeline = document.querySelector('.timeline');
    const timelineSteps = document.querySelectorAll('.timeline-step');

    if (!timeline) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.3
    };

    // Observe timeline container for line animation
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                timeline.classList.add('animated');
            }
        });
    }, observerOptions);

    timelineObserver.observe(timeline);

    // Observe each step for reveal
    const stepObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Trigger confetti on final step
                if (entry.target.classList.contains('step-final')) {
                    setTimeout(() => {
                        triggerConfetti();
                    }, 500);
                }
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.5
    });

    timelineSteps.forEach((step, index) => {
        // Add staggered delay
        step.style.transitionDelay = `${index * 0.2}s`;
        stepObserver.observe(step);
    });
}

/**
 * Reviews Carousel
 */
function initReviewsCarousel() {
    const track = document.getElementById('reviewsTrack');
    const indicators = document.querySelectorAll('.review-indicators .indicator');
    const cards = document.querySelectorAll('.review-card');

    if (!track || cards.length === 0) return;

    let currentIndex = 0;
    let autoPlayInterval;

    const showSlide = (index) => {
        cards.forEach((card, i) => {
            card.classList.toggle('active', i === index);
        });

        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });

        currentIndex = index;
    };

    const nextSlide = () => {
        const nextIndex = (currentIndex + 1) % cards.length;
        showSlide(nextIndex);
    };

    // Click handlers for indicators
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSlide(index);
            resetAutoPlay();
        });
    });

    // Auto-play
    const startAutoPlay = () => {
        autoPlayInterval = setInterval(nextSlide, 5000);
    };

    const resetAutoPlay = () => {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    };

    startAutoPlay();

    // Pause on hover
    track.addEventListener('mouseenter', () => {
        clearInterval(autoPlayInterval);
    });

    track.addEventListener('mouseleave', () => {
        startAutoPlay();
    });

    // Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    const handleSwipe = () => {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next
                showSlide((currentIndex + 1) % cards.length);
            } else {
                // Swipe right - prev
                showSlide((currentIndex - 1 + cards.length) % cards.length);
            }
            resetAutoPlay();
        }
    };
}

/**
 * Form Handling
 */
function initFormHandling() {
    const form = document.getElementById('consultForm');
    const modal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModal');
    const inquiryTextarea = document.getElementById('inquiry');
    const charCount = document.getElementById('charCount');

    if (!form) return;

    // Character count for textarea
    if (inquiryTextarea && charCount) {
        inquiryTextarea.addEventListener('input', () => {
            charCount.textContent = inquiryTextarea.value.length;
        });
    }

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm(form)) {
            return;
        }

        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        console.log('Form submitted:', data);

        // Here you would typically send data to a server
        // For demo, we'll just show the success modal

        // Show success modal
        showModal();

        // Reset form
        form.reset();
        if (charCount) charCount.textContent = '0';
    });

    // Close modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideModal);
    }

    // Close modal on backdrop click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
            hideModal();
        }
    });

    function showModal() {
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    function hideModal() {
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    function validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = '#FF4444';

                field.addEventListener('input', function handler() {
                    if (field.value.trim()) {
                        field.style.borderColor = '';
                        field.removeEventListener('input', handler);
                    }
                });
            }
        });

        // Phone validation
        const phone = document.getElementById('phone');
        if (phone && phone.value) {
            const phonePattern = /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/;
            if (!phonePattern.test(phone.value.replace(/\s/g, ''))) {
                isValid = false;
                phone.style.borderColor = '#FF4444';
            }
        }

        return isValid;
    }
}

/**
 * Confetti Effect for Timeline Final Step
 */
function initConfetti() {
    // Confetti will be triggered by timeline observer
}

function triggerConfetti() {
    const container = document.getElementById('confetti');
    if (!container) return;

    const colors = ['#FF6B00', '#FFD700', '#FF4444', '#00C851', '#2196F3'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.cssText = `
            position: absolute;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            animation: confettiFall ${Math.random() * 2 + 1}s ease-out forwards;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        container.appendChild(confetti);

        // Remove after animation
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }

    // Add confetti animation if not exists
    if (!document.getElementById('confetti-styles')) {
        const style = document.createElement('style');
        style.id = 'confetti-styles';
        style.textContent = `
            @keyframes confettiFall {
                0% {
                    opacity: 1;
                    transform: translateY(0) rotate(0deg);
                }
                100% {
                    opacity: 0;
                    transform: translateY(100px) rotate(720deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Smooth Scroll for Anchor Links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 0;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

/**
 * Parallax Effect for Hero Image
 */
window.addEventListener('scroll', () => {
    const heroVisual = document.querySelector('.hero-visual');
    if (!heroVisual) return;

    const scrollY = window.scrollY;
    const maxScroll = window.innerHeight;

    if (scrollY < maxScroll) {
        const parallaxValue = scrollY * 0.3;
        heroVisual.style.transform = `translateY(${parallaxValue}px)`;
    }
});

/**
 * Lazy Load Images
 */
if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                imageObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

/**
 * Phone Number Auto-formatting
 */
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');

        if (value.length > 3 && value.length <= 7) {
            value = value.slice(0, 3) + '-' + value.slice(3);
        } else if (value.length > 7) {
            value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
        }

        e.target.value = value;
    });
}
