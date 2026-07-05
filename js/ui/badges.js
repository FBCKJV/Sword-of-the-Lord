import { playBadgeUnlock } from './sound.js';

const STATS_KEY = 'sotl_stats';
const EARNED_KEY = 'sotl_badges_earned';

export const BADGES = [
  { id:'first-strike', name:'First Strike', icon:'first-strike.svg',
    desc:'Land your first true hit on a demon.',
    check: s => s.correctHits >= 1 },
  { id:'verse-keeper', name:'Verse Keeper', icon:'verse-keeper.svg',
    desc:'Complete your first verse.',
    check: s => s.levelsCompleted >= 1 },
  { id:'giant-slayer', name:'Giant Slayer', icon:'giant-slayer.svg',
    desc:'Defeat Satan in battle.',
    check: s => s.bossesDefeated >= 1 },
  { id:'full-armor', name:'Full Armor', icon:'full-armor.svg',
    desc:'Complete a verse without a single miss.',
    check: s => s.perfectVerses >= 1 },
  { id:'watchman', name:'Watchman', icon:'watchman.svg',
    desc:'Complete a verse with the hint hidden.',
    check: s => s.noHintCompletions >= 1 },
  { id:'sword-master', name:'Sword Master', icon:'sword-master.svg',
    desc:'Score 1,000 or more in a single run.',
    check: s => s.bestScore >= 1000 },
  { id:'overcomer', name:'Overcomer', icon:'overcomer.svg',
    desc:'Defeat Satan three times.',
    check: s => s.bossesDefeated >= 3 },
  { id:'steadfast', name:'Steadfast', icon:'steadfast.svg',
    desc:'Complete ten verses total.',
    check: s => s.levelsCompleted >= 10 }
];

function defaultStats(){
  return { correctHits:0, levelsCompleted:0, bossesDefeated:0, perfectVerses:0, noHintCompletions:0, bestScore:0 };
}

export function loadStats(){
  try {
    const raw = JSON.parse(localStorage.getItem(STATS_KEY));
    return raw ? { ...defaultStats(), ...raw } : defaultStats();
  } catch(e){ return defaultStats(); }
}

function saveStats(stats){
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch(e){}
}

function loadEarned(){
  try { return new Set(JSON.parse(localStorage.getItem(EARNED_KEY)) || []); }
  catch(e){ return new Set(); }
}
function saveEarned(set){
  try { localStorage.setItem(EARNED_KEY, JSON.stringify([...set])); } catch(e){}
}

let stats = loadStats();
let earned = loadEarned();

export function getEarnedIds(){ return earned; }

function evaluate(){
  const newlyEarned = [];
  BADGES.forEach(b=>{
    if(!earned.has(b.id) && b.check(stats)){
      earned.add(b.id);
      newlyEarned.push(b);
    }
  });
  if(newlyEarned.length) saveEarned(earned);
  return newlyEarned;
}

export function recordCorrectHit(){
  stats.correctHits++;
  saveStats(stats);
  return evaluate();
}

export function recordLevelComplete({ isBoss, perfect, hintOff }){
  stats.levelsCompleted++;
  if(isBoss) stats.bossesDefeated++;
  if(perfect) stats.perfectVerses++;
  if(hintOff) stats.noHintCompletions++;
  saveStats(stats);
  return evaluate();
}

export function recordBestScore(score){
  if(score > stats.bestScore){
    stats.bestScore = score;
    saveStats(stats);
  }
  return evaluate();
}

// ---------- UI ----------
let toastQueue = [];
let toastShowing = false;

export function queueBadgeToasts(badges, dom){
  if(!badges || !badges.length) return;
  toastQueue.push(...badges);
  if(!toastShowing) showNextToast(dom);
}

function showNextToast(dom){
  const badge = toastQueue.shift();
  if(!badge){ toastShowing = false; return; }
  toastShowing = true;
  if(!dom.badgeToast) { showNextToast(dom); return; }
  dom.badgeToast.innerHTML = `
    <img src="assets/badges/${badge.icon}" alt="">
    <div class="txt"><div class="lbl">Badge Earned</div><div class="name">${badge.name}</div></div>
  `;
  dom.badgeToast.classList.add('show');
  playBadgeUnlock();
  setTimeout(()=>{
    dom.badgeToast.classList.remove('show');
    setTimeout(()=> showNextToast(dom), 350);
  }, 2200);
}

export function renderBadgesGrid(dom){
  if(!dom.badgesGrid) return;
  dom.badgesGrid.innerHTML = BADGES.map(b=>{
    const isEarned = earned.has(b.id);
    return `
      <div class="badge-slot ${isEarned ? 'earned' : ''}" title="${isEarned ? b.desc : '???'}">
        <img src="assets/badges/${b.icon}" alt="">
        <div class="badge-label">${isEarned ? b.name : '???'}</div>
      </div>
    `;
  }).join('');
}
