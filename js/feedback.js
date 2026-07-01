// feedback.js - camada de dados inicial de avaliacoes
const feedbacks = [];

function addFeedback(feedback){
  if(!feedback || !feedback.comment) return false;

  feedbacks.push({
    id: Date.now(),
    name: feedback.name || 'Cliente',
    rating: Number(feedback.rating) || 1,
    comment: feedback.comment,
    timestamp: new Date().toISOString()
  });

  return true;
}

function getAverage(){
  if(!feedbacks.length) return 0;

  const total = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
  return total / feedbacks.length;
}

export { addFeedback, feedbacks, getAverage };
