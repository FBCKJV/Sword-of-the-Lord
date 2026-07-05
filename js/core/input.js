import { state } from './state.js';
import { canvas, dom, W, H } from './dom.js';
import { triggerSlash, burst } from './fx.js';
import { updateStrip, renderShields, levelComplete, endGame } from '../ui/screens.js';
import { recordCorrectHit, queueBadgeToasts } from '../ui/badges.js';
import { playCorrectHit, playWrongHit } from '../ui/sound.js';

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
  if(state.activeTile && hitTest(state.activeTile, pos)){ correctHit(state.activeTile); return; }
  for(const d of state.decoys){
    if(hitTest(d, pos)){ wrongHit(d.x, d.y); d.dead = true; return; }
  }
}

canvas.addEventListener('pointerdown', handleTap);

export function correctHit(tile){
  state.combo++;
  state.score += 10 + state.combo*2;
  dom.scoreVal.textContent = Math.floor(state.score);
  playCorrectHit();
  triggerSlash();
  burst(tile.x, tile.y, '#f4d976', 16);
  state.devil.hitFlash = 1; state.devil.shakeAmt = 1;
  state.shake = 0.35;
  state.activeTile = null;
  state.targetIdx++;
  updateStrip();
  queueBadgeToasts(recordCorrectHit(), dom);
  if(state.targetIdx >= state.words.length){ levelComplete(); }
  else { state.spawnDelay = Math.max(0.15, 0.55 - (state.currentEntry.tier||4)*0.03); }
}

export function wrongHit(x,y){
  state.combo = 0; state.lives--; state.levelPerfect = false;
  renderShields(); flash('#b3311d'); state.shake = 1;
  playWrongHit();
  burst(x,y,'#b3311d',10);
  if(state.lives <= 0) endGame();
}

export function missedTile(tile){
  state.combo = 0; state.lives--; state.levelPerfect = false;
  renderShields(); flash('#b3311d'); state.shake = 1;
  playWrongHit();
  burst(tile.x, H - 70, '#8c7f61', 8);
  state.activeTile = null; state.targetIdx++; updateStrip();
  if(state.lives <= 0){ endGame(); return; }
  if(state.targetIdx >= state.words.length){ levelComplete(); }
  else state.spawnDelay = Math.max(0.15, 0.55 - (state.currentEntry.tier||4)*0.03);
}

export function flash(color){ state.flashTimer = 1; state.flashColor = color; }
