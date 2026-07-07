import { state } from './core/state.js';
import { dom } from './core/dom.js';
import { drawBackground, drawSwordAndArm } from './core/draw.js';
import { loadImages } from './data/images.js';
import { loadSettings, hasSeenIntro } from './ui/settings.js';
import { initSettingsUI, setLoopFn, showIntroModal } from './ui/screens.js';
import { renderBadgesGrid } from './ui/badges.js';
import { unlockAudio } from './ui/sound.js';
import { playMenuTheme } from './ui/music.js';
import { loop } from './core/loop.js';
import './core/input.js'; // attaches pointerdown listener

const settings = loadSettings();
state.soundEnabled = settings.soundEnabled;
state.musicEnabled = settings.musicEnabled;
state.best = settings.best;
state.difficulty = settings.difficulty;

setLoopFn(loop);
initSettingsUI();
renderBadgesGrid(dom);

// Exposed for manual/automated testing from the browser console — this is a
// single-player local game, so read/write access to state carries no risk.
window.__sotl = { state, dom };

drawBackground();
drawSwordAndArm();

// Old-cartridge-style splash: hold the title screen for a fixed stretch
// (running in parallel with real asset loading, whichever takes longer)
// before revealing the main menu.
const SPLASH_MS = 10000;

Promise.all([
  loadImages(),
  new Promise(resolve => setTimeout(resolve, SPLASH_MS))
]).then(()=>{
  dom.loadScreen.classList.add('hidden');
  dom.startScreen.classList.remove('hidden');
  if(!hasSeenIntro()) showIntroModal();
});

// Autoplay policy requires a real user gesture before any audio can play —
// the menu theme starts on whichever tap/click reaches the page first
// (a settings toggle, a difficulty pick, or Draw the Sword itself).
window.addEventListener('pointerdown', () => {
  unlockAudio();
  playMenuTheme();
}, { once: true });

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      // reg.waiting is only ever populated when an existing active worker is
      // being superseded — a genuinely fresh install has no prior worker to
      // wait behind, so it skips straight to activating. Checking `waiting`
      // (rather than navigator.serviceWorker.controller, which can be flaky
      // around first-install timing) is what actually distinguishes "there's
      // a real update sitting here" from "this is just the first install."
      if(reg.waiting) dom.updateBanner.classList.add('show');

      reg.addEventListener('updatefound', ()=>{
        const fresh = reg.installing;
        if(!fresh) return;
        fresh.addEventListener('statechange', ()=>{
          if(fresh.state === 'installed' && reg.waiting){
            dom.updateBanner.classList.add('show');
          }
        });
      });
    }).catch(err=>{
      console.warn('[sword-of-the-lord] Service worker registration failed:', err);
    });

    // clients.claim() in sw.js fires 'controllerchange' even on the very
    // first page load (no prior controller -> new controller), not just on
    // genuine updates. Only reload once the user has actually accepted an
    // update via the banner — otherwise every fresh visit would reload itself.
    let updateAccepted = false;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{
      if(!updateAccepted || refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    dom.updateReloadBtn.addEventListener('click', ()=>{
      updateAccepted = true;
      navigator.serviceWorker.getRegistration().then(reg=>{
        if(reg && reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
        // No waiting worker (already activated on its own, or nothing to
        // do) — reload directly instead of leaving the button inert.
        else window.location.reload();
      });
    });
  });
}
