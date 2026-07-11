// app.js - cardapio dinamico, busca e filtros
import { addToCart, loadCart, setupCartControls } from './cart.js';
import { setupCheckout } from './checkout.js';

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

function createTextElement(tagName, className, text){
  const element = document.createElement(tagName);
  if(className) element.className = className;
  element.textContent = text;
  return element;
}

function createMenuCard(item){
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

function renderEmptyMenu(){
  if(!menuContainer) return;

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'empty-state menu-empty';
  emptyMessage.textContent = 'Nenhum item ativo encontrado para essa busca.';

  menuContainer.appendChild(emptyMessage);
}

function renderMenu(items = visibleItems){
  if(!menuContainer) return;

  menuContainer.replaceChildren();

  const activeItems = items.filter(item => item.active);

  if(!activeItems.length){
    renderEmptyMenu();
    return;
  }

  activeItems.forEach(item =>{
    menuContainer.appendChild(createMenuCard(item));
  });
}

function getFilteredMenuItems(){
  const normalizedSearch = normalizeText(searchTerm);

  return menuItems.filter(item =>{
    const isActive = item.active;
    const matchesCategory = activeFilter === 'all' || item.category === activeFilter;
    const searchableContent = normalizeText(`${item.name} ${item.description}`);
    const matchesSearch = !normalizedSearch || searchableContent.includes(normalizedSearch);

    return isActive && matchesCategory && matchesSearch;
  });
}

function updateVisibleItems(){
  visibleItems = getFilteredMenuItems();
  renderMenu(visibleItems);
}

function setSearchTerm(value){
  searchTerm = value;
  updateVisibleItems();
}

function setActiveFilter(value){
  activeFilter = value || 'all';
  updateVisibleItems();
}

function setupMenuFilters(){
  if(searchInput){
    searchInput.addEventListener('input', event =>{
      setSearchTerm(event.target.value);
    });
  }

  if(categoryFilter){
    categoryFilter.addEventListener('change', event =>{
      setActiveFilter(event.target.value);
    });
  }
}

function showToast(message){
  const container = document.getElementById('toast-container');
  if(!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function setupDemoInteractions(){
  document.body.addEventListener('click', event =>{
    const target = event.target;
    if(!(target instanceof HTMLElement)) return;

    if(target.matches('.add-to-cart')){
      const itemId = Number(target.dataset.id);
      const selectedItem = menuItems.find(item => item.id === itemId);

      addToCart(selectedItem);
      showToast('Item adicionado ao carrinho.');
    }
  });

  document.querySelectorAll('form:not(#checkout-form)').forEach(form =>{
    form.addEventListener('submit', event =>{
      event.preventDefault();
      showToast('Formulario pronto para a proxima fase.');
    });
  });
}

function setup(){
  updateVisibleItems();
  setupMenuFilters();
  loadCart();
  setupCartControls();
  setupCheckout();
  setupDemoInteractions();
}

window.addEventListener('DOMContentLoaded', setup);

export {
  activeFilter,
  menuItems,
  renderMenu,
  searchTerm,
  setActiveFilter,
  setSearchTerm,
  updateVisibleItems,
  visibleItems
};
