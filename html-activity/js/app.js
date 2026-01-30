/**
 * Structural Leverage SIM - Main App
 * BOW Track 301 - Module 3 Lesson 1
 */

// ============================================
// Config
// ============================================
const CONFIG = {
  LESSON_CODE: 'BOW301-M3L1',
  TOTAL_POINTS: 23,
  GOLD_MIN: 21,
  SILVER_MIN: 17,
  BRONZE_MIN: 13,
  GOLD_XP: 150,
  SILVER_XP: 100,
  BRONZE_XP: 50
};

// Universal claim codes - same for everyone at each tier
const CLAIM_CODES = {
  GOLD: 'BOW301-M3L1-GOLD-7X9K2',
  SILVER: 'BOW301-M3L1-SILVER-4M8P1',
  BRONZE: 'BOW301-M3L1-BRONZE-2N5Q8',
  FAIL: ''
};

// ============================================
// Answer Key (NBA Teams)
// ============================================
const ANSWER_KEY = {
  // Phase 1: Initial Leverage Read
  'p1-lakers': 'Team',      // Deep roster, no outside interest = Team leverage
  'p1-suns': 'Player',      // Thin roster, strong market interest = Player leverage
  'p1-nuggets': 'Balanced', // Medium everything = Balanced

  // Phase 2: Leverage Shifts
  // Update 1 - Deadline Approaches
  'p2-u1-lakers': 'Stayed the same',      // Lakers still have leverage, deadline doesn't change much
  'p2-u1-suns': 'Shifted toward player',  // Deadline pressure hurts desperate Suns
  'p2-u1-nuggets': 'Shifted toward player', // Deadline adds slight pressure

  // Update 2 - Market Thins
  'p2-u2-lakers': 'Stayed the same',      // Lakers have depth, don't need market
  'p2-u2-suns': 'Shifted toward player',  // Fewer options = more player leverage
  'p2-u2-nuggets': 'Shifted toward player', // Harder to replace = player gains

  // Update 3 - Injury News (contender needs starter)
  'p2-u3-lakers': 'Shifted toward team',  // Player might have new option, but Lakers still fine
  'p2-u3-suns': 'Shifted toward player',  // Player has even more options now
  'p2-u3-nuggets': 'Shifted toward player', // Player might get better offer elsewhere

  // Phase 3: Drivers
  'p3-lakers-replace': 'Deep',
  'p3-lakers-depend': 'Low',
  'p3-lakers-leverage': 'Team',

  'p3-suns-replace': 'Thin',
  'p3-suns-depend': 'High',
  'p3-suns-leverage': 'Player',

  'p3-nuggets-replace': 'Medium',
  'p3-nuggets-depend': 'Medium',
  'p3-nuggets-leverage': 'Team', // With serviceable backup, team can walk

  // Phase 4: Walk-Away Test (Nuggets)
  'p4-who': 'Team',           // Nuggets can walk - they have a backup
  'p4-consequence': 'Minimal damage' // Performance drops but manageable
};

// Question groups by phase
const PHASES = {
  phase1: ['p1-lakers', 'p1-suns', 'p1-nuggets'],
  phase2: [
    'p2-u1-lakers', 'p2-u1-suns', 'p2-u1-nuggets',
    'p2-u2-lakers', 'p2-u2-suns', 'p2-u2-nuggets',
    'p2-u3-lakers', 'p2-u3-suns', 'p2-u3-nuggets'
  ],
  phase3: [
    'p3-lakers-replace', 'p3-lakers-depend', 'p3-lakers-leverage',
    'p3-suns-replace', 'p3-suns-depend', 'p3-suns-leverage',
    'p3-nuggets-replace', 'p3-nuggets-depend', 'p3-nuggets-leverage'
  ],
  phase4: ['p4-who', 'p4-consequence']
};

// ============================================
// State
// ============================================
let state = {
  phase: 'intro',
  student: { name: '', email: '' },
  answers: {},
  score: 0,
  tier: '',
  claimCode: ''
};

// ============================================
// Storage
// ============================================
function saveState() {
  localStorage.setItem('bow-leverage-sim', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('bow-leverage-sim');
  if (saved) {
    try {
      state = { ...state, ...JSON.parse(saved) };

      // Restore form
      if (state.student.name) {
        document.getElementById('studentName').value = state.student.name;
      }
      if (state.student.email) {
        document.getElementById('studentEmail').value = state.student.email;
      }

      // Restore selections
      Object.entries(state.answers).forEach(([q, v]) => {
        const group = document.querySelector(`[data-question="${q}"]`);
        if (group) {
          const btn = group.querySelector(`[data-value="${v}"]`);
          if (btn) btn.classList.add('selected');
        }
      });

      updateButtons();
    } catch (e) {
      console.error('Load error:', e);
    }
  }
}

// ============================================
// Navigation
// ============================================
const SCREENS = ['intro', '1', '2', '3', '4', 'results'];

function goTo(screen) {
  // Hide all
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Show target
  const el = document.getElementById(`phase-${screen}`);
  if (el) el.classList.add('active');

  // Update nav steps
  document.querySelectorAll('.step').forEach(step => {
    const p = step.dataset.phase;
    step.classList.remove('active', 'done');

    if (p === screen) {
      step.classList.add('active');
    } else if (SCREENS.indexOf(p) < SCREENS.indexOf(screen)) {
      step.classList.add('done');
    }
  });

  // Update progress bar
  const pct = (SCREENS.indexOf(screen) / (SCREENS.length - 1)) * 100;
  document.getElementById('progressFill').style.width = `${pct}%`;

  state.phase = screen;
  saveState();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Options
// ============================================
function initOptions() {
  document.querySelectorAll('.options').forEach(group => {
    const q = group.dataset.question;

    group.querySelectorAll('.opt').forEach(btn => {
      btn.addEventListener('click', () => {
        // Deselect siblings
        group.querySelectorAll('.opt').forEach(b => b.classList.remove('selected'));

        // Select this
        btn.classList.add('selected');

        // Save
        state.answers[q] = btn.dataset.value;
        saveState();
        updateButtons();
      });
    });
  });
}

function updateButtons() {
  const p1Done = PHASES.phase1.every(q => state.answers[q]);
  const p2Done = PHASES.phase2.every(q => state.answers[q]);
  const p3Done = PHASES.phase3.every(q => state.answers[q]);
  const p4Done = PHASES.phase4.every(q => state.answers[q]);

  const btn2 = document.getElementById('toPhase2');
  const btn3 = document.getElementById('toPhase3');
  const btn4 = document.getElementById('toPhase4');
  const btnSubmit = document.getElementById('submitSim');

  if (btn2) btn2.disabled = !p1Done;
  if (btn3) btn3.disabled = !p2Done;
  if (btn4) btn4.disabled = !p3Done;
  if (btnSubmit) btnSubmit.disabled = !p4Done;
}

// ============================================
// Scoring
// ============================================
function score() {
  let correct = 0;
  const results = {};

  Object.keys(ANSWER_KEY).forEach(q => {
    const user = state.answers[q];
    const answer = ANSWER_KEY[q];
    const ok = user === answer;
    if (ok) correct++;
    results[q] = { user, answer, ok };
  });

  return { score: correct, results };
}

function getTier(s) {
  if (s >= CONFIG.GOLD_MIN) return 'GOLD';
  if (s >= CONFIG.SILVER_MIN) return 'SILVER';
  if (s >= CONFIG.BRONZE_MIN) return 'BRONZE';
  return 'FAIL';
}

function getXP(tier) {
  if (tier === 'GOLD') return CONFIG.GOLD_XP;
  if (tier === 'SILVER') return CONFIG.SILVER_XP;
  if (tier === 'BRONZE') return CONFIG.BRONZE_XP;
  return 0;
}

// ============================================
// Results
// ============================================
function showResults() {
  const { score: s, results } = score();
  const tier = getTier(s);
  const xp = getXP(tier);
  const code = CLAIM_CODES[tier];

  state.score = s;
  state.tier = tier;
  state.claimCode = code;
  saveState();

  // Update UI
  document.getElementById('analystInfo').textContent =
    `${state.student.name} • ${state.student.email}`;

  document.getElementById('scoreValue').textContent = s;

  const tierBox = document.getElementById('tierBox');
  tierBox.className = 'tier-card ' + tier.toLowerCase();
  document.getElementById('tierValue').textContent = tier === 'FAIL' ? 'NOT YET' : tier;
  document.getElementById('xpValue').textContent = `${xp} XP`;

  document.getElementById('claimCode').textContent = code || 'Complete the simulation to earn a code';

  // Breakdown
  buildBreakdown(results);

  goTo('results');
}

function buildBreakdown(results) {
  const el = document.getElementById('resultsBreakdown');
  el.innerHTML = '';

  const names = {
    phase1: 'Phase 1: Initial Read',
    phase2: 'Phase 2: Leverage Shifts',
    phase3: 'Phase 3: Drivers',
    phase4: 'Phase 4: Walk-Away'
  };

  Object.entries(PHASES).forEach(([phase, questions]) => {
    const phaseResults = questions.map(q => results[q]);
    const correct = phaseResults.filter(r => r.ok).length;
    const total = questions.length;
    const perfect = correct === total;

    const div = document.createElement('div');
    div.className = 'breakdown-phase';
    div.innerHTML = `
      <span>${names[phase]}</span>
      <span class="breakdown-score ${perfect ? 'perfect' : ''}">${correct}/${total}</span>
    `;
    el.appendChild(div);
  });
}

// ============================================
// Review Mode
// ============================================
function showReview() {
  Object.entries(ANSWER_KEY).forEach(([q, correct]) => {
    const group = document.querySelector(`[data-question="${q}"]`);
    if (!group) return;

    group.querySelectorAll('.opt').forEach(btn => {
      btn.classList.remove('correct', 'incorrect');

      if (btn.dataset.value === correct) {
        btn.classList.add('correct');
      } else if (btn.classList.contains('selected')) {
        btn.classList.add('incorrect');
      }
    });
  });

  goTo('1');
  toast('Review mode: Green = correct, Red = incorrect');
}

// ============================================
// Reset
// ============================================
function reset() {
  state = {
    phase: 'intro',
    student: state.student,
    answers: {},
    score: 0,
    tier: '',
    claimCode: ''
  };
  saveState();

  document.querySelectorAll('.opt').forEach(btn => {
    btn.classList.remove('selected', 'correct', 'incorrect');
  });

  updateButtons();
  goTo('intro');
  toast('Simulation reset');
}

// ============================================
// Toast
// ============================================
function toast(msg, duration = 3000) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');

  setTimeout(() => el.classList.remove('show'), duration);
}

// ============================================
// Copy
// ============================================
function copyCode() {
  const code = state.claimCode;
  if (!code) return;

  navigator.clipboard.writeText(code).then(() => {
    toast('Copied!');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('Copied!');
  });
}

// ============================================
// Validation
// ============================================
function validateIdentity() {
  const name = document.getElementById('studentName').value.trim();
  const email = document.getElementById('studentEmail').value.trim();

  if (!name) {
    toast('Please enter your name');
    document.getElementById('studentName').focus();
    return false;
  }

  if (!email || !email.includes('@')) {
    toast('Please enter a valid email');
    document.getElementById('studentEmail').focus();
    return false;
  }

  state.student = { name, email };
  saveState();
  return true;
}

// ============================================
// Event Listeners
// ============================================
function initEvents() {
  // Start
  document.getElementById('startSim').addEventListener('click', () => {
    if (validateIdentity()) goTo('1');
  });

  // Navigation
  document.getElementById('backToIntro').addEventListener('click', () => goTo('intro'));
  document.getElementById('toPhase2').addEventListener('click', () => goTo('2'));
  document.getElementById('backToPhase1').addEventListener('click', () => goTo('1'));
  document.getElementById('toPhase3').addEventListener('click', () => goTo('3'));
  document.getElementById('backToPhase2').addEventListener('click', () => goTo('2'));
  document.getElementById('toPhase4').addEventListener('click', () => goTo('4'));
  document.getElementById('backToPhase3').addEventListener('click', () => goTo('3'));

  // Submit
  document.getElementById('submitSim').addEventListener('click', showResults);

  // Results actions
  document.getElementById('reviewAnswers').addEventListener('click', showReview);
  document.getElementById('restartSim').addEventListener('click', () => {
    if (confirm('Reset the simulation?')) reset();
  });

  // Copy
  document.getElementById('copyCode').addEventListener('click', copyCode);

  // Enter key on inputs
  document.getElementById('studentName').addEventListener('keypress', e => {
    if (e.key === 'Enter') document.getElementById('studentEmail').focus();
  });

  document.getElementById('studentEmail').addEventListener('keypress', e => {
    if (e.key === 'Enter') document.getElementById('startSim').click();
  });
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initOptions();
  initEvents();
  loadState();
  updateButtons();
});
