// Difficulty profiles. Every tunable that varies by audience lives here so
// the rest of the game reads one object instead of scattering conditionals.
//
// Hint strip is purely difficulty-driven now (no separate on/off toggle):
//   'fadeQuick' — shown at battle start, fades after hintFadeSeconds regardless
//                 of progress (a short peek, not a crutch through the verse)
//   'off'       — never shown in battle (still shown on the pre-battle study
//                 screen for everyone, difficulty or not)
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
    hintMode: 'fadeQuick',
    hintFadeSeconds: 5,
    camouflage: false,      // verse words keep their gold highlight vs. chaff
    scoreMult: 0.8,
    blurb: 'The verse lingers on screen a few seconds after the fight starts before fading away.'
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
    hintMode: 'off',
    camouflage: false,
    scoreMult: 1.0,
    blurb: 'No on-screen hint once the battle begins — you strike from memory.'
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
    hintMode: 'off',
    camouflage: true,       // no gold tell — verse words and chaff render identically
    scoreMult: 1.3,
    blurb: 'No hint, and no gold tell marking the true words from the chaff — every word looks the same.'
  }
};

export function getDifficulty(key){
  return DIFFICULTIES[key] || DIFFICULTIES.standard;
}
