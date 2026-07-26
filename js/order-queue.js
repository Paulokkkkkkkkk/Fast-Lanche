// order-queue.js - Sistema de Fila de Pedidos (Fase 20)
// Gerencia a posição dos pedidos na fila de produção
// NOTA: Este módulo NÃO importa de order-tracking.js para evitar dependência circular

// =========================================================================
// CONSTANTES (duplicadas localmente para evitar dependência circular)
// =========================================================================
const QUEUE_EVENT_NAME = 'fastlanche:queue-updated';
const ORDERS_STORAGE_KEY = 'fastlanche_orders';

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

// Status que contam como "em fila de produção"
const QUEUE_STATUSES = [
    ORDER_STATUS.RECEIVED,
    ORDER_STATUS.PAYMENT_CONFIRMED,
    ORDER_STATUS.PREPARING
];

// Status que finalizam a passagem pela fila
const EXIT_QUEUE_STATUSES = [
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED
];

// =========================================================================
// UTILITÁRIOS DE PERSISTÊNCIA (locais para evitar dependência circular)
// =========================================================================
function loadOrders() {
    try {
        const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveOrders(orders) {
    try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
        return true;
    } catch {
        return false;
    }
}

function getStatusIndex(status) {
    return ORDER_STATUS_ORDER.indexOf(status);
}

// =========================================================================
// CÁLCULO DA FILA
// =========================================================================

/**
 * Retorna todos os pedidos que estão atualmente na fila de produção,
 * ordenados cronologicamente (mais antigos primeiro).
 */
function getQueueOrders() {
    const orders = loadOrders();
    return orders
        .filter(order => QUEUE_STATUSES.includes(order.status))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Calcula a posição de um pedido específico na fila.
 * Retorna um objeto com:
 * - inQueue: boolean indicando se está na fila
 * - position: número da posição (0-based, 0 = primeiro da fila)
 * - aheadCount: quantos pedidos estão à frente
 * - totalInQueue: total de pedidos na fila
 * - isNext: se é o próximo a ser preparado
 * - message: mensagem amigável para exibir ao cliente
 */
function getOrderQueuePosition(orderNumber) {
    const queue = getQueueOrders();
    const orderIndex = queue.findIndex(order => order.orderNumber === orderNumber);

    if (orderIndex === -1) {
        // Pedido não está mais na fila (já saiu para entrega ou foi entregue)
        const order = loadOrders().find(o => o.orderNumber === orderNumber);
        if (!order) {
            return {
                inQueue: false,
                position: -1,
                aheadCount: 0,
                totalInQueue: queue.length,
                isNext: false,
                message: 'Pedido não encontrado.'
            };
        }

        if (EXIT_QUEUE_STATUSES.includes(order.status)) {
            return {
                inQueue: false,
                position: -1,
                aheadCount: 0,
                totalInQueue: queue.length,
                isNext: false,
                message: 'Seu pedido já saiu para entrega ou foi entregue!'
            };
        }

        return {
            inQueue: false,
            position: -1,
            aheadCount: 0,
            totalInQueue: queue.length,
            isNext: false,
            message: 'Pedido não está na fila no momento.'
        };
    }

    const aheadCount = orderIndex;
    const totalInQueue = queue.length;
    const isNext = orderIndex === 0;

    let message;
    if (isNext) {
        message = '🎯 Seu pedido é o próximo!';
    } else if (aheadCount === 1) {
        message = `⏳ Há ${aheadCount} pedido na sua frente.`;
    } else {
        message = `⏳ Há ${aheadCount} pedidos na sua frente.`;
    }

    return {
        inQueue: true,
        position: orderIndex,
        aheadCount,
        totalInQueue,
        isNext,
        message
    };
}

/**
 * Dispara um evento personalizado para notificar que a fila foi atualizada.
 * Isso permite que componentes reajam sem criar dependências circulares.
 */
function notifyQueueUpdated() {
    try {
        window.dispatchEvent(new CustomEvent(QUEUE_EVENT_NAME, {
            detail: {
                queue: getQueueOrders(),
                timestamp: Date.now()
            }
        }));
    } catch {
        // Silently fail - evento não crítico
    }
}

/**
 * Escuta atualizações da fila.
 * Retorna uma função de cleanup para remover o listener.
 */
function onQueueUpdated(callback) {
    const handler = (event) => {
        callback(event.detail);
    };
    window.addEventListener(QUEUE_EVENT_NAME, handler);
    return () => window.removeEventListener(QUEUE_EVENT_NAME, handler);
}

/**
 * Atualiza o status de um pedido e notifica a fila.
 * Esta função deve ser usada no lugar de updateOrderStatus quando
 * a mudança de status pode afetar a fila.
 */
function updateOrderStatusWithQueue(orderNumber, newStatus) {
    const orders = loadOrders();
    const index = orders.findIndex(order => order.orderNumber === orderNumber);
    if (index === -1) return false;

    const oldStatus = orders[index].status;
    orders[index].status = newStatus;
    const saved = saveOrders(orders);

    if (saved) {
        // Notificar fila se a mudança de status afeta a fila
        const wasInQueue = QUEUE_STATUSES.includes(oldStatus);
        const nowInQueue = QUEUE_STATUSES.includes(newStatus);
        const exitedQueue = wasInQueue && !nowInQueue;

        if (wasInQueue !== nowInQueue || exitedQueue) {
            notifyQueueUpdated();
        }
    }

    return saved;
}

/**
 * Retorna estatísticas da fila para o painel administrativo.
 */
function getQueueStats() {
    const queue = getQueueOrders();
    const orders = loadOrders();

    const received = queue.filter(o => o.status === ORDER_STATUS.RECEIVED).length;
    const paymentConfirmed = queue.filter(o => o.status === ORDER_STATUS.PAYMENT_CONFIRMED).length;
    const preparing = queue.filter(o => o.status === ORDER_STATUS.PREPARING).length;
    const outForDelivery = orders.filter(o => o.status === ORDER_STATUS.OUT_FOR_DELIVERY).length;
    const delivered = orders.filter(o => o.status === ORDER_STATUS.DELIVERED).length;

    return {
        totalInQueue: queue.length,
        received,
        paymentConfirmed,
        preparing,
        outForDelivery,
        delivered,
        queue
    };
}

// =========================================================================
// EXPORTS
// =========================================================================
export {
    ORDER_STATUS,
    ORDER_STATUS_ORDER,
    QUEUE_STATUSES,
    EXIT_QUEUE_STATUSES,
    QUEUE_EVENT_NAME,
    getQueueOrders,
    getOrderQueuePosition,
    notifyQueueUpdated,
    onQueueUpdated,
    updateOrderStatusWithQueue,
    getQueueStats
};