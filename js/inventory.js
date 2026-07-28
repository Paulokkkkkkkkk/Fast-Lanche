// inventory.js - Controle de Estoque e Disponibilidade
// Módulo responsável por gerenciar quantidades em estoque, bloquear vendas
// e integrar com cardápio, carrinho e área administrativa
import { menuItems, updateVisibleItems } from './menu-store.js';
import { showToast } from './ui.js';

const INVENTORY_STORAGE_KEY = 'fastlanche_inventory';

// =========================================================================
// ESTADO DO ESTOQUE
// =========================================================================
const inventoryState = {
    stock: {} // { [productId]: { quantity: number, lowStockThreshold: number } }
};

// =========================================================================
// UTILITÁRIOS
// =========================================================================
function isStorageAvailable() {
    try {
        return typeof window !== 'undefined' && Boolean(window.localStorage);
    } catch {
        return false;
    }
}

// =========================================================================
// PERSISTÊNCIA
// =========================================================================
function saveInventory() {
    if (!isStorageAvailable()) return false;
    try {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryState.stock));
        return true;
    } catch {
        return false;
    }
}

function loadInventory() {
    if (!isStorageAvailable()) return;

    try {
        const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
        if (!stored) {
            initializeDefaultStock();
            return;
        }

        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
            inventoryState.stock = parsed;
        } else {
            initializeDefaultStock();
        }
    } catch {
        initializeDefaultStock();
    }
}

// =========================================================================
// INICIALIZAÇÃO
// =========================================================================
function initializeDefaultStock() {
    inventoryState.stock = {};

    menuItems.forEach(item => {
        // Define estoque inicial baseado no maxQuantity * 5 (estoque inicial razoável)
        const defaultStock = Math.max(item.maxQuantity * 5, 10);
        inventoryState.stock[item.id] = {
            quantity: defaultStock,
            lowStockThreshold: 5
        };
    });

    saveInventory();
}

// =========================================================================
// CONSULTA DE ESTOQUE
// =========================================================================
function getStock(productId) {
    const stock = inventoryState.stock[productId];
    if (!stock) return { quantity: 0, lowStockThreshold: 5 };

    return { ...stock };
}

function getAvailableQuantity(productId) {
    const stock = getStock(productId);
    return stock.quantity;
}

function isProductInStock(productId) {
    return getAvailableQuantity(productId) > 0;
}

function isLowStock(productId) {
    const stock = getStock(productId);
    return stock.quantity > 0 && stock.quantity <= stock.lowStockThreshold;
}

function isOutOfStock(productId) {
    return getAvailableQuantity(productId) <= 0;
}

// =========================================================================
// ATUALIZAÇÃO DE ESTOQUE
// =========================================================================
function setStock(productId, quantity) {
    if (quantity < 0) quantity = 0;

    if (!inventoryState.stock[productId]) {
        inventoryState.stock[productId] = {
            quantity: 0,
            lowStockThreshold: 5
        };
    }

    inventoryState.stock[productId].quantity = quantity;
    saveInventory();

    // Atualiza disponibilidade do produto baseado no estoque
    updateProductAvailability(productId);

    return { success: true };
}

function setLowStockThreshold(productId, threshold) {
    if (threshold < 0) threshold = 0;

    if (!inventoryState.stock[productId]) {
        inventoryState.stock[productId] = {
            quantity: 0,
            lowStockThreshold: 5
        };
    }

    inventoryState.stock[productId].lowStockThreshold = threshold;
    saveInventory();
}

function decrementStock(productId, quantity = 1) {
    const currentStock = getAvailableQuantity(productId);
    const newStock = Math.max(currentStock - quantity, 0);

    inventoryState.stock[productId].quantity = newStock;
    saveInventory();

    // Se estoque zerou, desativa produto automaticamente
    if (newStock <= 0) {
        updateProductAvailability(productId);
    }

    return { success: true, remaining: newStock };
}

function incrementStock(productId, quantity = 1) {
    const currentStock = getAvailableQuantity(productId);
    const newStock = currentStock + quantity;

    inventoryState.stock[productId].quantity = newStock;
    saveInventory();

    // Se estava sem estoque e agora tem, reativa (se o admin não desativou manualmente)
    if (currentStock <= 0 && newStock > 0) {
        const product = menuItems.find(item => item.id === productId);
        if (product && !product.active) {
            // Só reativa se o produto não foi desativado manualmente pelo admin
            // Verificamos se há flag de desativação manual
            const wasManuallyDisabled = localStorage.getItem(`manual_disable_${productId}`);
            if (!wasManuallyDisabled) {
                product.active = true;
                updateVisibleItems();
            }
        }
    }

    return { success: true, remaining: newStock };
}

// =========================================================================
// ATUALIZAÇÃO DE DISPONIBILIDADE DO PRODUTO
// =========================================================================
function updateProductAvailability(productId) {
    const product = menuItems.find(item => item.id === productId);
    if (!product) return;

    const stock = getAvailableQuantity(productId);

    // Se o estoque é 0, desativa o produto automaticamente
    if (stock <= 0 && product.active) {
        product.active = false;
        updateVisibleItems();
    }
}

// =========================================================================
// VERIFICAÇÃO PARA CARRINHO E CHECKOUT
// =========================================================================
function validateCartStock(cartItems) {
    const errors = [];

    cartItems.forEach(item => {
        const available = getAvailableQuantity(item.id);
        if (available <= 0) {
            errors.push({
                itemId: item.id,
                itemName: item.name,
                message: `${item.name} está sem estoque no momento.`
            });
        } else if (item.quantity > available) {
            errors.push({
                itemId: item.id,
                itemName: item.name,
                message: `Quantidade solicitada de ${item.name} (${item.quantity}) excede o estoque disponível (${available}).`
            });
        }
    });

    return errors;
}

function consumeStockForOrder(orderItems) {
    const results = [];

    orderItems.forEach(item => {
        const result = decrementStock(item.id, item.quantity);
        results.push({
            itemId: item.id,
            itemName: item.name,
            ...result
        });
    });

    return results;
}

// =========================================================================
// RENDERIZAÇÃO DE INDICADORES DE ESTOQUE
// =========================================================================
function createStockBadge(productId) {
    const badge = document.createElement('span');
    badge.className = 'stock-badge';

    if (isOutOfStock(productId)) {
        badge.className += ' stock-badge--out';
        badge.textContent = 'Indisponível';
    } else if (isLowStock(productId)) {
        badge.className += ' stock-badge--low';
        const stock = getStock(productId);
        badge.textContent = `Apenas ${stock.quantity} restantes`;
    }

    return badge;
}

function getStockStatusText(productId) {
    if (isOutOfStock(productId)) {
        return { text: 'Indisponível', type: 'out' };
    }
    if (isLowStock(productId)) {
        const stock = getStock(productId);
        return { text: `Apenas ${stock.quantity} restante(s)`, type: 'low' };
    }
    return { text: 'Disponível', type: 'available' };
}

// =========================================================================
// SETUP
// =========================================================================
function setupInventory() {
    loadInventory();
}

export {
    setupInventory,
    getStock,
    getAvailableQuantity,
    isProductInStock,
    isLowStock,
    isOutOfStock,
    setStock,
    setLowStockThreshold,
    decrementStock,
    incrementStock,
    validateCartStock,
    consumeStockForOrder,
    createStockBadge,
    getStockStatusText,
    inventoryState
};