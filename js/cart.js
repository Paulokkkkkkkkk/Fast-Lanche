// cart.js - logica do carrinho
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartFee = document.getElementById('cart-fee');
const cartTotal = document.getElementById('cart-total');

const DELIVERY_FEE = 6;
const FREE_DELIVERY_MINIMUM = 50;

const cart = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  total: 0
};

const formatCurrency = value => (
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
);

function normalizeQuantity(quantity, maxQuantity){
  const safeMax = Number.isFinite(maxQuantity) && maxQuantity > 0 ? maxQuantity : 99;
  const safeQuantity = Number.isFinite(quantity) ? quantity : 1;
  return Math.min(Math.max(safeQuantity, 1), safeMax);
}

function calculateCartTotals(){
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

function getCartItem(itemId){
  return cart.items.find(item => item.id === Number(itemId));
}

function addToCart(item){
  if(!item || !item.active) return cart;

  const existing = getCartItem(item.id);

  if(existing){
    existing.quantity = normalizeQuantity(existing.quantity + 1, existing.maxQuantity);
  }else{
    cart.items.push({
      id: item.id,
      name: item.name,
      price: Number(item.price) || 0,
      quantity: 1,
      maxQuantity: item.maxQuantity || 99
    });
  }

  calculateCartTotals();
  renderCart();
  return cart;
}

function incrementItem(itemId){
  const item = getCartItem(itemId);
  if(!item) return cart;

  item.quantity = normalizeQuantity(item.quantity + 1, item.maxQuantity);
  calculateCartTotals();
  renderCart();
  return cart;
}

function decrementItem(itemId){
  const item = getCartItem(itemId);
  if(!item) return cart;

  if(item.quantity <= 1){
    removeItem(itemId);
    return cart;
  }

  item.quantity = normalizeQuantity(item.quantity - 1, item.maxQuantity);
  calculateCartTotals();
  renderCart();
  return cart;
}

function removeItem(itemId){
  const index = cart.items.findIndex(item => item.id === Number(itemId));
  if(index === -1) return cart;

  cart.items.splice(index, 1);
  calculateCartTotals();
  renderCart();
  return cart;
}

function getSubtotal(){
  return cart.subtotal;
}

function renderEmptyCart(){
  if(!cartItemsContainer) return;

  const emptyItem = document.createElement('li');
  emptyItem.className = 'empty-state';
  emptyItem.textContent = 'Seu carrinho esta vazio.';
  cartItemsContainer.appendChild(emptyItem);
}

function createCartItemElement(item){
  const listItem = document.createElement('li');
  listItem.className = 'cart-item';

  const info = document.createElement('div');
  info.className = 'cart-item-info';

  const name = document.createElement('strong');
  name.textContent = item.name;

  const price = document.createElement('span');
  price.textContent = `${formatCurrency(item.price)} cada`;

  info.append(name, price);

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

function renderCart(){
  if(cartItemsContainer){
    cartItemsContainer.replaceChildren();

    if(cart.items.length){
      cart.items.forEach(item =>{
        cartItemsContainer.appendChild(createCartItemElement(item));
      });
    }else{
      renderEmptyCart();
    }
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  if(cartCount) cartCount.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`;
  if(cartSubtotal) cartSubtotal.textContent = formatCurrency(cart.subtotal);
  if(cartFee) cartFee.textContent = formatCurrency(cart.deliveryFee);
  if(cartTotal) cartTotal.textContent = formatCurrency(cart.total);
}

function setupCartControls(){
  if(!cartItemsContainer) return;

  cartItemsContainer.addEventListener('click', event =>{
    const target = event.target;
    if(!(target instanceof HTMLElement)) return;

    const action = target.dataset.cartAction;
    const itemId = Number(target.dataset.id);

    if(action === 'increment') incrementItem(itemId);
    if(action === 'decrement') decrementItem(itemId);
    if(action === 'remove') removeItem(itemId);
  });
}

export {
  addToCart,
  calculateCartTotals,
  cart,
  decrementItem,
  getSubtotal,
  incrementItem,
  removeItem,
  renderCart,
  setupCartControls
};
