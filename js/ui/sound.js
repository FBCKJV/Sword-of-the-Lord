// Lightweight synthesized sound effects via Web Audio — no audio files to ship/cache.
import { state } from '../core/state.js';
import { getCtx, unlockAudio } from '../core/audio-context.js';

export { unlockAudio };

function tone({ freq, dur=0.15, type='sine', gain=0.2, glideTo=null, delay=0 }){
  if(!state.soundEnabled) return;
  const ac = getCtx();
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if(glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g); g.connect(ac.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

export function playSwing(){
  tone({ freq:900, glideTo:220, dur:0.12, type:'sawtooth', gain:0.12 });
}
export function playCorrectHit(){
  tone({ freq:660, glideTo:1320, dur:0.1, type:'triangle', gain:0.18 });
  tone({ freq:990, dur:0.16, type:'sine', gain:0.1, delay:0.03 });
}
export function playWrongHit(){
  tone({ freq:180, glideTo:70, dur:0.28, type:'sawtooth', gain:0.22 });
}
export function playLevelComplete(){
  [523.25, 659.25, 783.99, 1046.5].forEach((f,i)=> tone({ freq:f, dur:0.22, type:'triangle', gain:0.14, delay:i*0.09 }));
}
export function playGameOver(){
  tone({ freq:220, glideTo:80, dur:0.7, type:'sawtooth', gain:0.18 });
}
export function playBadgeUnlock(){
  [784, 987.77, 1174.66].forEach((f,i)=> tone({ freq:f, dur:0.3, type:'sine', gain:0.16, delay:i*0.07 }));
}
// Milestone fanfare climbs in pitch the longer the streak runs.
export function playComboMilestone(combo){
  const base = Math.min(1400, 500 + combo*22);
  tone({ freq:base, dur:0.12, type:'triangle', gain:0.16 });
  tone({ freq:base*1.5, dur:0.2, type:'triangle', gain:0.14, delay:0.07 });
}
export function playMercy(){
  [523.25, 659.25, 880].forEach((f,i)=> tone({ freq:f, dur:0.3, type:'sine', gain:0.13, delay:i*0.08 }));
}
export function playSelah(){
  tone({ freq:196, dur:0.9, type:'sine', gain:0.14 });
  tone({ freq:294, dur:0.9, type:'sine', gain:0.1, delay:0.05 });
}
export function playDemonCast(){
  tone({ freq:110, glideTo:65, dur:0.4, type:'sawtooth', gain:0.14 });
  tone({ freq:220, glideTo:140, dur:0.25, type:'square', gain:0.05, delay:0.05 });
}
