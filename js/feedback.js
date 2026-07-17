// feedback.js - camada de dados e persistencia de avaliacoes
import { openModal, closeModal, showToast } from './app.js';

const FEEDBACKS_STORAGE_KEY = 'fastlanche_feedbacks';

const feedbacks = [];

function isStorageAvailable() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch (error) {
    console.warn('LocalStorage indisponivel para feedbacks.', error);
    return false;
  }
}

function saveFeedbacks() {
  if (!isStorageAvailable()) return false;

  try {
    localStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify(feedbacks));
    return true;
  } catch (error) {
    console.warn('Nao foi possivel salvar os feedbacks.', error);
    return false;
  }
}

function isValidStoredFeedback(feedback) {
  return (
    feedback &&
    Number.isFinite(Number(feedback.id)) &&
    typeof feedback.name === 'string' &&
    Number.isFinite(Number(feedback.rating)) &&
    typeof feedback.comment === 'string' &&
    typeof feedback.timestamp === 'string'
  );
}

function normalizeStoredFeedback(feedback) {
  return {
    id: Number(feedback.id),
    name: feedback.name,
    rating: Math.min(Math.max(Number(feedback.rating) || 1, 1), 5),
    comment: feedback.comment,
    timestamp: feedback.timestamp
  };
}

function loadFeedbacks() {
  if (!isStorageAvailable()) return feedbacks;

  try {
    const storedFeedbacks = localStorage.getItem(FEEDBACKS_STORAGE_KEY);
    if (!storedFeedbacks) return feedbacks;

    const parsedFeedbacks = JSON.parse(storedFeedbacks);
    const safeFeedbacks = Array.isArray(parsedFeedbacks) ? parsedFeedbacks : [];

    feedbacks.splice(
      0,
      feedbacks.length,
      ...safeFeedbacks.filter(isValidStoredFeedback).map(normalizeStoredFeedback)
    );

    return feedbacks;
  } catch (error) {
    console.warn('Nao foi possivel carregar os feedbacks.', error);
    feedbacks.splice(0, feedbacks.length);
    return feedbacks;
  }
}

function addFeedback(feedback) {
  if (!feedback || !feedback.comment) return false;

  feedbacks.push({
    id: Date.now(),
    name: feedback.name || 'Cliente',
    rating: Math.min(Math.max(Number(feedback.rating) || 1, 1), 5),
    comment: feedback.comment,
    timestamp: new Date().toISOString()
  });

  saveFeedbacks();
  return true;
}

function getAverage() {
  if (!feedbacks.length) return 0;

  const total = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
  return total / feedbacks.length;
}

const sessionFeedbacks = new Set();

function renderFeedbacks() {
  const listEl = document.getElementById('feedback-list');
  const avgEl = document.getElementById('average-rating');
  if (!listEl) return;

  listEl.replaceChildren();

  if (!feedbacks.length) {
    const emptyItem = document.createElement('article');
    emptyItem.className = 'feedback-item empty-state';

    const emoji = document.createElement('span');
    emoji.className = 'empty-state-icon';
    emoji.textContent = '💬';

    const text = document.createElement('span');
    text.className = 'empty-state-text';
    text.textContent = 'Nenhum feedback cadastrado ainda. Seja o primeiro a avaliar!';

    emptyItem.append(emoji, text);
    listEl.appendChild(emptyItem);
  } else {
    const sortedFeedbacks = [...feedbacks].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    sortedFeedbacks.forEach(fb => {
      const article = document.createElement('article');
      article.className = 'feedback-item';

      const stars = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);

      const header = document.createElement('strong');
      header.textContent = `${fb.name} — ${stars}`;

      const comment = document.createElement('p');
      comment.textContent = fb.comment;

      const dateEl = document.createElement('small');
      dateEl.style.display = 'block';
      dateEl.style.color = 'var(--cinza-500)';
      dateEl.style.marginTop = '0.25rem';

      try {
        const dateObj = new Date(fb.timestamp);
        dateEl.textContent = dateObj.toLocaleString('pt-BR');
      } catch (e) {
        dateEl.textContent = fb.timestamp;
      }

      article.append(header, comment, dateEl);
      listEl.appendChild(article);
    });
  }

  if (avgEl) {
    const avg = getAverage();
    avgEl.textContent = avg.toFixed(1).replace('.', ',');
  }
}

function setFeedbackMessage(element, message, status = 'info') {
  if (!element) return;
  element.textContent = message;
  element.dataset.status = status;
}

function showFeedbackConfirmationModal(name, rating, comment) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const bodyContent = document.createElement('div');
  bodyContent.style.display = 'grid';
  bodyContent.style.gap = '1rem';

  const successIcon = document.createElement('div');
  successIcon.style.cssText = 'font-size:2.5rem;text-align:center;line-height:1;';
  successIcon.textContent = '⭐';

  const summary = document.createElement('div');
  summary.style.cssText = 'display:grid;gap:.4rem;';

  const nameLine = document.createElement('p');
  nameLine.innerHTML = `<strong>${name}</strong>`;

  const ratingLine = document.createElement('p');
  ratingLine.style.cssText = 'font-size:1.3rem;letter-spacing:2px;';
  ratingLine.textContent = stars;

  const commentLine = document.createElement('p');
  commentLine.textContent = comment;

  const thanksMsg = document.createElement('p');
  thanksMsg.style.cssText = 'color:var(--verde);font-weight:700;padding-top:.5rem;border-top:1px solid var(--cinza-200);';
  thanksMsg.textContent = 'Obrigado pelo seu feedback! Sua opinião é muito importante.';

  summary.append(nameLine, ratingLine, commentLine, thanksMsg);
  bodyContent.append(successIcon, summary);

  openModal({
    title: 'Feedback Enviado!',
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

function setupFeedback() {
  loadFeedbacks();
  renderFeedbacks();

  const form = document.getElementById('feedback-form');
  const messageEl = document.getElementById('feedback-message');
  const ratingInput = document.getElementById('feedback-rating');
  const ratingValue = document.getElementById('rating-value');

  // Live update do valor do range rating
  if (ratingInput && ratingValue) {
    ratingInput.addEventListener('input', () => {
      ratingValue.textContent = ratingInput.value;
    });
  }

  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = (formData.get('name') || '').trim();
    const rating = Number(formData.get('rating'));
    const comment = (formData.get('comment') || '').trim();

    if (!name) {
      setFeedbackMessage(messageEl, 'Por favor, insira seu nome.', 'error');
      showToast('Por favor, insira seu nome.', 'error');
      return;
    }

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      setFeedbackMessage(messageEl, 'A nota deve ser entre 1 e 5.', 'error');
      showToast('A nota deve ser entre 1 e 5.', 'error');
      return;
    }

    if (comment.length < 10) {
      setFeedbackMessage(messageEl, 'O comentário deve conter pelo menos 10 caracteres.', 'error');
      showToast('O comentário deve conter pelo menos 10 caracteres.', 'error');
      return;
    }

    // Prevenção de duplicidade na mesma sessão
    const feedbackKey = `${name.toLowerCase()}-${rating}-${comment.toLowerCase()}`;
    if (sessionFeedbacks.has(feedbackKey)) {
      setFeedbackMessage(messageEl, 'Você já enviou este feedback nesta sessão.', 'error');
      showToast('Você já enviou este feedback nesta sessão.', 'error');
      return;
    }

    const newFeedback = {
      name: name || 'Cliente',
      rating: rating,
      comment: comment
    };

    const success = addFeedback(newFeedback);

    if (success) {
      sessionFeedbacks.add(feedbackKey);
      showFeedbackConfirmationModal(name, rating, comment);
      setFeedbackMessage(messageEl, 'Feedback enviado com sucesso!', 'success');
      showToast('Feedback enviado com sucesso!', 'success');
      form.reset();
      // Atualiza o texto do rating para refletir o valor resetado (5)
      if (ratingValue) ratingValue.textContent = '5';
      renderFeedbacks();
    } else {
      setFeedbackMessage(messageEl, 'Não foi possível salvar o feedback.', 'error');
      showToast('Não foi possível salvar o feedback.', 'error');
    }
  });
}

export {
  addFeedback,
  feedbacks,
  getAverage,
  loadFeedbacks,
  saveFeedbacks,
  setupFeedback
};