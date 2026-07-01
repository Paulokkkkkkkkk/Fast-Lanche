// booking.js - camada de dados inicial de reservas
const bookingRequest = {
  customerName: '',
  phone: '',
  date: '',
  time: '',
  guests: 2,
  status: 'idle',
  errors: []
};

function validateBooking(dateStr, timeStr, people){
  return Boolean(dateStr && timeStr && people);
}

function submitBooking(payload){
  console.log('Reserva enviada', payload);
}

export { bookingRequest, submitBooking, validateBooking };
