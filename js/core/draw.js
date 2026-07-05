import { state } from './state.js';
import { ctx, W, H } from './dom.js';
import { IMAGES } from '../data/images.js';

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
  const img = IMAGES[devil.key + '_' + stateKey];
  if(!img || !img.complete) return;

  ctx.save();
  const bob = Math.sin(devil.bobPhase)*6;
  const shk = devil.shakeAmt>0 ? (Math.random()-0.5)*12*devil.shakeAmt : 0;
  const dieScale = devil.dying>0 ? devil.dying : 1;
  const dieAlpha = devil.dying>0 ? devil.dying : 1;

  const baseW = devil.isBoss ? 300 : 210;
  const ratio = img.naturalHeight / img.naturalWidth;
  let dw = baseW * devil.scale * dieScale;
  let dh = dw * ratio;
  const maxDh = 420;
  if(dh > maxDh){ dh = maxDh; dw = dh / ratio; }

  ctx.globalAlpha = dieAlpha;
  ctx.translate(W/2 + shk, devil.y0 + bob);

  const glow = ctx.createRadialGradient(0,0,10,0,0,dw*0.7);
  glow.addColorStop(0, 'rgba(179,49,29,0.35)');
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

export function drawSlashStreak(){
  const slashFx = state.slashFx;
  if(!slashFx.active) return;
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
    grad.addColorStop(0, 'rgba(244,247,248,0)');
    grad.addColorStop(0.5, `rgba(244,247,248,${alpha})`);
    grad.addColorStop(1, 'rgba(244,247,248,0)');
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
  ctx.fillText('IT IS WRITTEN', W/2, H/2-8);
  ctx.font = 'italic 15px "EB Garamond", Georgia, serif';
  ctx.fillStyle = 'rgba(236,223,192,0.85)';
  ctx.fillText(state.currentVerse.ref, W/2, H/2+20);
  ctx.restore();
}

export function draw(){
  ctx.clearRect(0,0,W,H);
  const sx = state.shake>0 ? (Math.random()-0.5)*10*state.shake : 0;
  const sy = state.shake>0 ? (Math.random()-0.5)*10*state.shake : 0;
  ctx.save(); ctx.translate(sx,sy);

  drawBackground();
  drawDevil();
  if(state.activeTile) drawTile(state.activeTile, false);
  state.decoys.forEach(d=>drawTile(d, true));

  state.particles.forEach(p=>{
    ctx.beginPath(); ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0,p.life);
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  drawSlashStreak();
  drawSwordAndArm();
  drawBanner();

  if(state.flashTimer>0){
    ctx.fillStyle = state.flashColor;
    ctx.globalAlpha = Math.max(0, state.flashTimer*0.35);
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
