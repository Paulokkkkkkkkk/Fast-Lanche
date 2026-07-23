// order-tracking.js - Sistema de Acompanhamento de Pedido (modal pop-up)
import { formatCurrency, openModal, closeModal, showToast } from './ui.js';

const ORDER_STATUS = {
    RECEIVED: 'Pedido recebido',
    PAYMENT_CONFIRMED: 'Pagamento confirmado',
    PREPARING: 'Preparando pedido',
    OUT_FOR_DELIVERY: 'Saiu para entrega',
    DELIVERED: 'Entregue'
};

const ORDER_STATUS_ORDER = [
    ORDER_STATUS.RECEIVED,
    ORDER_STATUS.PAYMENT_CONFIRMED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED
];

const ORDERS_STORAGE_KEY = 'fastlanche_orders';

function getStatusIndex(status) {
    return ORDER_STATUS_ORDER.indexOf(status);
}

function loadOrders() {
    try {
        const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Erro ao carregar pedidos para tracking.', error);
        return [];
    }
}

function saveOrders(orders) {
    try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
        return true;
    } catch (error) {
        console.warn('Erro ao salvar pedidos no tracking.', error);
        return false;
    }
}

function findOrderByNumber(orderNumber) {
    const orders = loadOrders();
    return orders.find(order => order.orderNumber === orderNumber) || null;
}

function updateOrderStatus(orderNumber, newStatus) {
    const orders = loadOrders();
    const index = orders.findIndex(order => order.orderNumber === orderNumber);
    if (index === -1) return false;

    orders[index].status = newStatus;
    saveOrders(orders);
    return true;
}

function getStatusText(status) {
    const statusTexts = {
        [ORDER_STATUS.RECEIVED]: 'Restaurante recebeu a solicitação.',
        [ORDER_STATUS.PAYMENT_CONFIRMED]: 'Pagamento aprovado.',
        [ORDER_STATUS.PREPARING]: 'Produto em produção.',
        [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Pedido enviado ao cliente.',
        [ORDER_STATUS.DELIVERED]: 'Cliente recebeu.'
    };
    return statusTexts[status] || '';
}

function formatDateTime(isoString) {
    try {
        const date = new Date(isoString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return isoString;
    }
}

function createStatusStep(status, isActive, isCompleted) {
    const step = document.createElement('div');
    step.className = 'track-status-step';
    if (isCompleted) step.classList.add('completed');
    if (isActive) step.classList.add('active');

    const indicator = document.createElement('div');
    indicator.className = 'track-status-indicator';

    const label = document.createElement('div');
    label.className = 'track-status-label';

    const title = document.createElement('strong');
    title.textContent = status;

    const description = document.createElement('span');
    description.textContent = getStatusText(status);

    label.append(title, description);
    step.append(indicator, label);

    return step;
}

function renderStatusBar(currentStatus) {
    const container = document.createElement('div');
    container.className = 'track-status-bar';

    const currentIndex = getStatusIndex(currentStatus);

    ORDER_STATUS_ORDER.forEach((status, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const step = createStatusStep(status, isActive, isCompleted);
        container.appendChild(step);
    });

    return container;
}

function renderOrderItems(order) {
    const list = document.createElement('ul');
    list.className = 'track-items-list';

    order.items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'track-item';

        const itemName = document.createElement('span');
        itemName.className = 'track-item-name';
        itemName.textContent = `${item.quantity}x ${item.name}`;

        const itemPrice = document.createElement('span');
        itemPrice.className = 'track-item-price';
        itemPrice.textContent = formatCurrency(item.price * item.quantity);

        li.append(itemName, itemPrice);

        // Personalizacoes
        if (item._customization) {
            const custSummary = document.createElement('div');
            custSummary.className = 'track-item-customization';
            const cust = item._customization;

            const details = [];
            if (cust.type === 'half_half') {
                details.push(`Meio ${cust.flavor1}${cust.flavor2 ? ` + Meio ${cust.flavor2}` : ''}`);
            }
            if (cust.type === 'remove_ingredients' && cust.removedIngredients?.length) {
                details.push(`Sem: ${cust.removedIngredients.join(', ')}`);
            }
            if (cust.extras?.length) {
                const extrasNames = cust.extras.map(e => e.name);
                details.push(`Adicionais: ${extrasNames.join(', ')}`);
            }
            if (cust.observation) {
                details.push(`Obs: ${cust.observation}`);
            }

            if (details.length) {
                custSummary.textContent = details.join(' | ');
                li.appendChild(custSummary);
            }
        }

        list.appendChild(li);
    });

    return list;
}

function renderOrderValues(order) {
    const container = document.createElement('dl');
    container.className = 'track-values';

    const subtotalRow = document.createElement('div');
    subtotalRow.innerHTML = `<dt>Subtotal</dt><dd>${formatCurrency(order.subtotal || 0)}</dd>`;

    const feeRow = document.createElement('div');
    feeRow.innerHTML = `<dt>Entrega</dt><dd>${formatCurrency(order.deliveryFee || 0)}</dd>`;

    const totalRow = document.createElement('div');
    totalRow.className = 'summary-total';
    totalRow.innerHTML = `<dt>Total</dt><dd>${formatCurrency(order.total || 0)}</dd>`;

    container.append(subtotalRow, feeRow, totalRow);
    return container;
}

function buildTrackModalContent(order) {
    const content = document.createElement('div');
    content.className = 'track-modal-content';

    // Header
    const header = document.createElement('div');
    header.className = 'track-header';

    const headerMain = document.createElement('div');
    headerMain.className = 'track-header-main';

    const orderNumberEl = document.createElement('strong');
    orderNumberEl.className = 'track-order-number';
    orderNumberEl.innerHTML = `Pedido <span>${order.orderNumber}</span>`;

    const customerEl = document.createElement('span');
    customerEl.className = 'track-customer';
    customerEl.textContent = order.customerName;

    headerMain.append(orderNumberEl, customerEl);

    const dateEl = document.createElement('span');
    dateEl.className = 'track-date';
    dateEl.textContent = formatDateTime(order.createdAt);

    header.append(headerMain, dateEl);
    content.appendChild(header);

    // Status Bar
    const statusBar = renderStatusBar(order.status || ORDER_STATUS.RECEIVED);
    content.appendChild(statusBar);

    // Details
    const details = document.createElement('div');
    details.className = 'track-details';

    const itemsTitle = document.createElement('h4');
    itemsTitle.textContent = 'Itens do pedido';
    details.appendChild(itemsTitle);

    const itemsList = renderOrderItems(order);
    details.appendChild(itemsList);

    const values = renderOrderValues(order);
    details.appendChild(values);

    content.appendChild(details);

    // Botao confirmar entrega
    const canConfirm = order.status === ORDER_STATUS.OUT_FOR_DELIVERY;
    if (canConfirm) {
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'button button-primary track-confirm-btn';
        confirmBtn.type = 'button';
        confirmBtn.dataset.orderNumber = order.orderNumber;
        confirmBtn.textContent = '✅ Confirmar recebimento';
        confirmBtn.addEventListener('click', handleConfirmDelivery);
        content.appendChild(confirmBtn);
    }

    if (order.status === ORDER_STATUS.DELIVERED) {
        const deliveredMsg = document.createElement('p');
        deliveredMsg.className = 'track-delivered-msg';
        deliveredMsg.textContent = '✅ Pedido já foi entregue. Obrigado!';
        content.appendChild(deliveredMsg);
    }

    return content;
}

function handleConfirmDelivery(event) {
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const orderNumber = button.dataset.orderNumber;
    if (!orderNumber) return;

    const updated = updateOrderStatus(orderNumber, ORDER_STATUS.DELIVERED);
    if (!updated) {
        showToast('Erro ao confirmar entrega.', 'error');
        return;
    }

    closeModal();

    // Reabre o modal com status atualizado apos breve delay
    setTimeout(() => {
        const order = findOrderByNumber(orderNumber);
        if (order) {
            openTrackingModal(order);
        }
    }, 300);

    showToast('Entrega confirmada! Obrigado por comprar no Fast Lanche.', 'success', 5000);
}

function openTrackingModal(order) {
    const content = buildTrackModalContent(order);

    openModal({
        title: `Acompanhar Pedido`,
        bodyContent: content,
        actions: [
            {
                label: 'Fechar',
                variant: 'button-primary',
                onClick: closeModal
            }
        ]
    });
}

function handleTrackSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;

    const formData = new FormData(form);
    const orderNumber = (formData.get('order-number') || '').toString().trim().toUpperCase();

    if (!orderNumber) {
        showToast('Informe o número do pedido.', 'error');
        return;
    }

    if (!/^FL-[\w-]+$/i.test(orderNumber)) {
        showToast('Formato inválido. O número começa com FL- (ex: FL-ABC123).', 'error');
        return;
    }

    const order = findOrderByNumber(orderNumber);

    if (!order) {
        showToast('Pedido não encontrado. Verifique o número informado.', 'error');
        return;
    }

    closeModal();

    // Pequeno delay para fechar o modal de busca antes de abrir o do resultado
    setTimeout(() => {
        openTrackingModal(order);
    }, 300);
}

function openTrackSearchModal() {
    const content = document.createElement('div');
    content.className = 'track-search-modal';

    const description = document.createElement('p');
    description.className = 'track-search-desc';
    description.textContent = 'Digite o número do seu pedido para acompanhar o status atual.';

    const form = document.createElement('form');
    form.id = 'track-form';
    form.className = 'track-search-form';

    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = `<span>Número do pedido</span>`;

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'order-number';
    input.placeholder = 'Ex: FL-ABC123';
    input.autocomplete = 'off';
    input.required = true;

    label.appendChild(input);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'button button-primary';
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Buscar pedido';

    form.append(label, submitBtn);
    form.addEventListener('submit', handleTrackSubmit);

    content.append(description, form);

    openModal({
        title: 'Acompanhar Pedido',
        bodyContent: content,
        actions: [
            {
                label: 'Cancelar',
                variant: 'button-secondary',
                onClick: closeModal
            }
        ]
    });

    // Foco no input apos abrir
    setTimeout(() => input.focus(), 350);
}

function setupOrderTracking() {
    const trackBtn = document.getElementById('nav-track-btn');
    if (trackBtn) {
        trackBtn.addEventListener('click', openTrackSearchModal);
    }
}

export {
    ORDER_STATUS,
    ORDER_STATUS_ORDER,
    findOrderByNumber,
    getStatusIndex,
    getStatusText,
    loadOrders,
    saveOrders,
    setupOrderTracking,
    updateOrderStatus
};