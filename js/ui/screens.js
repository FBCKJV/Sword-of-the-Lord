import { state } from '../core/state.js';
import { dom, initialsInputs } from '../core/dom.js';
import { ensurePlan, drawVerse, drawBossVerse } from '../core/round-plan.js';
import { IMAGES } from '../data/images.js';
import { DEMONS } from '../data/demons.js';
import { DIFFICULTIES, getDifficulty } from '../data/difficulty.js';
import { saveBest, saveHintEnabled, saveSoundEnabled, saveDifficulty } from './settings.js';
import { recordLevelComplete, recordBestScore, queueBadgeToasts, renderBadgesGrid } from './badges.js';
import { recordVersePlay, isMastered, masteredCount } from './mastery.js';
import { playLevelComplete, playGameOver, unlockAudio } from './sound.js';
import { submitScore, fetchTopScores, qualifiesForBoard } from '../firebase/leaderboard.js';

// Set once by main.js (setLoopFn) instead of importing core/loop.js directly —
// loop.js sits downstream of update.js/input.js, which both lead back here,
// so a static import would create a module cycle.
let loopFn = null;
export function setLoopFn(fn){ loopFn = fn; }

function startLoop(){
  state.running = true;
  state.last = performance.now();
  if(state.raf) cancelAnimationFrame(state.raf);
  state.raf = requestAnimationFrame(loopFn);
}

export function renderShields(){
  dom.shieldsEl.innerHTML = '';
  for(let i=0;i<3;i++){
    const d = document.createElement('div');
    d.className = 'shield' + (i >= state.lives ? ' lost' : '');
    dom.shieldsEl.appendChild(d);
  }
  if(state.graceShield){
    const g = document.createElement('div');
    g.className = 'shield grace';
    dom.shieldsEl.appendChild(g);
  }
}

// ---------- Hint strip visibility ----------
// The strip's presence is the difference between reading and remembering.
// Difficulty decides how long you get to read; scoring rewards remembering.
function stripModeForBattle(){
  if(!state.hintEnabled) return 'off';
  return getDifficulty(state.difficulty).hintMode;
}

function showStripForBattle(){
  const mode = stripModeForBattle();
  dom.verseStrip.classList.remove('fading');
  if(mode === 'always' || mode === 'fadeHalf'){
    dom.verseStrip.classList.remove('hidden');
    state.stripVisible = true;
    state.stripEverVisible = true;
  } else {
    dom.verseStrip.classList.add('hidden');
    state.stripVisible = false;
  }
}

export function fadeStripOut(){
  if(!state.stripVisible) return;
  dom.verseStrip.classList.add('fading');
  state.stripVisible = false;
}

export function updateStrip(){
  dom.stripRef.textContent = state.currentVerse.ref;
  dom.stripWords.innerHTML = state.words.map((w,i)=>{
    let cls = 'w ';
    if(i < state.targetIdx) cls += 'done';
    else if(i === state.targetIdx) cls += 'now';
    else cls += 'upcoming';
    return `<span class="${cls}">${w}</span>`;
  }).join(' ');

  if(stripModeForBattle() === 'fadeHalf' &&
     state.targetIdx >= Math.ceil(state.words.length/2)){
    fadeStripOut();
  }
}

function levelParams(effTier){
  return {
    fallSpeed: 80 + effTier*16,
    decoyInterval: Math.max(0.5, 1.75 - effTier*0.17),
    spawnGap: Math.max(0.22, 0.62 - effTier*0.05)
  };
}

export function togglePause(force){
  if(state.phase !== 'battle' && force !== false) return;
  state.paused = (force !== undefined) ? force : !state.paused;
  dom.pauseScreen.classList.toggle('hidden', !state.paused);
}

export function quitToMenu(){
  // Only a death clears a run. Pausing out to the menu just stops
  // rendering — Continue picks the same level/verse/score back up.
  state.running = false;
  if(state.raf) cancelAnimationFrame(state.raf);
  dom.pauseScreen.classList.add('hidden');
  dom.verseStrip.classList.add('hidden');
  dom.pauseBtn.classList.remove('show');
  dom.levelScreen.classList.add('hidden');
  dom.endScreen.classList.add('hidden');
  dom.continueBtn.classList.toggle('hidden', !state.hasActiveRun);
  dom.startScreen.classList.remove('hidden');
  renderBadgesGrid(dom);
}

export function resumeRun(){
  dom.startScreen.classList.add('hidden');
  dom.pauseBtn.classList.add('show');
  if(state.stripVisible) dom.verseStrip.classList.remove('hidden');
  state.paused = false;
  startLoop();
}

export function startGame(){
  unlockAudio();
  state.levelIdx = 0; state.score = 0; state.lives = 3;
  state.tierDecks = {}; state.bossDeck = []; state.levelPlan = [];
  state.graceShield = false;
  state.hasActiveRun = true;
  dom.startScreen.classList.add('hidden');
  dom.endScreen.classList.add('hidden');
  dom.scoreVal.textContent = '0';
  renderShields();
  beginLevel();
}

export function beginLevel(){
  const diff = getDifficulty(state.difficulty);
  state.phase = 'countdown';
  state.particles = []; state.decoys = []; state.verseTiles = [];
  state.powerups = []; state.popups = [];
  state.fog = null; state.bossPhase2 = false;
  state.timeScale = 1; state.selahTimer = 0; state.hitStop = 0;
  state.castTelegraph = 0; state.pendingCast = null;
  state.levelPerfect = true;
  state.stripEverVisible = false;
  state.bannerText = null; state.bannerSub = null; state.bannerTimer = 0;
  ensurePlan(state.levelIdx);
  state.currentEntry = state.levelPlan[state.levelIdx];
  const roundIdx = Math.floor(state.levelIdx / (DEMONS.length+1));

  if(state.currentEntry.type === 'boss'){
    state.currentVerse = drawBossVerse();
    state.devil.isBoss = true;
    state.devil.key = 'satan';
    state.devil.scale = 1.15 + roundIdx*0.08;
    dom.levelEyebrow.innerHTML = '<span class="boss-tag">Final Boss — Round ' + (roundIdx+1) + '</span>';
    dom.demonName.textContent = 'SATAN';
    dom.demonName.style.color = 'var(--hell-bright)';
  } else {
    state.currentVerse = drawVerse(state.currentEntry.tier);
    state.devil.isBoss = false;
    state.devil.key = state.currentEntry.demonKey;
    state.devil.scale = 1 + roundIdx*0.06;
    dom.levelEyebrow.textContent = 'Level ' + (state.levelIdx+1) + (roundIdx>0 ? ' · Round '+(roundIdx+1) : '');
    dom.demonName.textContent = state.currentEntry.demonName;
    dom.demonName.style.color = '';
  }

  dom.demonPortrait.src = IMAGES[state.devil.key + '_laughing'].src;

  state.words = state.currentVerse.text.split(/\s+/);
  state.targetIdx = 0;
  const p = levelParams(state.currentEntry.type==='boss' ? 4 + roundIdx*0.5 : state.currentEntry.tier);
  state.fallSpeed = p.fallSpeed * diff.speedMult;
  state.decoyInterval = p.decoyInterval;
  state.nextChainIn = 0.4;
  state.nextDecoyIn = state.decoyInterval * (0.6 + Math.random()*0.6);
  state.devil.dying = 0;

  // Demon offense + mercy rolls for this verse
  const [cdA, cdB] = diff.demonAttackCooldown;
  state.demonAttackIn = cdA * (0.8 + Math.random()*0.4);
  state.mercySpawnedThisVerse = false;
  state.selahSpawnedThisVerse = false;
  const midWord = (lo, hi) => lo + Math.floor(Math.random() * Math.max(1, hi - lo));
  state.mercyAt = Math.random() < diff.mercyChance
    ? midWord(Math.floor(state.words.length*0.25), Math.floor(state.words.length*0.75)) : -1;
  state.selahAt = Math.random() < diff.selahChance
    ? midWord(Math.floor(state.words.length*0.3), Math.floor(state.words.length*0.8)) : -1;

  dom.levelRef.textContent = state.currentVerse.ref;
  dom.levelVerse.textContent = '"' + state.currentVerse.text + '"';
  const mastered = isMastered(state.currentVerse.ref);
  dom.levelCount.innerHTML = state.words.length + ' words · find them in order'
    + (mastered ? ' · <span class="mastered-tag">✦ mastered</span>' : '');
  dom.verseStrip.classList.add('hidden');
  dom.levelScreen.classList.remove('hidden');
  dom.endScreen.classList.add('hidden');

  let c = 3;
  dom.countdownVal.textContent = c;
  const iv = setInterval(()=>{
    c -= 1;
    if(c <= 0){
      clearInterval(iv);
      dom.levelScreen.classList.add('hidden');
      updateStrip();
      showStripForBattle();
      dom.pauseBtn.classList.add('show');
      state.phase = 'battle';
      state.nextChainIn = 0.4;
      startLoop();
    } else {
      dom.countdownVal.textContent = c;
    }
  }, 650);
}

export function levelComplete(){
  state.phase = 'levelDone'; state.running = false;
  if(state.raf) cancelAnimationFrame(state.raf);
  state.devil.dying = 1;
  state.bannerText = null; state.bannerSub = null; // default: IT IS WRITTEN
  state.bannerTimer = 1.6;
  playLevelComplete();
  const isBoss = state.currentEntry.type === 'boss';
  const diff = getDifficulty(state.difficulty);
  state.score += Math.round((isBoss ? 150 : 50) * diff.scoreMult);
  dom.scoreVal.textContent = Math.floor(state.score);

  const hintless = !state.stripEverVisible;
  recordVersePlay(state.currentVerse.ref, { perfect: state.levelPerfect, hintless });
  queueBadgeToasts(recordLevelComplete({
    isBoss,
    perfect: state.levelPerfect,
    hintOff: hintless,
    versesMastered: masteredCount()
  }), dom);

  // A flawless verse arms a golden grace shield for the next battle.
  if(state.levelPerfect && !state.graceShield){
    state.graceShield = true;
    renderShields();
  }

  setTimeout(()=>{ state.levelIdx++; beginLevel(); }, 1700);
  startLoop();
}

export async function endGame(){
  state.running = false; state.phase = 'gameover';
  state.hasActiveRun = false;
  if(state.raf) cancelAnimationFrame(state.raf);
  playGameOver();
  if(state.score > state.best){
    state.best = state.score;
    saveBest(state.best);
  }
  queueBadgeToasts(recordBestScore(state.score), dom);
  dom.finalScoreEl.textContent = Math.floor(state.score);
  dom.bestLineEl.textContent = 'Best score: ' + Math.floor(state.best);
  dom.endRef.textContent = state.currentVerse.ref + ' — "' + state.currentVerse.text + '"';
  dom.endEyebrow.textContent = 'Shield Broken';
  dom.verseStrip.classList.add('hidden');
  dom.pauseBtn.classList.remove('show');
  dom.pauseScreen.classList.add('hidden');
  state.paused = false;
  dom.endScreen.classList.remove('hidden');

  const top = await fetchTopScores();
  const qualifies = qualifiesForBoard(Math.floor(state.score), top);
  if(dom.initialsPrompt) dom.initialsPrompt.classList.toggle('hidden', !qualifies);
}

export async function submitInitialsAndShowBoard(){
  const initials = initialsInputs().map(i => i.value || '-').join('');
  await submitScore(initials, Math.floor(state.score));
  if(dom.initialsPrompt) dom.initialsPrompt.classList.add('hidden');
  await showLeaderboard();
}

export async function showLeaderboard(){
  const top = await fetchTopScores();
  dom.leaderboardList.innerHTML = top.length
    ? top.map((e,i)=>`<li><span class="rank">${i+1}.</span><span class="name">${e.initials}</span><span class="pts">${e.score}</span></li>`).join('')
    : '<li class="leaderboard-note">No scores yet — be the first!</li>';
  dom.startScreen.classList.add('hidden');
  dom.endScreen.classList.add('hidden');
  dom.leaderboardScreen.classList.remove('hidden');
}

export function hideLeaderboard(){
  dom.leaderboardScreen.classList.add('hidden');
  if(state.phase === 'gameover') dom.endScreen.classList.remove('hidden');
  else dom.startScreen.classList.remove('hidden');
}

function renderDifficultyUI(){
  if(!dom.difficultyRow) return;
  dom.difficultyRow.innerHTML = '';
  Object.values(DIFFICULTIES).forEach(d=>{
    const btn = document.createElement('button');
    btn.className = 'diff-btn' + (state.difficulty === d.key ? ' active' : '');
    btn.innerHTML = `<span class="diff-label">${d.label}</span><span class="diff-tag">${d.tagline}</span>`;
    btn.addEventListener('click', ()=>{
      state.difficulty = d.key;
      saveDifficulty(d.key);
      renderDifficultyUI();
    });
    dom.difficultyRow.appendChild(btn);
  });
}

export function initSettingsUI(){
  dom.hintToggleBtn.textContent = state.hintEnabled ? 'On' : 'Off';
  dom.hintToggleBtn.classList.toggle('off', !state.hintEnabled);
  dom.hintToggleBtn.addEventListener('click', ()=>{
    state.hintEnabled = !state.hintEnabled;
    dom.hintToggleBtn.textContent = state.hintEnabled ? 'On' : 'Off';
    dom.hintToggleBtn.classList.toggle('off', !state.hintEnabled);
    saveHintEnabled(state.hintEnabled);
  });

  if(dom.soundToggleBtn){
    dom.soundToggleBtn.textContent = state.soundEnabled ? 'On' : 'Off';
    dom.soundToggleBtn.classList.toggle('off', !state.soundEnabled);
    dom.soundToggleBtn.addEventListener('click', ()=>{
      state.soundEnabled = !state.soundEnabled;
      dom.soundToggleBtn.textContent = state.soundEnabled ? 'On' : 'Off';
      dom.soundToggleBtn.classList.toggle('off', !state.soundEnabled);
      saveSoundEnabled(state.soundEnabled);
      if(state.soundEnabled) unlockAudio();
    });
  }

  renderDifficultyUI();
}

dom.pauseBtn.addEventListener('click', ()=>togglePause());
dom.resumeBtn.addEventListener('click', ()=>togglePause(false));
dom.quitBtn.addEventListener('click', quitToMenu);
dom.startBtn.addEventListener('click', startGame);
dom.retryBtn.addEventListener('click', startGame);
dom.continueBtn.addEventListener('click', resumeRun);
if(dom.leaderboardBtn) dom.leaderboardBtn.addEventListener('click', showLeaderboard);
if(dom.leaderboardBtnEnd) dom.leaderboardBtnEnd.addEventListener('click', showLeaderboard);
if(dom.initialsSubmitBtn) dom.initialsSubmitBtn.addEventListener('click', submitInitialsAndShowBoard);

window.addEventListener('keydown', (e)=>{
  if(e.key === 'p' || e.key === 'P' || e.key === 'Escape'){
    if(state.phase === 'battle') togglePause();
  }
});

initialsInputs().forEach((input, i, all)=>{
  input.addEventListener('input', ()=>{
    input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    if(input.value && all[i+1]) all[i+1].focus();
  });
});
