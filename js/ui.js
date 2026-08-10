// ui.js - Funções de UI compartilhadas (quebra o import circular)
const TOAST_ICONS = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
};

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = TOAST_ICONS[type] || TOAST_ICONS.info;

    const msg = document.createElement('span');
    msg.className = 'toast-message';
    msg.textContent = message;

    const dismiss = document.createElement('button');
    dismiss.className = 'toast-dismiss';
    dismiss.type = 'button';
    dismiss.setAttribute('aria-label', 'Fechar notificacao');
    dismiss.textContent = '✕';
    dismiss.addEventListener('click', () => toast.remove());

    toast.append(icon, msg, dismiss);
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(24px)';
            toast.style.transition = 'opacity .3s, transform .3s';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function openModal({ title, bodyContent, actions = [] }) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalActions = document.getElementById('modal-actions');
    const modalClose = document.getElementById('modal-close');

    if (!modalOverlay || !modalTitle || !modalBody || !modalActions) return;

    modalTitle.textContent = title || '';
    modalBody.replaceChildren();

    if (typeof bodyContent === 'string') {
        const p = document.createElement('p');
        p.textContent = bodyContent;
        modalBody.appendChild(p);
    } else if (bodyContent instanceof HTMLElement) {
        modalBody.appendChild(bodyContent);
    } else if (Array.isArray(bodyContent)) {
        bodyContent.forEach(el => {
            if (el instanceof HTMLElement) modalBody.appendChild(el);
        });
    }

    modalActions.replaceChildren();
    actions.forEach(action => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `button ${action.variant || 'button-primary'}`;
        btn.textContent = action.label || '';
        if (action.onClick) btn.addEventListener('click', action.onClick);
        modalActions.appendChild(btn);
    });

    if (modalClose) {
        modalClose.onclick = () => closeModal();
    }

    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    };

    modalOverlay.classList.remove('closing');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (!modalOverlay) return;

    modalOverlay.classList.add('closing');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';

    setTimeout(() => {
        modalOverlay.classList.remove('closing');
    }, 300);
}

function createSpinner() {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    spinner.setAttribute('aria-hidden', 'true');
    return spinner;
}

function setButtonLoading(button, isLoading, originalText) {
    if (!button) return;

    if (isLoading) {
        button.disabled = true;
        button.classList.add('button-loading');
        button.dataset.originalText = originalText || button.textContent;
        button.textContent = '';
        button.appendChild(createSpinner());
        const loadingText = document.createTextNode(' Processando...');
        button.appendChild(loadingText);
    } else {
        button.disabled = false;
        button.classList.remove('button-loading');
        const original = button.dataset.originalText || 'Finalizar pedido';
        button.textContent = original;
    }
}

export { formatCurrency, showToast, openModal, closeModal, createSpinner, setButtonLoading };
