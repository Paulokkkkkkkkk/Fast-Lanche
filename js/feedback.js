// feedback.js - camada de dados e persistencia de avaliacoes
const FEEDBACKS_STORAGE_KEY = 'fastlanche_feedbacks';

const feedbacks = [];

function isStorageAvailable(){
  try{
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  }catch(error){
    console.warn('LocalStorage indisponivel para feedbacks.', error);
    return false;
  }
}

function saveFeedbacks(){
  if(!isStorageAvailable()) return false;

  try{
    localStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify(feedbacks));
    return true;
  }catch(error){
    console.warn('Nao foi possivel salvar os feedbacks.', error);
    return false;
  }
}

function isValidStoredFeedback(feedback){
  return (
    feedback &&
    Number.isFinite(Number(feedback.id)) &&
    typeof feedback.name === 'string' &&
    Number.isFinite(Number(feedback.rating)) &&
    typeof feedback.comment === 'string' &&
    typeof feedback.timestamp === 'string'
  );
}

function normalizeStoredFeedback(feedback){
  return {
    id: Number(feedback.id),
    name: feedback.name,
    rating: Math.min(Math.max(Number(feedback.rating) || 1, 1), 5),
    comment: feedback.comment,
    timestamp: feedback.timestamp
  };
}

function loadFeedbacks(){
  if(!isStorageAvailable()) return feedbacks;

  try{
    const storedFeedbacks = localStorage.getItem(FEEDBACKS_STORAGE_KEY);
    if(!storedFeedbacks) return feedbacks;

    const parsedFeedbacks = JSON.parse(storedFeedbacks);
    const safeFeedbacks = Array.isArray(parsedFeedbacks) ? parsedFeedbacks : [];

    feedbacks.splice(
      0,
      feedbacks.length,
      ...safeFeedbacks.filter(isValidStoredFeedback).map(normalizeStoredFeedback)
    );

    return feedbacks;
  }catch(error){
    console.warn('Nao foi possivel carregar os feedbacks.', error);
    feedbacks.splice(0, feedbacks.length);
    return feedbacks;
  }
}

function addFeedback(feedback){
  if(!feedback || !feedback.comment) return false;

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

function getAverage(){
  if(!feedbacks.length) return 0;

  const total = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
  return total / feedbacks.length;
}

export {
  addFeedback,
  feedbacks,
  getAverage,
  loadFeedbacks,
  saveFeedbacks
};
