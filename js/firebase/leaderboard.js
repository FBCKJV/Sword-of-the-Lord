// Arcade-style top-10 leaderboard (3 initials + score), classic high-score-table style.
// Falls back to a local-only board (localStorage) until firebaseConfig is filled in,
// so the leaderboard screen works out of the box and upgrades transparently later.
import { firebaseConfig, LEADERBOARD_COLLECTIONS } from './config.js';

const LOCAL_KEY_PREFIX = 'sotl_local_leaderboard_';
const MAX_ENTRIES = 10;

function collectionFor(difficulty){
  return LEADERBOARD_COLLECTIONS[difficulty] || LEADERBOARD_COLLECTIONS.standard;
}
function localKeyFor(difficulty){
  return LOCAL_KEY_PREFIX + (LEADERBOARD_COLLECTIONS[difficulty] ? difficulty : 'standard');
}
const SDK_VERSION = '10.14.1';

export function isFirebaseConfigured(){
  return !!firebaseConfig.apiKey;
}

let firestorePromise = null;
function getFirestore_(){
  if(!isFirebaseConfigured()) return Promise.resolve(null);
  if(!firestorePromise){
    firestorePromise = (async () => {
      try {
        const [{ initializeApp }, firestoreMod] = await Promise.all([
          import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
          import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`)
        ]);
        const app = initializeApp(firebaseConfig);
        return { db: firestoreMod.getFirestore(app), mod: firestoreMod };
      } catch(e){
        console.warn('[leaderboard] Firebase unavailable, using local leaderboard.', e);
        return null;
      }
    })();
  }
  return firestorePromise;
}

function getLocalBoard(difficulty){
  try { return JSON.parse(localStorage.getItem(localKeyFor(difficulty))) || []; }
  catch(e){ return []; }
}
function saveLocalBoard(difficulty, list){
  try { localStorage.setItem(localKeyFor(difficulty), JSON.stringify(list)); } catch(e){}
}
function submitLocal(difficulty, initials, score){
  const list = getLocalBoard(difficulty);
  list.push({ initials, score, ts: Date.now() });
  list.sort((a,b)=> b.score - a.score);
  saveLocalBoard(difficulty, list.slice(0, MAX_ENTRIES));
}

export async function submitScore(initials, score, difficulty){
  initials = (initials || '???').toUpperCase().slice(0,3).padEnd(3, '-');
  const fb = await getFirestore_();
  if(!fb){ submitLocal(difficulty, initials, score); return; }
  try {
    const { collection, addDoc, serverTimestamp } = fb.mod;
    await addDoc(collection(fb.db, collectionFor(difficulty)), { initials, score, ts: serverTimestamp() });
  } catch(e){
    console.warn('[leaderboard] submit failed, saving locally instead.', e);
    submitLocal(difficulty, initials, score);
  }
}

export async function fetchTopScores(difficulty){
  const fb = await getFirestore_();
  if(!fb) return getLocalBoard(difficulty).slice(0, MAX_ENTRIES);
  try {
    const { collection, query, orderBy, limit, getDocs } = fb.mod;
    const q = query(collection(fb.db, collectionFor(difficulty)), orderBy('score', 'desc'), limit(MAX_ENTRIES));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch(e){
    console.warn('[leaderboard] fetch failed, showing local board instead.', e);
    return getLocalBoard(difficulty).slice(0, MAX_ENTRIES);
  }
}

export function qualifiesForBoard(score, topScores){
  return topScores.length < MAX_ENTRIES || score > topScores[topScores.length-1].score;
}
