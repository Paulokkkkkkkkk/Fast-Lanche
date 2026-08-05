// app-state.js - Estado global compartilhado
// Fase 25 - Integra perfil de usuário, admin claim e navegação do sistema

// ============================================
// CONSTANTES
// ============================================

const PROFILE_STORAGE_KEY = 'fastlanche_user_profile';
const CLAIM_STORAGE_KEY = 'fastlanche_admin_claim';

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

function safeParse(json, fallback) {
    try {
        const parsed = JSON.parse(json);
        return parsed || fallback;
    } catch {
        return fallback;
    }
}

// ============================================
// ESTADO GLOBAL
// ============================================

const appState = {
    currentUser: null,          // dados do perfil do usuário logado
    userRole: 'customer',       // 'customer' | 'admin'
    isAdminApproved: false,     // boolean
    claimStatus: 'none'         // 'none' | 'pending' | 'approved' | 'rejected'
};

// ============================================
// CARREGAMENTO DO ESTADO
// ============================================

function loadProfileFromStorage() {
    if (!isStorageAvailable()) return null;
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) return null;
    const profile = safeParse(stored, null);
    if (!profile || typeof profile !== 'object') return null;
    return profile;
}

function loadClaimFromStorage() {
    if (!isStorageAvailable()) return null;
    const stored = localStorage.getItem(CLAIM_STORAGE_KEY);
    if (!stored) return null;
    const claim = safeParse(stored, null);
    if (!claim || typeof claim !== 'object') return null;
    return claim;
}

/**
 * Carrega e sincroniza o estado global a partir do localStorage.
 * Deve ser chamado na inicialização da aplicação.
 */
function refreshAppState() {
    const profile = loadProfileFromStorage();
    const claim = loadClaimFromStorage();

    appState.currentUser = profile ? { ...profile } : null;

    if (claim) {
        appState.claimStatus = claim.claimStatus || 'none';
        appState.isAdminApproved = claim.isAdmin === true && claim.claimStatus === 'approved';
        appState.userRole = appState.isAdminApproved ? 'admin' : 'customer';
    } else {
        appState.claimStatus = 'none';
        appState.isAdminApproved = false;
        appState.userRole = 'customer';
    }

    return getAppState();
}

// ============================================
// GETTERS
// ============================================

function getAppState() {
    return {
        currentUser: appState.currentUser ? { ...appState.currentUser } : null,
        userRole: appState.userRole,
        isAdminApproved: appState.isAdminApproved,
        claimStatus: appState.claimStatus
    };
}

function getCurrentUser() {
    return appState.currentUser ? { ...appState.currentUser } : null;
}

function getUserRole() {
    return appState.userRole;
}

function getIsAdminApproved() {
    return appState.isAdminApproved;
}

function getClaimStatus() {
    return appState.claimStatus;
}

function isCurrentUserAdmin() {
    return appState.isAdminApproved === true && appState.userRole === 'admin';
}

function hasPendingClaim() {
    return appState.claimStatus === 'pending';
}

function hasRejectedClaim() {
    return appState.claimStatus === 'rejected';
}

// ============================================
// SÍNCRONIZAÇÃO VIA EVENTOS
// ============================================

/**
 * Dispara o evento global 'appstate:update' para que
 * todos os módulos ouçam e atualizem sua interface.
 */
function dispatchAppStateUpdate() {
    const event = new CustomEvent('appstate:update', {
        detail: getAppState()
    });
    document.dispatchEvent(event);
}

/**
 * Registra listeners para sincronizar o estado global
 * quando perfil ou admin claim são alterados.
 */
function setupAppState() {
    // Carregar estado inicial
    refreshAppState();

    // Sincronizar quando o perfil for atualizado
    document.addEventListener('profile:update', () => {
        refreshAppState();
        dispatchAppStateUpdate();
    });

    // Sincronizar quando o admin claim for atualizado
    document.addEventListener('adminclaim:update', () => {
        refreshAppState();
        dispatchAppStateUpdate();
    });

    // Escutar também quando a janela for carregada
    window.addEventListener('storage', (event) => {
        if (event.key === PROFILE_STORAGE_KEY || event.key === CLAIM_STORAGE_KEY) {
            refreshAppState();
            dispatchAppStateUpdate();
        }
    });

    return getAppState();
}

// ============================================
// API PÚBLICA
// ============================================

export {
    setupAppState,
    refreshAppState,
    getAppState,
    getCurrentUser,
    getUserRole,
    getIsAdminApproved,
    getClaimStatus,
    isCurrentUserAdmin,
    hasPendingClaim,
    hasRejectedClaim,
    dispatchAppStateUpdate
};