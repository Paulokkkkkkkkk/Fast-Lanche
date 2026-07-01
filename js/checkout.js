// checkout.js - camada de dados inicial do checkout
const checkoutData = {
  customerName: '',
  document: '',
  phone: '',
  email: '',
  address: '',
  orderNumber: '',
  paymentMethod: '',
  notes: '',
  isPaymentPending: false,
  paymentStatus: 'idle'
};

function validateCheckout(data){
  return Boolean(data);
}

function processPayment(data){
  return Promise.resolve({
    success: true,
    id: Date.now(),
    data
  });
}

export { checkoutData, processPayment, validateCheckout };
