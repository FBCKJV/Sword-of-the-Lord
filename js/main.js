import { state } from './core/state.js';
import { dom } from './core/dom.js';
import { drawBackground, drawSwordAndArm } from './core/draw.js';
import { loadImages } from './data/images.js';
import { loadSettings } from './ui/settings.js';
import { initSettingsUI, setLoopFn } from './ui/screens.js';
import { renderBadgesGrid } from './ui/badges.js';
import { loop } from './core/loop.js';
import './core/input.js'; // attaches pointerdown listener

const settings = loadSettings();
state.hintEnabled = settings.hintEnabled;
state.soundEnabled = settings.soundEnabled;
state.best = settings.best;

setLoopFn(loop);
initSettingsUI();
renderBadgesGrid(dom);

// Exposed for manual/automated testing from the browser console — this is a
// single-player local game, so read/write access to state carries no risk.
window.__sotl = { state, dom };

drawBackground();
drawSwordAndArm();

loadImages().then(()=>{
  dom.loadScreen.classList.add('hidden');
  dom.startScreen.classList.remove('hidden');
});

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      reg.addEventListener('updatefound', ()=>{
        const fresh = reg.installing;
        if(!fresh) return;
        fresh.addEventListener('statechange', ()=>{
          if(fresh.state === 'installed' && navigator.serviceWorker.controller){
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
      });
    });
  });
}
