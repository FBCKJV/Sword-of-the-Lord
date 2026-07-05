// Procedural background score — a step-sequencer over the Web Audio API,
// the same technique that actually drove Doom, Hexen, and most SNES scores
// (tracker/FM synthesis), not a compromise version of it. No audio files.
import { state } from '../core/state.js';
import { getCtx } from '../core/audio-context.js';

const SEMITONE = {
  C:-9, 'C#':-8, Db:-8, D:-7, 'D#':-6, Eb:-6, E:-5, F:-4,
  'F#':-3, Gb:-3, G:-2, 'G#':-1, Ab:-1, A:0, 'A#':1, Bb:1, B:2
};
function noteToFreq(note){
  const m = /^([A-G](?:#|b)?)(\d)$/.exec(note);
  if(!m) return 440;
  const semi = SEMITONE[m[1]] + (parseInt(m[2], 10) - 4) * 12;
  return 440 * Math.pow(2, semi / 12);
}

let musicGain = null;
function getMusicGain(){
  const ac = getCtx();
  if(!musicGain){
    musicGain = ac.createGain();
    musicGain.gain.value = 0.4;
    musicGain.connect(ac.destination);
  }
  return musicGain;
}

function playMelodicNote(freq, time, dur, opts){
  const ac = getCtx();
  const osc = ac.createOscillator();
  osc.type = opts.type || 'square';
  osc.frequency.setValueAtTime(freq, time);

  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(Math.max(0.02, opts.gain || 0.14), time + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

  let tail = g;
  if(opts.filterFreq){
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = opts.filterFreq;
    osc.connect(f); f.connect(g);
  } else {
    osc.connect(g);
  }
  tail.connect(getMusicGain());
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

let noiseBuffer = null;
function getNoiseBuffer(){
  const ac = getCtx();
  if(!noiseBuffer || noiseBuffer.sampleRate !== ac.sampleRate){
    const len = ac.sampleRate; // 1 second, reused for every hit
    noiseBuffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for(let i=0;i<len;i++) data[i] = Math.random()*2 - 1;
  }
  return noiseBuffer;
}

function playPercHit(kind, time){
  const ac = getCtx();
  const dest = getMusicGain();

  if(kind === 'k'){
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.09);
    g.gain.setValueAtTime(0.34, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
    osc.connect(g); g.connect(dest);
    osc.start(time); osc.stop(time + 0.12);
    return;
  }

  const noise = ac.createBufferSource();
  noise.buffer = getNoiseBuffer();
  const filt = ac.createBiquadFilter();
  const g = ac.createGain();
  if(kind === 'h'){
    filt.type = 'highpass'; filt.frequency.value = 6500;
    g.gain.setValueAtTime(0.11, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
  } else { // snare
    filt.type = 'bandpass'; filt.frequency.value = 1800; filt.Q.value = 0.6;
    g.gain.setValueAtTime(0.2, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
  }
  noise.connect(filt); filt.connect(g); g.connect(dest);
  noise.start(time); noise.stop(time + 0.16);
}

// ---------- Themes (D natural minor; boss borrows a raised 7th + tritone) ----------
function track(gate, opts, pattern){ return { gate, opts, pattern }; }

const MENU_THEME = {
  bpm: 92, patternLength: 32,
  bass: track(0.9, { type:'triangle', gain:0.16, filterFreq:900 }, (() => {
    const p = new Array(32).fill(null);
    p[0]=['D3',8]; p[8]=['C3',8]; p[16]=['Bb2',8]; p[24]=['A2',8];
    return p;
  })()),
  lead: track(0.85, { type:'triangle', gain:0.12, filterFreq:2200 }, (() => {
    const p = new Array(32).fill(null);
    p[0]=['D4',4]; p[4]=['F4',4]; p[8]=['A4',4]; p[12]=['G4',4];
    p[16]=['F4',4]; p[20]=['E4',4]; p[24]=['D4',4]; // steps 28-31 rest — subtle breathing room
    return p;
  })()),
  perc: track(1, {}, new Array(32).fill(null))
};

const BATTLE_THEME = {
  bpm: 158, patternLength: 16,
  bass: track(0.72, { type:'square', gain:0.15, filterFreq:1100 }, [
    ['D3',2], null, ['A3',2], null, ['D3',2], null, ['D4',2], null,
    ['D3',2], null, ['A3',2], null, ['D3',2], null, ['C4',2], null
  ]),
  lead: track(0.75, { type:'square', gain:0.12, filterFreq:3400 }, [
    ['D5',2], null, ['F5',2], null, ['A5',2], null, ['G5',1], ['F5',1],
    ['E5',2], null, ['D5',2], null, ['F5',2], null, ['E5',1], ['D5',1]
  ]),
  perc: track(1, {}, ['k',null,'h',null,'s',null,'h',null,'k',null,'h',null,'s',null,'h',null])
};

const BOSS_THEME = {
  bpm: 176, patternLength: 16,
  bass: track(0.62, { type:'sawtooth', gain:0.14, filterFreq:950 }, [
    ['D3',2], null, ['Ab3',2], null, ['D3',2], null, ['D4',2], null,
    ['C3',2], null, ['Ab3',2], null, ['D3',2], null, ['C#3',2], null
  ]),
  lead: track(0.68, { type:'sawtooth', gain:0.11, filterFreq:4200 }, [
    ['D5',1], ['F5',1], ['A5',2], null, ['Bb5',1], ['A5',1], ['G5',2], null,
    ['F5',1], ['E5',1], ['D5',2], null, ['C#5',1], ['D5',1], ['F5',2], null
  ]),
  perc: track(1, {}, ['k','h','h','h','s','h','k','h','k','h','h','h','s','h','k','h'])
};

// ---------- Lookahead scheduler ----------
const LOOKAHEAD = 0.15;
const TICK_MS = 25;
let timer = null;
let step = 0;
let nextNoteTime = 0;
let activeTheme = null;
let activeThemeKey = null;

function scheduleStep(theme, stepIdx, time){
  const stepDur = 60 / theme.bpm / 4;
  const idx = stepIdx % theme.patternLength;

  const b = theme.bass.pattern[idx % theme.bass.pattern.length];
  if(b) playMelodicNote(noteToFreq(b[0]), time, stepDur*(b[1]||1)*theme.bass.gate, theme.bass.opts);

  const l = theme.lead.pattern[idx % theme.lead.pattern.length];
  if(l) playMelodicNote(noteToFreq(l[0]), time, stepDur*(l[1]||1)*theme.lead.gate, theme.lead.opts);

  const p = theme.perc.pattern[idx % theme.perc.pattern.length];
  if(p) playPercHit(p, time);
}

function tick(){
  const ac = getCtx();
  while(nextNoteTime < ac.currentTime + LOOKAHEAD){
    scheduleStep(activeTheme, step, nextNoteTime);
    nextNoteTime += 60 / activeTheme.bpm / 4;
    step++;
  }
}

function startScheduler(theme){
  stopScheduler();
  activeTheme = theme;
  step = 0;
  nextNoteTime = getCtx().currentTime + 0.05;
  timer = setInterval(tick, TICK_MS);
}

function stopScheduler(){
  if(timer){ clearInterval(timer); timer = null; }
}

// playX() no-ops if that theme is already the active one, so returning to a
// level after a menu trip (or looping between ordinary levels) doesn't
// restart the phrase from bar 1 every time — only genuine theme changes cut.
function playTheme(key, theme){
  if(activeThemeKey === key) return;
  activeThemeKey = key;
  if(!state.musicEnabled){ activeTheme = theme; stopScheduler(); return; }
  startScheduler(theme);
}

export function playMenuTheme(){ playTheme('menu', MENU_THEME); }
export function playBattleTheme(){ playTheme('battle', BATTLE_THEME); }
export function playBossTheme(){ playTheme('boss', BOSS_THEME); }

export function setMusicEnabled(enabled){
  if(enabled && activeTheme) startScheduler(activeTheme);
  else if(!enabled) stopScheduler();
}

// For tests/debugging only — harmless to ship, mirrors window.__sotl.
export function getActiveThemeKey(){ return activeThemeKey; }
