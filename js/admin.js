// admin.js - Painel Administrativo do Restaurante
// Módulo de gerenciamento de cardápio, categorias e pedidos
import { menuItems, updateVisibleItems } from './menu-store.js';
import { formatCurrency, openModal, closeModal, showToast, setButtonLoading, createSpinner } from './ui.js';
import { ORDER_STATUS, ORDER_STATUS_ORDER, saveOrders, loadOrders, getStatusIndex, getStatusText } from './order-tracking.js';
import { getQueueStats, updateOrderStatusWithQueue } from './order-queue.js';

const CATEGORIES_STORAGE_KEY = 'fastlanche_categories';

// =========================================================================
// CATEGORIAS PADRÃO
// =========================================================================
const DEFAULT_CATEGORIES = [
    'Hambúrgueres',
    'Pizzas',
    'Combos',
    'Bebidas',
    'Sobremesas',
    'Porções'
];

// =========================================================================
// ESTADO DO ADMIN
// =========================================================================
const adminState = {
    categories: [],
    editingProductId: null
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

function normalizeText(value) {
    return String(value || '').trim();
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// =========================================================================
// GERENCIAMENTO DE CATEGORIAS
// =========================================================================
function loadCategories() {
    if (!isStorageAvailable()) return [...DEFAULT_CATEGORIES];

    try {
        const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (!stored) {
            saveCategories(DEFAULT_CATEGORIES);
            return [...DEFAULT_CATEGORIES];
        }
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_CATEGORIES];
    } catch {
        return [...DEFAULT_CATEGORIES];
    }
}

function saveCategories(categories) {
    if (!isStorageAvailable()) return false;
    try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
        adminState.categories = [...categories];
        return true;
    } catch {
        return false;
    }
}

function addCategory(name) {
    const trimmed = normalizeText(name);
    if (!trimmed) return { success: false, error: 'Nome da categoria é obrigatório.' };

    const exists = adminState.categories.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) return { success: false, error: 'Categoria já existe.' };

    adminState.categories.push(trimmed);
    saveCategories(adminState.categories);
    return { success: true };
}

function removeCategory(name) {
    const isDefault = DEFAULT_CATEGORIES.includes(name);
    if (isDefault) return { success: false, error: 'Não é possível remover categorias padrão.' };

    // Verificar se há produtos usando esta categoria
    const hasProducts = menuItems.some(item => item.category === name);
    if (hasProducts) return { success: false, error: 'Existem produtos usando esta categoria. Remova-os primeiro.' };

    const index = adminState.categories.indexOf(name);
    if (index === -1) return { success: false, error: 'Categoria não encontrada.' };

    adminState.categories.splice(index, 1);
    saveCategories(adminState.categories);
    return { success: true };
}

// =========================================================================
// GERENCIAMENTO DE PRODUTOS
// =========================================================================
function getNextProductId() {
    if (!menuItems.length) return 1;
    return Math.max(...menuItems.map(item => item.id)) + 1;
}

function addProduct(productData) {
    const errors = [];

    if (!normalizeText(productData.name)) errors.push('Nome é obrigatório.');
    if (!normalizeText(productData.category)) errors.push('Categoria é obrigatória.');
    if (productData.price === undefined || productData.price === null || isNaN(Number(productData.price)) || Number(productData.price) < 0) {
        errors.push('Preço deve ser um valor válido maior ou igual a zero.');
    }

    if (errors.length) return { success: false, errors };

    const newProduct = {
        id: getNextProductId(),
        name: normalizeText(productData.name),
        description: normalizeText(productData.description) || '',
        price: Number(productData.price),
        category: productData.category,
        maxQuantity: Number(productData.maxQuantity) || 10,
        active: productData.active !== false,
        customization: productData.customization || null
    };

    menuItems.push(newProduct);
    updateVisibleItems();
    saveProductsToStorage();
    return { success: true, product: newProduct };
}

function updateProduct(id, productData) {
    const index = menuItems.findIndex(item => item.id === id);
    if (index === -1) return { success: false, error: 'Produto não encontrado.' };

    const errors = [];
    if (productData.name !== undefined && !normalizeText(productData.name)) errors.push('Nome não pode ficar vazio.');
    if (productData.price !== undefined && (isNaN(Number(productData.price)) || Number(productData.price) < 0)) {
        errors.push('Preço deve ser um valor válido maior ou igual a zero.');
    }

    if (errors.length) return { success: false, errors };

    const product = menuItems[index];

    if (productData.name !== undefined) product.name = normalizeText(productData.name);
    if (productData.description !== undefined) product.description = normalizeText(productData.description);
    if (productData.price !== undefined) product.price = Number(productData.price);
    if (productData.category !== undefined) product.category = productData.category;
    if (productData.maxQuantity !== undefined) product.maxQuantity = Number(productData.maxQuantity);
    if (productData.active !== undefined) product.active = productData.active;
    if (productData.customization !== undefined) product.customization = productData.customization;

    updateVisibleItems();
    saveProductsToStorage();
    return { success: true, product };
}

function toggleProductActive(id) {
    const product = menuItems.find(item => item.id === id);
    if (!product) return { success: false, error: 'Produto não encontrado.' };

    product.active = !product.active;
    updateVisibleItems();
    saveProductsToStorage();
    return { success: true, active: product.active };
}

function deleteProduct(id) {
    // Remoção lógica: desativa o produto
    return toggleProductActive(id);
}

function saveProductsToStorage() {
    if (!isStorageAvailable()) return false;
    try {
        // Salva apenas dados essenciais dos produtos (sem funções)
        const productsData = menuItems.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            maxQuantity: item.maxQuantity,
            active: item.active,
            customization: item.customization
        }));
        localStorage.setItem('fastlanche_menuItems', JSON.stringify(productsData));
        return true;
    } catch {
        return false;
    }
}

function loadProductsFromStorage() {
    if (!isStorageAvailable()) return false;
    try {
        const stored = localStorage.getItem('fastlanche_menuItems');
        if (!stored) return false;

        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return false;

        // Atualiza os dados dos produtos existentes no menuItems
        parsed.forEach(storedItem => {
            const existing = menuItems.find(item => item.id === storedItem.id);
            if (existing) {
                Object.assign(existing, storedItem);
            } else {
                menuItems.push(storedItem);
            }
        });

        updateVisibleItems();
        return true;
    } catch {
        return false;
    }
}

// =========================================================================
// GERENCIAMENTO DE PEDIDOS
// =========================================================================
function getAllOrders() {
    return loadOrders();
}

function updateOrderAdminStatus(orderNumber, newStatus) {
    const ordersList = loadOrders();
    const order = ordersList.find(o => o.orderNumber === orderNumber);
    if (!order) return { success: false, error: 'Pedido não encontrado.' };

    const currentIdx = getStatusIndex(order.status);
    const newIdx = getStatusIndex(newStatus);

    if (newIdx === -1) return { success: false, error: 'Status inválido.' };

    // Usa a função do sistema de fila para notificar atualizações
    const updated = updateOrderStatusWithQueue(orderNumber, newStatus);
    if (!updated) return { success: false, error: 'Erro ao atualizar status.' };

    return { success: true, order };
}

// =========================================================================
// RENDERIZAÇÃO DO PAINEL ADMIN
// =========================================================================
function buildAdminModal() {
    const content = document.createElement('div');
    content.className = 'admin-modal-content';

    // Tabs de navegação
    const tabs = document.createElement('div');
    tabs.className = 'admin-tabs';
    tabs.innerHTML = `
    <button class="admin-tab active" data-tab="products" type="button">Produtos</button>
    <button class="admin-tab" data-tab="categories" type="button">Categorias</button>
    <button class="admin-tab" data-tab="orders" type="button">Pedidos</button>
  `;

    // Container do conteúdo
    const tabContent = document.createElement('div');
    tabContent.className = 'admin-tab-content';

    content.append(tabs, tabContent);

    // Eventos das tabs
    tabs.addEventListener('click', event => {
        const tab = event.target.closest('.admin-tab');
        if (!tab) return;

        tabs.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderAdminTab(tab.dataset.tab, tabContent);
    });

    // Renderizar primeira tab
    renderAdminTab('products', tabContent);

    return content;
}

function renderAdminTab(tabName, container) {
    container.innerHTML = '';

    switch (tabName) {
        case 'products':
            renderProductsTab(container);
            break;
        case 'categories':
            renderCategoriesTab(container);
            break;
        case 'orders':
            renderOrdersTab(container);
            break;
    }
}

// =========================================================================
// TAB: PRODUTOS
// =========================================================================
function renderProductsTab(container) {
    const header = document.createElement('div');
    header.className = 'admin-section-header';
    header.innerHTML = `
    <h4 class="admin-section-title">Gerenciar Produtos</h4>
    <button class="button button-primary admin-add-btn" type="button">+ Novo Produto</button>
  `;
    container.appendChild(header);

    // Lista de produtos
    const list = document.createElement('div');
    list.className = 'admin-product-list';

    menuItems.forEach(item => {
        const card = document.createElement('div');
        card.className = `admin-product-card${!item.active ? ' inactive' : ''}`;

        const info = document.createElement('div');
        info.className = 'admin-product-info';

        const nameRow = document.createElement('div');
        nameRow.className = 'admin-product-name-row';

        const name = document.createElement('strong');
        name.textContent = item.name;

        const statusBadge = document.createElement('span');
        statusBadge.className = `admin-status-badge ${item.active ? 'active' : 'inactive'}`;
        statusBadge.textContent = item.active ? 'Ativo' : 'Inativo';

        nameRow.append(name, statusBadge);

        const meta = document.createElement('div');
        meta.className = 'admin-product-meta';
        meta.textContent = `${item.category} • ${formatCurrency(item.price)} • ID: ${item.id}`;

        info.append(nameRow, meta);

        const actions = document.createElement('div');
        actions.className = 'admin-product-actions';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = `button ${item.active ? 'button-secondary' : 'button-primary'}`;
        toggleBtn.type = 'button';
        toggleBtn.textContent = item.active ? 'Desativar' : 'Ativar';
        toggleBtn.addEventListener('click', () => {
            const result = toggleProductActive(item.id);
            if (result.success) {
                showToast(`Produto ${result.active ? 'ativado' : 'desativado'}!`, 'success');
                renderAdminTab('products', container.parentElement.querySelector('.admin-tab-content'));
            }
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'button button-secondary';
        editBtn.type = 'button';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => {
            openProductForm(item);
        });

        actions.append(toggleBtn, editBtn);
        card.append(info, actions);
        list.appendChild(card);
    });

    container.appendChild(list);

    // Evento para adicionar novo produto
    header.querySelector('.admin-add-btn').addEventListener('click', () => {
        openProductForm(null);
    });
}

function openProductForm(existingProduct) {
    const isEditing = existingProduct !== null;
    const title = isEditing ? `Editar: ${existingProduct.name}` : 'Novo Produto';

    const form = document.createElement('form');
    form.className = 'admin-product-form';
    form.noValidate = true;

    const nameField = createFormField('text', 'Nome', 'product-name', existingProduct?.name || '', true);
    const descField = createFormField('text', 'Descrição', 'product-desc', existingProduct?.description || '');
    const priceField = createFormField('number', 'Preço (R$)', 'product-price', existingProduct?.price?.toString() || '', true, '0.01');
    const maxQtyField = createFormField('number', 'Qtd. máxima', 'product-maxqty', existingProduct?.maxQuantity?.toString() || '10', false, '1');

    // Select de categoria
    const catField = document.createElement('label');
    catField.className = 'field';
    catField.innerHTML = `<span>Categoria</span>`;
    const catSelect = document.createElement('select');
    catSelect.id = 'product-category';
    catSelect.required = true;

    adminState.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (existingProduct?.category === cat) opt.selected = true;
        catSelect.appendChild(opt);
    });

    catField.appendChild(catSelect);

    // Ativo
    const activeField = document.createElement('label');
    activeField.className = 'field field-checkbox';
    const activeCheckbox = document.createElement('input');
    activeCheckbox.type = 'checkbox';
    activeCheckbox.id = 'product-active';
    activeCheckbox.checked = existingProduct ? existingProduct.active : true;
    activeField.innerHTML = `<span>Produto ativo</span>`;
    activeField.appendChild(activeCheckbox);

    form.append(nameField, descField, priceField, maxQtyField, catField, activeField);

    // Botões
    const btnRow = document.createElement('div');
    btnRow.className = 'admin-form-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'button button-primary';
    saveBtn.type = 'submit';
    saveBtn.textContent = isEditing ? 'Salvar alterações' : 'Adicionar produto';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'button button-secondary';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', closeModal);

    btnRow.append(saveBtn, cancelBtn);
    form.appendChild(btnRow);

    // Mensagem de feedback
    const feedback = document.createElement('p');
    feedback.className = 'form-feedback';
    form.appendChild(feedback);

    form.addEventListener('submit', event => {
        event.preventDefault();

        const formData = new FormData(form);
        const productData = {
            name: formData.get('product-name'),
            description: formData.get('product-desc'),
            price: Number(formData.get('product-price')),
            category: formData.get('product-category'),
            maxQuantity: Number(formData.get('product-maxqty')) || 10,
            active: activeCheckbox.checked,
            customization: null
        };

        let result;
        if (isEditing) {
            result = updateProduct(existingProduct.id, productData);
        } else {
            result = addProduct(productData);
        }

        if (result.success) {
            closeModal();
            showToast(isEditing ? 'Produto atualizado!' : 'Produto adicionado!', 'success');

            // Reabrir admin
            setTimeout(() => {
                openAdminPanel();
            }, 300);
        } else {
            const errors = result.errors || [result.error];
            feedback.textContent = errors[0];
            feedback.dataset.status = 'error';
        }
    });

    openModal({
        title,
        bodyContent: form,
        actions: []
    });
}

function createFormField(type, label, id, value, required = false, step = null) {
    const field = document.createElement('label');
    field.className = 'field';
    field.innerHTML = `<span>${label}${required ? ' *' : ''}</span>`;

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    input.required = required;
    if (value) input.value = value;
    if (step) input.step = step;
    if (type === 'number') input.min = '0';

    field.appendChild(input);
    return field;
}

// =========================================================================
// TAB: CATEGORIAS
// =========================================================================
function renderCategoriesTab(container) {
    const header = document.createElement('div');
    header.className = 'admin-section-header';
    header.innerHTML = `
    <h4 class="admin-section-title">Gerenciar Categorias</h4>
  `;
    container.appendChild(header);

    // Formulário para adicionar categoria
    const addForm = document.createElement('div');
    addForm.className = 'admin-category-add';
    addForm.innerHTML = `
    <label class="field" style="flex:1">
      <span>Nova categoria</span>
      <input type="text" id="new-category-name" placeholder="Ex: Lanches Naturais">
    </label>
    <button class="button button-primary" id="add-category-btn" type="button" style="align-self:flex-end">Adicionar</button>
  `;

    const feedback = document.createElement('p');
    feedback.className = 'form-feedback';
    addForm.appendChild(feedback);

    container.appendChild(addForm);

    // Lista de categorias
    const list = document.createElement('div');
    list.className = 'admin-category-list';

    adminState.categories.forEach(cat => {
        const isDefault = DEFAULT_CATEGORIES.includes(cat);
        const item = document.createElement('div');
        item.className = 'admin-category-item';

        const name = document.createElement('span');
        name.textContent = cat;
        if (isDefault) {
            const tag = document.createElement('small');
            tag.textContent = ' (padrão)';
            tag.style.color = 'var(--cinza-500)';
            name.appendChild(tag);
        }

        const actions = document.createElement('div');
        actions.className = 'admin-category-actions';

        if (!isDefault) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'button button-secondary';
            removeBtn.type = 'button';
            removeBtn.textContent = 'Remover';
            removeBtn.style.color = 'var(--vermelho)';
            removeBtn.style.borderColor = 'var(--vermelho)';
            removeBtn.addEventListener('click', () => {
                const result = removeCategory(cat);
                if (result.success) {
                    showToast('Categoria removida!', 'success');
                    renderAdminTab('categories', container);
                } else {
                    feedback.textContent = result.error;
                    feedback.dataset.status = 'error';
                }
            });
            actions.appendChild(removeBtn);
        }

        item.append(name, actions);
        list.appendChild(item);
    });

    container.appendChild(list);

    // Evento para adicionar categoria
    const input = addForm.querySelector('#new-category-name');
    const addBtn = addForm.querySelector('#add-category-btn');

    const handleAddCategory = () => {
        const result = addCategory(input.value);
        if (result.success) {
            input.value = '';
            feedback.textContent = '';
            showToast('Categoria adicionada!', 'success');
            renderAdminTab('categories', container);
        } else {
            feedback.textContent = result.error;
            feedback.dataset.status = 'error';
        }
    };

    addBtn.addEventListener('click', handleAddCategory);
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleAddCategory();
        }
    });
}

// =========================================================================
// TAB: PEDIDOS
// =========================================================================
function renderOrdersTab(container) {
    const header = document.createElement('div');
    header.className = 'admin-section-header';
    header.innerHTML = `
    <h4 class="admin-section-title">Pedidos Recebidos</h4>
  `;
    container.appendChild(header);

    // Resumo da fila
    const stats = getQueueStats();
    if (stats.totalInQueue > 0) {
        const queueSummary = document.createElement('div');
        queueSummary.className = 'admin-queue-summary';
        queueSummary.innerHTML = `
      <div class="admin-queue-summary-title">📋 Fila de produção — ${stats.totalInQueue} pedido(s) na fila</div>
      <div class="admin-queue-summary-stats">
        <span>📥 Recebidos: <strong>${stats.received}</strong></span>
        <span>💳 Pagos: <strong>${stats.paymentConfirmed}</strong></span>
        <span>👨‍🍳 Preparando: <strong>${stats.preparing}</strong></span>
        <span>🚚 Saiu p/ entrega: <strong>${stats.outForDelivery}</strong></span>
        <span>✅ Entregues: <strong>${stats.delivered}</strong></span>
      </div>
    `;
        container.appendChild(queueSummary);
    }

    const orders = getAllOrders();

    if (!orders.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Nenhum pedido registrado ainda.';
        container.appendChild(empty);
        return;
    }

    // Filtro de status
    const filterBar = document.createElement('div');
    filterBar.className = 'admin-filter-bar';

    const statusFilter = document.createElement('select');
    statusFilter.className = 'admin-filter-select';
    statusFilter.innerHTML = `
    <option value="all">Todos os status</option>
    ${ORDER_STATUS_ORDER.map(s => `<option value="${s}">${s}</option>`).join('')}
  `;

    filterBar.appendChild(statusFilter);
    container.appendChild(filterBar);

    // Lista de pedidos
    const list = document.createElement('div');
    list.className = 'admin-orders-list';

    function renderOrders() {
        list.innerHTML = '';
        const filterValue = statusFilter.value;

        const filteredOrders = filterValue === 'all'
            ? orders
            : orders.filter(o => o.status === filterValue);

        if (!filteredOrders.length) {
            const empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'Nenhum pedido encontrado para este filtro.';
            list.appendChild(empty);
            return;
        }

        filteredOrders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'admin-order-card';

            const headerRow = document.createElement('div');
            headerRow.className = 'admin-order-header';

            const orderInfo = document.createElement('div');
            orderInfo.className = 'admin-order-info';

            const num = document.createElement('strong');
            num.textContent = order.orderNumber;

            const customer = document.createElement('span');
            customer.className = 'admin-order-customer';
            customer.textContent = order.customerName;

            const date = document.createElement('span');
            date.className = 'admin-order-date';
            date.textContent = new Date(order.createdAt).toLocaleString('pt-BR');

            orderInfo.append(num, customer, date);

            const statusSelect = document.createElement('select');
            statusSelect.className = 'admin-order-status-select';

            ORDER_STATUS_ORDER.forEach(status => {
                const opt = document.createElement('option');
                opt.value = status;
                opt.textContent = status;
                if (order.status === status) opt.selected = true;
                statusSelect.appendChild(opt);
            });

            headerRow.append(orderInfo, statusSelect);
            card.appendChild(headerRow);

            // Detalhes do pedido
            const details = document.createElement('div');
            details.className = 'admin-order-details';

            const itemsList = document.createElement('ul');
            itemsList.className = 'admin-order-items';

            order.items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.quantity}x ${item.name} — ${formatCurrency(item.price * item.quantity)}`;

                if (item._customization) {
                    const cust = item._customization;
                    const custDetails = [];
                    if (cust.type === 'half_half') {
                        custDetails.push(`Meio: ${cust.flavor1}${cust.flavor2 ? ` + ${cust.flavor2}` : ''}`);
                    }
                    if (cust.removedIngredients?.length) {
                        custDetails.push(`Sem: ${cust.removedIngredients.join(', ')}`);
                    }
                    if (cust.extras?.length) {
                        custDetails.push(`+ ${cust.extras.map(e => e.name).join(', ')}`);
                    }
                    if (cust.observation) {
                        custDetails.push(`Obs: ${cust.observation}`);
                    }
                    if (custDetails.length) {
                        const custSpan = document.createElement('div');
                        custSpan.className = 'admin-order-cust';
                        custSpan.textContent = custDetails.join(' | ');
                        li.appendChild(custSpan);
                    }
                }

                itemsList.appendChild(li);
            });

            const values = document.createElement('div');
            values.className = 'admin-order-values';
            values.innerHTML = `
        <span>Total: <strong>${formatCurrency(order.total || 0)}</strong></span>
        <span>Pagamento: ${order.paymentMethod}</span>
      `;

            details.append(itemsList, values);
            card.appendChild(details);
            list.appendChild(card);

            // Evento de mudança de status
            statusSelect.addEventListener('change', () => {
                const newStatus = statusSelect.value;
                const result = updateOrderAdminStatus(order.orderNumber, newStatus);
                if (result.success) {
                    showToast(`Pedido ${order.orderNumber}: ${newStatus}`, 'success');
                } else {
                    showToast(result.error, 'error');
                    statusSelect.value = order.status;
                }
            });
        });
    }

    statusFilter.addEventListener('change', renderOrders);
    renderOrders();

    container.appendChild(list);
}

// =========================================================================
// ABRIR PAINEL ADMIN
// =========================================================================
function openAdminPanel() {
    adminState.categories = loadCategories();

    const content = buildAdminModal();

    openModal({
        title: 'Painel Administrativo',
        bodyContent: content,
        actions: [
            {
                label: 'Fechar',
                variant: 'button-secondary',
                onClick: closeModal
            }
        ]
    });
}

// =========================================================================
// SETUP
// =========================================================================
function setupAdmin() {
    adminState.categories = loadCategories();
    loadProductsFromStorage();

    // Botão no header para acessar o admin
    const nav = document.getElementById('main-nav');
    if (nav) {
        const adminBtn = document.createElement('button');
        adminBtn.className = 'nav-link-btn';
        adminBtn.type = 'button';
        adminBtn.id = 'nav-admin-btn';
        adminBtn.textContent = 'Admin';
        adminBtn.setAttribute('aria-label', 'Abrir painel administrativo');
        adminBtn.addEventListener('click', openAdminPanel);
        nav.appendChild(adminBtn);
    }
}

export {
    setupAdmin,
    openAdminPanel,
    addProduct,
    updateProduct,
    toggleProductActive,
    deleteProduct,
    addCategory,
    removeCategory,
    updateOrderAdminStatus,
    getAllOrders,
    adminState
};