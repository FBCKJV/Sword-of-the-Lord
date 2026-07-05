export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
export const W = canvas.width, H = canvas.height;

export const dom = {
  scoreVal: document.getElementById('scoreVal'),
  shieldsEl: document.getElementById('shields'),
  startScreen: document.getElementById('startScreen'),
  levelScreen: document.getElementById('levelScreen'),
  endScreen: document.getElementById('endScreen'),
  loadScreen: document.getElementById('loadScreen'),
  startBtn: document.getElementById('startBtn'),
  continueBtn: document.getElementById('continueBtn'),
  retryBtn: document.getElementById('retryBtn'),
  levelEyebrow: document.getElementById('levelEyebrow'),
  levelRef: document.getElementById('levelRef'),
  levelVerse: document.getElementById('levelVerse'),
  levelCount: document.getElementById('levelCount'),
  countdownVal: document.getElementById('countdownVal'),
  finalScoreEl: document.getElementById('finalScore'),
  bestLineEl: document.getElementById('bestLine'),
  endEyebrow: document.getElementById('endEyebrow'),
  endRef: document.getElementById('endRef'),
  verseStrip: document.getElementById('verseStrip'),
  stripRef: document.getElementById('stripRef'),
  stripWords: document.getElementById('stripWords'),
  hintToggleBtn: document.getElementById('hintToggleBtn'),
  soundToggleBtn: document.getElementById('soundToggleBtn'),
  musicToggleBtn: document.getElementById('musicToggleBtn'),
  difficultyRow: document.getElementById('difficultyRow'),
  studyScreen: document.getElementById('studyScreen'),
  studyRef: document.getElementById('studyRef'),
  studyVerse: document.getElementById('studyVerse'),
  studyFacing: document.getElementById('studyFacing'),
  studyTimerVal: document.getElementById('studyTimerVal'),
  studySkipBtn: document.getElementById('studySkipBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  pauseScreen: document.getElementById('pauseScreen'),
  resumeBtn: document.getElementById('resumeBtn'),
  quitBtn: document.getElementById('quitBtn'),
  demonPortrait: document.getElementById('demonPortrait'),
  demonName: document.getElementById('demonName'),
  badgeToast: document.getElementById('badgeToast'),
  badgesGrid: document.getElementById('badgesGrid'),
  leaderboardScreen: document.getElementById('leaderboardScreen'),
  leaderboardList: document.getElementById('leaderboardList'),
  leaderboardBtn: document.getElementById('leaderboardBtn'),
  leaderboardBtnEnd: document.getElementById('leaderboardBtnEnd'),
  leaderboardBackBtn: document.getElementById('leaderboardBackBtn'),
  updateBanner: document.getElementById('updateBanner'),
  updateReloadBtn: document.getElementById('updateReloadBtn'),
  initialsForm: document.getElementById('initialsForm'),
  initialsSubmitBtn: document.getElementById('initialsSubmitBtn'),
  initialsPrompt: document.getElementById('initialsPrompt')
};

export function initialsInputs(){
  return dom.initialsForm ? [...dom.initialsForm.querySelectorAll('input')] : [];
}
