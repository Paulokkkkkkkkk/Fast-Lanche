// checkout.js - validacao, pagamento simulado e registro de pedidos
import { cart, clearCart } from './cart.js';
import { openModal, closeModal, showToast, formatCurrency, setButtonLoading } from './ui.js';
import { ORDER_STATUS } from './order-tracking.js';
import { createAndShowReceipt } from './receipt.js';
import { validateCartStock, consumeStockForOrder } from './inventory.js';
import { getProfileDataForCheckout, isProfileComplete, getProfile } from './user-profile.js';

const checkoutForm = document.getElementById('checkout-form');
const checkoutFeedback = document.getElementById('checkout-feedback');
const submitButton = checkoutForm?.querySelector('button[type="submit"]');

const ORDERS_STORAGE_KEY = 'fastlanche_orders';

const checkoutData = {
  customerName: '',
  document: '',
  phone: '',
  address: '',
  orderNumber: '',
  paymentMethod: '',
  isPaymentPending: false,
  paymentStatus: 'idle',
  useProfileData: true
};

const orders = [];

function isStorageAvailable() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch (error) {
    console.warn('LocalStorage indisponivel para pedidos.', error);
    return false;
  }
}

function normalizeText(value) {
  return String(value || '').trim();
}

function onlyDigits(value) {
  return normalizeText(value).replace(/\D/g, '');
}

function createOrderNumber() {
  return `FL-${Date.now().toString(36).toUpperCase()}`;
}

function setFeedback(message, type = 'info') {
  if (!checkoutFeedback) return;

  checkoutFeedback.textContent = message;
  checkoutFeedback.dataset.status = type;
}

function setPendingState(isPending) {
  checkoutData.isPaymentPending = isPending;
  setButtonLoading(submitButton, isPending);
}

function saveOrders() {
  if (!isStorageAvailable()) return false;

  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.warn('Nao foi possivel salvar o pedido.', error);
    return false;
  }
}

function loadOrders() {
  if (!isStorageAvailable()) return orders;

  try {
    const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!storedOrders) return orders;

    const parsedOrders = JSON.parse(storedOrders);
    const safeOrders = Array.isArray(parsedOrders) ? parsedOrders : [];

    orders.splice(0, orders.length, ...safeOrders.filter(order => order?.orderNumber));
    return orders;
  } catch (error) {
    console.warn('Nao foi possivel carregar os pedidos.', error);
    orders.splice(0, orders.length);
    return orders;
  }
}

function getCheckoutData(form) {
  const formData = new FormData(form);

  checkoutData.customerName = normalizeText(formData.get('name'));
  checkoutData.phone = normalizeText(formData.get('phone'));
  checkoutData.address = normalizeText(formData.get('address'));
  checkoutData.paymentMethod = normalizeText(formData.get('payment'));
  checkoutData.document = normalizeText(formData.get('document'));
  checkoutData.orderNumber = createOrderNumber();
  checkoutData.paymentStatus = 'idle';

  return { ...checkoutData };
}

function validateCheckout(data) {
  const errors = [];
  const phoneDigits = onlyDigits(data.phone);
  const documentDigits = onlyDigits(data.document);

  if (!cart.items.length) errors.push('Adicione pelo menos um item ao carrinho.');
  if (data.customerName.length < 3) errors.push('Informe seu nome completo.');
  if (phoneDigits.length < 10 || phoneDigits.length > 11) errors.push('Informe um telefone valido.');
  if (data.address.length < 8) errors.push('Informe um endereco de entrega valido.');
  if (!data.paymentMethod) errors.push('Selecione uma forma de pagamento.');

  if (data.document && documentDigits.length !== 11 && documentDigits.length !== 14) {
    errors.push('CPF/CNPJ deve ter 11 ou 14 digitos.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function processPayment(data) {
  checkoutData.paymentStatus = 'processing';

  return new Promise(resolve => {
    window.setTimeout(() => {
      checkoutData.paymentStatus = 'approved';

      resolve({
        success: true,
        id: data.orderNumber,
        status: 'approved',
        method: data.paymentMethod
      });
    }, 800);
  });
}

function createOrder(data, paymentResult) {
  // Obter dados do perfil para vincular ao pedido
  const profile = getProfile();
  const order = {
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    phone: data.phone,
    address: data.address,
    document: data.document,
    paymentMethod: data.paymentMethod,
    paymentStatus: paymentResult.status,
    status: ORDER_STATUS.RECEIVED,
    items: cart.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      _customization: item._customization || null
    })),
    subtotal: cart.subtotal,
    deliveryFee: cart.deliveryFee,
    total: cart.total,
    createdAt: new Date().toISOString()
  };

  // Vincular dados do perfil ao pedido
  if (profile?.name || profile?.email) {
    order.userEmail = profile.email || '';
    order.userProfileId = profile.email || '';
    // Se o nome do checkout estiver vazio, usar o nome do perfil
    if (!data.customerName && profile.name) {
      order.customerName = profile.name;
    }
  }

  return order;
}

function registerOrder(order) {
  orders.unshift(order);
  saveOrders();
  return order;
}

function showOrderConfirmationModal(order) {
  const bodyContent = document.createElement('div');
  bodyContent.style.display = 'grid';
  bodyContent.style.gap = '1rem';

  const successIcon = document.createElement('div');
  successIcon.style.cssText = 'font-size:2.5rem;text-align:center;line-height:1;';
  successIcon.textContent = '✅';

  const summary = document.createElement('div');
  summary.style.cssText = 'display:grid;gap:.5rem;';

  const orderInfo = document.createElement('p');
  orderInfo.innerHTML = `<strong>Pedido:</strong> ${order.orderNumber}`;

  const dateInfo = document.createElement('p');
  const dateObj = new Date(order.createdAt);
  dateInfo.innerHTML = `<strong>Data:</strong> ${dateObj.toLocaleString('pt-BR')}`;

  const paymentInfo = document.createElement('p');
  const paymentLabels = { pix: 'Pix', card: 'Cartão', cash: 'Dinheiro' };
  paymentInfo.innerHTML = `<strong>Pagamento:</strong> ${paymentLabels[order.paymentMethod] || order.paymentMethod}`;

  const totalLine = document.createElement('p');
  totalLine.className = 'price-highlight';
  totalLine.textContent = `${formatCurrency(order.total)}`;

  const itemsInfo = document.createElement('p');
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  itemsInfo.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'} no pedido`;

  summary.append(orderInfo, dateInfo, paymentInfo, itemsInfo, totalLine);
  bodyContent.append(successIcon, summary);

  openModal({
    title: 'Pedido Confirmado!',
    bodyContent,
    actions: [
      {
        label: 'Fechar',
        variant: 'button-primary',
        onClick: closeModal
      }
    ]
  });
}

async function handleCheckoutSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;

  if (!form.reportValidity()) {
    setFeedback('Revise os campos obrigatorios.', 'error');
    showToast('Revise os campos obrigatorios.', 'error');
    return;
  }

  const data = getCheckoutData(form);
  const validation = validateCheckout(data);

  if (!validation.isValid) {
    setFeedback(validation.errors[0], 'error');
    showToast(validation.errors[0], 'error');
    return;
  }

  try {
    // Fase 22: Validar estoque antes de processar pagamento
    const stockErrors = validateCartStock(cart.items);
    if (stockErrors.length) {
      setFeedback(stockErrors[0].message, 'error');
      showToast(stockErrors[0].message, 'error');
      setPendingState(false);
      return;
    }

    setPendingState(true);
    setFeedback('Pagamento simulado em processamento...', 'info');

    const paymentResult = await processPayment(data);
    if (!paymentResult.success) throw new Error('Pagamento recusado.');

    // Fase 22: Consumir estoque após pagamento aprovado
    consumeStockForOrder(cart.items);

    const order = registerOrder(createOrder(data, paymentResult));
    clearCart();
    form.reset();

    setFeedback(
      `Pedido ${order.orderNumber} registrado. Total ${formatCurrency(order.total)}.`,
      'success'
    );

    // Fase 21: Gera e exibe comprovante digital apos pagamento aprovado
    createAndShowReceipt(order);
    showToast(`Pedido ${order.orderNumber} confirmado!`, 'success', 5000);
  } catch (error) {
    checkoutData.paymentStatus = 'failed';
    console.warn('Erro ao finalizar checkout.', error);
    setFeedback('Nao foi possivel finalizar o pedido. Tente novamente.', 'error');
    showToast('Erro ao finalizar o pedido.', 'error');
  } finally {
    setPendingState(false);
  }
}

function prefillCheckoutWithProfile() {
  if (!checkoutForm) return;

  const useProfileCheckbox = document.getElementById('checkout-use-profile');
  const shouldUseProfile = useProfileCheckbox ? useProfileCheckbox.checked : true;
  if (!shouldUseProfile) return;

  const profileData = getProfileDataForCheckout();
  if (!profileData.name && !profileData.phone && !profileData.address) return;

  const nameInput = document.getElementById('checkout-name');
  const phoneInput = document.getElementById('checkout-phone');
  const addressInput = document.getElementById('checkout-address');
  const paymentSelect = document.getElementById('checkout-payment');

  if (profileData.name && nameInput) nameInput.value = profileData.name;
  if (profileData.phone && phoneInput) phoneInput.value = profileData.phone;
  if (profileData.address && addressInput) addressInput.value = profileData.address;
  if (profileData.paymentMethod && paymentSelect) paymentSelect.value = profileData.paymentMethod;
}

function setupCheckout() {
  loadOrders();
  if (!checkoutForm) return;

  // Pré-preenchimento com dados do perfil ao carregar
  prefillCheckoutWithProfile();

  // Re-preenchimento quando o perfil for atualizado
  document.addEventListener('profile:update', () => {
    prefillCheckoutWithProfile();
  });

  // Re-preenchimento quando o checkbox "Usar dados do perfil" for alterado
  const useProfileCheckbox = document.getElementById('checkout-use-profile');
  if (useProfileCheckbox) {
    useProfileCheckbox.addEventListener('change', () => {
      if (useProfileCheckbox.checked) {
        prefillCheckoutWithProfile();
      }
    });
  }

  checkoutForm.addEventListener('submit', handleCheckoutSubmit);
}

export {
  checkoutData,
  handleCheckoutSubmit,
  loadOrders,
  orders,
  processPayment,
  registerOrder,
  saveOrders,
  setupCheckout,
  validateCheckout
};