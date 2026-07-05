import { state } from './state.js';
import { ctx, W, H } from './dom.js';
import { SPRITES } from '../data/images.js';

export function drawBackground(){
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#241a11'); g.addColorStop(0.5,'#1c140e'); g.addColorStop(1,'#0c0908');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for(let i=0;i<5;i++){ const px = 30 + i*((W-60)/4); ctx.fillRect(px-8, 260, 16, 540); }
  const haze = ctx.createRadialGradient(W/2, H, 40, W/2, H, 420);
  haze.addColorStop(0, 'rgba(179,49,29,0.18)'); haze.addColorStop(1, 'rgba(179,49,29,0)');
  ctx.fillStyle = haze; ctx.fillRect(0,0,W,H);
}

export function drawDevil(){
  const devil = state.devil;
  if(devil.dying > 0 && devil.dying < 0.02) return;
  const stateKey = devil.hitFlash > 0.15 ? 'struck' : 'laughing';
  const img = SPRITES[devil.key + '_' + stateKey];
  if(!img) return;
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if(!iw || !ih) return;

  ctx.save();
  const bob = Math.sin(devil.bobPhase)*6;
  const shk = devil.shakeAmt>0 ? (Math.random()-0.5)*12*devil.shakeAmt : 0;
  const dieScale = devil.dying>0 ? devil.dying : 1;
  const dieAlpha = devil.dying>0 ? devil.dying : 1;

  const baseW = devil.isBoss ? 300 : 210;
  const ratio = ih / iw;
  let dw = baseW * devil.scale * dieScale;
  let dh = dw * ratio;
  const maxDh = 420;
  if(dh > maxDh){ dh = maxDh; dw = dh / ratio; }

  ctx.globalAlpha = dieAlpha;
  ctx.translate(W/2 + shk, devil.y0 + bob);

  // vignette glow — flares hot red while the demon winds up a cast
  const casting = state.castTelegraph > 0;
  const pulse = casting ? 0.5 + 0.3*Math.sin(performance.now()/60) : 0.35;
  const glow = ctx.createRadialGradient(0,0,10,0,0,dw*0.7);
  glow.addColorStop(0, `rgba(${casting ? '255,60,20' : '179,49,29'},${pulse})`);
  glow.addColorStop(1, 'rgba(179,49,29,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0,0,dw*0.7,0,Math.PI*2); ctx.fill();

  ctx.drawImage(img, -dw/2, -dh/2, dw, dh);

  if(devil.hitFlash > 0){
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(0.6, devil.hitFlash*0.6);
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(-dw/2,-dh/2,dw,dh);
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawSwordAndArm(){
  const sword = state.sword, slashFx = state.slashFx;
  ctx.save();
  ctx.translate(W/2, H-10);
  ctx.rotate(-Math.PI/2 + (sword.swingTimer>0 ? sword.swingTimer*(slashFx.dir||1)*0.55 : 0));
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(-14,-10,28,60);
  ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-6,-40,12,30);
  ctx.fillStyle = '#d4af37'; ctx.fillRect(-20,-44,40,8);
  const bladeGrad = ctx.createLinearGradient(0,-260,0,-44);
  bladeGrad.addColorStop(0, '#f4f7f8'); bladeGrad.addColorStop(1, '#9fb0b8');
  ctx.fillStyle = bladeGrad;
  ctx.beginPath();
  ctx.moveTo(-9,-44); ctx.lineTo(-4,-250); ctx.lineTo(0,-268); ctx.lineTo(4,-250); ctx.lineTo(9,-44);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth=1; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-50); ctx.lineTo(0,-240);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
  ctx.restore();
}

// The slash burns hotter as the streak climbs: steel -> gold -> flame.
function slashRGB(){
  if(state.combo >= 12) return '255,157,92';
  if(state.combo >= 5) return '244,217,118';
  return '244,247,248';
}

export function drawSlashStreak(){
  const slashFx = state.slashFx;
  if(!slashFx.active) return;
  const rgb = slashRGB();
  const p = slashFx.t / slashFx.dur;
  const travel = W + 500;
  const trailCount = 9;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for(let i=0;i<trailCount;i++){
    const tp = Math.max(0, p - i*0.045);
    if(tp <= 0) continue;
    const eased = 1 - Math.pow(1-tp, 2);
    const tx = slashFx.dir > 0 ? (-250 + travel*eased) : (W+250 - travel*eased);
    const alpha = (1 - i/trailCount) * Math.max(0, 1 - p*0.4);
    const len = 260 - i*14;
    ctx.save();
    ctx.translate(tx, slashFx.y - i*3*slashFx.dir);
    ctx.rotate(slashFx.dir > 0 ? -0.32 : 0.32);
    const grad = ctx.createLinearGradient(-len/2,0,len/2,0);
    grad.addColorStop(0, `rgba(${rgb},0)`);
    grad.addColorStop(0.5, `rgba(${rgb},${alpha})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(-len/2, -(4-i*0.25), len, Math.max(1.5,8-i*0.7));
    ctx.restore();
  }
  const eased0 = 1 - Math.pow(1-p,2);
  const coreX = slashFx.dir > 0 ? (-250 + travel*eased0) : (W+250 - travel*eased0);
  ctx.save();
  ctx.translate(coreX, slashFx.y);
  ctx.rotate(slashFx.dir > 0 ? -0.32 : 0.32);
  ctx.fillStyle = `rgba(255,255,255,${Math.max(0,1-p)})`;
  ctx.fillRect(-140,-3,280,6);
  ctx.restore();
  ctx.restore();
}

export function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

export function drawTile(tile, isDecoy){
  ctx.save();
  ctx.translate(tile.x, tile.y);
  ctx.fillStyle = 'rgba(12,9,8,0.85)';
  roundRect(-tile.w/2,-tile.h/2,tile.w,tile.h,7); ctx.fill();
  ctx.strokeStyle = isDecoy ? 'rgba(140,127,97,0.5)' : 'rgba(212,175,55,0.8)';
  ctx.lineWidth = 2;
  roundRect(-tile.w/2,-tile.h/2,tile.w,tile.h,7); ctx.stroke();
  ctx.fillStyle = isDecoy ? '#a89b7c' : '#ecdfc0';
  ctx.font = '600 16px "EB Garamond", Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(tile.text, 0, 1);
  ctx.restore();
}

function drawPowerup(p){
  ctx.save();
  ctx.translate(p.x, p.y);
  const pulse = 0.75 + 0.25*Math.sin(performance.now()/180);
  if(p.kind === 'dove'){
    const glow = ctx.createRadialGradient(0,0,4,0,0,34);
    glow.addColorStop(0, `rgba(244,247,248,${0.5*pulse})`);
    glow.addColorStop(1, 'rgba(244,247,248,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0,0,34,0,Math.PI*2); ctx.fill();
    // shield shape, same silhouette as the HUD shields
    ctx.fillStyle = '#e8f0f4';
    ctx.strokeStyle = '#c8d3d9';
    ctx.beginPath();
    ctx.moveTo(0,-16); ctx.lineTo(14,-10); ctx.lineTo(14,2);
    ctx.lineTo(0,16); ctx.lineTo(-14,2); ctx.lineTo(-14,-10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(28,20,14,0.5)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(0,8); ctx.moveTo(-6,-2); ctx.lineTo(6,-2); ctx.stroke();
  } else {
    const glow = ctx.createRadialGradient(0,0,4,0,0,34);
    glow.addColorStop(0, `rgba(184,156,224,${0.5*pulse})`);
    glow.addColorStop(1, 'rgba(184,156,224,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0,0,34,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(24,17,28,0.9)';
    ctx.strokeStyle = '#b89ce0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8c8f0';
    ctx.font = '700 9px Cinzel, Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SELAH', 0, 1);
  }
  ctx.restore();
}

function drawFog(){
  const fog = state.fog;
  if(!fog) return;
  ctx.save();
  ctx.globalAlpha = 0.92 * fog.alpha;
  const g = ctx.createLinearGradient(fog.x, 0, fog.x + fog.w, 0);
  g.addColorStop(0, 'rgba(10,7,5,0)');
  g.addColorStop(0.25, 'rgba(14,10,8,0.97)');
  g.addColorStop(0.75, 'rgba(14,10,8,0.97)');
  g.addColorStop(1, 'rgba(10,7,5,0)');
  ctx.fillStyle = g;
  ctx.fillRect(fog.x, 40, fog.w, H - 260);
  ctx.restore();
}

function drawComboMeter(){
  if(state.combo < 2 || state.phase !== 'battle') return;
  ctx.save();
  const flash = Math.max(0, state.comboFlash);
  const size = 15 + Math.min(10, state.combo*0.4) + flash*8;
  ctx.font = `800 ${size}px Cinzel, Georgia, serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const rgb = slashRGB();
  ctx.shadowColor = `rgba(${rgb},${0.5 + flash*0.5})`;
  ctx.shadowBlur = 12 + flash*18;
  ctx.fillStyle = `rgba(${rgb},${0.85 + flash*0.15})`;
  ctx.fillText('×' + state.combo, W/2, 52);
  ctx.restore();
}

function drawPopups(){
  state.popups.forEach(p=>{
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life*1.4));
    ctx.font = `700 ${p.size}px Cinzel, Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  });
}

export function drawBanner(){
  if(state.bannerTimer <= 0) return;
  const alpha = Math.min(1, state.bannerTimer*1.5);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(12,9,8,0.55)';
  ctx.fillRect(0, H/2-46, W, 92);
  ctx.strokeStyle = 'rgba(212,175,55,0.6)'; ctx.lineWidth = 1;
  ctx.strokeRect(0, H/2-46, W, 92);
  ctx.fillStyle = '#f4d976';
  ctx.font = '800 30px Cinzel, Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(state.bannerText || 'IT IS WRITTEN', W/2, H/2-8);
  ctx.font = 'italic 15px "EB Garamond", Georgia, serif';
  ctx.fillStyle = 'rgba(236,223,192,0.85)';
  ctx.fillText(state.bannerSub || (state.currentVerse ? state.currentVerse.ref : ''), W/2, H/2+20);
  ctx.restore();
}

export function draw(){
  ctx.clearRect(0,0,W,H);
  const sx = state.shake>0 ? (Math.random()-0.5)*10*state.shake : 0;
  const sy = state.shake>0 ? (Math.random()-0.5)*10*state.shake : 0;
  ctx.save(); ctx.translate(sx,sy);

  drawBackground();
  drawDevil();

  // Draw order is deliberate: chaff first, mercy tiles next, verse words
  // LAST — the word the player owes can never be buried under a decoy.
  state.decoys.forEach(d=>drawTile(d, true));
  state.powerups.forEach(drawPowerup);
  state.verseTiles.forEach(t=>drawTile(t, false));

  drawFog();

  state.particles.forEach(p=>{
    ctx.beginPath(); ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0,p.life);
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  drawSlashStreak();
  drawSwordAndArm();
  drawComboMeter();
  drawPopups();
  drawBanner();

  if(state.flashTimer>0){
    ctx.fillStyle = state.flashColor;
    ctx.globalAlpha = Math.max(0, state.flashTimer*0.35);
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
