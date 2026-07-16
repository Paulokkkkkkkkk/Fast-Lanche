// app.js - cardapio dinamico, busca e filtros
import { addToCart, loadCart, setupCartControls } from './cart.js';
import { setupCheckout } from './checkout.js';
import { setupBooking } from './booking.js';
import { setupFeedback } from './feedback.js';

const menuContainer = document.getElementById('menu-items');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');

const menuItems = [
  {
    id: 1,
    name: 'X-Burger',
    description: 'Hamburguer, queijo, alface, tomate e molho da casa.',
    price: 14.9,
    category: 'Lanches',
    maxQuantity: 10,
    active: true
  },
  {
    id: 2,
    name: 'Batata Frita',
    description: 'Porcao crocante com sal na medida e molho especial.',
    price: 7.5,
    category: 'Acompanhamentos',
    maxQuantity: 8,
    active: true
  },
  {
    id: 3,
    name: 'Suco Natural',
    description: 'Bebida gelada preparada na hora.',
    price: 8.9,
    category: 'Bebidas',
    maxQuantity: 12,
    active: true
  },
  {
    id: 4,
    name: 'X-Salada',
    description: 'Hamburguer com queijo, salada fresca e maionese da casa.',
    price: 17.9,
    category: 'Lanches',
    maxQuantity: 10,
    active: true
  },
  {
    id: 5,
    name: 'Refrigerante Lata',
    description: 'Lata gelada de 350ml.',
    price: 6,
    category: 'Bebidas',
    maxQuantity: 12,
    active: true
  },
  {
    id: 6,
    name: 'Onion Rings',
    description: 'Aneis de cebola empanados com molho especial.',
    price: 11.9,
    category: 'Acompanhamentos',
    maxQuantity: 8,
    active: true
  },
  {
    id: 7,
    name: 'Combo Indisponivel',
    description: 'Item inativo para validar a regra de exibicao.',
    price: 24.9,
    category: 'Lanches',
    maxQuantity: 5,
    active: false
  }
];

let visibleItems = menuItems.filter(item => item.active);
let activeFilter = 'all';
let searchTerm = '';

const formatCurrency = value => (
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
);

const normalizeText = value => (
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
);

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function createMenuCard(item) {
  const card = document.createElement('article');
  card.className = 'menu-item';

  const visual = document.createElement('div');
  visual.className = 'menu-item-visual';
  visual.setAttribute('aria-hidden', 'true');

  const category = createTextElement('p', 'section-kicker', item.category);
  const title = createTextElement('h3', '', item.name);
  const description = createTextElement('p', '', item.description);

  const footer = document.createElement('div');
  footer.className = 'menu-item-footer';

  const price = createTextElement('span', 'price', formatCurrency(item.price));

  const button = document.createElement('button');
  button.className = 'add-to-cart';
  button.type = 'button';
  button.dataset.id = String(item.id);
  button.textContent = 'Adicionar';

  footer.append(price, button);
  card.append(visual, category, title, description, footer);

  return card;
}

function renderEmptyMenu() {
  if (!menuContainer) return;

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'empty-state menu-empty';

  const icon = document.createElement('span');
  icon.className = 'empty-state-icon';
  icon.textContent = '🍔';

  const text = document.createElement('span');
  text.className = 'empty-state-text';
  text.textContent = 'Nenhum item ativo encontrado para essa busca.';

  emptyMessage.append(icon, text);
  menuContainer.appendChild(emptyMessage);
}

function renderMenu(items = visibleItems) {
  if (!menuContainer) return;

  menuContainer.replaceChildren();

  const activeItems = items.filter(item => item.active);

  if (!activeItems.length) {
    renderEmptyMenu();
    return;
  }

  activeItems.forEach(item => {
    menuContainer.appendChild(createMenuCard(item));
  });
}

function getFilteredMenuItems() {
  const normalizedSearch = normalizeText(searchTerm);

  return menuItems.filter(item => {
    const isActive = item.active;
    const matchesCategory = activeFilter === 'all' || item.category === activeFilter;
    const searchableContent = normalizeText(`${item.name} ${item.description}`);
    const matchesSearch = !normalizedSearch || searchableContent.includes(normalizedSearch);

    return isActive && matchesCategory && matchesSearch;
  });
}

function updateVisibleItems() {
  visibleItems = getFilteredMenuItems();
  renderMenu(visibleItems);
}

function setSearchTerm(value) {
  searchTerm = value;
  updateVisibleItems();
}

function setActiveFilter(value) {
  activeFilter = value || 'all';
  updateVisibleItems();
}

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

// ============================================
// FASE 10 — UX: SISTEMA DE TOAST APRIMORADO
// ============================================

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
};

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

// ============================================
// FASE 10 — UX: SISTEMA DE MODAL
// ============================================

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalActions = document.getElementById('modal-actions');
const modalClose = document.getElementById('modal-close');

function openModal({ title, bodyContent, actions = [] }) {
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

  modalOverlay.classList.remove('closing');
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!modalOverlay) return;

  modalOverlay.classList.add('closing');
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';

  setTimeout(() => {
    modalOverlay.classList.remove('closing');
  }, 300);
}

function setupModalControls() {
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', event => {
      if (event.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
      }
    });
  }
}

// ============================================
// FASE 10 — UX: LOADING SPINNER
// ============================================

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

function setupDemoInteractions() {
  document.body.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('.add-to-cart')) {
      const itemId = Number(target.dataset.id);
      const selectedItem = menuItems.find(item => item.id === itemId);

      addToCart(selectedItem);
      showToast('Item adicionado ao carrinho.', 'success');
    }
  });

  document.querySelectorAll('form:not(#checkout-form):not(#booking-form):not(#feedback-form)').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      showToast('Formulario pronto para a proxima fase.', 'info');
    });
  });
}

function setup() {
  showSkeletonLoader(menuContainer, 6);

  setTimeout(() => {
    updateVisibleItems();
  }, 400);

  setupMenuFilters();
  loadCart();
  setupCartControls();
  setupCheckout();
  setupBooking();
  setupFeedback();
  setupDemoInteractions();
  setupModalControls();
}

window.addEventListener('DOMContentLoaded', setup);

export {
  activeFilter,
  closeModal,
  createSpinner,
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