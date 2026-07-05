const KEYS = {
  hint: 'sotl_hint_enabled',
  sound: 'sotl_sound_enabled',
  best: 'sotl_best'
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
    hintEnabled: readBool(KEYS.hint, true),
    soundEnabled: readBool(KEYS.sound, true),
    best: (() => {
      try { return parseInt(localStorage.getItem(KEYS.best) || '0', 10) || 0; }
      catch(e){ return 0; }
    })()
  };
}

export function saveHintEnabled(val){ writeBool(KEYS.hint, val); }
export function saveSoundEnabled(val){ writeBool(KEYS.sound, val); }
export function saveBest(val){
  try { localStorage.setItem(KEYS.best, String(val)); } catch(e){}
}
