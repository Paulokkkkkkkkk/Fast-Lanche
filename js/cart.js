// cart.js - camada de dados inicial do carrinho
const cart = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  total: 0
};

function addToCart(item){
  const existing = cart.items.find(cartItem => cartItem.id === item.id);
  if(existing){
    existing.quantity = Math.min(existing.quantity + 1, item.maxQuantity || 99);
  }else{
    cart.items.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      maxQuantity: item.maxQuantity || 99
    });
  }
}

function getSubtotal(){
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export { addToCart, cart, getSubtotal };
