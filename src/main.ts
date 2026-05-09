import './style.css';

// ============================================
// Types
// ============================================

type AppState = 'start' | 'countdown' | 'playing' | 'timeup' | 'result';

// ============================================
// Constants
// ============================================

const GAME_DURATION = 10; // seconds

const TAP_TEXTS = [
  'おめでとう！', 'Congratulations!', '祝🎉', '最高！',
  'Happy Wedding!', '幸せに！', '💒', '永遠に！',
  'Love💕', 'ぽくぬり最高！', '末永く！', 'Cheers!',
  '乾杯🥂', '祝福✨', 'Best Wishes!', 'ふたりに幸あれ！',
];

const PARTICLES = ['🎉', '💕', '✨', '🌸', '💐', '🥂', '🎊', '💖', '🌹', '💍'];

const TAP_COLORS = [
  '#e8c56d', '#e8a0b4', '#f2c4d4', '#f5e6c8',
  '#c9a44a', '#faf6ef', '#d4a5c0', '#ecd89e',
];

const RANK_TABLE = [
  { min: 0,   title: 'お祝いビギナー',     sub: 'これからもっとお祝いしよう！' },
  { min: 20,  title: 'お祝いの使者',       sub: '気持ちはしっかり届いています！' },
  { min: 40,  title: 'お祝いマスター',     sub: '素晴らしいお祝いパワー！' },
  { min: 60,  title: '祝福の達人',         sub: 'その熱意、ふたりに届いてます！' },
  { min: 80,  title: '愛の伝道師',         sub: '圧倒的なお祝いパワー！！' },
  { min: 100, title: '祝福の神',           sub: 'あなたのお祝いは宇宙レベル！' },
];

const RESULT_MESSAGES = [
  'ぽくぬり、おめでとう！',
  'ふたりの未来に、幸あれ。',
  'May your love story be eternal.',
];

// ============================================
// State
// ============================================

let state: AppState = 'start';
let score = 0;
let timeLeft = GAME_DURATION;
let hasPlayed = false;
let timerInterval: ReturnType<typeof setInterval> | null = null;
let bumpTimeout: ReturnType<typeof setTimeout> | null = null;

// ============================================
// DOM References (lazily assigned)
// ============================================

let appEl: HTMLElement;

// ============================================
// Utility
// ============================================

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}



function getRank(s: number) {
  let rank = RANK_TABLE[0];
  for (const r of RANK_TABLE) {
    if (s >= r.min) rank = r;
  }
  return rank;
}

// ============================================
// Render Functions
// ============================================

function renderApp() {
  appEl = document.getElementById('app')!;
  appEl.innerHTML = '';

  // Background layer
  const bgLayer = document.createElement('div');
  bgLayer.className = 'bg-layer';
  bgLayer.innerHTML = '<div class="bg-gradient"></div><div class="bg-grain"></div>';
  appEl.appendChild(bgLayer);

  switch (state) {
    case 'start':
      renderStartScreen();
      break;
    case 'countdown':
      renderCountdown();
      break;
    case 'playing':
      renderPlayScreen();
      break;
    case 'timeup':
      renderTimeup();
      break;
    case 'result':
      renderResultScreen();
      break;
  }
}

function renderStartScreen() {
  const screen = document.createElement('div');
  screen.className = 'screen start-screen';
  screen.id = 'start-screen';
  screen.innerHTML = `
    <div class="start-ornament">✦ ✦ ✦</div>
    <h1 class="start-title">
      ぽくぬり
      <span class="accent">Wedding Celebration</span>
    </h1>
    <p class="start-subtitle">
      ${hasPlayed ? 'お祝いしてくれてありがとう！<br>もう一度お祝いパワーを送る？' : '10秒間タップして<br>ふたりにお祝いパワーを送ろう！'}
    </p>
    <button class="start-btn" id="start-btn">
      タップしてスタート！
    </button>
  `;
  appEl.appendChild(screen);

  document.getElementById('start-btn')!.addEventListener('click', startGame);
}

function renderPlayScreen(autoStart = true) {
  const screen = document.createElement('div');
  screen.className = 'screen play-screen';
  screen.id = 'play-screen';
  screen.innerHTML = `
    <div class="play-hud">
      <div class="timer-bar-track">
        <div class="timer-bar-fill" id="timer-fill" style="transform: scaleX(1)"></div>
      </div>
      <div class="timer-text">
        <span id="timer-label">${timeLeft.toFixed(1)}s</span>
        <span id="score-label">${score} taps</span>
      </div>
    </div>
    <div class="play-score-bg">
      <div class="play-score-number" id="score-bg">${score}</div>
    </div>
    <div class="effects-layer" id="effects-layer"></div>
    <div class="play-tap-area" id="tap-area"></div>
  `;
  appEl.appendChild(screen);

  const tapArea = document.getElementById('tap-area')!;

  // Handle both touch and click
  tapArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      handleTap(touch.clientX, touch.clientY);
    }
  }, { passive: false });

  tapArea.addEventListener('mousedown', (e) => {
    handleTap(e.clientX, e.clientY);
  });

  if (autoStart) {
    startTimer();
  }
}

function renderTimeup() {
  // Keep play screen visible behind
  const overlay = document.createElement('div');
  overlay.className = 'timeup-overlay';
  overlay.id = 'timeup-overlay';
  overlay.innerHTML = '<div class="timeup-text">Time Up!</div>';
  appEl.appendChild(overlay);

  setTimeout(() => {
    state = 'result';
    renderApp();
  }, 1500);
}

function renderResultScreen() {
  const rank = getRank(score);
  const msg = randomFrom(RESULT_MESSAGES);
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

  const screen = document.createElement('div');
  screen.className = 'screen result-screen';
  screen.id = 'result-screen';
  screen.innerHTML = `
    <div class="result-card" id="result-card">
      <div class="result-ornament-top">✦ CELEBRATION ✦</div>
      <div class="result-label">あなたが送ったお祝いパワー</div>
      <div class="result-score-block">
        <div class="result-score-number" id="result-score">${score}</div>
        <span class="result-score-unit">Pokunuri!</span>
      </div>
      <div class="result-rank">
        <div class="result-rank-title">${rank.title}</div>
        <div class="result-rank-subtitle">${rank.sub}</div>
      </div>
      <div class="result-divider"></div>
      <div class="result-message">"${msg}"</div>
      <div class="result-hashtag">#ぽくぬり結婚</div>
      <div class="result-footer">
        <span class="result-date">${dateStr}</span>
        <button class="share-btn" id="share-btn" aria-label="Share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </button>
      </div>
      <div class="result-confetti" id="result-confetti"></div>
    </div>
    <div class="result-actions">
      <button class="retry-btn" id="retry-btn">もう一度お祝いする ↻</button>
      <button class="back-btn" id="back-btn">スタート画面に戻る</button>
    </div>
  `;
  appEl.appendChild(screen);

  // Confetti burst
  spawnResultConfetti();

  // Retry & Back buttons
  document.getElementById('retry-btn')!.addEventListener('click', startGame);
  document.getElementById('back-btn')!.addEventListener('click', backToStart);

  // Share button
  document.getElementById('share-btn')!.addEventListener('click', handleShare);

  // Animate score count-up
  animateScoreCountUp();
}

// ============================================
// Game Logic
// ============================================

function startGame() {
  state = 'countdown';
  score = 0;
  timeLeft = GAME_DURATION;
  renderApp();
}

function renderCountdown() {
  // Keep play screen visible behind
  renderPlayScreen(false); // Render UI but don't start timer

  const overlay = document.createElement('div');
  overlay.className = 'countdown-overlay';
  overlay.id = 'countdown-overlay';
  
  const numEl = document.createElement('div');
  numEl.className = 'countdown-text';
  overlay.appendChild(numEl);
  appEl.appendChild(overlay);

  let count = 3;
  
  function nextCount() {
    if (count > 0) {
      numEl.textContent = String(count);
      numEl.classList.remove('pop');
      void numEl.offsetWidth; // force reflow
      numEl.classList.add('pop');
      
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(20);
      
      count--;
      setTimeout(nextCount, 600);
    } else {
      // GO
      numEl.textContent = 'GO!';
      numEl.classList.remove('pop');
      void numEl.offsetWidth;
      numEl.classList.add('pop');
      numEl.style.color = 'var(--gold-bright)';
      
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

      setTimeout(() => {
        overlay.remove();
        state = 'playing';
        startTimer();
      }, 500);
    }
  }

  nextCount();
}

function startTimer() {
  const startTime = performance.now();

  timerInterval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    timeLeft = Math.max(0, GAME_DURATION - elapsed);

    // Update HUD
    const fill = document.getElementById('timer-fill');
    const label = document.getElementById('timer-label');
    const scoreLabel = document.getElementById('score-label');

    if (fill) fill.style.transform = `scaleX(${timeLeft / GAME_DURATION})`;
    if (label) label.textContent = `${timeLeft.toFixed(1)}s`;
    if (scoreLabel) scoreLabel.textContent = `${score} taps`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval!);
      timerInterval = null;
      state = 'timeup';

      // Render timeup overlay on top of play screen
      const overlay = document.createElement('div');
      overlay.className = 'timeup-overlay';
      overlay.innerHTML = '<div class="timeup-text">Time Up!</div>';
      appEl.appendChild(overlay);

      // Disable tap area
      const tapArea = document.getElementById('tap-area');
      if (tapArea) tapArea.style.pointerEvents = 'none';

      setTimeout(() => {
        state = 'result';
        renderApp();
      }, 1500);
    }
  }, 50);
}

function handleTap(x: number, y: number) {
  if (state !== 'playing') return;

  score++;

  // Update bg score
  const scoreBg = document.getElementById('score-bg');
  if (scoreBg) {
    scoreBg.textContent = String(score);
    scoreBg.classList.remove('bump');
    // Force reflow
    void scoreBg.offsetWidth;
    scoreBg.classList.add('bump');

    if (bumpTimeout) clearTimeout(bumpTimeout);
    bumpTimeout = setTimeout(() => {
      scoreBg.classList.remove('bump');
    }, 100);
  }

  // Screen pulse
  const playScreen = document.getElementById('play-screen');
  if (playScreen) {
    playScreen.classList.remove('screen-pulse');
    void playScreen.offsetWidth;
    playScreen.classList.add('screen-pulse');
  }

  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(15);
  }

  // Spawn effects
  spawnTapText(x, y);
  spawnParticles(x, y);
}

function spawnTapText(x: number, y: number) {
  const effectsLayer = document.getElementById('effects-layer');
  if (!effectsLayer) return;

  const text = randomFrom(TAP_TEXTS);
  const color = randomFrom(TAP_COLORS);
  const size = 24 + Math.random() * 24;
  const rotation = -25 + Math.random() * 50;

  const el = document.createElement('div');
  el.className = 'tap-text';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  el.style.fontSize = `${size}px`;
  el.style.setProperty('--rot', `${rotation}deg`);

  effectsLayer.appendChild(el);

  // Remove after animation
  setTimeout(() => {
    el.remove();
  }, 1200);
}

function spawnParticles(x: number, y: number) {
  const effectsLayer = document.getElementById('effects-layer');
  if (!effectsLayer) return;

  const count = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    const emoji = randomFrom(PARTICLES);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const distance = 60 + Math.random() * 80;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 30; // bias upward
    const size = 24 + Math.random() * 16;

    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = emoji;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.fontSize = `${size}px`;
    el.style.setProperty('--dx', `${dx}px`);
    el.style.setProperty('--dy', `${dy}px`);

    effectsLayer.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 1000);
  }
}

// ============================================
// Result Confetti
// ============================================

function spawnResultConfetti() {
  const container = document.getElementById('result-confetti');
  if (!container) return;

  const colors = ['#e8c56d', '#e8a0b4', '#f2c4d4', '#c9a44a', '#f5e6c8', '#d4a5c0'];
  const count = 40;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';

    const color = randomFrom(colors);
    const sx = Math.random() * 100;
    const ex = sx + (-30 + Math.random() * 60);
    const dur = 1.5 + Math.random() * 2;
    const delay = Math.random() * 0.5;
    const spin = 360 + Math.random() * 720;
    const size = 6 + Math.random() * 6;

    el.style.width = `${size}px`;
    el.style.height = `${size * (0.4 + Math.random() * 0.6)}px`;
    el.style.background = color;
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.left = `${sx}%`;
    el.style.setProperty('--sx', `${sx}%`);
    el.style.setProperty('--ex', `${ex}%`);
    el.style.setProperty('--dur', `${dur}s`);
    el.style.setProperty('--delay', `${delay}s`);
    el.style.setProperty('--spin', `${spin}deg`);

    container.appendChild(el);

    // Cleanup
    setTimeout(() => {
      el.remove();
    }, (dur + delay) * 1000 + 100);
  }
}

// ============================================
// Score Count-Up Animation
// ============================================

function animateScoreCountUp() {
  const el = document.getElementById('result-score');
  if (!el) return;

  const target = score;
  const duration = 1200;
  const start = performance.now();

  function tick(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el!.textContent = String(current);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  el.textContent = '0';
  requestAnimationFrame(tick);
}

// ============================================
// Share
// ============================================

async function handleShare() {
  const rank = getRank(score);
  const shareText = `ぽくぬりに ${score} Pokunuri のお祝いパワーを送りました！🎉\n称号：${rank.title}\n\n#ぽくぬり結婚`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'ぽくぬり Wedding Celebration!',
        text: shareText,
      });
    } catch {
      // User cancelled share — ignore
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      const btn = document.getElementById('share-btn');
      if (btn) {
        btn.style.borderColor = 'var(--gold-bright)';
        setTimeout(() => {
          btn.style.borderColor = '';
        }, 1000);
      }
    } catch {
      // Ignore
    }
  }
}

function backToStart() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  hasPlayed = true;
  state = 'start';
  score = 0;
  timeLeft = GAME_DURATION;
  renderApp();
}

// ============================================
// Init
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
