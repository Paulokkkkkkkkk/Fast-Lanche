// cart.js - lógica do carrinho (stub)
const cart = [];

function addToCart(item){
  const existing = cart.find(c=>c.id===item.id);
  if(existing) existing.qty = Math.min((existing.qty||1)+1, 99);
  else cart.push({...item, qty:1});
}

function getSubtotal(){
  return cart.reduce((s,i)=>s + i.price * (i.qty||1), 0);
}

export { cart, addToCart, getSubtotal };
