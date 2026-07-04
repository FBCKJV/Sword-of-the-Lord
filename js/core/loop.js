import { state } from './state.js';
import { update } from './update.js';
import { draw } from './draw.js';

export function loop(t){
  if(!state.running) return;
  const dt = Math.min(0.033, (t-state.last)/1000);
  state.last = t;
  if(!state.paused) update(dt);
  draw();
  state.raf = requestAnimationFrame(loop);
}
