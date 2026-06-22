# DOCUMENTO DE REQUISITOS DO PRODUTO (PRD) - FAST LANCHE

---

## 1. VISÃO GERAL, PERSONA E PALETA DE CORES

- [Objetivo do Negócio]
  * O site Fast Lanche é uma plataforma web de delivery nativo para restaurante, desenvolvida em HTML/CSS/JS.
  * Resolve a necessidade de pedidos rápidos, visualização clara do cardápio, controle de entrega e agendamento de mesa sem depender de apps externos.
  * Deve permitir que o cliente selecione itens, veja preços, calcule taxas, finalize pagamentos simulados e envie feedback com usabilidade responsiva.

- [Público-Alvo/Persona]
  * Usuários mobile e desktop, com foco em clientes de restaurante rápido que preferem interface simples.
  * Perfil de baixa a média familiaridade técnica; precisa ser intuitivo, direto e com validação visual clara.
  * Prioriza pessoas que procuram comida rápida, agendamento de mesa e feedback de experiência.

- [Identidade Visual Básica]
  * Mapeamento obrigatório da paleta de cores em variáveis CSS no `:root`:
    ```css
    :root {
      --amarelo: #FFC700; /* Destaques / ações */
      --vermelho: #E63946; /* Identidade / alerta */
      --branco: #FFFFFF; /* Fundos / textos invertidos */
      --preto: #161616; /* Textos principais / fundos escuros */
    }
    ```

---

## 2. ARQUITETURA E STACK TÉCNICA

- [Árvore de Diretórios]
  * `/`
    - `index.html`
  * `/css/`
    - `styles.css`
  * `/js/`
    - `app.js`
    - `cart.js`
    - `checkout.js`
    - `booking.js`
    - `feedback.js`

- [Restrições de Código]
  * JavaScript deve ser ES6+ puro, sem frameworks ou bibliotecas externas.
  * Uso obrigatório de `const` / `let`, arrow functions, `fetch` (se simulado), módulos via imports se houver build simples; mas a especificação foca em scripts nativos carregados por `<script>`.
  * CSS deve usar CSS Variables para cores e espaçamento, sem pré-processadores.
  * Layout responsivo deve ser baseado em CSS Grid e Flexbox.
  * Não usar `innerHTML` inseguro para injeção de conteúdo dinâmico; preferir métodos de criação DOM (`createElement`, `textContent`, `appendChild`).
  * Validação de formulários deve ser feita com JavaScript e atributos HTML5 (`required`, `type`, `min`, `max`, `pattern`).
  * Separação clara de responsabilidades: `app.js` controla navegação básica e inicialização, módulos JS controlam cada domínio funcional.

---

## 3. MATRIZ DE RECURSOS (FUNCIONALIDADES POR COMPONENTE)

### Cardápio Online
- Componente UI
  * Lista de itens do menu com imagem, nome, descrição curta, preço e botão de adicionar ao carrinho.
  * Filtro por categoria e campo de busca por texto.
- Objetivo/Para que serve
  * Permitir que o usuário descubra pratos disponíveis, compare preços e adicione itens ao pedido rapidamente.
- Regras de Negócio
  * Exibir apenas itens ativos.
  * Busca deve filtrar por nome ou descrição em tempo real.
  * Filtros por categoria devem combinar com a busca atual.
  * O botão de adicionar deve atualizar o carrinho local imediatamente.
- Estado/DOM
  * DOM contém `<section id="menu">` com `<article class="menu-item">`.
  * Elementos de filtro: `<select id="category-filter">`, `<input id="search-input">`.
  * Estado em JS: `menuItems`, `activeFilter`, `searchTerm`, `visibleItems`.

---

### Pedidos e Entregas Online
- Componente UI
  * Carrinho de compras fixo ou modal com lista de itens selecionados, quantidades, subtotal, taxa de entrega e total.
  * Botões de incrementar/decrementar quantidade e remover item.
- Objetivo/Para que serve
  * Controlar o pedido do cliente e calcular valores antes do checkout.
- Regras de Negócio
  * Quantidade mínima de 1 e máxima definida por item (`maxQuantity`).
  * Taxa de entrega fixa ou variável conforme subtotal.
  * Atualização instantânea de subtotal e total ao alterar quantidades.
  * Não permitir total negativo; remover item se quantidade chegar a zero.
- Estado/DOM
  * DOM contém `<aside id="cart">` com `<ul id="cart-items">`, `<span id="cart-subtotal">`, `<span id="cart-fee">`, `<span id="cart-total">`.
  * Estado em JS: `cart = { itemId: quantidade, ... }`, `cartItems[]`, `deliveryFee`, `subtotal`, `total`.

---

### Pagamento Direto
- Componente UI
  * Formulário de checkout com campos para nome, CPF/CNPJ opcional, endereço de entrega, método de pagamento simulado e confirmação.
  * Indicador de segurança visual e botão de "Finalizar Pedido".
- Objetivo/Para que serve
  * Simular transação segura e registrar o pedido final.
- Regras de Negócio
  * Campos obrigatórios: nome, endereço, número do pedido, forma de pagamento.
  * Validação de formato para email e telefone.
  * Simular falha se algum campo obrigatório estiver vazio ou inválido.
  * Ao finalizar, limpar o carrinho e registrar o pedido em LocalStorage.
- Estado/DOM
  * DOM contém `<form id="checkout-form">` com inputs e `<div id="checkout-feedback">`.
  * Estado em JS: `checkoutData`, `isPaymentPending`, `paymentStatus`.

---

### Agendamento de Mesas
- Componente UI
  * Formulário de agendamento com data, hora, número de pessoas e opções de horário.
  * Mensagens de validação e confirmação de reserva.
- Objetivo/Para que serve
  * Permitir reservas de mesas com verificação de disponibilidade mínima e dados corretos.
- Regras de Negócio
  * Data não pode ser no passado.
  * Horário deve estar dentro do período de atendimento definido.
  * Número de pessoas mínimo de 1 e máximo conforme capacidade (`maxGuests`).
  * Validar campos antes de permitir envio.
- Estado/DOM
  * DOM contém `<form id="booking-form">`, `<input type="date" id="booking-date">`, `<input type="time" id="booking-time">`, `<input type="number" id="booking-guests">`.
  * Estado em JS: `bookingRequest`, `bookingErrors`, `availableTimes`.

---

### Aba de Feedbacks
- Componente UI
  * Seção com lista de avaliações, formulário de comentário, campo de estrelas e botão de enviar.
  * Exibição de depoimentos recentes e nota média.
- Objetivo/Para que serve
  * Capturar experiência do cliente e exibir opiniões para novos visitantes.
- Regras de Negócio
  * Avaliações devem ter pelo menos 1 estrela e comentário mínimo de 10 caracteres.
  * Cada feedback enviado é salvo localmente e exibido na lista.
  * Cálculo da nota média atualizado a cada novo feedback.
  * Prevenir envio duplicado idêntico na mesma sessão.
- Estado/DOM
  * DOM contém `<section id="feedbacks">`, `<div id="feedback-list">`, `<form id="feedback-form">`, `<input type="range" id="feedback-rating">`, `<textarea id="feedback-comment">`.
  * Estado em JS: `feedbacks[]`, `averageRating`, `feedbackDraft`.

---

---

## 4. PERSISTÊNCIA DE DADOS NO NAVEGADOR

- [Estratégia de LocalStorage]
  * Salvar o estado do carrinho em `localStorage` com chave `fastlanche_cart`.
    - Estrutura: `{ items: [{ id, name, price, quantity }], subtotal, deliveryFee, total }`
  * Salvar feedbacks enviados em `localStorage` com chave `fastlanche_feedbacks`.
    - Estrutura: `[{ id, name, rating, comment, timestamp }]`
  * Ao carregar a página, o app deve:
    - Ler `localStorage`
    - Desserializar JSON
    - Validar formato básico
    - Reconstituir o estado do carrinho e exibir os feedbacks.
  * Ao atualizar carrinho ou enviar feedback:
    - Atualizar `localStorage` imediatamente após alteração de estado.
    - Usar `try/catch` para capturar erros de serialização e falhas de armazenamento.
  * Se `localStorage` estiver indisponível:
    - Exibir mensagem de aviso no console e manter estado apenas em memória.
    - Não bloquear a navegação.

---

## 5. ENGENHARIA DE TESTES (CRITÉRIOS DE ACEITE)

- [User Stories]

1. Cardápio Online
  * Dado que estou na seção de cardápio,
  * Quando eu digito um termo no campo de busca,
  * Então os itens exibidos são filtrados e apenas produtos correspondentes aparecem.
  * Dado que escolho uma categoria,
  * Quando aplico o filtro,
  * Então o cardápio mostra apenas itens dessa categoria.

---

2. Pedidos e Entregas Online
  * Dado que adicionei um item ao carrinho,
  * Quando incremento a quantidade,
  * Então o subtotal e o total são recalculados corretamente.
  * Dado que a quantidade chega a zero,
  * Quando removo o item,
  * Então ele desaparece do carrinho e o total atualiza.

---

3. Pagamento Direto
  * Dado que preenchi todos os campos obrigatórios corretamente,
  * Quando clico em "Finalizar Pedido",
  * Então a transação é simulada como bem-sucedida e o carrinho é limpo.
  * Dado que deixo um campo obrigatório vazio,
  * Quando tento enviar o formulário,
  * Então o sistema exibe erro de validação e não finaliza a compra.

---

4. Agendamento de Mesas
  * Dado que escolho uma data futura e um horário válido,
  * Quando envio o formulário de agendamento,
  * Então a reserva é aceita e é exibida mensagem de confirmação.
  * Dado que escolho uma data no passado,
  * Quando envio o formulário,
  * Então o sistema bloqueia o envio e mostra mensagem de erro.

---

5. Aba de Feedbacks
  * Dado que avalio com 5 estrelas e adiciono um comentário válido,
  * Quando envio o feedback,
  * Então ele é incluído na lista de depoimentos e a nota média é atualizada.
  * Dado que o comentário tem menos de 10 caracteres,
  * Quando tento enviar,
  * Então o envio é recusado e o campo exibe mensagem de correção.
