// signature: the demon's one trademark attack, replacing the generic
// difficulty-driven cast so each fight asks a different question.
//   null     — plain chaff burst (the training demon)
//   'prowl'  — everything falls faster for a few seconds
//   'fog'    — always casts the drifting fog band
//   'pairs'  — chaff bursts come doubled
//   'flurry' — a burst of extra-fast chaff
//   'veil'   — all tiles briefly lose their color tells (fog on Valiant,
//              where there is no tell to take)
export const DEMONS = [
  { key:'flameimp', name:'Flame Imp', tier:1, signature:null },
  { key:'hellhound', name:'Hellhound', tier:1, signature:'prowl' },
  { key:'wraith', name:'Wraith', tier:2, signature:'fog' },
  { key:'boneguard', name:'Bone Guard', tier:2, signature:'pairs' },
  { key:'bladefiend', name:'Blade Fiend', tier:3, signature:'flurry' },
  { key:'shadowdervish', name:'Shadow Dervish', tier:3, signature:'veil' }
];

// Boss key is 'satan', handled separately from the regular roster in round-plan.js
export const IMAGE_KEYS = [
  ...DEMONS.map(d => d.key),
  'satan'
].flatMap(key => [`${key}_laughing`, `${key}_struck`]);

export function imagePath(key){
  return `assets/demons/${key}.jpg`;
}
