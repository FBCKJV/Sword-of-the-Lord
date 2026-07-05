import { state } from './state.js';
import { W } from './dom.js';
import { CHAFF } from '../data/verses.js';
import { getDifficulty } from '../data/difficulty.js';

function tileWidth(text){
  return Math.max(46, text.length*13 + 20);
}

// Pick a spawn x whose horizontal span doesn't sit on top of any tile still
// near the top of the screen — this is what stops chaff from hiding the verse
// word (and vice versa) right at the spawn line.
function pickClearX(w){
  const occupied = [];
  const collect = t => { if(t.y < 110) occupied.push([t.x - t.w/2, t.x + t.w/2]); };
  state.verseTiles.forEach(collect);
  state.decoys.forEach(collect);
  state.powerups.forEach(collect);

  const min = 40 + w/2, max = W - 40 - w/2;
  for(let tries = 0; tries < 14; tries++){
    const x = min + Math.random()*(max - min);
    const clear = occupied.every(([a,b]) => x + w/2 + 10 < a || x - w/2 - 10 > b);
    if(clear) return x;
  }
  // Crowded: fall back to the x farthest from every occupied span's center.
  let bestX = min + Math.random()*(max - min), bestDist = -1;
  for(let i = 0; i < 8; i++){
    const x = min + (i/7)*(max - min);
    const dist = occupied.length
      ? Math.min(...occupied.map(([a,b]) => Math.abs(x - (a+b)/2)))
      : Infinity;
    if(dist > bestDist){ bestDist = dist; bestX = x; }
  }
  return bestX;
}

export function spawnVerseWord(wordIdx){
  const text = state.words[wordIdx];
  const w = tileWidth(text);
  state.verseTiles.push({ x: pickClearX(w), y: -30, w, h: 34, text, wordIdx });
}

// Decoy text: plain chaff normally; on tricky tiers (or an enraged boss),
// half the decoys are real words from the current verse pulled out of order —
// so the player has to track *position*, not just recognize vocabulary.
function pickDecoyText(){
  const diff = getDifficulty(state.difficulty);
  const tier = state.currentEntry && state.currentEntry.type === 'boss'
    ? 99 : (state.currentEntry ? state.currentEntry.tier : 1);
  const tricky = state.bossPhase2 || tier >= diff.trickyDecoyTier ||
    (state.currentEntry && state.currentEntry.type === 'boss' && state.difficulty !== 'easy');

  if(tricky && Math.random() < 0.5){
    // Words the player must NOT confuse with the imminent targets: exclude
    // anything matching the next few upcoming words.
    const upcoming = new Set(
      state.words.slice(state.targetIdx, state.targetIdx + 4).map(w => w.toLowerCase())
    );
    const pool = state.words.filter(w => !upcoming.has(w.toLowerCase()));
    if(pool.length) return pool[Math.floor(Math.random()*pool.length)];
  }
  return CHAFF[Math.floor(Math.random()*CHAFF.length)];
}

export function spawnDecoy(){
  const text = pickDecoyText();
  const w = tileWidth(text);
  state.decoys.push({ x: pickClearX(w), y: -30, w, h: 34, text, dead: false });
}

export function spawnPowerup(kind){
  const w = 46;
  state.powerups.push({ x: pickClearX(w), y: -30, w, h: 46, kind, dead: false });
}
