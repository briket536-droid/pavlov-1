import '../css/input.css';

document.addEventListener('DOMContentLoaded', () => {
    // Reveal onto scroll animation
    const revealElements = document.querySelectorAll('.reveal');

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // Smooth scroll for anchors — использует scroll-margin-top из CSS
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const margin = parseInt(getComputedStyle(target).scrollMarginTop) || 0;
                window.scrollTo({
                    top: target.offsetTop - margin,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Calculator Logic ---
    const calcForm = document.getElementById('calcForm');
    if (calcForm) {
        const employeesRange = document.getElementById('employeesRange');
        const operationsRange = document.getElementById('operationsRange');
        const employeesVal = document.getElementById('employeesVal');
        const operationsVal = document.getElementById('operationsVal');
        const totalPriceEl = document.getElementById('totalPrice');
        const taxButtons = document.querySelectorAll('.toggle-btn');
        const taxInput = document.getElementById('taxInput');

        const calculatePrice = () => {
            const basePrice = 15000;
            const employeeRate = 500;
            const operationRate = 100;

            let taxMultiplier = 1;
            if (taxInput.value === 'ОСНО') taxMultiplier = 1.3;
            if (taxInput.value === 'УСН') taxMultiplier = 1.1;

            const total = (basePrice + (employeesRange.value * employeeRate) + (operationsRange.value * operationRate)) *
                taxMultiplier;
            if (totalPriceEl) totalPriceEl.textContent = Math.round(total).toLocaleString('ru-RU') + ' ₽';
        };

        employeesRange.addEventListener('input', () => {
            if (employeesVal) employeesVal.textContent = employeesRange.value;
            calculatePrice();
        });

        operationsRange.addEventListener('input', () => {
            if (operationsVal) operationsVal.textContent = operationsRange.value;
            calculatePrice();
        });

        taxButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                taxButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                taxInput.value = btn.dataset.value;
                calculatePrice();
            });
        });

    }

    // --- Form Handling ---
    const auditForm = document.getElementById('auditForm');
    const auditStatus = document.getElementById('auditStatus');
    const auditSubmitBtn = document.getElementById('auditSubmitBtn');

    if (auditForm) {
        auditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(auditForm);

            if (auditSubmitBtn) {
                auditSubmitBtn.disabled = true;
                auditSubmitBtn.textContent = 'ОТПРАВКА...';
            }

            await sendData(formData, 'Заявка на аудит', auditStatus);

            if (auditSubmitBtn) {
                auditSubmitBtn.disabled = false;
                auditSubmitBtn.textContent = 'ЗАПИСАТЬСЯ НА АУДИТ';
            }
        });
    }

    async function sendData(formData, subject, statusEl) {
        formData.append('subject', subject);

        try {
            const response = await fetch('https://formspree.io/f/mrenqgjq', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                if (statusEl) {
                    statusEl.textContent = 'Спасибо! Заявка успешно отправлена.';
                    statusEl.className = 'form-status success';
                }
                if (auditForm) auditForm.reset();
            } else {
                if (statusEl) {
                    statusEl.textContent = 'Ошибка отправки. Попробуйте позже.';
                    statusEl.className = 'form-status error';
                }
            }
        } catch (error) {
            if (statusEl) {
                statusEl.textContent = 'Заявка принята! (Демо-режим)';
                statusEl.className = 'form-status success';
            }
        }
    }
});

// ==================== QUIZ MODAL LOGIC ====================

const quizModal = document.getElementById('quizModal');
const modalPriceValue = document.getElementById('modalPriceValue');
const modalPhone = document.getElementById('modalPhone');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');

let quizData = {};

// Открыть модалку с ценой
function openQuizModal() {
    const form = document.getElementById('calcForm');
    if (form) {
        const formData = new FormData(form);
        quizData = {
            ownership: formData.get('ownership') || document.getElementById('ownershipSelect')?.value || 'ООО',
            tax_system: document.getElementById('taxInput')?.value || 'ОСНО',
            employees: document.getElementById('employeesRange')?.value || '0',
            operations: document.getElementById('operationsRange')?.value || '100'
        };
    }

    const price = calculateQuizPrice(quizData);
    modalPriceValue.textContent = price.toLocaleString('ru-RU');

    showModalScreen('modalScreenPrice');

    quizModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => modalPhone?.focus(), 300);
}

function closeQuizModal() {
    quizModal.classList.remove('active');
    document.body.style.overflow = '';
    resetQuizModal();
}

function resetQuizModal() {
    modalPhone.value = '';
    modalSubmitBtn.disabled = false;
    modalSubmitBtn.textContent = 'Получить расчёт и аудит';
    showModalScreen('modalScreenPrice');
}

function showModalScreen(screenId) {
    document.querySelectorAll('.modal-screen').forEach(s => s.classList.remove('modal-screen-active'));
    document.getElementById(screenId)?.classList.add('modal-screen-active');
}

function calculateQuizPrice(data) {
    const basePrice = 15000;
    const ownershipMultiplier = data.ownership === 'ООО' ? 2.0 : 1.0;
    const employeesCost = (parseInt(data.employees) || 0) * 500;
    const operationsCost = (parseInt(data.operations) || 0) * 100;

    let taxMultiplier = 1.0;
    if (data.tax_system === 'ОСНО') taxMultiplier = 1.3;
    if (data.tax_system === 'УСН') taxMultiplier = 1.1;
    if (data.tax_system === 'Патент') taxMultiplier = 1.0;

    return Math.round((basePrice * ownershipMultiplier + employeesCost + operationsCost) * taxMultiplier);
}

function maskPhone(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.startsWith('7') || value.startsWith('8')) {
        value = value.substring(1);
    }

    let formatted = '+7';
    if (value.length > 0) formatted += ' (' + value.substring(0, 3);
    if (value.length >= 3) formatted += ') ' + value.substring(3, 6);
    if (value.length >= 6) formatted += '-' + value.substring(6, 8);
    if (value.length >= 8) formatted += '-' + value.substring(8, 10);

    input.value = formatted.substring(0, 18);
}

function validatePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
}

async function submitQuizLead() {
    const phone = modalPhone.value.trim();

    if (!validatePhone(phone)) {
        modalPhone.style.borderColor = '#ff4d4d';
        modalPhone.placeholder = 'Введите корректный номер';
        modalPhone.focus();
        return;
    }

    modalPhone.style.borderColor = '';
    modalSubmitBtn.disabled = true;
    modalSubmitBtn.textContent = 'Отправка...';

    const formData = new FormData();
    formData.append('source', 'quiz');
    formData.append('phone', phone);
    formData.append('name', 'Квиз-калькулятор');
    formData.append('ownership', quizData.ownership);
    formData.append('tax_system', quizData.tax_system);
    formData.append('employees', quizData.employees);
    formData.append('operations', quizData.operations);
    formData.append('price', modalPriceValue.textContent);

    try {
        const response = await fetch('https://formspree.io/f/mrenqgjq', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            showModalScreen('modalScreenSuccess');
        } else {
            throw new Error('Server error');
        }
    } catch (error) {
        showModalScreen('modalScreenError');
    }
}

// onclick в HTML не видит функции из модуля — выносим в window
window.closeQuizModal = closeQuizModal;
window.submitQuizLead = submitQuizLead;
window.resetQuizModal = resetQuizModal;

document.addEventListener('DOMContentLoaded', () => {
    const bookBtn = document.getElementById('bookBtn');
    if (bookBtn) {
        bookBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openQuizModal();
        });
    }

    if (modalPhone) {
        modalPhone.addEventListener('input', () => maskPhone(modalPhone));
        modalPhone.addEventListener('focus', () => {
            if (!modalPhone.value) modalPhone.value = '+7';
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && quizModal.classList.contains('active')) {
            closeQuizModal();
        }
    });

    quizModal?.addEventListener('click', (e) => {
        if (e.target === quizModal) closeQuizModal();
    });
});