import { state } from './state.js';
import { H, W, dom } from './dom.js';
import { spawnVerseWord, spawnDecoy, spawnPowerup } from './spawn.js';
import { missedTile } from './input.js';
import { burst, showBanner } from './fx.js';
import { getDifficulty } from '../data/difficulty.js';
import { playDemonCast } from '../ui/sound.js';

function updateBattle(dt){
  const s = state;
  const diff = getDifficulty(s.difficulty);

  // Selah slow-time affects everything the demon throws at you, but not
  // your own feedback timers.
  if(s.selahTimer > 0){
    s.selahTimer -= dt;
    if(s.selahTimer <= 0) s.timeScale = 1;
  }
  const bdt = dt * s.timeScale;

  // Signature timers: Hellhound prowl speeds the whole sky up briefly;
  // the Dervish's veil hides color tells (checked by drawTile).
  if(s.prowlTimer > 0) s.prowlTimer -= bdt;
  if(s.shadowVeil > 0) s.shadowVeil -= bdt;
  const prowl = s.prowlTimer > 0 ? 1.35 : 1;

  // --- Verse word chain: keep up to chainSize words cascading in order ---
  const nextToSpawn = s.targetIdx + s.verseTiles.length;
  if(s.verseTiles.length < diff.chainSize && nextToSpawn < s.words.length){
    s.nextChainIn -= bdt;
    if(s.nextChainIn <= 0){
      spawnVerseWord(nextToSpawn);
      s.nextChainIn = diff.chainGap;
    }
  }
  s.verseTiles.forEach(t => { t.y += s.fallSpeed * prowl * bdt; });
  if(s.verseTiles.length && s.verseTiles[0].y > H + 40){
    missedTile(s.verseTiles[0]);
  }

  // --- Decoys ---
  s.nextDecoyIn -= bdt;
  if(s.nextDecoyIn <= 0){
    spawnDecoy();
    s.nextDecoyIn = (s.decoyInterval / diff.decoyRateMult) * (0.7 + Math.random()*0.6);
  }
  s.decoys.forEach(d => { d.y += s.fallSpeed * 0.92 * prowl * (d.speedMult || 1) * bdt; });
  s.decoys = s.decoys.filter(d => d.y < H + 40 && !d.dead);

  // --- Mercy tiles (fall slower so they're catchable) ---
  s.powerups.forEach(p => { p.y += s.fallSpeed * 0.6 * bdt; });
  s.powerups = s.powerups.filter(p => p.y < H + 40 && !p.dead);
  maybeSpawnMercy(diff);

  // --- Demon attacks ---
  updateDemonAttack(bdt, diff);

  // --- Satan enrage at the halfway word ---
  if(s.currentEntry && s.currentEntry.type === 'boss' && !s.bossPhase2 &&
     s.targetIdx >= Math.ceil(s.words.length / 2)){
    s.bossPhase2 = true;
    s.fallSpeed *= 1.15;
    // Satan snatches the hint away — from here on you fight from memory.
    dom.verseStrip.classList.add('fading');
    s.stripVisible = false;
    showBanner('THE ACCUSER RAGES', 'his chaff wears the words of the verse', 2);
    s.devil.shakeAmt = 2;
    burst(W/2, s.devil.y0, '#ff6b35', 30);
    playDemonCast();
  }
}

// A dove only ever appears when you're already wounded, and each verse rolls
// its chance once. Selah is an independent roll. Trigger points were chosen
// at beginLevel; here we just watch for the verse to reach them.
function maybeSpawnMercy(diff){
  const s = state;
  if(s.mercyAt >= 0 && !s.mercySpawnedThisVerse && s.targetIdx >= s.mercyAt && s.lives < 3){
    s.mercySpawnedThisVerse = true;
    spawnPowerup('dove');
  }
  if(s.selahAt >= 0 && !s.selahSpawnedThisVerse && s.targetIdx >= s.selahAt){
    s.selahSpawnedThisVerse = true;
    spawnPowerup('selah');
  }
}

function updateDemonAttack(bdt, diff){
  const s = state;
  if(s.devil.dying > 0) return;

  if(s.castTelegraph > 0){
    s.castTelegraph -= bdt;
    if(s.castTelegraph <= 0) fireCast(s.pendingCast);
    return;
  }

  s.demonAttackIn -= bdt;
  if(s.demonAttackIn <= 0){
    let kind;
    if(s.currentEntry && s.currentEntry.type === 'demon' && s.currentEntry.signature){
      // Each demon's trademark move overrides the generic difficulty cast —
      // this is what makes a Wraith fight feel different from a Hellhound's.
      kind = s.currentEntry.signature;
      // The veil hides the gold tell; Valiant already has none, so the
      // Dervish reaches for fog there instead.
      if(kind === 'veil' && diff.camouflage) kind = 'fog';
    } else {
      const kinds = diff.demonAttackKinds;
      kind = kinds[Math.floor(Math.random()*kinds.length)];
    }
    // Fog needs somewhere to matter — skip it on very short verses.
    if(kind === 'fog' && s.words.length < 6) kind = 'chaffBurst';
    s.pendingCast = kind;
    s.castTelegraph = 0.7; // wind-up: demon glows so the player can brace
    playDemonCast();
    const [a, b] = diff.demonAttackCooldown;
    s.demonAttackIn = a + Math.random()*(b - a);
  }

  if(s.fog){
    s.fog.x += s.fog.vx * bdt;
    s.fog.timer -= bdt;
    if(s.fog.timer < 1) s.fog.alpha = Math.max(0, s.fog.timer);
    if(s.fog.timer <= 0) s.fog = null;
  }
}

function fireCast(kind){
  const s = state;
  s.pendingCast = null;
  if(kind === 'chaffBurst'){
    spawnDecoy(); spawnDecoy();
    if(s.difficulty === 'valiant') spawnDecoy();
  } else if(kind === 'pairs'){
    // Bone Guard: the burst comes doubled.
    spawnDecoy(); spawnDecoy(); spawnDecoy(); spawnDecoy();
  } else if(kind === 'flurry'){
    // Blade Fiend: fewer, but they cut down the screen fast.
    spawnDecoy(1.3); spawnDecoy(1.3); spawnDecoy(1.3);
  } else if(kind === 'prowl'){
    s.prowlTimer = 3.5;
    showBanner('THE HOUND PROWLS', 'all things fall faster', 1.4);
  } else if(kind === 'veil'){
    s.shadowVeil = 4;
    showBanner('SHADOW VEIL', 'the gold light is hidden', 1.4);
  } else if(kind === 'fog'){
    const w = 200 + Math.random()*80;
    s.fog = {
      x: Math.random() < 0.5 ? -w : W,
      w,
      vx: (Math.random() < 0.5 ? 1 : -1) * (30 + Math.random()*20),
      alpha: 1,
      timer: s.difficulty === 'easy' ? 4 : 6
    };
    if(s.fog.x < 0) s.fog.vx = Math.abs(s.fog.vx);
    else s.fog.vx = -Math.abs(s.fog.vx);
  }
}

export function update(dt){
  const s = state;

  // Hit-stop: a few frames of frozen action on combo milestones makes the
  // strike land. Feedback timers below still run so it never feels stuck.
  if(s.hitStop > 0){
    s.hitStop -= dt;
  } else if(s.phase === 'battle'){
    updateBattle(dt);
  }

  s.devil.bobPhase += dt*1.6;
  if(s.devil.hitFlash>0) s.devil.hitFlash -= dt*2.2;
  if(s.devil.shakeAmt>0) s.devil.shakeAmt -= dt*4;
  if(s.devil.dying>0) s.devil.dying = Math.max(0, s.devil.dying - dt*0.7);

  if(s.sword.swingTimer>0){ s.sword.swingTimer -= dt*4; }
  if(s.slashFx.active){
    s.slashFx.t += dt;
    if(s.slashFx.t >= s.slashFx.dur) s.slashFx.active = false;
  }
  if(s.flashTimer>0) s.flashTimer -= dt*2.2;
  if(s.shake>0) s.shake -= dt*3;
  if(s.bannerTimer>0) s.bannerTimer -= dt;
  if(s.comboFlash>0) s.comboFlash -= dt*2;

  s.particles.forEach(p=>{ p.x+=p.vx*dt; p.y+=p.vy*dt; p.life -= dt*1.5; p.vy += 160*dt; });
  s.particles = s.particles.filter(p=>p.life>0);

  s.popups.forEach(p=>{ p.y -= 34*dt; p.life -= dt*0.9; });
  s.popups = s.popups.filter(p=>p.life>0);
}
