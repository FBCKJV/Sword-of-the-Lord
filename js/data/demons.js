export const DEMONS = [
  { key:'flameimp', name:'Flame Imp', tier:1 },
  { key:'hellhound', name:'Hellhound', tier:1 },
  { key:'wraith', name:'Wraith', tier:2 },
  { key:'boneguard', name:'Bone Guard', tier:2 },
  { key:'bladefiend', name:'Blade Fiend', tier:3 },
  { key:'shadowdervish', name:'Shadow Dervish', tier:3 }
];

// Boss key is 'satan', handled separately from the regular roster in round-plan.js
export const IMAGE_KEYS = [
  ...DEMONS.map(d => d.key),
  'satan'
].flatMap(key => [`${key}_laughing`, `${key}_struck`]);

export function imagePath(key){
  return `assets/demons/${key}.jpg`;
}
