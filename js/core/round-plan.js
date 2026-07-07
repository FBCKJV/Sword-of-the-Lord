import { state } from './state.js';
import { VERSE_TIERS, BOSS_VERSE_TIERS } from '../data/verses.js';
import { DEMONS } from '../data/demons.js';

export function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// Session decks: no immediate repeats, reshuffle on empty. Tier 4 is where
// every demon ends up capped from round 3 onward, so it's the pool players
// actually cycle through for the rest of a long run — folding tier 3 in
// alongside it roughly doubles that long-term variety instead of the same
// 11 verses on repeat forever.
export function drawVerse(tier){
  tier = Math.max(1, Math.min(4, tier));
  const pool = tier === 4 ? [...VERSE_TIERS[3], ...VERSE_TIERS[4]] : VERSE_TIERS[tier];
  if(!state.tierDecks[tier] || state.tierDecks[tier].length === 0){
    state.tierDecks[tier] = shuffle(pool);
  }
  return state.tierDecks[tier].pop();
}

export function drawBossVerse(roundIdx){
  const tier = Math.max(1, Math.min(4, roundIdx + 1));
  const pool = tier === 4 ? [...BOSS_VERSE_TIERS[3], ...BOSS_VERSE_TIERS[4]] : BOSS_VERSE_TIERS[tier];
  if(!state.bossTierDecks[tier] || state.bossTierDecks[tier].length === 0){
    state.bossTierDecks[tier] = shuffle(pool);
  }
  return state.bossTierDecks[tier].pop();
}

// Level plan is rebuilt per round; demon order reshuffled each round.
export function buildRound(roundIdx){
  const order = shuffle(DEMONS);
  order.forEach(d=>{
    state.levelPlan.push({ type:'demon', demonKey:d.key, demonName:d.name, tier: Math.min(4, d.tier + roundIdx) });
  });
  state.levelPlan.push({ type:'boss' });
}

export function ensurePlan(idx){
  while(state.levelPlan.length <= idx){
    buildRound(Math.floor(state.levelPlan.length / (DEMONS.length+1)));
  }
}
