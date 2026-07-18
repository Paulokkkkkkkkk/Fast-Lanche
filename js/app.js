// app.js - cardapio dinamico, busca e filtros
import { addToCart, loadCart, setupCartControls } from './cart.js';
import { setupCheckout } from './checkout.js';
import { setupBooking } from './booking.js';
import { setupFeedback } from './feedback.js';

const menuContainer = document.getElementById('menu-items');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');

const CUSTOMIZATION_TYPES = {
  HALF_HALF: 'half_half',
  REMOVE_INGREDIENTS: 'remove_ingredients',
  OBSERVATIONS: 'observations',
  ADD_EXTRAS: 'add_extras'
};

const menuItems = [
  // =========================================================================
  // HAMBÚRGUERES
  // =========================================================================
  {
    id: 1,
    name: 'X-Burger Simples',
    description: 'Hambúrguer artesanal 150g, queijo cheddar, alface e molho especial.',
    price: 16.9,
    category: 'Hambúrgueres',
    maxQuantity: 10,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.REMOVE_INGREDIENTS,
      ingredients: ['Cebola', 'Queijo Cheddar', 'Alface', 'Tomate', 'Molho Especial'],
      extras: [{ name: 'Bacon extra', price: 3.5 }, { name: 'Queijo adicional', price: 2.5 }]
    }
  },
  {
    id: 2,
    name: 'X-Salada',
    description: 'Hambúrguer 180g, queijo prato, salada fresca, maionese da casa.',
    price: 19.9,
    category: 'Hambúrgueres',
    maxQuantity: 10,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.REMOVE_INGREDIENTS,
      ingredients: ['Cebola Roxa', 'Queijo Prato', 'Alface Americana', 'Tomate', 'Maionese'],
      extras: [{ name: 'Ovo', price: 2.0 }, { name: 'Calabresa', price: 3.0 }]
    }
  },
  {
    id: 3,
    name: 'X-Bacon',
    description: 'Hambúrguer 200g, bastante bacon crocante, cheddar e barbecue.',
    price: 24.9,
    category: 'Hambúrgueres',
    maxQuantity: 8,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.REMOVE_INGREDIENTS,
      ingredients: ['Cebola Caramelizada', 'Queijo Cheddar', 'Bacon', 'Molho Barbecue'],
      extras: [{ name: 'Dobro de bacon', price: 5.0 }, { name: 'Hambúrguer extra', price: 7.0 }]
    }
  },
  {
    id: 4,
    name: 'X-Egg',
    description: 'Hambúrguer 150g, ovo frito, queijo mussarela, alface e tomate.',
    price: 18.9,
    category: 'Hambúrgueres',
    maxQuantity: 10,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.REMOVE_INGREDIENTS,
      ingredients: ['Ovo', 'Queijo Mussarela', 'Alface', 'Tomate', 'Maionese'],
      extras: [{ name: 'Bacon', price: 3.5 }, { name: 'Catupiry', price: 2.5 }]
    }
  },
  {
    id: 5,
    name: 'X-Tudo',
    description: 'Hambúrguer 220g, bacon, ovo, calabresa, queijo, salada completa.',
    price: 29.9,
    category: 'Hambúrgueres',
    maxQuantity: 8,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.REMOVE_INGREDIENTS,
      ingredients: ['Cebola', 'Bacon', 'Ovo', 'Calabresa', 'Queijo', 'Alface', 'Tomate', 'Molho'],
      extras: [{ name: 'Hambúrguer duplo', price: 8.0 }, { name: 'Cheddar extra', price: 3.0 }]
    }
  },
  {
    id: 6,
    name: 'X-Frango',
    description: 'Filé de frango empanado 180g, queijo, alface, tomate e maionese.',
    price: 21.9,
    category: 'Hambúrgueres',
    maxQuantity: 10,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.REMOVE_INGREDIENTS,
      ingredients: ['Queijo', 'Alface', 'Tomate', 'Maionese'],
      extras: [{ name: 'Cheddar', price: 2.5 }, { name: 'Bacon', price: 3.5 }]
    }
  },
  {
    id: 7,
    name: 'X-Veggie',
    description: 'Hambúrguer de grão-de-bico 160g, alface, tomate, cebola roxa e molho vegano.',
    price: 22.9,
    category: 'Hambúrgueres',
    maxQuantity: 8,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.REMOVE_INGREDIENTS,
      ingredients: ['Cebola Roxa', 'Alface', 'Tomate', 'Molho Vegano', 'Picles'],
      extras: [{ name: 'Guacamole', price: 4.0 }, { name: 'Queijo vegano', price: 3.0 }]
    }
  },

  // =========================================================================
  // PIZZAS
  // =========================================================================
  {
    id: 8,
    name: 'Pizza Calabresa',
    description: 'Molho de tomate, calabresa fatiada, cebola, azeitona e mussarela.',
    price: 34.9,
    category: 'Pizzas',
    maxQuantity: 5,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.HALF_HALF,
      flavors: [
        { name: 'Calabresa', price: 0 },
        { name: 'Frango com Catupiry', price: 2.0 },
        { name: 'Mussarela', price: 0 },
        { name: 'Portuguesa', price: 3.0 },
        { name: 'Marguerita', price: 2.0 },
        { name: 'Pepperoni', price: 4.0 },
        { name: 'Quatro Queijos', price: 5.0 },
        { name: 'Bacon', price: 3.0 }
      ],
      extras: [{ name: 'Borda recheada', price: 6.0 }, { name: 'Azeitona extra', price: 2.0 }]
    }
  },
  {
    id: 9,
    name: 'Pizza Mussarela',
    description: 'Molho de tomate, mussarela, orégano e azeitona. Clássica e irresistível.',
    price: 29.9,
    category: 'Pizzas',
    maxQuantity: 5,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.HALF_HALF,
      flavors: [
        { name: 'Calabresa', price: 0 },
        { name: 'Frango com Catupiry', price: 2.0 },
        { name: 'Mussarela', price: 0 },
        { name: 'Portuguesa', price: 3.0 },
        { name: 'Marguerita', price: 2.0 },
        { name: 'Pepperoni', price: 4.0 },
        { name: 'Quatro Queijos', price: 5.0 },
        { name: 'Bacon', price: 3.0 }
      ],
      extras: [{ name: 'Borda recheada', price: 6.0 }, { name: 'Catupiry extra', price: 3.0 }]
    }
  },
  {
    id: 10,
    name: 'Pizza Portuguesa',
    description: 'Molho, mussarela, presunto, ovos, cebola, pimentão, ervilha e azeitona.',
    price: 38.9,
    category: 'Pizzas',
    maxQuantity: 5,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.HALF_HALF,
      flavors: [
        { name: 'Calabresa', price: 0 },
        { name: 'Frango com Catupiry', price: 0 },
        { name: 'Mussarela', price: 0 },
        { name: 'Portuguesa', price: 0 },
        { name: 'Marguerita', price: 0 },
        { name: 'Pepperoni', price: 2.0 },
        { name: 'Quatro Queijos', price: 2.0 },
        { name: 'Bacon', price: 2.0 }
      ],
      extras: [{ name: 'Borda recheada', price: 6.0 }, { name: 'Mussarela extra', price: 3.0 }]
    }
  },
  {
    id: 11,
    name: 'Pizza Frango com Catupiry',
    description: 'Molho, frango desfiado, catupiry cremoso, milho e azeitona.',
    price: 36.9,
    category: 'Pizzas',
    maxQuantity: 5,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.HALF_HALF,
      flavors: [
        { name: 'Calabresa', price: 0 },
        { name: 'Frango com Catupiry', price: 0 },
        { name: 'Mussarela', price: 0 },
        { name: 'Portuguesa', price: 3.0 },
        { name: 'Marguerita', price: 0 },
        { name: 'Pepperoni', price: 4.0 },
        { name: 'Quatro Queijos', price: 3.0 },
        { name: 'Bacon', price: 2.0 }
      ],
      extras: [{ name: 'Borda recheada', price: 6.0 }, { name: 'Catupiry extra', price: 4.0 }]
    }
  },
  {
    id: 12,
    name: 'Pizza Pepperoni',
    description: 'Molho, pepperoni fatiado, mussarela e orégano. Sabor marcante.',
    price: 39.9,
    category: 'Pizzas',
    maxQuantity: 5,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.HALF_HALF,
      flavors: [
        { name: 'Calabresa', price: 0 },
        { name: 'Frango com Catupiry', price: 0 },
        { name: 'Mussarela', price: 0 },
        { name: 'Portuguesa', price: 2.0 },
        { name: 'Marguerita', price: 0 },
        { name: 'Pepperoni', price: 0 },
        { name: 'Quatro Queijos', price: 2.0 },
        { name: 'Bacon', price: 0 }
      ],
      extras: [{ name: 'Borda recheada', price: 6.0 }, { name: 'Pepperoni extra', price: 4.0 }]
    }
  },
  {
    id: 13,
    name: 'Pizza Quatro Queijos',
    description: 'Mussarela, provolone, parmesão e catupiry. Para os amantes de queijo.',
    price: 41.9,
    category: 'Pizzas',
    maxQuantity: 5,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.HALF_HALF,
      flavors: [
        { name: 'Calabresa', price: 0 },
        { name: 'Frango com Catupiry', price: 0 },
        { name: 'Mussarela', price: 0 },
        { name: 'Portuguesa', price: 2.0 },
        { name: 'Marguerita', price: 0 },
        { name: 'Pepperoni', price: 2.0 },
        { name: 'Quatro Queijos', price: 0 },
        { name: 'Bacon', price: 0 }
      ],
      extras: [{ name: 'Borda recheada', price: 6.0 }, { name: 'Gorgonzola extra', price: 5.0 }]
    }
  },

  // =========================================================================
  // COMBOS
  // =========================================================================
  {
    id: 14,
    name: 'Combo Fast',
    description: 'X-Burger Simples + Batata Frita Média + Refrigerante Lata.',
    price: 29.9,
    category: 'Combos',
    maxQuantity: 8,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.OBSERVATIONS,
      extras: [{ name: 'Batata grande', price: 3.0 }, { name: 'Milk shake', price: 6.0 }]
    }
  },
  {
    id: 15,
    name: 'Combo Família',
    description: '2 X-Tudo + 2 Batatas Grandes + 2 Refrigerantes + 1 Pizza Calabresa Média.',
    price: 89.9,
    category: 'Combos',
    maxQuantity: 5,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.OBSERVATIONS,
      extras: [{ name: 'Refrigerante 2L', price: 5.0 }, { name: 'Sobremesa extra', price: 7.0 }]
    }
  },
  {
    id: 16,
    name: 'Combo Burguer',
    description: 'X-Bacon + Batata Frita + Onion Rings + Refrigerante Lata.',
    price: 44.9,
    category: 'Combos',
    maxQuantity: 8,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.OBSERVATIONS,
      extras: [{ name: 'Hambúrguer extra', price: 7.0 }, { name: 'Milk shake', price: 6.0 }]
    }
  },
  {
    id: 17,
    name: 'Combo Pizza',
    description: 'Pizza Grande + 2 Refrigerantes + Sobremesa. Ideal para o fim de semana.',
    price: 59.9,
    category: 'Combos',
    maxQuantity: 5,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.OBSERVATIONS,
      extras: [{ name: 'Borda recheada', price: 6.0 }, { name: 'Refrigerante 2L', price: 5.0 }]
    }
  },

  // =========================================================================
  // BEBIDAS
  // =========================================================================
  {
    id: 18,
    name: 'Refrigerante Lata',
    description: 'Coca-Cola, Guaraná, Fanta ou Sprite. Lata 350ml gelada.',
    price: 6.0,
    category: 'Bebidas',
    maxQuantity: 20,
    active: true,
    customization: null
  },
  {
    id: 19,
    name: 'Refrigerante 2L',
    description: 'Garrafa 2 litros. Coca-Cola ou Guaraná.',
    price: 12.0,
    category: 'Bebidas',
    maxQuantity: 10,
    active: true,
    customization: null
  },
  {
    id: 20,
    name: 'Suco Natural',
    description: 'Laranja, limão, maracujá ou abacaxi. Preparado na hora. 500ml.',
    price: 8.9,
    category: 'Bebidas',
    maxQuantity: 15,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.OBSERVATIONS,
      extras: [{ name: 'Levar açúcar', price: 0 }, { name: 'Com gelo extra', price: 0 }]
    }
  },
  {
    id: 21,
    name: 'Milk Shake',
    description: 'Chocolate, morango ou baunilha. Cremoso e gelado. 400ml.',
    price: 14.9,
    category: 'Bebidas',
    maxQuantity: 10,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.OBSERVATIONS,
      extras: [{ name: 'Calda extra', price: 2.0 }, { name: 'Chantilly', price: 3.0 }]
    }
  },
  {
    id: 22,
    name: 'Água Mineral',
    description: 'Água sem gás 500ml.',
    price: 4.0,
    category: 'Bebidas',
    maxQuantity: 20,
    active: true,
    customization: null
  },
  {
    id: 23,
    name: 'Cerveja Lata',
    description: 'Heineken, Brahma ou Stella. Lata 350ml gelada.',
    price: 7.5,
    category: 'Bebidas',
    maxQuantity: 15,
    active: true,
    customization: null
  },

  // =========================================================================
  // SOBREMESAS
  // =========================================================================
  {
    id: 24,
    name: 'Pudim',
    description: 'Pudim de leite condensado com calda de caramelo. Fatia generosa.',
    price: 11.9,
    category: 'Sobremesas',
    maxQuantity: 8,
    active: true,
    customization: null
  },
  {
    id: 25,
    name: 'Brownie',
    description: 'Brownie de chocolate belga com nozes e calda de chocolate.',
    price: 13.9,
    category: 'Sobremesas',
    maxQuantity: 8,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.OBSERVATIONS,
      extras: [{ name: 'Sorvete de creme', price: 5.0 }, { name: 'Calda extra', price: 2.0 }]
    }
  },
  {
    id: 26,
    name: 'Sorvete Sundae',
    description: 'Sorvete de creme com calda de chocolate, morango ou caramelo.',
    price: 15.9,
    category: 'Sobremesas',
    maxQuantity: 10,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.OBSERVATIONS,
      extras: [{ name: 'Calda dupla', price: 2.0 }, { name: 'Granulado', price: 0 }]
    }
  },
  {
    id: 27,
    name: 'Petit Gateau',
    description: 'Bolinho de chocolate com recheio cremoso, acompanha sorvete de creme.',
    price: 18.9,
    category: 'Sobremesas',
    maxQuantity: 6,
    active: true,
    customization: null
  },

  // =========================================================================
  // PORÇÕES
  // =========================================================================
  {
    id: 28,
    name: 'Batata Frita',
    description: 'Porção de batata crocante 400g com sal na medida e molho especial.',
    price: 14.9,
    category: 'Porções',
    maxQuantity: 10,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.ADD_EXTRAS,
      extras: [{ name: 'Cheddar e bacon', price: 6.0 }, { name: 'Molho extra', price: 2.0 }]
    }
  },
  {
    id: 29,
    name: 'Onion Rings',
    description: 'Anéis de cebola empanados 300g com molho barbecue especial.',
    price: 16.9,
    category: 'Porções',
    maxQuantity: 8,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.ADD_EXTRAS,
      extras: [{ name: 'Molho extra', price: 2.0 }, { name: 'Bacon em cubos', price: 5.0 }]
    }
  },
  {
    id: 30,
    name: 'Frango a Passarinho',
    description: 'Frango temperado e frito na medida certa. Porção 500g.',
    price: 24.9,
    category: 'Porções',
    maxQuantity: 8,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.ADD_EXTRAS,
      extras: [{ name: 'Molho picante', price: 2.0 }, { name: 'Limão extra', price: 0 }]
    }
  },
  {
    id: 31,
    name: 'Calabresa Acebolada',
    description: 'Calabresa fatiada grelhada com cebola. Porção 400g.',
    price: 21.9,
    category: 'Porções',
    maxQuantity: 8,
    active: true,
    customization: {
      type: CUSTOMIZATION_TYPES.ADD_EXTRAS,
      extras: [{ name: 'Queijo coalho', price: 5.0 }, { name: 'Molho barbecue', price: 2.0 }]
    }
  },
  {
    id: 32,
    name: 'Porção de Queijo Coalho',
    description: 'Queijo coalho grelhado com melado de cana. Porção 300g.',
    price: 19.9,
    category: 'Porções',
    maxQuantity: 8,
    active: true,
    customization: null
  },

  // =========================================================================
  // PRODUTOS INATIVOS (exemplo)
  // =========================================================================
  {
    id: 33,
    name: 'Combo Indisponível',
    description: 'Item inativo para validar a regra de exibição.',
    price: 24.9,
    category: 'Combos',
    maxQuantity: 5,
    active: false,
    customization: null
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

  // Fecha o menu ao clicar em um link
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
    });
  });

  // Fecha o menu ao pressionar Escape
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
  setupDemoInteractions();
  setupModalControls();
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