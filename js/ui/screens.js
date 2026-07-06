import { state } from '../core/state.js';
import { dom, initialsInputs } from '../core/dom.js';
import { ensurePlan, drawVerse, drawBossVerse } from '../core/round-plan.js';
import { IMAGES } from '../data/images.js';
import { DEMONS } from '../data/demons.js';
import { DIFFICULTIES, getDifficulty } from '../data/difficulty.js';
import { saveBest, saveSoundEnabled, saveMusicEnabled, saveDifficulty, saveSeenIntro } from './settings.js';
import { recordLevelComplete, recordBestScore, queueBadgeToasts, renderBadgesGrid } from './badges.js';
import { recordVersePlay, isMastered, masteredCount } from './mastery.js';
import { playLevelComplete, playGameOver, playBossVictory, unlockAudio } from './sound.js';
import { playMenuTheme, playBattleTheme, playBossTheme, setMusicEnabled } from './music.js';
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
// The strip's presence is purely a function of difficulty now (no separate
// on/off toggle) — Easy gets a short timed peek, Standard and Valiant get
// none at all in battle. The pre-battle study screen still shows the full
// verse to everyone regardless.
let hintFadeTimer = null;

function showStripForBattle(){
  const diff = getDifficulty(state.difficulty);
  clearTimeout(hintFadeTimer);
  dom.verseStrip.classList.remove('fading');
  if(diff.hintMode === 'fadeQuick'){
    dom.verseStrip.classList.remove('hidden');
    state.stripVisible = true;
    state.stripEverVisible = true;
    hintFadeTimer = setTimeout(fadeStripOut, (diff.hintFadeSeconds || 5) * 1000);
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
}

function levelParams(effTier, roundIdx){
  // Chaff eases in over the first two tiers rather than hitting full density
  // immediately — new players (and now that Standard has no hint at all)
  // need the early rounds to actually teach the pattern before it ramps up.
  const earlyEase = effTier <= 2 ? 1.35 : 1;
  // The very first round (before Satan's been beaten even once) also gets
  // its own across-the-board ease on top of that — tier 3-4 verses are
  // long, and at full speed + full chaff that combination was overwhelming
  // for a first fight. From round 2 on this backs off entirely and the
  // tier-based ramp above is the only thing tuning difficulty, same as it
  // scaling up further with every subsequent boss kill.
  const roundEase = roundIdx === 0 ? { speed: 0.8, decoy: 1.3 } : { speed: 1, decoy: 1 };
  return {
    fallSpeed: (80 + effTier*16) * roundEase.speed,
    decoyInterval: Math.max(0.5, 1.75 - effTier*0.17) * earlyEase * roundEase.decoy,
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
  playMenuTheme();
}

export function resumeRun(){
  dom.startScreen.classList.add('hidden');
  dom.pauseBtn.classList.add('show');
  if(state.stripVisible) dom.verseStrip.classList.remove('hidden');
  state.paused = false;
  syncMusicToEntry();
  startLoop();
}

// Battle vs. boss theme, matching whatever fight is actually in progress —
// used on resume and at the top of every level so a boss encounter always
// gets its own music even mid-run.
function syncMusicToEntry(){
  if(state.currentEntry && state.currentEntry.type === 'boss') playBossTheme();
  else playBattleTheme();
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
  state.phase = 'study';
  state.particles = []; state.decoys = []; state.verseTiles = [];
  state.powerups = []; state.popups = [];
  state.fog = null; state.bossPhase2 = false;
  state.timeScale = 1; state.selahTimer = 0; state.hitStop = 0;
  state.castTelegraph = 0; state.pendingCast = null;
  state.levelPerfect = true;
  state.stripEverVisible = false;
  clearTimeout(hintFadeTimer);
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
  const p = levelParams(state.currentEntry.type==='boss' ? 4 + roundIdx*0.5 : state.currentEntry.tier, roundIdx);
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
  dom.endScreen.classList.add('hidden');

  beginStudy();
}

// ---------- Study phase: a long, skippable memorization window before the
// quick 3-2-1 reveal. Menu music keeps playing here regardless of what's
// coming — battle/boss music only kicks in once the countdown starts, so
// the calm-before-the-storm beat actually lands.
let studyIv = null;

function studyDurationFor(wordCount){
  return Math.max(10, Math.min(18, 8 + Math.round(wordCount * 0.7)));
}

function beginStudy(){
  if(studyIv){ clearInterval(studyIv); studyIv = null; }
  state.phase = 'study';
  playMenuTheme();

  dom.studyRef.textContent = state.currentVerse.ref;
  dom.studyVerse.textContent = '"' + state.currentVerse.text + '"';
  dom.studyFacing.textContent = state.currentEntry.type === 'boss'
    ? 'Satan approaches'
    : 'Facing: ' + state.currentEntry.demonName;
  dom.studyScreen.classList.remove('hidden');

  let remaining = studyDurationFor(state.words.length);
  dom.studyTimerVal.textContent = remaining;
  studyIv = setInterval(()=>{
    remaining -= 1;
    if(remaining <= 0){
      clearInterval(studyIv); studyIv = null;
      beginCountdown();
    } else {
      dom.studyTimerVal.textContent = remaining;
    }
  }, 1000);
}

function skipStudy(){
  if(state.phase !== 'study') return;
  if(studyIv){ clearInterval(studyIv); studyIv = null; }
  beginCountdown();
}
dom.studySkipBtn.addEventListener('click', skipStudy);

function beginCountdown(){
  state.phase = 'countdown';
  dom.studyScreen.classList.add('hidden');
  syncMusicToEntry();
  dom.levelScreen.classList.remove('hidden');

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
  const isBoss = state.currentEntry.type === 'boss';
  if(isBoss) playBossVictory(); else playLevelComplete();
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

  // Satan doesn't fall every round — that earns a real stop for a
  // celebration instead of auto-marching into the next round like an
  // ordinary demon kill does.
  if(isBoss) setTimeout(showVictoryScreen, 1700);
  else setTimeout(()=>{ state.levelIdx++; beginLevel(); }, 1700);
  startLoop();
}

function showVictoryScreen(){
  const roundIdx = Math.floor(state.levelIdx / (DEMONS.length+1));
  dom.victoryRef.textContent = state.currentVerse.ref;
  dom.victoryVerse.textContent = '"' + state.currentVerse.text + '"';
  dom.victoryScoreVal.textContent = Math.floor(state.score);
  dom.victoryRoundLine.textContent = 'Round ' + (roundIdx + 1) + ' overcome';
  dom.victoryScreen.classList.remove('hidden');
}

function continueAfterVictory(){
  dom.victoryScreen.classList.add('hidden');
  state.levelIdx++;
  beginLevel();
}
dom.victoryContinueBtn.addEventListener('click', continueAfterVictory);

export async function endGame(){
  state.running = false; state.phase = 'gameover';
  state.hasActiveRun = false;
  if(state.raf) cancelAnimationFrame(state.raf);
  playGameOver();
  playMenuTheme();
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

  const top = await fetchTopScores(state.difficulty);
  const qualifies = qualifiesForBoard(Math.floor(state.score), top);
  if(dom.initialsPrompt) dom.initialsPrompt.classList.toggle('hidden', !qualifies);
}

export async function submitInitialsAndShowBoard(){
  const initials = initialsInputs().map(i => i.value || '-').join('');
  await submitScore(initials, Math.floor(state.score), state.difficulty);
  if(dom.initialsPrompt) dom.initialsPrompt.classList.add('hidden');
  await showLeaderboard();
}

// A real network round trip (Firestore, or just a slow connection) can take
// a while with no visual feedback, which reads as "nothing happened." Worse:
// if the player starts a new run *while it's still pending*, the fetch used
// to land later and yank them out of an active battle with no way back in.
// The busy-button gives immediate feedback; the state.running check after
// the await drops the result entirely if a real game has started since.
function withLeaderboardLoading(btn, fn){
  return async () => {
    const originalText = btn ? btn.textContent : null;
    if(btn){ btn.disabled = true; btn.textContent = 'Loading…'; }
    try { await fn(); }
    finally { if(btn){ btn.disabled = false; btn.textContent = originalText; } }
  };
}

let lbDifficulty = 'standard';

function renderLeaderboardTabs(){
  if(!dom.leaderboardTabs) return;
  dom.leaderboardTabs.innerHTML = '';
  Object.values(DIFFICULTIES).forEach(d=>{
    const btn = document.createElement('button');
    btn.className = 'lb-tab' + (lbDifficulty === d.key ? ' active' : '');
    btn.textContent = d.label;
    btn.addEventListener('click', ()=> selectLeaderboardTab(d.key));
    dom.leaderboardTabs.appendChild(btn);
  });
}

function renderScoreList(top){
  dom.leaderboardList.innerHTML = top.length
    ? top.map((e,i)=>`<li><span class="rank">${i+1}.</span><span class="name">${e.initials}</span><span class="pts">${e.score}</span></li>`).join('')
    : '<li class="leaderboard-note">No scores yet — be the first!</li>';
}

async function selectLeaderboardTab(difficulty){
  if(lbDifficulty === difficulty) return;
  lbDifficulty = difficulty;
  renderLeaderboardTabs();
  dom.leaderboardList.innerHTML = '<li class="leaderboard-note">Loading…</li>';
  const top = await fetchTopScores(lbDifficulty);
  if(lbDifficulty !== difficulty) return; // a newer tab click superseded this fetch
  renderScoreList(top);
}

export async function showLeaderboard(){
  lbDifficulty = state.difficulty;
  const top = await fetchTopScores(lbDifficulty);
  if(state.running) return; // player has since started/resumed a real battle — don't barge in
  renderLeaderboardTabs();
  renderScoreList(top);
  dom.startScreen.classList.add('hidden');
  dom.endScreen.classList.add('hidden');
  dom.leaderboardScreen.classList.remove('hidden');
}

export function hideLeaderboard(){
  dom.leaderboardScreen.classList.add('hidden');
  // Defense in depth: if a battle is somehow running underneath (shouldn't
  // happen given the guard above, but never leave the player with no way
  // back into their game), resume it rather than falling through to a menu.
  if(state.running){
    if(state.paused) dom.pauseScreen.classList.remove('hidden');
    return;
  }
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

  if(dom.musicToggleBtn){
    dom.musicToggleBtn.textContent = state.musicEnabled ? 'On' : 'Off';
    dom.musicToggleBtn.classList.toggle('off', !state.musicEnabled);
    dom.musicToggleBtn.addEventListener('click', ()=>{
      state.musicEnabled = !state.musicEnabled;
      dom.musicToggleBtn.textContent = state.musicEnabled ? 'On' : 'Off';
      dom.musicToggleBtn.classList.toggle('off', !state.musicEnabled);
      saveMusicEnabled(state.musicEnabled);
      if(state.musicEnabled) unlockAudio();
      setMusicEnabled(state.musicEnabled);
    });
  }

  renderDifficultyUI();
}

export function showIntroModal(){
  if(dom.introModal) dom.introModal.classList.remove('hidden');
}
function hideIntroModal(){
  if(dom.introModal) dom.introModal.classList.add('hidden');
  saveSeenIntro();
}

dom.pauseBtn.addEventListener('click', ()=>togglePause());
dom.resumeBtn.addEventListener('click', ()=>togglePause(false));
dom.quitBtn.addEventListener('click', quitToMenu);
dom.startBtn.addEventListener('click', startGame);
dom.retryBtn.addEventListener('click', startGame);
dom.continueBtn.addEventListener('click', resumeRun);
if(dom.leaderboardBtn) dom.leaderboardBtn.addEventListener('click', withLeaderboardLoading(dom.leaderboardBtn, showLeaderboard));
if(dom.leaderboardBtnEnd) dom.leaderboardBtnEnd.addEventListener('click', withLeaderboardLoading(dom.leaderboardBtnEnd, showLeaderboard));
if(dom.leaderboardBackBtn) dom.leaderboardBackBtn.addEventListener('click', hideLeaderboard);
if(dom.howToPlayBtn) dom.howToPlayBtn.addEventListener('click', showIntroModal);
if(dom.introCloseBtn) dom.introCloseBtn.addEventListener('click', hideIntroModal);
if(dom.introOkBtn) dom.introOkBtn.addEventListener('click', hideIntroModal);
if(dom.initialsSubmitBtn) dom.initialsSubmitBtn.addEventListener('click', withLeaderboardLoading(dom.initialsSubmitBtn, submitInitialsAndShowBoard));

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
