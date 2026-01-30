/**
 * BOW Track 301 - Structural Leverage SIM
 * Main Application JavaScript
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
  LESSON_CODE: 'L1-301-M3-LEV',
  TRACK: 301,
  MODULE: 3,
  LESSON_NUM: 1,
  TOTAL_POINTS: 23,
  GOLD_MIN: 21,
  SILVER_MIN: 17,
  BRONZE_MIN: 13,
  GOLD_XP: 150,
  SILVER_XP: 100,
  BRONZE_XP: 50,
  FAIL_XP: 0,
  HASH_SALT: 'BOW'
};

// ============================================
// Answer Key
// ============================================
const ANSWER_KEY = {
  // Phase 1: Initial Leverage Read (3 questions)
  'p1-harbor': 'Team',
  'p1-ironclad': 'Player',
  'p1-summit': 'Balanced',

  // Phase 2: Leverage Shifts (9 questions)
  // Update 1 - Deadline Compresses
  'p2-u1-harbor': 'Stayed the same',
  'p2-u1-ironclad': 'Shifted toward player',
  'p2-u1-summit': 'Shifted toward player',

  // Update 2 - Market Thins
  'p2-u2-harbor': 'Stayed the same',
  'p2-u2-ironclad': 'Shifted toward player',
  'p2-u2-summit': 'Shifted toward player',

  // Update 3 - External Shock
  'p2-u3-harbor': 'Shifted toward team',
  'p2-u3-ironclad': 'Shifted toward player',
  'p2-u3-summit': 'Shifted toward player',

  // Phase 3: Drivers (9 questions)
  'p3-harbor-replace': 'Deep',
  'p3-harbor-depend': 'Low',
  'p3-harbor-leverage': 'Team',
  'p3-ironclad-replace': 'Thin',
  'p3-ironclad-depend': 'High',
  'p3-ironclad-leverage': 'Player',
  'p3-summit-replace': 'Medium',
  'p3-summit-depend': 'Medium',
  'p3-summit-leverage': 'Team',

  // Phase 4: Walk-Away Test (2 questions)
  'p4-who': 'Team',
  'p4-consequence': 'Minimal damage'
};

// Questions grouped by phase for breakdown
const PHASE_QUESTIONS = {
  phase1: ['p1-harbor', 'p1-ironclad', 'p1-summit'],
  phase2: [
    'p2-u1-harbor', 'p2-u1-ironclad', 'p2-u1-summit',
    'p2-u2-harbor', 'p2-u2-ironclad', 'p2-u2-summit',
    'p2-u3-harbor', 'p2-u3-ironclad', 'p2-u3-summit'
  ],
  phase3: [
    'p3-harbor-replace', 'p3-harbor-depend', 'p3-harbor-leverage',
    'p3-ironclad-replace', 'p3-ironclad-depend', 'p3-ironclad-leverage',
    'p3-summit-replace', 'p3-summit-depend', 'p3-summit-leverage'
  ],
  phase4: ['p4-who', 'p4-consequence']
};

// ============================================
// State Management
// ============================================
let state = {
  currentPhase: 'intro',
  student: {
    name: '',
    email: ''
  },
  answers: {},
  score: 0,
  tier: '',
  claimCode: ''
};

// Load state from localStorage
function loadState() {
  const saved = localStorage.getItem('bow-sim-state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };

      // Restore student info
      if (state.student.name) {
        document.getElementById('studentName').value = state.student.name;
      }
      if (state.student.email) {
        document.getElementById('studentEmail').value = state.student.email;
      }

      // Restore answers
      Object.entries(state.answers).forEach(([questionId, value]) => {
        const optionGroup = document.querySelector(`[data-question="${questionId}"]`);
        if (optionGroup) {
          const btn = optionGroup.querySelector(`[data-value="${value}"]`);
          if (btn) {
            btn.classList.add('selected');
          }
        }
      });

      // Update navigation buttons
      updateNavButtons();
    } catch (e) {
      console.error('Error loading state:', e);
    }
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem('bow-sim-state', JSON.stringify(state));
}

// ============================================
// Phase Navigation
// ============================================
const phases = ['intro', '1', '2', '3', '4', 'results'];

function navigateToPhase(phase) {
  // Hide all phases
  document.querySelectorAll('.phase-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show target phase
  const targetSection = document.getElementById(`phase-${phase}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update progress indicators
  document.querySelectorAll('.phase-indicator').forEach(indicator => {
    const indicatorPhase = indicator.dataset.phase;
    indicator.classList.remove('active', 'completed');

    if (indicatorPhase === phase) {
      indicator.classList.add('active');
    } else if (phases.indexOf(indicatorPhase) < phases.indexOf(phase)) {
      indicator.classList.add('completed');
    }
  });

  // Update progress bar
  const progress = (phases.indexOf(phase) / (phases.length - 1)) * 100;
  document.getElementById('progressFill').style.width = `${progress}%`;

  // Update state
  state.currentPhase = phase;
  saveState();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Answer Selection
// ============================================
function initAnswerOptions() {
  document.querySelectorAll('.answer-options').forEach(optionGroup => {
    const questionId = optionGroup.dataset.question;

    optionGroup.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove selected from siblings
        optionGroup.querySelectorAll('.option-btn').forEach(b => {
          b.classList.remove('selected');
        });

        // Add selected to clicked
        btn.classList.add('selected');

        // Save answer
        state.answers[questionId] = btn.dataset.value;
        saveState();

        // Update navigation buttons
        updateNavButtons();
      });
    });
  });
}

function updateNavButtons() {
  // Phase 1 -> 2
  const phase1Complete = PHASE_QUESTIONS.phase1.every(q => state.answers[q]);
  const toPhase2Btn = document.getElementById('toPhase2');
  if (toPhase2Btn) toPhase2Btn.disabled = !phase1Complete;

  // Phase 2 -> 3
  const phase2Complete = PHASE_QUESTIONS.phase2.every(q => state.answers[q]);
  const toPhase3Btn = document.getElementById('toPhase3');
  if (toPhase3Btn) toPhase3Btn.disabled = !phase2Complete;

  // Phase 3 -> 4
  const phase3Complete = PHASE_QUESTIONS.phase3.every(q => state.answers[q]);
  const toPhase4Btn = document.getElementById('toPhase4');
  if (toPhase4Btn) toPhase4Btn.disabled = !phase3Complete;

  // Phase 4 -> Results
  const phase4Complete = PHASE_QUESTIONS.phase4.every(q => state.answers[q]);
  const submitBtn = document.getElementById('submitSim');
  if (submitBtn) submitBtn.disabled = !phase4Complete;
}

// ============================================
// Scoring Engine
// ============================================
function calculateScore() {
  let correct = 0;
  const results = {};

  Object.keys(ANSWER_KEY).forEach(questionId => {
    const userAnswer = state.answers[questionId];
    const correctAnswer = ANSWER_KEY[questionId];
    const isCorrect = userAnswer === correctAnswer;

    if (isCorrect) correct++;

    results[questionId] = {
      user: userAnswer,
      correct: correctAnswer,
      isCorrect
    };
  });

  return {
    score: correct,
    total: CONFIG.TOTAL_POINTS,
    results
  };
}

function getTier(score) {
  if (score >= CONFIG.GOLD_MIN) return 'GOLD';
  if (score >= CONFIG.SILVER_MIN) return 'SILVER';
  if (score >= CONFIG.BRONZE_MIN) return 'BRONZE';
  return 'FAIL';
}

function getXP(tier) {
  switch (tier) {
    case 'GOLD': return CONFIG.GOLD_XP;
    case 'SILVER': return CONFIG.SILVER_XP;
    case 'BRONZE': return CONFIG.BRONZE_XP;
    default: return CONFIG.FAIL_XP;
  }
}

// ============================================
// Claim Code Generator
// ============================================
function makeInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'XX';

  const first = parts[0][0] || 'X';
  const last = parts.length === 1
    ? parts[0][parts[0].length - 1]
    : parts[parts.length - 1][0] || 'X';

  return (first + last).toUpperCase();
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray;
}

async function hash6(input) {
  const bytes = await sha256(input);

  // Convert first 4 bytes to number
  let num = 0;
  for (let i = 0; i < 4; i++) {
    num = (num << 8) + (bytes[i] & 0xff);
  }

  // Convert to base36 and take first 6 chars
  const out = Math.abs(num).toString(36).toUpperCase();
  return out.padStart(6, '0').slice(0, 6);
}

async function generateClaimCode(tier, name, email) {
  if (tier === 'FAIL') return '';

  const initials = makeInitials(name);
  const input = `${email.toLowerCase()}|${CONFIG.LESSON_CODE}|${tier}|${CONFIG.HASH_SALT}`;
  const hashValue = await hash6(input);

  return `${CONFIG.LESSON_CODE}-${tier}-${initials}-${hashValue}`;
}

// ============================================
// Results Display
// ============================================
async function showResults() {
  const { score, total, results } = calculateScore();
  const tier = getTier(score);
  const xp = getXP(tier);
  const claimCode = await generateClaimCode(tier, state.student.name, state.student.email);

  // Update state
  state.score = score;
  state.tier = tier;
  state.claimCode = claimCode;
  saveState();

  // Update analyst info
  document.getElementById('analystInfo').textContent =
    `Analyst: ${state.student.name}  |  ${state.student.email}`;

  // Update score
  document.getElementById('scoreValue').textContent = score;

  // Update tier
  const tierBox = document.getElementById('tierBox');
  tierBox.className = 'tier-box ' + tier.toLowerCase();
  document.getElementById('tierValue').textContent = tier === 'FAIL' ? 'NOT YET' : tier;
  document.getElementById('xpValue').textContent = `${xp} XP`;

  // Update claim code
  document.getElementById('claimCode').textContent = claimCode || 'NO CLAIM CODE — RUN SIM AGAIN';

  // Generate breakdown
  generateBreakdown(results);

  // Navigate to results
  navigateToPhase('results');

  // Show confetti for Gold
  if (tier === 'GOLD') {
    showConfetti();
  }
}

function generateBreakdown(results) {
  const breakdown = document.getElementById('resultsBreakdown');
  breakdown.innerHTML = '';

  const phaseNames = {
    phase1: 'Phase 1: Initial Leverage Read',
    phase2: 'Phase 2: Leverage Shifts',
    phase3: 'Phase 3: Drivers',
    phase4: 'Phase 4: Walk-Away Test'
  };

  Object.entries(PHASE_QUESTIONS).forEach(([phase, questions]) => {
    const phaseResults = questions.map(q => results[q]);
    const phaseCorrect = phaseResults.filter(r => r.isCorrect).length;
    const phaseTotal = questions.length;

    const phaseDiv = document.createElement('div');
    phaseDiv.className = 'breakdown-phase';

    const isPerfect = phaseCorrect === phaseTotal;

    phaseDiv.innerHTML = `
      <div class="breakdown-header">
        <span>${phaseNames[phase]}</span>
        <span class="breakdown-score ${isPerfect ? 'perfect' : ''}">${phaseCorrect}/${phaseTotal}</span>
      </div>
    `;

    breakdown.appendChild(phaseDiv);
  });
}

// ============================================
// Review Mode
// ============================================
function showReviewMode() {
  // Mark correct/incorrect answers
  Object.entries(ANSWER_KEY).forEach(([questionId, correctAnswer]) => {
    const optionGroup = document.querySelector(`[data-question="${questionId}"]`);
    if (!optionGroup) return;

    optionGroup.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.remove('correct', 'incorrect');

      if (btn.dataset.value === correctAnswer) {
        btn.classList.add('correct');
      } else if (btn.classList.contains('selected')) {
        btn.classList.add('incorrect');
      }
    });
  });

  // Navigate to Phase 1
  navigateToPhase('1');
  showToast('Review mode: Green = correct, Red = your incorrect answers');
}

// ============================================
// Restart
// ============================================
function restartSim() {
  // Clear state
  state = {
    currentPhase: 'intro',
    student: state.student, // Keep student info
    answers: {},
    score: 0,
    tier: '',
    claimCode: ''
  };
  saveState();

  // Clear UI selections
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.remove('selected', 'correct', 'incorrect');
  });

  // Reset nav buttons
  updateNavButtons();

  // Go to intro
  navigateToPhase('intro');

  showToast('Simulation reset. Good luck!');
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// ============================================
// Copy to Clipboard
// ============================================
function copyClaimCode() {
  const code = state.claimCode;
  if (!code) return;

  navigator.clipboard.writeText(code).then(() => {
    showToast('Claim code copied to clipboard!');
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = code;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Claim code copied to clipboard!');
  });
}

// ============================================
// Confetti Effect
// ============================================
function showConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#B45309', '#FCD34D', '#F59E0B', '#FBBF24', '#D97706'];

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%;
      top: -10px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    container.appendChild(confetti);
  }

  // Add animation keyframes
  if (!document.getElementById('confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'confetti-styles';
    style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Remove after animation
  setTimeout(() => {
    container.remove();
  }, 5000);
}

// ============================================
// Validation
// ============================================
function validateIdentity() {
  const name = document.getElementById('studentName').value.trim();
  const email = document.getElementById('studentEmail').value.trim();

  if (!name) {
    showToast('Please enter your full name');
    document.getElementById('studentName').focus();
    return false;
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    showToast('Please enter a valid email address');
    document.getElementById('studentEmail').focus();
    return false;
  }

  state.student.name = name;
  state.student.email = email;
  saveState();

  return true;
}

// ============================================
// Event Listeners
// ============================================
function initEventListeners() {
  // Start button
  document.getElementById('startSim').addEventListener('click', () => {
    if (validateIdentity()) {
      navigateToPhase('1');
    }
  });

  // Back to intro
  document.getElementById('backToIntro').addEventListener('click', () => {
    navigateToPhase('intro');
  });

  // Phase 1 -> 2
  document.getElementById('toPhase2').addEventListener('click', () => {
    navigateToPhase('2');
  });

  // Phase 2 -> 1
  document.getElementById('backToPhase1').addEventListener('click', () => {
    navigateToPhase('1');
  });

  // Phase 2 -> 3
  document.getElementById('toPhase3').addEventListener('click', () => {
    navigateToPhase('3');
  });

  // Phase 3 -> 2
  document.getElementById('backToPhase2').addEventListener('click', () => {
    navigateToPhase('2');
  });

  // Phase 3 -> 4
  document.getElementById('toPhase4').addEventListener('click', () => {
    navigateToPhase('4');
  });

  // Phase 4 -> 3
  document.getElementById('backToPhase3').addEventListener('click', () => {
    navigateToPhase('3');
  });

  // Submit
  document.getElementById('submitSim').addEventListener('click', () => {
    showResults();
  });

  // Review answers
  document.getElementById('reviewAnswers').addEventListener('click', () => {
    showReviewMode();
  });

  // Restart
  document.getElementById('restartSim').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the simulation? Your answers will be cleared.')) {
      restartSim();
    }
  });

  // Copy claim code
  document.getElementById('copyCode').addEventListener('click', () => {
    copyClaimCode();
  });

  // Enter key on form inputs
  document.getElementById('studentName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('studentEmail').focus();
    }
  });

  document.getElementById('studentEmail').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('startSim').click();
    }
  });
}

// ============================================
// Keyboard Navigation
// ============================================
function initKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    // Escape to go back
    if (e.key === 'Escape') {
      const currentIndex = phases.indexOf(state.currentPhase);
      if (currentIndex > 0 && state.currentPhase !== 'results') {
        navigateToPhase(phases[currentIndex - 1]);
      }
    }
  });
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initAnswerOptions();
  initEventListeners();
  initKeyboardNav();
  loadState();
  updateNavButtons();

  // If returning to a session, show toast
  if (Object.keys(state.answers).length > 0 && state.currentPhase === 'intro') {
    showToast('Welcome back! Your progress has been saved.');
  }
});
