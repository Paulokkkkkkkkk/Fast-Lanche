// booking.js - lógica de reservas de mesas e persistência local
import { openModal, closeModal, showToast } from './ui.js';
import { setButtonLoading } from './ui.js';
import { sanitizeBookingData } from './security.js';

const BOOKINGS_STORAGE_KEY = 'fastlanche_bookings';

const bookingRequest = {
  customerName: '',
  phone: '',
  date: '',
  time: '',
  guests: 2,
  status: 'idle',
  errors: []
};

const bookings = [];

function isStorageAvailable() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch (error) {
    console.warn('LocalStorage indisponível para reservas.', error);
    return false;
  }
}

function saveBookings() {
  if (!isStorageAvailable()) return false;
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    return true;
  } catch (error) {
    console.warn('Não foi possível salvar as reservas.', error);
    return false;
  }
}

function loadBookings() {
  if (!isStorageAvailable()) return bookings;
  try {
    const stored = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!stored) return bookings;

    const parsed = JSON.parse(stored);
    const safeBookings = Array.isArray(parsed) ? parsed : [];

    bookings.splice(0, bookings.length, ...safeBookings);
    return bookings;
  } catch (error) {
    console.warn('Não foi possível carregar as reservas.', error);
    bookings.splice(0, bookings.length);
    return bookings;
  }
}

function getLocalDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function validateBooking(dateStr, timeStr, people) {
  const errors = [];
  const todayStr = getLocalDateString();

  if (!dateStr) {
    errors.push('Selecione uma data para a reserva.');
  } else if (dateStr < todayStr) {
    errors.push('A data da reserva não pode ser no passado.');
  }

  if (!timeStr) {
    errors.push('Selecione um horário para a reserva.');
  } else if (timeStr < '11:00' || timeStr > '23:00') {
    errors.push('O horário deve estar entre 11:00 e 23:00.');
  }

  const guestsNum = Number(people);
  if (!people || Number.isNaN(guestsNum) || guestsNum < 1 || guestsNum > 12) {
    errors.push('O número de pessoas deve ser de 1 a 12.');
  }

  bookingRequest.errors = errors;
  return {
    isValid: errors.length === 0,
    errors
  };
}

function submitBooking(payload) {
  // Fase 29: Sanitizar dados da reserva
  const sanitized = sanitizeBookingData(payload);

  const newBooking = {
    id: Date.now(),
    date: sanitized.date,
    time: sanitized.time,
    guests: sanitized.guests,
    createdAt: new Date().toISOString()
  };

  bookings.push(newBooking);
  saveBookings();
  return newBooking;
}

function setFeedback(element, message, status = 'info') {
  if (!element) return;
  element.textContent = message;
  element.dataset.status = status;
}

function showBookingConfirmationModal(booking) {
  const formattedDate = formatDateBR(booking.date);
  const peopleText = booking.guests === 1 ? 'pessoa' : 'pessoas';

  const bodyContent = document.createElement('div');
  bodyContent.style.display = 'grid';
  bodyContent.style.gap = '1rem';

  const successIcon = document.createElement('div');
  successIcon.style.cssText = 'font-size:2.5rem;text-align:center;line-height:1;';
  successIcon.textContent = '✅';

  const summary = document.createElement('div');
  summary.style.cssText = 'display:grid;gap:.4rem;';

  const dateInfo = document.createElement('p');
  dateInfo.innerHTML = `<strong>Data:</strong> ${formattedDate}`;

  const timeInfo = document.createElement('p');
  timeInfo.innerHTML = `<strong>Horário:</strong> ${booking.time}`;

  const guestsInfo = document.createElement('p');
  guestsInfo.innerHTML = `<strong>${booking.guests} ${peopleText}</strong>`;

  const confirmationMsg = document.createElement('p');
  confirmationMsg.style.cssText = 'color:var(--verde);font-weight:700;padding-top:.5rem;border-top:1px solid var(--cinza-200);';
  confirmationMsg.textContent = 'Sua reserva foi confirmada! Aguardamos sua visita.';

  summary.append(dateInfo, timeInfo, guestsInfo, confirmationMsg);
  bodyContent.append(successIcon, summary);

  openModal({
    title: 'Reserva Confirmada!',
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

function setupBooking() {
  loadBookings();

  const form = document.getElementById('booking-form');
  const dateInput = document.getElementById('booking-date');
  const feedbackEl = document.getElementById('booking-feedback');
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (dateInput) {
    dateInput.min = getLocalDateString();
  }

  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();

    const formData = new FormData(form);
    const dateVal = formData.get('date');
    const timeVal = formData.get('time');
    const guestsVal = formData.get('guests');

    bookingRequest.date = dateVal;
    bookingRequest.time = timeVal;
    bookingRequest.guests = Number(guestsVal) || 2;
    bookingRequest.status = 'processing';

    setButtonLoading(submitBtn, true, 'Confirmar reserva');
    setFeedback(feedbackEl, 'Processando reserva...', 'info');

    const validation = validateBooking(dateVal, timeVal, guestsVal);

    if (!validation.isValid) {
      bookingRequest.status = 'failed';
      setFeedback(feedbackEl, validation.errors[0], 'error');
      showToast(validation.errors[0], 'error');
      setButtonLoading(submitBtn, false);
      return;
    }

    try {
      const payload = {
        date: dateVal,
        time: timeVal,
        guests: guestsVal
      };

      const booking = submitBooking(payload);
      bookingRequest.status = 'success';

      form.reset();

      if (dateInput) {
        dateInput.min = getLocalDateString();
      }

      const formattedDate = formatDateBR(booking.date);
      setFeedback(
        feedbackEl,
        `Reserva confirmada! Mesa para ${booking.guests} ${booking.guests === 1 ? 'pessoa' : 'pessoas'} em ${formattedDate} às ${booking.time}.`,
        'success'
      );

      showBookingConfirmationModal(booking);
      showToast(`Reserva para ${formattedDate} confirmada!`, 'success', 5000);
    } catch (error) {
      bookingRequest.status = 'failed';
      console.error('Erro ao realizar reserva:', error);
      setFeedback(feedbackEl, 'Erro interno ao realizar reserva. Tente novamente.', 'error');
      showToast('Erro ao realizar reserva.', 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

export {
  bookingRequest,
  bookings,
  loadBookings,
  saveBookings,
  setupBooking,
  submitBooking,
  validateBooking
};