// app.js - responsabilidade: renderização do cardápio, busca e filtros (stub)
const menuContainer = document.getElementById('menu-items');
const cartContents = document.getElementById('cart-contents');

const menuItems = [
  { id: 1, name: 'X-Burger', price: 14.9, category: 'Lanches', active: true },
  { id: 2, name: 'Batata Frita', price: 7.5, category: 'Acompanhamentos', active: true }
];

function renderMenu(items = menuItems){
  if(!menuContainer) return;
  menuContainer.innerHTML = '';
  items.filter(i => i.active).forEach(item =>{
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h4>${item.name}</h4>
      <p>R$ ${item.price.toFixed(2)}</p>
      <button data-id="${item.id}" class="add-to-cart">Adicionar</button>
    `;
    menuContainer.appendChild(card);
  });
}

function setup(){
  renderMenu();
  // listeners básicos
  document.body.addEventListener('click', (e)=>{
    const t = e.target;
    if(t.matches('.add-to-cart')){
      const id = Number(t.dataset.id);
      console.log('Adicionar ao carrinho:', id);
      showToast('Item adicionado ao carrinho');
    }
  });
}

function showToast(message){
  const container = document.getElementById('toast-container');
  if(!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(()=> el.remove(), 3000);
}

window.addEventListener('DOMContentLoaded', setup);

export { renderMenu, menuItems };
