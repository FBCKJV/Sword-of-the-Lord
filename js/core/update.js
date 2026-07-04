import { state } from './state.js';
import { H } from './dom.js';
import { spawnVerseTile, spawnDecoy } from './spawn.js';
import { missedTile } from './input.js';

export function update(dt){
  const s = state;
  if(s.phase === 'battle'){
    if(!s.activeTile){
      s.spawnDelay -= dt;
      if(s.spawnDelay <= 0) spawnVerseTile();
    } else {
      s.activeTile.y += s.fallSpeed*dt;
      if(s.activeTile.y > H+40){ missedTile(s.activeTile); }
    }
    s.nextDecoyIn -= dt;
    if(s.nextDecoyIn <= 0){
      spawnDecoy();
      s.nextDecoyIn = s.decoyInterval * (0.7 + Math.random()*0.6);
    }
    s.decoys.forEach(d=>{ d.y += s.fallSpeed*0.92*dt; });
    s.decoys = s.decoys.filter(d=> d.y < H+40 && !d.dead);
  }

  s.devil.bobPhase += dt*1.6;
  if(s.devil.hitFlash>0) s.devil.hitFlash -= dt*2.2;
  if(s.devil.shakeAmt>0) s.devil.shakeAmt -= dt*4;
  if(s.devil.dying>0) s.devil.dying = Math.max(0, s.devil.dying - dt*0.7);

  if(s.sword.swingTimer>0){ s.sword.swingTimer -= dt*4; }
  if(s.slashFx.active){
    s.slashFx.t += dt;
    if(s.slashFx.t >= s.slashFx.dur) s.slashFx.active = false;
  }
  if(s.flashTimer>0) s.flashTimer -= dt*2.2;
  if(s.shake>0) s.shake -= dt*3;
  if(s.bannerTimer>0) s.bannerTimer -= dt;

  s.particles.forEach(p=>{ p.x+=p.vx*dt; p.y+=p.vy*dt; p.life -= dt*1.5; p.vy += 160*dt; });
  s.particles = s.particles.filter(p=>p.life>0);
}
