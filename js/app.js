// app.js - dados e inicializacao visual do cardapio
const menuContainer = document.getElementById('menu-items');

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
  }
];

let visibleItems = menuItems.filter(item => item.active);
let activeFilter = 'all';
let searchTerm = '';

const formatCurrency = value => (
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
);

function createTextElement(tagName, className, text){
  const element = document.createElement(tagName);
  if(className) element.className = className;
  element.textContent = text;
  return element;
}

function renderMenu(items = visibleItems){
  if(!menuContainer) return;

  menuContainer.replaceChildren();

  items.filter(item => item.active).forEach(item =>{
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
    menuContainer.appendChild(card);
  });
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
      showToast('Item selecionado. A logica do carrinho entra na Fase 4.');
    }
  });

  document.querySelectorAll('form').forEach(form =>{
    form.addEventListener('submit', event =>{
      event.preventDefault();
      showToast('Formulario pronto para a proxima fase.');
    });
  });
}

function setup(){
  renderMenu();
  setupDemoInteractions();
}

window.addEventListener('DOMContentLoaded', setup);

export {
  activeFilter,
  menuItems,
  renderMenu,
  searchTerm,
  visibleItems
};
