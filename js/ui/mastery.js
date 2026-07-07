// Per-verse mastery, kept in localStorage. A verse is "mastered" once it has
// been completed perfectly with no hint strip — the sword-drill gold standard.
const KEY = 'sotl_verse_mastery';

function load(){
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch(e){ return {}; }
}
function save(map){
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch(e){}
}

let mastery = load();

export function recordVersePlay(ref, { perfect, hintless }){
  const m = mastery[ref] || { plays: 0, perfects: 0, masteries: 0 };
  m.plays++;
  if(perfect) m.perfects++;
  if(perfect && hintless) m.masteries++;
  mastery[ref] = m;
  save(mastery);
}

export function isMastered(ref){
  return !!(mastery[ref] && mastery[ref].masteries > 0);
}

export function getVerseStats(ref){
  return mastery[ref] || null;
}

export function masteredCount(){
  return Object.values(mastery).filter(m => m.masteries > 0).length;
}
