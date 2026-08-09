// app.js - Inicialização, navegação e comunicação entre módulos
import { menuItems, renderMenu, updateVisibleItems, setSearchTerm, setActiveFilter, searchTerm, activeFilter, visibleItems, setupRestaurantStatusListener } from './menu-store.js';
import { addToCart, loadCart, setupCartControls } from './cart.js';
import { setupCheckout } from './checkout.js';
import { setupBooking } from './booking.js';
import { setupFeedback } from './feedback.js';
import { openCustomizationModal } from './product-customization.js';
import { setupOrderTracking } from './order-tracking.js';
import { setupAdmin } from './admin.js';
import { setupReceipt } from './receipt.js';
import { setupInventory } from './inventory.js';
import { setupUserProfile } from './user-profile.js';
import { setupAdminClaim } from './admin-claim.js';
import { setupUserNavigation } from './user-navigation.js';
import { setupAppState } from './app-state.js';
import { setupUX } from './ux.js';
import { CUSTOMIZATION_TYPES } from './constants.js';
import { formatCurrency, showToast, openModal, closeModal, createSpinner, setButtonLoading } from './ui.js';

const menuContainer = document.getElementById('menu-items');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');

// ============================================
// FASE 10 — UX: SKELETON LOADING
// ============================================

function showSkeletonLoader(container, count = 6) {
  if (!container) return;

  const grid = document.createElement('div');
  grid.className = 'skeleton-grid';

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    grid.appendChild(card);
  }

  container.replaceChildren(grid);
}

// ============================================
// SETUP PRINCIPAL
// ============================================

function setupMenuFilters() {
  if (searchInput) {
    searchInput.addEventListener('input', event => {
      setSearchTerm(event.target.value);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', event => {
      setActiveFilter(event.target.value);
    });
  }
}

function setupDemoInteractions() {
  document.body.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('.add-to-cart')) {
      const itemId = Number(target.dataset.id);
      const selectedItem = menuItems.find(item => item.id === itemId);

      if (selectedItem) {
        openCustomizationModal(selectedItem);
      }
    }
  });

  document.querySelectorAll('form:not(#checkout-form):not(#booking-form):not(#feedback-form)').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      showToast('Formulario pronto para a proxima fase.', 'info');
    });
  });
}

function setupNavToggle() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('active');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  const closeNav = () => {
    nav.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  };

  nav.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
    }
  });
}

function setup() {
  showSkeletonLoader(menuContainer, 6);

  setTimeout(() => {
    updateVisibleItems();
  }, 400);

  setupNavToggle();
  setupMenuFilters();
  loadCart();
  setupCartControls();
  setupCheckout();
  setupBooking();
  setupFeedback();
  setupOrderTracking();
  setupAdmin();
  setupReceipt();
  setupInventory();
  setupUserProfile();
  setupAdminClaim();
  setupAppState();
  setupUserNavigation();
  setupRestaurantStatusListener();
  setupUX();
  setupDemoInteractions();
}

window.addEventListener('DOMContentLoaded', setup);

export {
  activeFilter,
  closeModal,
  createSpinner,
  CUSTOMIZATION_TYPES,
  formatCurrency,
  menuItems,
  openModal,
  renderMenu,
  searchTerm,
  setActiveFilter,
  setButtonLoading,
  setSearchTerm,
  showToast,
  updateVisibleItems,
  visibleItems
};