// product-customization.js - Sistema de personalização de produtos
import { formatCurrency, openModal, closeModal, showToast } from './ui.js';
import { CUSTOMIZATION_TYPES } from './constants.js';
import { addToCart } from './cart.js';

// =========================================================================
// FUNÇÃO AUXILIAR: Calcular preço total + criar priceDisplay
// =========================================================================

function createPriceDisplay(basePrice) {
    const display = document.createElement('div');
    display.className = 'customization-price';
    display.style.cssText = 'font-size:1.3rem;font-weight:900;text-align:right;padding-top:0.5rem;border-top:1px solid var(--cinza-200);';
    display.textContent = formatCurrency(basePrice);
    return display;
}

function updatePriceDisplay(display, basePrice, extraPrice) {
    const total = basePrice + extraPrice;
    display.textContent = formatCurrency(total);
}

// =========================================================================
// ABRIR MODAL DE PERSONALIZAÇÃO
// =========================================================================

function openCustomizationModal(item) {
    if (!item || !item.customization) {
        addToCart(item);
        showToast('Item adicionado ao carrinho.', 'success');
        return;
    }

    const { type } = item.customization;

    if (type === CUSTOMIZATION_TYPES.HALF_HALF) {
        openHalfHalfModal(item);
    } else if (type === CUSTOMIZATION_TYPES.REMOVE_INGREDIENTS) {
        openRemoveIngredientsModal(item);
    } else if (type === CUSTOMIZATION_TYPES.ADD_EXTRAS) {
        openExtrasModal(item);
    } else {
        openObservationsModal(item);
    }
}

// =========================================================================
// MODAL: PIZZA MEIO A MEIO (HALF_HALF)
// =========================================================================

function openHalfHalfModal(item) {
    const { flavors, extras } = item.customization;
    const basePrice = item.price;
    let selectedFlavor1 = null;
    let selectedFlavor2 = null;
    let selectedExtras = [];

    // Extrai o nome base da pizza (remove "Pizza " do início)
    const baseName = item.name.replace(/^Pizza\s+/i, '').trim();

    // Encontra o sabor que corresponde ao nome base da pizza
    const defaultFlavor = flavors.find(f =>
        f.name.toLowerCase() === baseName.toLowerCase()
    );

    const bodyContent = document.createElement('div');
    bodyContent.className = 'customization-body';
    bodyContent.style.display = 'grid';
    bodyContent.style.gap = '1.25rem';

    const title = document.createElement('p');
    title.style.fontWeight = '700';
    title.textContent = `Escolha 2 sabores para sua ${item.name}`;
    bodyContent.appendChild(title);

    // --- Grid de sabores ---
    const flavorsGrid = document.createElement('div');
    flavorsGrid.className = 'customization-flavors-grid';

    flavors.forEach(flavor => {
        const label = document.createElement('label');
        label.className = 'customization-flavor-label';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = flavor.name;
        input.dataset.price = flavor.price;

        // Pré-seleciona o sabor que corresponde ao nome base da pizza
        const isDefault = defaultFlavor && flavor.name === defaultFlavor.name;
        if (isDefault) {
            input.checked = true;
            selectedFlavor1 = flavor;
        }

        const info = document.createElement('span');
        info.className = 'customization-flavor-info';
        const priceText = flavor.price > 0 ? ` (+${formatCurrency(flavor.price)})` : '';
        info.textContent = `${flavor.name}${priceText}`;

        label.append(input, info);

        input.addEventListener('change', () => {
            const checked = flavorsGrid.querySelectorAll('input[type="checkbox"]:checked');

            if (input.checked && checked.length > 2) {
                input.checked = false;
                showToast('Selecine no máximo 2 sabores.', 'warning');
                return;
            }

            if (input.checked) {
                if (!selectedFlavor1) {
                    selectedFlavor1 = flavor;
                } else if (!selectedFlavor2) {
                    selectedFlavor2 = flavor;
                }
            } else {
                if (selectedFlavor1?.name === flavor.name) {
                    selectedFlavor1 = selectedFlavor2;
                    selectedFlavor2 = null;
                } else if (selectedFlavor2?.name === flavor.name) {
                    selectedFlavor2 = null;
                }
            }

            updateFlavorSummary();
            updateTotalPrice();
        });

        flavorsGrid.appendChild(label);
    });

    // Atualiza o resumo inicial se já tiver um sabor pré-selecionado
    if (selectedFlavor1) {
        updateFlavorSummary();
        updateTotalPrice();
    }

    bodyContent.appendChild(flavorsGrid);

    // --- Resumo dos sabores ---
    const summaryFlavors = document.createElement('div');
    summaryFlavors.className = 'customization-summary';
    summaryFlavors.style.color = 'var(--cinza-500)';
    summaryFlavors.innerHTML = 'Selecione pelo menos 1 sabor para continuar.';
    bodyContent.appendChild(summaryFlavors);

    function updateFlavorSummary() {
        const names = [];
        if (selectedFlavor1) names.push(selectedFlavor1.name);
        if (selectedFlavor2) names.push(selectedFlavor2.name);

        if (names.length === 0) {
            summaryFlavors.style.color = 'var(--cinza-500)';
            summaryFlavors.innerHTML = 'Selecione pelo menos 1 sabor para continuar.';
        } else if (names.length === 1) {
            summaryFlavors.style.color = 'var(--preto)';
            summaryFlavors.innerHTML = `<strong>Sabores:</strong> ${names[0]} (inteiro)`;
        } else {
            summaryFlavors.style.color = 'var(--preto)';
            summaryFlavors.innerHTML = `<strong>Sabores:</strong> Meio ${names[0]} / Meio ${names[1]}`;
        }
    }

    // --- Extras (opcionais) ---
    if (extras && extras.length > 0) {
        const extrasSection = document.createElement('div');
        extrasSection.style.display = 'grid';
        extrasSection.style.gap = '0.5rem';

        const extrasTitle = document.createElement('p');
        extrasTitle.style.fontWeight = '700';
        extrasTitle.textContent = 'Adicionais:';
        extrasSection.appendChild(extrasTitle);

        extras.forEach(extra => {
            const label = document.createElement('label');
            label.className = 'customization-extra-label';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = extra.name;
            input.dataset.price = extra.price;

            const info = document.createElement('span');
            const priceText = extra.price > 0 ? ` (+${formatCurrency(extra.price)})` : '';
            info.textContent = `${extra.name}${priceText}`;

            label.append(input, info);

            input.addEventListener('change', () => {
                if (input.checked) {
                    selectedExtras.push(extra);
                } else {
                    selectedExtras = selectedExtras.filter(e => e.name !== extra.name);
                }
                updateTotalPrice();
            });

            extrasSection.appendChild(label);
        });

        bodyContent.appendChild(extrasSection);
    }

    // --- Observação ---
    const obsField = document.createElement('label');
    obsField.className = 'field';
    obsField.style.marginTop = '0.5rem';
    obsField.innerHTML = '<span>Observação (opcional):</span>';
    const obsInput = document.createElement('textarea');
    obsInput.className = 'customization-observation';
    obsInput.rows = 2;
    obsInput.placeholder = 'Alguma observação para o preparo?';
    obsField.appendChild(obsInput);
    bodyContent.appendChild(obsField);

    // --- Preço total com atualização ao vivo ---
    const priceDisplay = createPriceDisplay(basePrice);
    bodyContent.appendChild(priceDisplay);

    function calcExtraPrice() {
        let extra = 0;
        if (selectedFlavor1 && selectedFlavor1.price > 0) extra += selectedFlavor1.price;
        if (selectedFlavor2 && selectedFlavor2.price > 0) extra += selectedFlavor2.price;
        selectedExtras.forEach(e => { extra += e.price; });
        return extra;
    }

    function updateTotalPrice() {
        const extra = calcExtraPrice();
        updatePriceDisplay(priceDisplay, basePrice, extra);
    }

    // --- Ações do modal ---
    const actions = [
        {
            label: 'Cancelar',
            variant: 'button-secondary',
            onClick: closeModal
        },
        {
            label: 'Adicionar ao carrinho',
            variant: 'button-primary',
            onClick: () => {
                if (!selectedFlavor1) {
                    showToast('Selecione pelo menos 1 sabor.', 'error');
                    return;
                }

                const customizationData = {
                    type: CUSTOMIZATION_TYPES.HALF_HALF,
                    flavor1: selectedFlavor1.name,
                    flavor2: selectedFlavor2 ? selectedFlavor2.name : null,
                    extras: selectedExtras.map(e => ({ name: e.name, price: e.price })),
                    observation: obsInput.value
                };

                const extraPrice = calcExtraPrice();
                const customizedItem = {
                    ...item,
                    price: item.price + extraPrice,
                    unitPrice: item.price,
                    _customization: customizationData
                };

                addToCart(customizedItem);
                closeModal();
                showToast(`${item.name} personalizada adicionada ao carrinho!`, 'success');
            }
        }
    ];

    openModal({
        title: `Personalizar ${item.name}`,
        bodyContent,
        actions
    });
}

// =========================================================================
// MODAL: HAMBÚRGUER - REMOVER INGREDIENTES
// =========================================================================

function openRemoveIngredientsModal(item) {
    const { ingredients, extras } = item.customization;
    const basePrice = item.price;
    const removedIngredients = [];
    let selectedExtras = [];

    const bodyContent = document.createElement('div');
    bodyContent.className = 'customization-body';
    bodyContent.style.display = 'grid';
    bodyContent.style.gap = '1.25rem';

    const title = document.createElement('p');
    title.style.fontWeight = '700';
    title.textContent = `Personalize seu ${item.name}`;
    bodyContent.appendChild(title);

    // --- Remover ingredientes ---
    const ingredientsSection = document.createElement('div');
    ingredientsSection.style.display = 'grid';
    ingredientsSection.style.gap = '0.5rem';

    const ingredientsTitle = document.createElement('p');
    ingredientsTitle.style.fontWeight = '700';
    ingredientsTitle.textContent = 'Remover ingredientes:';
    ingredientsSection.appendChild(ingredientsTitle);

    ingredients.forEach(ingredient => {
        const label = document.createElement('label');
        label.className = 'customization-extra-label';
        label.style.color = 'var(--cinza-500)';

        const input = document.createElement('input');
        input.type = 'checkbox';

        const info = document.createElement('span');
        info.textContent = `Sem ${ingredient}`;

        label.append(input, info);

        input.addEventListener('change', () => {
            if (input.checked) {
                removedIngredients.push(ingredient);
            } else {
                const idx = removedIngredients.indexOf(ingredient);
                if (idx !== -1) removedIngredients.splice(idx, 1);
            }
        });

        ingredientsSection.appendChild(label);
    });

    bodyContent.appendChild(ingredientsSection);

    // --- Extras ---
    if (extras && extras.length > 0) {
        const extrasSection = document.createElement('div');
        extrasSection.style.display = 'grid';
        extrasSection.style.gap = '0.5rem';

        const extrasTitle = document.createElement('p');
        extrasTitle.style.fontWeight = '700';
        extrasTitle.textContent = 'Adicionais:';
        extrasSection.appendChild(extrasTitle);

        extras.forEach(extra => {
            const label = document.createElement('label');
            label.className = 'customization-extra-label';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.dataset.price = extra.price;

            const info = document.createElement('span');
            const priceText = extra.price > 0 ? ` (+${formatCurrency(extra.price)})` : '';
            info.textContent = `${extra.name}${priceText}`;

            label.append(input, info);

            input.addEventListener('change', () => {
                if (input.checked) {
                    selectedExtras.push(extra);
                } else {
                    selectedExtras = selectedExtras.filter(e => e.name !== extra.name);
                }
                updateTotalPrice();
            });

            extrasSection.appendChild(label);
        });

        bodyContent.appendChild(extrasSection);
    }

    // --- Observação ---
    const obsField = document.createElement('label');
    obsField.className = 'field';
    obsField.innerHTML = '<span>Observação (opcional):</span>';
    const obsInput = document.createElement('textarea');
    obsInput.className = 'customization-observation';
    obsInput.rows = 2;
    obsInput.placeholder = 'Ex: ponto da carne, sem sal, etc.';
    obsField.appendChild(obsInput);
    bodyContent.appendChild(obsField);

    // --- Preço com atualização ao vivo ---
    const priceDisplay = createPriceDisplay(basePrice);
    bodyContent.appendChild(priceDisplay);

    function calcExtraPrice() {
        let extra = 0;
        selectedExtras.forEach(e => { extra += e.price; });
        return extra;
    }

    function updateTotalPrice() {
        const extra = calcExtraPrice();
        updatePriceDisplay(priceDisplay, basePrice, extra);
    }

    const actions = [
        {
            label: 'Cancelar',
            variant: 'button-secondary',
            onClick: closeModal
        },
        {
            label: 'Adicionar ao carrinho',
            variant: 'button-primary',
            onClick: () => {
                const extraPrice = calcExtraPrice();

                const customizationData = {
                    type: CUSTOMIZATION_TYPES.REMOVE_INGREDIENTS,
                    removedIngredients: [...removedIngredients],
                    extras: selectedExtras.map(e => ({ name: e.name, price: e.price })),
                    observation: obsInput.value
                };

                const customizedItem = {
                    ...item,
                    price: item.price + extraPrice,
                    unitPrice: item.price,
                    _customization: customizationData
                };

                addToCart(customizedItem);
                closeModal();
                showToast(`${item.name} personalizado adicionado ao carrinho!`, 'success');
            }
        }
    ];

    openModal({
        title: `Personalizar ${item.name}`,
        bodyContent,
        actions
    });
}

// =========================================================================
// MODAL: ADICIONAIS (ADD_EXTRAS)
// =========================================================================

function openExtrasModal(item) {
    const { extras } = item.customization;
    const basePrice = item.price;
    let selectedExtras = [];

    const bodyContent = document.createElement('div');
    bodyContent.className = 'customization-body';
    bodyContent.style.display = 'grid';
    bodyContent.style.gap = '1.25rem';

    const title = document.createElement('p');
    title.style.fontWeight = '700';
    title.textContent = `Adicionais para ${item.name}`;
    bodyContent.appendChild(title);

    // --- Extras com atualização ao vivo ---
    if (extras && extras.length > 0) {
        const extrasSection = document.createElement('div');
        extrasSection.style.display = 'grid';
        extrasSection.style.gap = '0.5rem';

        extras.forEach(extra => {
            const label = document.createElement('label');
            label.className = 'customization-extra-label';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.dataset.price = extra.price;

            const info = document.createElement('span');
            const priceText = extra.price > 0 ? ` (+${formatCurrency(extra.price)})` : '';
            info.textContent = `${extra.name}${priceText}`;

            label.append(input, info);

            input.addEventListener('change', () => {
                if (input.checked) {
                    selectedExtras.push(extra);
                } else {
                    selectedExtras = selectedExtras.filter(e => e.name !== extra.name);
                }
                updateTotalPrice();
            });

            extrasSection.appendChild(label);
        });

        bodyContent.appendChild(extrasSection);
    }

    // --- Observação ---
    const obsField = document.createElement('label');
    obsField.className = 'field';
    obsField.innerHTML = '<span>Observação (opcional):</span>';
    const obsInput = document.createElement('textarea');
    obsInput.className = 'customization-observation';
    obsInput.rows = 2;
    obsInput.placeholder = 'Alguma preferência?';
    obsField.appendChild(obsInput);
    bodyContent.appendChild(obsField);

    // --- Preço com atualização ao vivo ---
    const priceDisplay = createPriceDisplay(basePrice);
    bodyContent.appendChild(priceDisplay);

    function calcExtraPrice() {
        let extra = 0;
        selectedExtras.forEach(e => { extra += e.price; });
        return extra;
    }

    function updateTotalPrice() {
        const extra = calcExtraPrice();
        updatePriceDisplay(priceDisplay, basePrice, extra);
    }

    const actions = [
        {
            label: 'Cancelar',
            variant: 'button-secondary',
            onClick: closeModal
        },
        {
            label: 'Adicionar ao carrinho',
            variant: 'button-primary',
            onClick: () => {
                const extraPrice = calcExtraPrice();

                const customizationData = {
                    type: CUSTOMIZATION_TYPES.ADD_EXTRAS,
                    extras: selectedExtras.map(e => ({ name: e.name, price: e.price })),
                    observation: obsInput.value
                };

                const customizedItem = {
                    ...item,
                    price: item.price + extraPrice,
                    unitPrice: item.price,
                    _customization: customizationData
                };

                addToCart(customizedItem);
                closeModal();
                showToast(`${item.name} adicionado ao carrinho!`, 'success');
            }
        }
    ];

    openModal({
        title: `Personalizar ${item.name}`,
        bodyContent,
        actions
    });
}

// =========================================================================
// MODAL: OBSERVAÇÕES (para itens com opções como sabores de refrigerante)
// =========================================================================

function openObservationsModal(item) {
    const { extras } = item.customization;
    const basePrice = item.price;
    let selectedExtras = [];
    let hasSelection = !extras || extras.length === 0;

    const bodyContent = document.createElement('div');
    bodyContent.className = 'customization-body';
    bodyContent.style.display = 'grid';
    bodyContent.style.gap = '1.25rem';

    const title = document.createElement('p');
    title.style.fontWeight = '700';
    title.textContent = `Opções para ${item.name}`;
    bodyContent.appendChild(title);

    // --- Se tem extras, mostra como opções de escolha OBRIGATÓRIA ---
    if (extras && extras.length > 0) {
        const extrasSection = document.createElement('div');
        extrasSection.style.display = 'grid';
        extrasSection.style.gap = '0.5rem';

        const extrasTitle = document.createElement('p');
        extrasTitle.style.fontWeight = '700';
        extrasTitle.textContent = 'Selecione uma opção (obrigatório):';
        extrasSection.appendChild(extrasTitle);

        extras.forEach(extra => {
            const label = document.createElement('label');
            label.className = 'customization-extra-label';

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'custom-option';
            input.dataset.price = extra.price;

            const info = document.createElement('span');
            const priceText = extra.price > 0 ? ` (+${formatCurrency(extra.price)})` : '';
            info.textContent = `${extra.name}${priceText}`;

            label.append(input, info);

            input.addEventListener('change', () => {
                if (input.checked) {
                    selectedExtras = [extra];
                    hasSelection = true;
                    updateTotalPrice();
                }
            });

            extrasSection.appendChild(label);
        });

        bodyContent.appendChild(extrasSection);
    }

    // --- Observação ---
    const obsField = document.createElement('label');
    obsField.className = 'field';
    obsField.innerHTML = '<span>Observação (opcional):</span>';
    const obsInput = document.createElement('textarea');
    obsInput.className = 'customization-observation';
    obsInput.rows = 2;
    obsInput.placeholder = 'Digite suas observações aqui...';
    obsField.appendChild(obsInput);
    bodyContent.appendChild(obsField);

    // --- Preço com atualização ao vivo ---
    const priceDisplay = createPriceDisplay(basePrice);
    bodyContent.appendChild(priceDisplay);

    function calcExtraPrice() {
        let extra = 0;
        selectedExtras.forEach(e => { extra += e.price; });
        return extra;
    }

    function updateTotalPrice() {
        const extra = calcExtraPrice();
        updatePriceDisplay(priceDisplay, basePrice, extra);
    }

    const actions = [
        {
            label: 'Cancelar',
            variant: 'button-secondary',
            onClick: closeModal
        },
        {
            label: 'Adicionar ao carrinho',
            variant: 'button-primary',
            onClick: () => {
                if (!hasSelection) {
                    showToast('Selecione uma opção antes de adicionar ao carrinho.', 'warning');
                    return;
                }

                const extraPrice = calcExtraPrice();

                const customizationData = {
                    type: CUSTOMIZATION_TYPES.OBSERVATIONS,
                    extras: selectedExtras.map(e => ({ name: e.name, price: e.price })),
                    observation: obsInput.value
                };

                const customizedItem = {
                    ...item,
                    price: item.price + extraPrice,
                    unitPrice: item.price,
                    _customization: customizationData
                };

                addToCart(customizedItem);
                closeModal();
                showToast(`${item.name} adicionado ao carrinho!`, 'success');
            }
        }
    ];

    openModal({
        title: `Personalizar ${item.name}`,
        bodyContent,
        actions
    });
}

// =========================================================================
// EXPORTS
// =========================================================================

export {
    openCustomizationModal
};