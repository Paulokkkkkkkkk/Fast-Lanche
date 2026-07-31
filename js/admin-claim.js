// admin-claim.js - Sistema de Reconhecimento de Admin (Admin Claim)
// Fase 24 - Gerencia solicitação e concessão de status de administrador

import { showToast } from './ui.js';
import { openAdminPanel } from './admin.js';

const STORAGE_KEY = 'fastlanche_admin_claim';

const DEFAULT_STATE = {
    role: 'customer',
    isAdmin: false,
    claimStatus: 'none', // 'none' | 'pending' | 'approved' | 'rejected'
    adminData: {
        restaurantName: '',
        address: '',
        phone: '',
        openingHours: {
            open: '',
            close: ''
        },
        description: ''
    },
    submittedAt: null,
    approvedAt: null,
    rejectedReason: ''
};

let currentClaim = { ...DEFAULT_STATE };

// ============================================
// UTILITÁRIOS
// ============================================

function isStorageAvailable() {
    try {
        return typeof window !== 'undefined' && Boolean(window.localStorage);
    } catch {
        return false;
    }
}

function normalizeText(value) {
    return String(value || '').trim();
}

function formatPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
}

function isValidPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
}

// ============================================
// PERSISTÊNCIA
// ============================================

function saveClaimData() {
    if (!isStorageAvailable()) return false;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentClaim));
        dispatchClaimUpdate();
        return true;
    } catch {
        return false;
    }
}

function loadClaimData() {
    if (!isStorageAvailable()) return false;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return false;

        const parsed = JSON.parse(stored);
        if (!parsed || typeof parsed !== 'object') return false;

        // Merge com dados default para garantir estrutura completa
        currentClaim = {
            ...DEFAULT_STATE,
            ...parsed,
            adminData: {
                ...DEFAULT_STATE.adminData,
                ...(parsed.adminData || {}),
                openingHours: {
                    ...DEFAULT_STATE.adminData.openingHours,
                    ...(parsed.adminData?.openingHours || {})
                }
            }
        };
        return true;
    } catch {
        console.warn('Nao foi possivel carregar dados de admin claim.');
        currentClaim = { ...DEFAULT_STATE };
        return false;
    }
}

// ============================================
// GETTERS
// ============================================

function getClaimStatus() {
    return currentClaim.claimStatus;
}

function isUserAdmin() {
    return currentClaim.isAdmin === true;
}

function getAdminData() {
    return { ...currentClaim.adminData };
}

function getClaimData() {
    return { ...currentClaim };
}

function getClaimStatusText() {
    switch (currentClaim.claimStatus) {
        case 'none':
            return 'Nenhuma solicitação';
        case 'pending':
            return 'Aguardando aprovação';
        case 'approved':
            return 'Aprovado';
        case 'rejected':
            return 'Rejeitado';
        default:
            return 'Desconhecido';
    }
}

// ============================================
// AÇÕES
// ============================================

function submitClaim(data) {
    const validation = validateClaimData(data);
    if (!validation.valid) {
        return { success: false, errors: validation.errors };
    }

    // Salvar dados do restaurante
    currentClaim.adminData = {
        restaurantName: normalizeText(data.restaurantName),
        address: normalizeText(data.address),
        phone: normalizeText(data.phone),
        openingHours: {
            open: data.openingOpen || '',
            close: data.openingClose || ''
        },
        description: normalizeText(data.description || '')
    };
    currentClaim.submittedAt = new Date().toISOString();

    // Auto-aprovação (simulação - sem backend real)
    currentClaim.claimStatus = 'approved';
    currentClaim.isAdmin = true;
    currentClaim.role = 'admin';
    currentClaim.approvedAt = new Date().toISOString();
    currentClaim.rejectedReason = '';

    saveClaimData();
    updateHeaderAdminButton();
    return { success: true, autoApproved: true };
}

function approveClaim() {
    if (currentClaim.claimStatus !== 'pending') {
        return { success: false, error: 'Nao ha solicitacao pendente para aprovar.' };
    }

    currentClaim.claimStatus = 'approved';
    currentClaim.isAdmin = true;
    currentClaim.role = 'admin';
    currentClaim.approvedAt = new Date().toISOString();
    currentClaim.rejectedReason = '';

    saveClaimData();
    updateHeaderAdminButton();
    return { success: true };
}

function rejectClaim(reason) {
    if (currentClaim.claimStatus !== 'pending') {
        return { success: false, error: 'Nao ha solicitacao pendente para rejeitar.' };
    }

    currentClaim.claimStatus = 'rejected';
    currentClaim.isAdmin = false;
    currentClaim.role = 'customer';
    currentClaim.rejectedReason = normalizeText(reason) || 'Solicitacao rejeitada.';
    currentClaim.approvedAt = null;

    saveClaimData();
    updateHeaderAdminButton();
    return { success: true };
}

function resetClaim() {
    currentClaim = { ...DEFAULT_STATE };
    saveClaimData();
    updateHeaderAdminButton();
}

// ============================================
// VALIDAÇÃO
// ============================================

function validateClaimData(data) {
    const errors = [];

    const restaurantName = normalizeText(data.restaurantName);
    if (!restaurantName) {
        errors.push('Nome do restaurante é obrigatório.');
    } else if (restaurantName.length < 3) {
        errors.push('Nome do restaurante deve ter pelo menos 3 caracteres.');
    }

    const address = normalizeText(data.address);
    if (!address) {
        errors.push('Endereço é obrigatório.');
    } else if (address.length < 10) {
        errors.push('Endereço deve ter pelo menos 10 caracteres.');
    }

    const phone = normalizeText(data.phone);
    if (!phone) {
        errors.push('Telefone é obrigatório.');
    } else if (!isValidPhone(phone)) {
        errors.push('Telefone deve ter formato válido com DDD (ex: 11999999999).');
    }

    const openingOpen = data.openingOpen || '';
    const openingClose = data.openingClose || '';
    if (!openingOpen || !openingClose) {
        errors.push('Horário de funcionamento é obrigatório.');
    } else if (openingOpen >= openingClose) {
        errors.push('Horário de abertura deve ser anterior ao fechamento.');
    }

    if (!normalizeText(data.description)) {
        errors.push('Descrição do restaurante é obrigatória.');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// ============================================
// EVENTO PERSONALIZADO
// ============================================

function dispatchClaimUpdate() {
    const event = new CustomEvent('adminclaim:update', {
        detail: { claim: getClaimData() }
    });
    document.dispatchEvent(event);
}

// ============================================
// HEADER ADMIN BUTTON
// ============================================

function createAdminButton() {
    const btn = document.createElement('button');
    btn.className = 'nav-link-btn';
    btn.type = 'button';
    btn.id = 'nav-admin-claim-btn';
    return btn;
}

function updateHeaderAdminButton() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    // Remover botão existente se houver
    const existingBtn = document.getElementById('nav-admin-claim-btn');
    if (existingBtn) {
        existingBtn.remove();
    }

    const btn = createAdminButton();
    const status = currentClaim.claimStatus;
    const isAdmin = currentClaim.isAdmin;

    if (isAdmin && status === 'approved') {
        // Admin aprovado: botão "Admin" funcional
        btn.textContent = 'Admin';
        btn.setAttribute('aria-label', 'Abrir painel administrativo');
        btn.addEventListener('click', () => {
            openAdminPanel();
        });
        nav.appendChild(btn);

    } else if (status === 'pending') {
        // Solicitação pendente: botão desabilitado com indicativo
        btn.textContent = 'Admin (Pendente)';
        btn.setAttribute('aria-label', 'Aguardando aprovacao');
        btn.setAttribute('title', 'Sua solicitacao de administrador esta aguardando aprovacao.');
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        nav.appendChild(btn);

    } else if (status === 'rejected') {
        // Solicitação rejeitada: botão para reenviar
        btn.textContent = 'Reenviar Solicitação';
        btn.setAttribute('aria-label', 'Reenviar solicitacao de administrador');
        btn.addEventListener('click', () => {
            openClaimFormModal();
        });
        nav.appendChild(btn);

    } else {
        // Nenhuma solicitação: botão "Solicitar Admin"
        btn.textContent = 'Solicitar Admin';
        btn.setAttribute('aria-label', 'Solicitar status de administrador');
        btn.addEventListener('click', () => {
            openClaimFormModal();
        });
        nav.appendChild(btn);
    }
}

// ============================================
// MODAL DO FORMULÁRIO DE SOLICITAÇÃO
// ============================================

function createClaimFormContent() {
    const wrapper = document.createElement('div');
    wrapper.className = 'admin-claim-form';

    // Descrição
    const desc = document.createElement('p');
    desc.className = 'admin-claim-desc';
    desc.textContent = 'Preencha os dados do seu restaurante para solicitar acesso ao painel administrativo.';
    wrapper.appendChild(desc);

    // Se rejeitado, mostrar motivo
    if (currentClaim.claimStatus === 'rejected' && currentClaim.rejectedReason) {
        const rejectMsg = document.createElement('div');
        rejectMsg.className = 'admin-claim-rejected-msg';
        rejectMsg.innerHTML = `
            <strong>Solicitação rejeitada:</strong>
            <p>${currentClaim.rejectedReason}</p>
            <p>Corrija os dados e reenvie sua solicitação.</p>
        `;
        wrapper.appendChild(rejectMsg);
    }

    // Se já aprovado, mostrar mensagem
    if (currentClaim.claimStatus === 'approved' && currentClaim.isAdmin) {
        const approvedMsg = document.createElement('div');
        approvedMsg.className = 'admin-claim-approved-msg';
        approvedMsg.innerHTML = `
            <strong>✓ Você já é administrador!</strong>
            <p>Seu acesso ao painel administrativo está liberado.</p>
        `;
        wrapper.appendChild(approvedMsg);
        return { wrapper, isApproved: true };
    }

    const data = currentClaim.adminData;

    // Nome do restaurante
    const nameField = document.createElement('label');
    nameField.className = 'field';
    nameField.innerHTML = '<span>Nome do restaurante *</span>';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'claim-restaurant-name';
    nameInput.value = data.restaurantName || '';
    nameInput.required = true;
    nameInput.minLength = 3;
    nameInput.placeholder = 'Ex: Fast Lanche';
    nameField.appendChild(nameInput);
    wrapper.appendChild(nameField);

    // Endereço completo
    const addressField = document.createElement('label');
    addressField.className = 'field';
    addressField.innerHTML = '<span>Endereço completo *</span>';
    const addressInput = document.createElement('input');
    addressInput.type = 'text';
    addressInput.id = 'claim-address';
    addressInput.value = data.address || '';
    addressInput.required = true;
    addressInput.minLength = 10;
    addressInput.placeholder = 'Rua, número, bairro, cidade, CEP';
    addressField.appendChild(addressInput);
    wrapper.appendChild(addressField);

    // Telefone
    const phoneField = document.createElement('label');
    phoneField.className = 'field';
    phoneField.innerHTML = '<span>Telefone do restaurante *</span>';
    const phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.id = 'claim-phone';
    phoneInput.value = data.phone || '';
    phoneInput.required = true;
    phoneInput.minLength = 10;
    phoneInput.maxLength = 15;
    phoneInput.placeholder = '(00) 00000-0000';
    phoneInput.inputmode = 'tel';
    phoneField.appendChild(phoneInput);
    wrapper.appendChild(phoneField);

    // Horário de funcionamento
    const hoursTitle = document.createElement('h4');
    hoursTitle.className = 'admin-claim-hours-title';
    hoursTitle.textContent = 'Horário de funcionamento *';
    wrapper.appendChild(hoursTitle);

    const hoursRow = document.createElement('div');
    hoursRow.className = 'admin-claim-hours-row';

    const openField = document.createElement('label');
    openField.className = 'field';
    openField.innerHTML = '<span>Abertura</span>';
    const openInput = document.createElement('input');
    openInput.type = 'time';
    openInput.id = 'claim-hours-open';
    openInput.value = data.openingHours?.open || '';
    openInput.required = true;
    openField.appendChild(openInput);

    const closeField = document.createElement('label');
    closeField.className = 'field';
    closeField.innerHTML = '<span>Fechamento</span>';
    const closeInput = document.createElement('input');
    closeInput.type = 'time';
    closeInput.id = 'claim-hours-close';
    closeInput.value = data.openingHours?.close || '';
    closeInput.required = true;
    closeField.appendChild(closeInput);

    hoursRow.append(openField, closeField);
    wrapper.appendChild(hoursRow);

    // Descrição do restaurante
    const descField = document.createElement('label');
    descField.className = 'field';
    descField.innerHTML = '<span>Descrição do restaurante *</span>';
    const descInput = document.createElement('textarea');
    descInput.id = 'claim-description';
    descInput.value = data.description || '';
    descInput.required = true;
    descInput.rows = 3;
    descInput.minLength = 10;
    descInput.placeholder = 'Descreva seu restaurante, tipo de culinária, diferenciais...';
    descField.appendChild(descInput);
    wrapper.appendChild(descField);

    // Feedback
    const feedback = document.createElement('p');
    feedback.className = 'form-feedback';
    feedback.id = 'claim-feedback';
    wrapper.appendChild(feedback);

    return { wrapper, nameInput, addressInput, phoneInput, openInput, closeInput, descInput, feedback, isApproved: false };
}

function openClaimFormModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalActions = document.getElementById('modal-actions');
    const modalClose = document.getElementById('modal-close');

    if (!modalOverlay || !modalTitle || !modalBody || !modalActions) return;

    const closeHandler = () => {
        modalOverlay.classList.remove('active');
        modalOverlay.classList.add('closing');
        document.body.style.overflow = '';
        setTimeout(() => modalOverlay.classList.remove('closing'), 300);
    };

    const { wrapper, nameInput, addressInput, phoneInput, openInput, closeInput, descInput, feedback, isApproved } = createClaimFormContent();

    modalTitle.textContent = 'Solicitar Acesso Administrativo';
    modalBody.replaceChildren(wrapper);
    modalActions.replaceChildren();

    if (isApproved) {
        // Já é admin, só mostrar mensagem e botão de fechar
        const closeBtn = document.createElement('button');
        closeBtn.className = 'button button-primary';
        closeBtn.textContent = 'Fechar';
        closeBtn.type = 'button';
        closeBtn.addEventListener('click', closeHandler);
        modalActions.appendChild(closeBtn);
    } else {
        // Botão enviar solicitação
        const submitBtn = document.createElement('button');
        submitBtn.className = 'button button-primary';
        submitBtn.textContent = 'Enviar Solicitação';
        submitBtn.type = 'button';
        submitBtn.addEventListener('click', () => {
            const result = submitClaim({
                restaurantName: nameInput?.value || '',
                address: addressInput?.value || '',
                phone: phoneInput?.value || '',
                openingOpen: openInput?.value || '',
                openingClose: closeInput?.value || '',
                description: descInput?.value || ''
            });

            if (result.success) {
                showToast(result.autoApproved ? 'Solicitação aprovada! Você agora é administrador.' : 'Solicitação enviada com sucesso!', 'success');
                setTimeout(closeHandler, 600);
            } else {
                if (feedback) {
                    feedback.textContent = result.errors?.[0] || 'Erro ao enviar solicitação.';
                    feedback.dataset.status = 'error';
                }
            }
        });
        modalActions.appendChild(submitBtn);

        // Botão cancelar
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'button button-secondary';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.type = 'button';
        cancelBtn.addEventListener('click', closeHandler);
        modalActions.appendChild(cancelBtn);
    }

    // Abrir modal
    modalOverlay.classList.remove('closing');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    modalClose.onclick = closeHandler;
    modalOverlay.onclick = (event) => {
        if (event.target === modalOverlay) closeHandler();
    };

    const escHandler = (event) => {
        if (event.key === 'Escape') {
            closeHandler();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// ============================================
// SETUP
// ============================================

function setupAdminClaim() {
    // Carregar dados salvos
    loadClaimData();

    // Atualizar botão no header
    updateHeaderAdminButton();

    // Ouvir atualizações de perfil (caso o admin queira editar depois)
    document.addEventListener('adminclaim:update', () => {
        updateHeaderAdminButton();
    });
}

// ============================================
// API PÚBLICA
// ============================================

export {
    setupAdminClaim,
    getClaimStatus,
    isUserAdmin,
    getAdminData,
    getClaimData,
    getClaimStatusText,
    submitClaim,
    approveClaim,
    rejectClaim,
    resetClaim,
    openClaimFormModal,
    updateHeaderAdminButton
};