import { state } from './state.js';
import { W } from './dom.js';
import { CHAFF } from '../data/verses.js';

export function spawnVerseTile(){
  const text = state.words[state.targetIdx];
  const w = Math.max(46, text.length*13 + 20);
  state.activeTile = { x: 60+Math.random()*(W-120), y: -30, w, h:34, text };
}

export function spawnDecoy(){
  const text = CHAFF[Math.floor(Math.random()*CHAFF.length)];
  const w = Math.max(46, text.length*13 + 20);
  state.decoys.push({ x: 60+Math.random()*(W-120), y:-30, w, h:34, text, dead:false });
}
