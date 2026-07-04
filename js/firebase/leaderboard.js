// Arcade-style top-10 leaderboard (3 initials + score), classic high-score-table style.
// Falls back to a local-only board (localStorage) until firebaseConfig is filled in,
// so the leaderboard screen works out of the box and upgrades transparently later.
import { firebaseConfig, LEADERBOARD_COLLECTION } from './config.js';

const LOCAL_KEY = 'sotl_local_leaderboard';
const MAX_ENTRIES = 10;
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

function getLocalBoard(){
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; }
  catch(e){ return []; }
}
function saveLocalBoard(list){
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); } catch(e){}
}
function submitLocal(initials, score){
  const list = getLocalBoard();
  list.push({ initials, score, ts: Date.now() });
  list.sort((a,b)=> b.score - a.score);
  saveLocalBoard(list.slice(0, MAX_ENTRIES));
}

export async function submitScore(initials, score){
  initials = (initials || '???').toUpperCase().slice(0,3).padEnd(3, '-');
  const fb = await getFirestore_();
  if(!fb){ submitLocal(initials, score); return; }
  try {
    const { collection, addDoc, serverTimestamp } = fb.mod;
    await addDoc(collection(fb.db, LEADERBOARD_COLLECTION), { initials, score, ts: serverTimestamp() });
  } catch(e){
    console.warn('[leaderboard] submit failed, saving locally instead.', e);
    submitLocal(initials, score);
  }
}

export async function fetchTopScores(){
  const fb = await getFirestore_();
  if(!fb) return getLocalBoard().slice(0, MAX_ENTRIES);
  try {
    const { collection, query, orderBy, limit, getDocs } = fb.mod;
    const q = query(collection(fb.db, LEADERBOARD_COLLECTION), orderBy('score', 'desc'), limit(MAX_ENTRIES));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch(e){
    console.warn('[leaderboard] fetch failed, showing local board instead.', e);
    return getLocalBoard().slice(0, MAX_ENTRIES);
  }
}

export function qualifiesForBoard(score, topScores){
  return topScores.length < MAX_ENTRIES || score > topScores[topScores.length-1].score;
}
