// cart.js - logica do carrinho
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartFee = document.getElementById('cart-fee');
const cartTotal = document.getElementById('cart-total');

const DELIVERY_FEE = 6;
const FREE_DELIVERY_MINIMUM = 50;
const CART_STORAGE_KEY = 'fastlanche_cart';

const cart = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  total: 0
};

const formatCurrency = value => (
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
);

function normalizeQuantity(quantity, maxQuantity) {
  const safeMax = Number.isFinite(maxQuantity) && maxQuantity > 0 ? maxQuantity : 99;
  const safeQuantity = Number.isFinite(quantity) ? quantity : 1;
  return Math.min(Math.max(safeQuantity, 1), safeMax);
}

function calculateCartTotals() {
  cart.subtotal = cart.items.reduce((sum, item) => (
    sum + item.price * item.quantity
  ), 0);

  cart.deliveryFee = cart.subtotal > 0 && cart.subtotal < FREE_DELIVERY_MINIMUM
    ? DELIVERY_FEE
    : 0;

  cart.total = Math.max(cart.subtotal + cart.deliveryFee, 0);

  return {
    subtotal: cart.subtotal,
    deliveryFee: cart.deliveryFee,
    total: cart.total
  };
}

function isStorageAvailable() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch (error) {
    console.warn('LocalStorage indisponivel para o carrinho.', error);
    return false;
  }
}

function getSerializableCart() {
  return {
    items: cart.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      maxQuantity: item.maxQuantity,
      _customization: item._customization || null
    })),
    subtotal: cart.subtotal,
    deliveryFee: cart.deliveryFee,
    total: cart.total
  };
}

function saveCart() {
  if (!isStorageAvailable()) return false;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(getSerializableCart()));
    return true;
  } catch (error) {
    console.warn('Nao foi possivel salvar o carrinho.', error);
    return false;
  }
}

function isValidStoredItem(item) {
  return (
    item &&
    Number.isFinite(Number(item.id)) &&
    typeof item.name === 'string' &&
    Number.isFinite(Number(item.price)) &&
    Number.isFinite(Number(item.quantity))
  );
}

function normalizeStoredItem(item) {
  const maxQuantity = Number(item.maxQuantity) || 99;

  return {
    id: Number(item.id),
    name: item.name,
    price: Math.max(Number(item.price) || 0, 0),
    quantity: normalizeQuantity(Number(item.quantity), maxQuantity),
    maxQuantity,
    _customization: item._customization || null
  };
}

function loadCart() {
  if (!isStorageAvailable()) {
    calculateCartTotals();
    renderCart();
    return cart;
  }

  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) {
      calculateCartTotals();
      renderCart();
      return cart;
    }

    const parsedCart = JSON.parse(storedCart);
    const storedItems = Array.isArray(parsedCart?.items) ? parsedCart.items : [];

    cart.items = storedItems
      .filter(isValidStoredItem)
      .map(normalizeStoredItem);

    calculateCartTotals();
    renderCart();
    return cart;
  } catch (error) {
    console.warn('Nao foi possivel carregar o carrinho.', error);
    cart.items = [];
    calculateCartTotals();
    renderCart();
    return cart;
  }
}

function getCartItem(itemId) {
  return cart.items.find(item => item.id === Number(itemId));
}

function addToCart(item) {
  if (!item || !item.active) return cart;

  const existing = getCartItem(item.id);

  if (existing) {
    existing.quantity = normalizeQuantity(existing.quantity + 1, existing.maxQuantity);
  } else {
    cart.items.push({
      id: item.id,
      name: item.name,
      price: Number(item.price) || 0,
      quantity: 1,
      maxQuantity: item.maxQuantity || 99,
      _customization: item._customization || null
    });
  }

  calculateCartTotals();
  saveCart();
  renderCart();
  return cart;
}

function incrementItem(itemId) {
  const item = getCartItem(itemId);
  if (!item) return cart;

  item.quantity = normalizeQuantity(item.quantity + 1, item.maxQuantity);
  calculateCartTotals();
  saveCart();
  renderCart();
  return cart;
}

function decrementItem(itemId) {
  const item = getCartItem(itemId);
  if (!item) return cart;

  if (item.quantity <= 1) {
    removeItem(itemId);
    return cart;
  }

  item.quantity = normalizeQuantity(item.quantity - 1, item.maxQuantity);
  calculateCartTotals();
  saveCart();
  renderCart();
  return cart;
}

function removeItem(itemId) {
  const index = cart.items.findIndex(item => item.id === Number(itemId));
  if (index === -1) return cart;

  cart.items.splice(index, 1);
  calculateCartTotals();
  saveCart();
  renderCart();
  return cart;
}

function clearCart() {
  cart.items = [];
  calculateCartTotals();
  saveCart();
  renderCart();
  return cart;
}

function getSubtotal() {
  return cart.subtotal;
}

function renderEmptyCart() {
  if (!cartItemsContainer) return;

  const emptyItem = document.createElement('li');
  emptyItem.className = 'empty-state';

  const emoji = document.createElement('span');
  emoji.className = 'empty-state-icon';
  emoji.textContent = '🛒';

  const text = document.createElement('span');
  text.className = 'empty-state-text';
  text.textContent = 'Seu carrinho esta vazio.';

  emptyItem.append(emoji, text);
  cartItemsContainer.appendChild(emptyItem);
}

function createCustomizationSummary(item) {
  if (!item._customization) return null;

  const summary = document.createElement('div');
  summary.className = 'cart-item-customization';

  const cust = item._customization;

  if (cust.type === 'half_half') {
    const parts = [];
    parts.push(`Meio ${cust.flavor1}`);
    if (cust.flavor2) parts.push(`Meio ${cust.flavor2}`);
    const p = document.createElement('span');
    p.textContent = parts.join(' + ');
    summary.appendChild(p);
  }

  if (cust.type === 'remove_ingredients' && cust.removedIngredients && cust.removedIngredients.length > 0) {
    const removed = document.createElement('span');
    removed.textContent = `Sem: ${cust.removedIngredients.join(', ')}`;
    summary.appendChild(removed);
  }

  if (cust.extras && cust.extras.length > 0) {
    const extrasText = document.createElement('span');
    extrasText.textContent = `Adicionais: ${cust.extras.map(e => e.name).join(', ')}`;
    summary.appendChild(extrasText);
  }

  if (cust.observation) {
    const obs = document.createElement('span');
    obs.textContent = `Obs: ${cust.observation}`;
    summary.appendChild(obs);
  }

  return summary;
}

function createCartItemElement(item) {
  const listItem = document.createElement('li');
  listItem.className = 'cart-item';

  const info = document.createElement('div');
  info.className = 'cart-item-info';

  const name = document.createElement('strong');
  name.textContent = item.name;

  const price = document.createElement('span');
  price.textContent = `${formatCurrency(item.price)} cada`;

  info.append(name, price);

  // Resumo da personalizacao
  const customizationSummary = createCustomizationSummary(item);
  if (customizationSummary) {
    info.appendChild(customizationSummary);
  }

  const controls = document.createElement('div');
  controls.className = 'cart-item-controls';

  const decrementButton = document.createElement('button');
  decrementButton.type = 'button';
  decrementButton.className = 'cart-control';
  decrementButton.dataset.cartAction = 'decrement';
  decrementButton.dataset.id = String(item.id);
  decrementButton.textContent = '-';
  decrementButton.setAttribute('aria-label', `Diminuir quantidade de ${item.name}`);

  const quantity = document.createElement('span');
  quantity.className = 'cart-quantity';
  quantity.textContent = String(item.quantity);

  const incrementButton = document.createElement('button');
  incrementButton.type = 'button';
  incrementButton.className = 'cart-control';
  incrementButton.dataset.cartAction = 'increment';
  incrementButton.dataset.id = String(item.id);
  incrementButton.textContent = '+';
  incrementButton.disabled = item.quantity >= item.maxQuantity;
  incrementButton.setAttribute('aria-label', `Aumentar quantidade de ${item.name}`);

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'cart-remove';
  removeButton.dataset.cartAction = 'remove';
  removeButton.dataset.id = String(item.id);
  removeButton.textContent = 'Remover';

  controls.append(decrementButton, quantity, incrementButton, removeButton);
  listItem.append(info, controls);

  return listItem;
}

function renderCart() {
  if (cartItemsContainer) {
    cartItemsContainer.replaceChildren();

    if (cart.items.length) {
      cart.items.forEach(item => {
        cartItemsContainer.appendChild(createCartItemElement(item));
      });
    } else {
      renderEmptyCart();
    }
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  if (cartCount) cartCount.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`;
  if (cartSubtotal) cartSubtotal.textContent = formatCurrency(cart.subtotal);
  if (cartFee) cartFee.textContent = formatCurrency(cart.deliveryFee);
  if (cartTotal) cartTotal.textContent = formatCurrency(cart.total);
}

function setupCartControls() {
  if (!cartItemsContainer) return;

  cartItemsContainer.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.dataset.cartAction;
    const itemId = Number(target.dataset.id);

    if (action === 'increment') incrementItem(itemId);
    if (action === 'decrement') decrementItem(itemId);
    if (action === 'remove') removeItem(itemId);
  });
}

export {
  addToCart,
  calculateCartTotals,
  cart,
  clearCart,
  decrementItem,
  getSubtotal,
  incrementItem,
  loadCart,
  removeItem,
  renderCart,
  saveCart,
  setupCartControls
};
