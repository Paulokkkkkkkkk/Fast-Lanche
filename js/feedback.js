// feedback.js - cadastro e persistência de avaliações (stub)
const feedbacks = [];

function addFeedback(f){
  if(!f || !f.text) return false;
  feedbacks.push({...f, id: Date.now()});
  return true;
}

function getAverage(){
  if(!feedbacks.length) return 0;
  return feedbacks.reduce((s,f)=>s + (f.score||0),0)/feedbacks.length;
}

export { feedbacks, addFeedback, getAverage };
