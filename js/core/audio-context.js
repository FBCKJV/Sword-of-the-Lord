// Single shared AudioContext for both sound effects (sound.js) and the
// music sequencer (music.js) — two contexts would double the unlock
// friction on iOS/Chrome autoplay policies for no benefit.
let ctx = null;

export function getCtx(){
  if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if(ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio(){
  try { getCtx(); } catch(e){ /* audio unavailable */ }
}
