const KEYS = {
  sound: 'sotl_sound_enabled',
  music: 'sotl_music_enabled',
  best: 'sotl_best',
  difficulty: 'sotl_difficulty',
  seenIntro: 'sotl_seen_intro',
  run: 'sotl_run'
};

function readBool(key, fallback){
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch(e){ return fallback; }
}
function writeBool(key, val){
  try { localStorage.setItem(key, val ? '1' : '0'); } catch(e){}
}

export function loadSettings(){
  return {
    soundEnabled: readBool(KEYS.sound, true),
    musicEnabled: readBool(KEYS.music, true),
    best: (() => {
      try { return parseInt(localStorage.getItem(KEYS.best) || '0', 10) || 0; }
      catch(e){ return 0; }
    })(),
    difficulty: (() => {
      try { return localStorage.getItem(KEYS.difficulty) || 'standard'; }
      catch(e){ return 'standard'; }
    })()
  };
}

export function saveSoundEnabled(val){ writeBool(KEYS.sound, val); }
export function saveMusicEnabled(val){ writeBool(KEYS.music, val); }
export function saveBest(val){
  try { localStorage.setItem(KEYS.best, String(val)); } catch(e){}
}
export function saveDifficulty(key){
  try { localStorage.setItem(KEYS.difficulty, key); } catch(e){}
}

export function hasSeenIntro(){ return readBool(KEYS.seenIntro, false); }
export function saveSeenIntro(){ writeBool(KEYS.seenIntro, true); }

// Run checkpoint: enough to resume at the start of the level the player was
// on, even after the OS kills the tab. Written at every level start,
// cleared on death or victory.
export function saveRun(run){
  try { localStorage.setItem(KEYS.run, JSON.stringify(run)); } catch(e){}
}
export function loadRun(){
  try {
    const run = JSON.parse(localStorage.getItem(KEYS.run));
    // Sanity-check the shape so a corrupt blob can't wedge the Continue path.
    if(run && typeof run.levelIdx === 'number' && Array.isArray(run.levelPlan) && run.levelPlan.length > run.levelIdx){
      return run;
    }
    return null;
  } catch(e){ return null; }
}
export function clearRun(){
  try { localStorage.removeItem(KEYS.run); } catch(e){}
}
