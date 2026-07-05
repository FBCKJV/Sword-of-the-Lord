// Difficulty profiles. Every tunable that varies by audience lives here so
// the rest of the game reads one object instead of scattering conditionals.
export const DIFFICULTIES = {
  easy: {
    key: 'easy',
    label: 'Easy',
    tagline: 'a gentle drill',
    speedMult: 0.82,        // fall-speed multiplier on top of tier params
    chainSize: 2,           // max verse words falling at once
    chainGap: 0.85,         // seconds between chained word spawns
    decoyRateMult: 0.75,    // fewer chaff spawns
    trickyDecoyTier: 99,    // never use verse-word decoys
    demonAttackCooldown: [9, 13],  // min,max seconds between demon casts
    demonAttackKinds: ['chaffBurst'],
    mercyChance: 0.5,       // chance per verse a dove can appear (when hurt)
    selahChance: 0.35,      // chance per verse a Selah tile appears
    hintMode: 'always',     // hint strip never auto-fades
    scoreMult: 0.8
  },
  standard: {
    key: 'standard',
    label: 'Standard',
    tagline: 'the good fight',
    speedMult: 1.0,
    chainSize: 3,
    chainGap: 0.7,
    decoyRateMult: 1.0,
    trickyDecoyTier: 3,     // tier 3+ demons mix in out-of-order verse words
    demonAttackCooldown: [7, 11],
    demonAttackKinds: ['chaffBurst', 'fog'],
    mercyChance: 0.3,
    selahChance: 0.22,
    hintMode: 'fadeHalf',   // hint strip fades after the halfway word
    scoreMult: 1.0
  },
  valiant: {
    key: 'valiant',
    label: 'Valiant',
    tagline: 'quit you like men',
    speedMult: 1.15,
    chainSize: 3,
    chainGap: 0.55,
    decoyRateMult: 1.2,
    trickyDecoyTier: 2,
    demonAttackCooldown: [5, 9],
    demonAttackKinds: ['chaffBurst', 'fog'],
    mercyChance: 0.15,
    selahChance: 0.12,
    hintMode: 'battleHidden', // strip only on the study screen, never in battle
    scoreMult: 1.3
  }
};

export function getDifficulty(key){
  return DIFFICULTIES[key] || DIFFICULTIES.standard;
}
