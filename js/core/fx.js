import { state } from './state.js';
import { H } from './dom.js';

export function triggerSlash(){
  state.sword.swingTimer = 1;
  state.slashFx.active = true; state.slashFx.t = 0;
  state.slashFx.dir = Math.random() < 0.5 ? 1 : -1;
  state.slashFx.y = H - 150 + (Math.random()*36 - 18);
}

export function burst(x,y,color,n){
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2;
    const sp = 50+Math.random()*160;
    state.particles.push({ x,y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1, color, size:2+Math.random()*3.5 });
  }
}

export function addPopup(x, y, text, color = '#f4d976', size = 18){
  state.popups.push({ x, y, text, color, size, life: 1 });
}

export function showBanner(text, sub, dur = 1.6){
  state.bannerText = text;
  state.bannerSub = sub;
  state.bannerTimer = dur;
}
