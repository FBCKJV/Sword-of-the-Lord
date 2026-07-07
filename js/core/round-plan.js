import { state } from './state.js';
import { VERSE_TIERS, BOSS_LADDER } from '../data/verses.js';
import { DEMONS } from '../data/demons.js';

// The campaign: five rounds of six demons + Satan, then the game is won.
export const TOTAL_ROUNDS = 5;
export const LEVELS_PER_ROUND = DEMONS.length + 1;
export const TOTAL_LEVELS = TOTAL_ROUNDS * LEVELS_PER_ROUND;

export function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// One flat pool with computed word counts — a verse's difficulty IS its
// length, so round selection keys off word count directly instead of the
// old static tier lists (which let 2-word verses surface in late rounds).
const ALL_VERSES = Object.values(VERSE_TIERS).flat()
  .map(v => ({ ...v, wc: v.text.split(/\s+/).length }));

// Word-count window per round. Adjacent windows overlap on purpose: two
// runs draw different 6-verse subsets from 11-13 candidates, so early
// rounds stop feeling identical every run.
const ROUND_WINDOWS = [
  [2, 9],
  [8, 14],
  [12, 17],
  [15, 21],
  [18, 99]
];

// Six verses for one round: drawn from the round's window, skipping verses
// already fought this run when possible, sorted shortest-first so the round
// escalates internally toward its boss.
function versesForRound(roundIdx){
  const [lo, hi] = ROUND_WINDOWS[Math.min(roundIdx, ROUND_WINDOWS.length - 1)];
  const inWindow = ALL_VERSES.filter(v => v.wc >= lo && v.wc <= hi);
  let pool = inWindow.filter(v => !state.usedVerseRefs.has(v.ref));
  if(pool.length < DEMONS.length) pool = inWindow;
  const picks = shuffle(pool).slice(0, DEMONS.length).sort((a,b) => a.wc - b.wc);
  picks.forEach(v => state.usedVerseRefs.add(v.ref));
  return picks;
}

export function buildRound(roundIdx){
  const order = shuffle(DEMONS);
  const verses = versesForRound(roundIdx);
  order.forEach((d, i)=>{
    state.levelPlan.push({
      type:'demon', demonKey:d.key, demonName:d.name, signature:d.signature,
      tier: Math.min(4, d.tier + roundIdx),
      verse: verses[i]
    });
  });
  state.levelPlan.push({ type:'boss', verse: BOSS_LADDER[Math.min(roundIdx, BOSS_LADDER.length - 1)] });
}

export function ensurePlan(idx){
  while(state.levelPlan.length <= idx && state.levelPlan.length < TOTAL_LEVELS){
    buildRound(Math.floor(state.levelPlan.length / LEVELS_PER_ROUND));
  }
}
