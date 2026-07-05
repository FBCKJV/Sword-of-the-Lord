// firebaseConfig for the fbcopc-cfe23 project — the arcade leaderboard
// lives there (Firestore collection below). Leave apiKey empty to fall
// back to the built-in local-only leaderboard (see leaderboard.js).
export const firebaseConfig = {
  apiKey: 'AIzaSyAKJoeWK8VUlprl-6P_DcXtdTMBrsuvns8',
  authDomain: 'fbcopc-cfe23.firebaseapp.com',
  projectId: 'fbcopc-cfe23',
  storageBucket: 'fbcopc-cfe23.firebasestorage.app',
  messagingSenderId: '749844151889',
  appId: '1:749844151889:web:ba8525839b67cb96254270'
};

// Firestore collection name for the arcade high-score table.
export const LEADERBOARD_COLLECTION = 'sword_of_the_lord_scores';
