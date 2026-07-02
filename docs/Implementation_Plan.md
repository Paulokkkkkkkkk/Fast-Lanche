# IMPLEMENTATION PLAN — FAST LANCHE

## Objetivo
Desenvolver a plataforma **Fast Lanche** em **HTML, CSS e JavaScript ES6+**, seguindo rigorosamente o PRD e uma arquitetura modular.

---

# Fase 0 — Estrutura Base ✅
## Objetivos
- Criar a estrutura inicial do projeto.
- Configurar a arquitetura de pastas.
- Definir a identidade visual.

### Estrutura
```text
/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── cart.js
    ├── checkout.js
    ├── booking.js
    └── feedback.js
```

### Tarefas
- Criar HTML base.
- Header, Main e Footer.
- Definir variáveis CSS:
```css
:root{
  --amarelo:#FFC700;
  --vermelho:#E63946;
  --branco:#FFFFFF;
  --preto:#161616;
}
```
- Configurar Grid, Flexbox e responsividade.

---

# Fase 1 — Interface ✅
## Componentes
- Header
- Hero
- Cardápio
- Carrinho
- Checkout
- Reserva
- Feedback
- Footer

---

# Fase 2 — Camada de Dados ✅
Criar:
- menuItems
- cart
- visibleItems
- activeFilter
- searchTerm
- feedbacks
- bookingRequest
- checkoutData

---

# Fase 3 — Cardápio ✅
**Arquivo:** `app.js`

Implementar:
- Renderização dinâmica
- Busca em tempo real
- Filtro por categoria
- Exibição apenas de itens ativos

---

# Fase 4 — Carrinho ✅
**Arquivo:** `cart.js`

Implementar:
- Adicionar itens
- Incrementar
- Decrementar
- Remover
- Cálculo de subtotal
- Taxa de entrega
- Total

Regras:
- Quantidade mínima 1
- Quantidade máxima por item
- Nunca permitir valores negativos

---

# Fase 5 — Persistência ✅
Implementar LocalStorage.

Chaves:
- `fastlanche_cart`
- `fastlanche_feedbacks`

Criar:
- saveCart()
- loadCart()
- saveFeedbacks()
- loadFeedbacks()

Utilizar `try/catch`.

---

# Fase 6 — Checkout
**Arquivo:** `checkout.js`

Implementar:
- Validação HTML5
- Validação JS
- Pagamento simulado
- Limpeza do carrinho
- Registro do pedido

---

# Fase 7 — Agendamento
**Arquivo:** `booking.js`

Implementar:
- Reserva
- Validação de datas
- Validação de horário
- Limite de pessoas
- Confirmação

---

# Fase 8 — Feedbacks
**Arquivo:** `feedback.js`

Implementar:
- Cadastro de avaliações
- Nota média
- Persistência
- Prevenção de duplicidade

---

# Fase 9 — Integração
Integrar:
- Cardápio
- Carrinho
- Checkout
- Reserva
- Feedback

---

# Fase 10 — UX
Adicionar:
- Toasts
- Modais
- Animações
- Estados vazios
- Loading

---

# Fase 11 — Responsividade
Testar:
- Desktop
- Tablet
- Mobile

---

# Fase 12 — Testes
Validar todos os critérios de aceite definidos no PRD.

---

# Ordem Recomendada
1. Estrutura
2. Layout
3. Componentes
4. Dados
5. Cardápio
6. Carrinho
7. LocalStorage
8. Checkout
9. Reserva
10. Feedbacks
11. Integração
12. Responsividade
13. Testes finais
