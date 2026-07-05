import { state } from './state.js';
import { canvas, dom, W, H } from './dom.js';
import { triggerSlash, burst, addPopup, showBanner } from './fx.js';
import { updateStrip, renderShields, levelComplete, endGame } from '../ui/screens.js';
import { recordCorrectHit, queueBadgeToasts } from '../ui/badges.js';
import { playCorrectHit, playWrongHit, playComboMilestone, playMercy, playSelah } from '../ui/sound.js';
import { getDifficulty } from '../data/difficulty.js';

export function getPos(e){
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width, scaleY = H / rect.height;
  const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  return { x: cx*scaleX, y: cy*scaleY };
}

export function hitTest(tile, pos){
  return pos.x > tile.x - tile.w/2 - 6 && pos.x < tile.x + tile.w/2 + 6 &&
         pos.y > tile.y - tile.h/2 - 6 && pos.y < tile.y + tile.h/2 + 6;
}

export function handleTap(e){
  if(state.phase !== 'battle' || state.paused) return;
  e.preventDefault();
  const pos = getPos(e);

  for(const p of state.powerups){
    if(!p.dead && hitTest(p, pos)){ powerupHit(p); return; }
  }
  // Verse tiles: index 0 is the word the player owes next. Tapping a later
  // word in the chain is out of order — a real penalty, but the tile stays,
  // because that word is still owed once its turn comes.
  for(let i = 0; i < state.verseTiles.length; i++){
    const t = state.verseTiles[i];
    if(hitTest(t, pos)){
      if(i === 0) correctHit(t);
      else outOfOrderHit(t);
      return;
    }
  }
  for(const d of state.decoys){
    if(hitTest(d, pos)){ wrongHit(d.x, d.y); d.dead = true; return; }
  }
}

canvas.addEventListener('pointerdown', handleTap);

// Tapping a word while it's still high on screen is worth up to ~2x.
function swiftMultiplier(y){
  return 1 + Math.max(0, (420 - y) / 420);
}

export function correctHit(tile){
  const diff = getDifficulty(state.difficulty);
  state.combo++;
  const swift = swiftMultiplier(tile.y);
  const hintless = state.stripVisible ? 1 : 1.5;
  const points = Math.round((10 + state.combo*2) * swift * hintless * diff.scoreMult);
  state.score += points;
  dom.scoreVal.textContent = Math.floor(state.score);

  addPopup(tile.x, tile.y - 14, '+' + points, swift >= 1.6 ? '#ff9d5c' : '#f4d976', swift >= 1.6 ? 21 : 17);
  if(swift >= 1.6) addPopup(tile.x, tile.y - 38, 'SWIFT!', '#fff3c4', 13);

  if(state.combo > 0 && state.combo % 5 === 0){
    state.comboFlash = 1;
    state.hitStop = 0.05;
    playComboMilestone(state.combo);
    addPopup(W/2, 180, state.combo + ' IN A ROW', '#f4d976', 24);
  }

  playCorrectHit();
  triggerSlash();
  burst(tile.x, tile.y, '#f4d976', 16);
  // The demon reels harder the hotter your streak runs.
  state.devil.hitFlash = 1;
  state.devil.shakeAmt = Math.min(2.2, 1 + state.combo*0.08);
  state.shake = 0.35;

  state.verseTiles.shift();
  state.targetIdx++;
  updateStrip();
  queueBadgeToasts(recordCorrectHit(), dom);
  if(state.targetIdx >= state.words.length){ levelComplete(); }
}

function outOfOrderHit(tile){
  burst(tile.x, tile.y, '#b3311d', 8);
  addPopup(tile.x, tile.y - 14, 'OUT OF ORDER', '#ff6b35', 13);
  applyDamage(tile.x, tile.y);
}

export function wrongHit(x, y){
  burst(x, y, '#b3311d', 10);
  applyDamage(x, y);
}

// Central damage path: a grace shield (earned by a perfect verse) absorbs
// one mistake before the real shields start breaking.
function applyDamage(x, y){
  state.combo = 0;
  state.levelPerfect = false;
  playWrongHit();
  if(state.graceShield){
    state.graceShield = false;
    renderShields();
    addPopup(x, y - 30, 'GRACE', '#f4d976', 20);
    flash('#d4af37');
    state.shake = 0.5;
    return;
  }
  state.lives--;
  renderShields();
  flash('#b3311d');
  state.shake = 1;
  if(state.lives <= 0) endGame();
}

export function missedTile(tile){
  addPopup(tile.x, H - 90, 'MISSED', '#8c7f61', 14);
  burst(tile.x, H - 70, '#8c7f61', 8);
  state.verseTiles.shift();
  state.targetIdx++;
  updateStrip();
  applyDamage(tile.x, H - 80);
  if(state.phase !== 'battle') return; // endGame already fired
  if(state.targetIdx >= state.words.length){ levelComplete(); }
}

function powerupHit(p){
  p.dead = true;
  if(p.kind === 'dove'){
    state.lives = Math.min(3, state.lives + 1);
    renderShields();
    burst(p.x, p.y, '#f4f7f8', 22);
    addPopup(p.x, p.y - 16, 'SHIELD RESTORED', '#c8d3d9', 15);
    playMercy();
  } else if(p.kind === 'selah'){
    state.timeScale = 0.45;
    state.selahTimer = 4;
    burst(p.x, p.y, '#b89ce0', 22);
    showBanner('SELAH', 'be still, and know', 1.4);
    playSelah();
  }
}

export function flash(color){ state.flashTimer = 1; state.flashColor = color; }
