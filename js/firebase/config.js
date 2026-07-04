// Fill this in with the firebaseConfig object from the Firebase console
// (Project settings > General > Your apps > SDK setup and configuration)
// for whichever project you want the arcade leaderboard to live in
// (fbckjv-bible, fbcopc-cfe23, or a new project). Leave apiKey empty to
// run with the built-in local-only leaderboard (see leaderboard.js).
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

// Firestore collection name for the arcade high-score table.
export const LEADERBOARD_COLLECTION = 'sword_of_the_lord_scores';
