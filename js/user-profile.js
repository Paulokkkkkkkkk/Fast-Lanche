// user-profile.js - Sistema de Perfil de Usuário
// Fase 23 - Gerencia dados pessoais, avatar e preferências do usuário
import { validateProfileInput, sanitizeProfileData } from './security.js';

const STORAGE_KEY = 'fastlanche_user_profile';

const DEFAULT_PROFILE = {
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '', // Base64 da imagem
    preferences: {
        paymentMethod: '',
        notifications: true,
        theme: 'light'
    },
    createdAt: null,
    updatedAt: null
};

let currentProfile = { ...DEFAULT_PROFILE };

// ============================================
// UTILITÁRIOS
// ============================================

function isStorageAvailable() {
    try {
        return typeof window !== 'undefined' && Boolean(window.localStorage);
    } catch (error) {
        console.warn('localStorage indisponivel para perfil.', error);
        return false;
    }
}

function normalizeText(value) {
    return String(value || '').trim();
}

function getInitials(name) {
    if (!name || !normalizeText(name)) return '?';
    const parts = normalizeText(name).split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ============================================
// PERSISTÊNCIA
// ============================================

function saveProfile() {
    if (!isStorageAvailable()) return false;
    try {
        currentProfile.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProfile));
        return true;
    } catch (error) {
        console.warn('Nao foi possivel salvar o perfil.', error);
        return false;
    }
}

function loadProfile() {
    if (!isStorageAvailable()) return false;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return false;

        const parsed = JSON.parse(stored);
        if (!parsed || typeof parsed !== 'object') return false;

        // Merge com dados default para garantir estrutura completa
        currentProfile = {
            ...DEFAULT_PROFILE,
            ...parsed,
            preferences: {
                ...DEFAULT_PROFILE.preferences,
                ...(parsed.preferences || {})
            }
        };
        return true;
    } catch (error) {
        console.warn('Nao foi possivel carregar o perfil.', error);
        currentProfile = { ...DEFAULT_PROFILE };
        return false;
    }
}

// ============================================
// GETTERS / SETTERS
// ============================================

function getProfile() {
    return { ...currentProfile };
}

function getProfileName() {
    return currentProfile.name || '';
}

function getProfileAvatar() {
    return currentProfile.avatar || '';
}

function isProfileComplete() {
    return Boolean(
        normalizeText(currentProfile.name) &&
        normalizeText(currentProfile.phone) &&
        normalizeText(currentProfile.address)
    );
}

function dispatchAppStateSync() {
    const event = new CustomEvent('appstate:update', {
        detail: { profile: getProfile() }
    });
    document.dispatchEvent(event);
}

function updateProfile(data) {
    // Sanitizar datos con el módulo de seguridad
    const sanitized = sanitizeProfileData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || ''
    });

    currentProfile.name = sanitized.name;
    currentProfile.email = sanitized.email;
    currentProfile.phone = sanitized.phone;
    currentProfile.address = sanitized.address;

    if (data.preferences) {
        currentProfile.preferences = {
            ...currentProfile.preferences,
            ...data.preferences
        };
    }

    if (!currentProfile.createdAt) {
        currentProfile.createdAt = new Date().toISOString();
    }

    saveProfile();
    dispatchProfileUpdate();
    dispatchAppStateSync();
    return getProfile();
}

function updateAvatar(avatarBase64) {
    currentProfile.avatar = avatarBase64 || '';
    saveProfile();
    dispatchProfileUpdate();
    dispatchAppStateSync();
}

function removeAvatar() {
    currentProfile.avatar = '';
    saveProfile();
    dispatchProfileUpdate();
    dispatchAppStateSync();
}

// ============================================
// EVENTO PERSONALIZADO
// ============================================

function dispatchProfileUpdate() {
    const event = new CustomEvent('profile:update', {
        detail: { profile: getProfile() }
    });
    document.dispatchEvent(event);
}

// ============================================
// HEADER AVATAR
// ============================================

function createHeaderAvatar() {
    const avatar = document.createElement('button');
    avatar.className = 'profile-avatar-btn';
    avatar.type = 'button';
    avatar.setAttribute('aria-label', 'Meu Perfil');
    avatar.setAttribute('title', 'Meu Perfil');
    return avatar;
}

function updateHeaderAvatar() {
    // O header (avatar + dropdown) é renderizado pelo user-navigation.js
    // para integrar perfil e admin claim. Esta função apenas dispara
    // o evento de atualização do estado global para que a navegação
    // atualize o avatar com os dados mais recentes.
    const event = new CustomEvent('profile:update', {
        detail: { profile: getProfile() }
    });
    document.dispatchEvent(event);
}

// ============================================
// MODAL DE PERFIL
// ============================================

function createProfileModalContent() {
    const profile = getProfile();

    const wrapper = document.createElement('div');
    wrapper.className = 'profile-modal-content';

    // --- Avatar Upload ---
    const avatarSection = document.createElement('div');
    avatarSection.className = 'profile-avatar-section';

    const avatarPreview = document.createElement('div');
    avatarPreview.className = 'profile-avatar-preview';
    avatarPreview.id = 'profile-avatar-preview';

    const initials = document.createElement('span');
    initials.className = 'profile-avatar-initials-large';
    initials.id = 'profile-avatar-initials';
    initials.textContent = getInitials(profile.name);

    const avatarImg = document.createElement('img');
    avatarImg.className = 'profile-avatar-img-large';
    avatarImg.id = 'profile-avatar-img';
    avatarImg.alt = 'Foto do perfil';
    if (profile.avatar) {
        avatarImg.src = profile.avatar;
        avatarImg.style.display = 'block';
        initials.style.display = 'none';
    } else {
        avatarImg.style.display = 'none';
        initials.style.display = 'flex';
    }

    avatarPreview.appendChild(avatarImg);
    avatarPreview.appendChild(initials);

    const avatarActions = document.createElement('div');
    avatarActions.className = 'profile-avatar-actions';

    const uploadLabel = document.createElement('label');
    uploadLabel.className = 'button button-secondary button-small';
    uploadLabel.textContent = 'Alterar foto';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tamanho (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            import('./ui.js').then(({ showToast }) => {
                showToast('A imagem deve ter no maximo 2MB.', 'error');
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result;
            if (typeof base64 === 'string') {
                updateAvatar(base64);
                // Atualizar preview
                avatarImg.src = base64;
                avatarImg.style.display = 'block';
                initials.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    });
    uploadLabel.appendChild(fileInput);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'button button-secondary button-small';
    removeBtn.textContent = 'Remover foto';
    removeBtn.type = 'button';
    removeBtn.addEventListener('click', () => {
        removeAvatar();
        avatarImg.style.display = 'none';
        initials.style.display = 'flex';
        initials.textContent = getInitials(getProfileName());
        fileInput.value = '';
    });

    avatarActions.appendChild(uploadLabel);
    avatarActions.appendChild(removeBtn);
    avatarSection.appendChild(avatarPreview);
    avatarSection.appendChild(avatarActions);
    wrapper.appendChild(avatarSection);

    // --- Informações Pessoais ---
    const infoSection = document.createElement('div');
    infoSection.className = 'profile-section';

    const infoTitle = document.createElement('h4');
    infoTitle.className = 'profile-section-title';
    infoTitle.textContent = 'Informacoes Pessoais';
    infoSection.appendChild(infoTitle);

    const fields = document.createElement('div');
    fields.className = 'profile-fields';

    // Nome
    const nameField = document.createElement('label');
    nameField.className = 'field';
    nameField.innerHTML = '<span>Nome completo</span>';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'profile-name';
    nameInput.value = profile.name;
    nameInput.required = true;
    nameInput.minLength = 3;
    nameField.appendChild(nameInput);
    fields.appendChild(nameField);

    // Email
    const emailField = document.createElement('label');
    emailField.className = 'field';
    emailField.innerHTML = '<span>E-mail</span>';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'profile-email';
    emailInput.value = profile.email;
    emailField.appendChild(emailInput);
    fields.appendChild(emailField);

    // Telefone
    const phoneField = document.createElement('label');
    phoneField.className = 'field';
    phoneField.innerHTML = '<span>Telefone</span>';
    const phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.id = 'profile-phone';
    phoneInput.value = profile.phone;
    phoneInput.autocomplete = 'tel';
    phoneInput.inputmode = 'tel';
    phoneInput.minLength = 10;
    phoneInput.maxLength = 15;
    phoneInput.placeholder = '(00) 00000-0000';
    phoneField.appendChild(phoneInput);
    fields.appendChild(phoneField);

    // Endereço
    const addressField = document.createElement('label');
    addressField.className = 'field field-full';
    addressField.innerHTML = '<span>Endereco padrao de entrega</span>';
    const addressInput = document.createElement('input');
    addressInput.type = 'text';
    addressInput.id = 'profile-address';
    addressInput.value = profile.address;
    addressInput.autocomplete = 'street-address';
    addressInput.minLength = 8;
    addressField.appendChild(addressInput);
    fields.appendChild(addressField);

    infoSection.appendChild(fields);
    wrapper.appendChild(infoSection);

    // --- Preferências ---
    const prefsSection = document.createElement('div');
    prefsSection.className = 'profile-section';

    const prefsTitle = document.createElement('h4');
    prefsTitle.className = 'profile-section-title';
    prefsTitle.textContent = 'Preferencias';
    prefsSection.appendChild(prefsTitle);

    const prefsFields = document.createElement('div');
    prefsFields.className = 'profile-fields';

    // Método de pagamento preferido
    const paymentField = document.createElement('label');
    paymentField.className = 'field';
    paymentField.innerHTML = '<span>Metodo de pagamento preferido</span>';
    const paymentSelect = document.createElement('select');
    paymentSelect.id = 'profile-payment';
    const paymentOptions = [
        { value: '', label: 'Nao definido' },
        { value: 'pix', label: 'Pix' },
        { value: 'card', label: 'Cartao' },
        { value: 'cash', label: 'Dinheiro' }
    ];
    paymentOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (profile.preferences.paymentMethod === opt.value) option.selected = true;
        paymentSelect.appendChild(option);
    });
    paymentField.appendChild(paymentSelect);
    prefsFields.appendChild(paymentField);

    // Notificações
    const notifField = document.createElement('label');
    notifField.className = 'field field-checkbox';
    const notifInput = document.createElement('input');
    notifInput.type = 'checkbox';
    notifInput.id = 'profile-notifications';
    notifInput.checked = profile.preferences.notifications;
    const notifSpan = document.createElement('span');
    notifSpan.textContent = 'Receber notificacoes';
    notifField.appendChild(notifInput);
    notifField.appendChild(notifSpan);
    prefsFields.appendChild(notifField);

    prefsSection.appendChild(prefsFields);
    wrapper.appendChild(prefsSection);

    // --- Feedback ---
    const feedback = document.createElement('p');
    feedback.className = 'form-feedback';
    feedback.id = 'profile-feedback';
    wrapper.appendChild(feedback);

    return { wrapper, nameInput, emailInput, phoneInput, addressInput, paymentSelect, notifInput, feedback };
}

function openProfileModal() {
    // Usar o modal global já existente
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalActions = document.getElementById('modal-actions');
    const modalClose = document.getElementById('modal-close');

    if (!modalOverlay || !modalTitle || !modalBody || !modalActions) return;

    // Salvar referência para fechar
    const closeHandler = () => {
        modalOverlay.classList.remove('active');
        modalOverlay.classList.add('closing');
        document.body.style.overflow = '';
        setTimeout(() => modalOverlay.classList.remove('closing'), 300);
    };

    // Criar conteúdo
    const { wrapper, nameInput, emailInput, phoneInput, addressInput, paymentSelect, notifInput, feedback } = createProfileModalContent();

    modalTitle.textContent = 'Meu Perfil';
    modalBody.replaceChildren(wrapper);
    modalActions.replaceChildren();

    // Botão salvar
    const saveBtn = document.createElement('button');
    saveBtn.className = 'button button-primary';
    saveBtn.textContent = 'Salvar alteracoes';
    saveBtn.type = 'button';
    saveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name.length < 3) {
            feedback.textContent = 'O nome deve ter pelo menos 3 caracteres.';
            feedback.dataset.status = 'error';
            return;
        }

        const phone = phoneInput.value.trim();
        const phoneDigits = phone.replace(/\D/g, '');
        if (phone && (phoneDigits.length < 10 || phoneDigits.length > 11)) {
            feedback.textContent = 'Informe um telefone valido com DDD.';
            feedback.dataset.status = 'error';
            return;
        }

        const address = addressInput.value.trim();
        if (address && address.length < 8) {
            feedback.textContent = 'Informe um endereco valido.';
            feedback.dataset.status = 'error';
            return;
        }

        updateProfile({
            name,
            email: emailInput.value.trim(),
            phone,
            address,
            preferences: {
                paymentMethod: paymentSelect.value,
                notifications: notifInput.checked,
                theme: 'light'
            }
        });

        feedback.textContent = 'Perfil salvo com sucesso!';
        feedback.dataset.status = 'success';

        // Atualizar iniciais se mudou nome
        const initialsEl = document.getElementById('profile-avatar-initials');
        const avatarImg = document.getElementById('profile-avatar-img');
        if (initialsEl && avatarImg) {
            initialsEl.textContent = getInitials(name);
            if (!getProfileAvatar()) {
                avatarImg.style.display = 'none';
                initialsEl.style.display = 'flex';
            }
        }

        // Importar showToast dinamicamente
        import('./ui.js').then(({ showToast }) => {
            showToast('Perfil salvo com sucesso!', 'success');
        });

        setTimeout(closeHandler, 800);
    });

    modalActions.appendChild(saveBtn);

    // Botão cancelar
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'button button-secondary';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.type = 'button';
    cancelBtn.addEventListener('click', closeHandler);
    modalActions.appendChild(cancelBtn);

    // Abrir modal
    modalOverlay.classList.remove('closing');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Fechar ao clicar no X
    modalClose.onclick = closeHandler;

    // Fechar ao clicar fora
    modalOverlay.onclick = (event) => {
        if (event.target === modalOverlay) closeHandler();
    };

    // Fechar com ESC
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

function setupUserProfile() {
    // Carregar perfil salvo
    loadProfile();

    // O header (avatar + dropdown) é renderizado pelo user-navigation.js
    // para integrar perfil e admin claim. Esta função apenas garante que
    // o container exista no DOM.
    const headerLayout = document.querySelector('.header-layout');
    if (!headerLayout) return;

    let container = document.getElementById('profile-header-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'profile-header-container';
        container.className = 'profile-header-container';
        // Inserir antes da nav ou depois do header-row
        const nav = document.getElementById('main-nav');
        if (nav) {
            headerLayout.insertBefore(container, nav);
        } else {
            headerLayout.appendChild(container);
        }
    }
}

// ============================================
// API PÚBLICA PARA CHECKOUT
// ============================================

function getProfileDataForCheckout() {
    const profile = getProfile();
    return {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        paymentMethod: profile.preferences.paymentMethod
    };
}

export {
    setupUserProfile,
    getProfile,
    getProfileName,
    getProfileAvatar,
    getProfileDataForCheckout,
    isProfileComplete,
    updateProfile,
    updateAvatar,
    removeAvatar,
    openProfileModal,
    getInitials
};