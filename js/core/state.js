import { H } from './dom.js';

export const state = {
  running: false, raf: null, last: 0,
  levelIdx: 0, score: 0, lives: 3,
  words: [], targetIdx: 0,

  // Verse words currently in flight, oldest (= current target) first.
  // Invariant: verseTiles[0].wordIdx === targetIdx.
  verseTiles: [],
  nextChainIn: 0,       // countdown to spawning the next chained word
  decoys: [],
  powerups: [],         // falling mercy tiles: {x,y,w,h,kind:'dove'|'selah'}
  particles: [],
  popups: [],           // floating score text: {x,y,text,life,color,size}

  spawnDelay: 0,
  nextDecoyIn: 1.2,
  fallSpeed: 90,
  decoyInterval: 1.6,
  timeScale: 1,         // Selah slow-time: battle movement multiplier
  selahTimer: 0,
  hitStop: 0,           // brief freeze after milestone hits

  flashTimer: 0, flashColor: null,
  shake: 0,
  currentEntry: null,
  currentVerse: null,
  devil: { y0: 320, bobPhase:0, hitFlash:0, shakeAmt:0, dying:0, scale:1, isBoss:false, key:'flameimp' },

  // Demon offensive: countdown to next cast, telegraph timer, active fog band
  demonAttackIn: 8,
  castTelegraph: 0,     // >0 while the demon winds up (glows) before a cast
  pendingCast: null,    // which attack fires when the telegraph ends
  fog: null,            // {x, w, alpha, vx, timer} drifting band that hides tiles
  bossPhase2: false,    // Satan enrage state (triggered at half verse)
  prowlTimer: 0,        // Hellhound signature: everything falls faster while > 0
  shadowVeil: 0,        // Shadow Dervish signature: tiles lose color tells while > 0

  sword: { swingTimer:0 },
  slashFx: { active:false, t:0, dur:0.3, dir:1, y:H-160 },
  bannerTimer: 0,
  bannerText: null,     // override text for the mid-screen banner
  bannerSub: null,
  phase: 'idle',
  musicEnabled: true,
  soundEnabled: true,
  stripVisible: false,  // whether the hint strip is actually showing right now
  difficulty: 'standard',
  runDifficulty: 'standard', // locked at Draw the Sword — the picker can't retag a live run
  paused: false,
  combo: 0,
  comboFlash: 0,        // milestone pulse timer for the combo meter
  hasActiveRun: false,
  pendingVictoryContinue: false,
  pendingRestore: null, // run checkpoint loaded from storage, consumed by Continue
  levelPerfect: true,
  graceShield: false,   // one-hit shield earned by a perfect verse
  mercySpawnedThisVerse: false,
  selahSpawnedThisVerse: false,
  best: 0,
  usedVerseRefs: new Set(),
  levelPlan: []
};
