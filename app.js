/****************************
 * รอให้ DOM โหลดเสร็จก่อน
 ****************************/
document.addEventListener('DOMContentLoaded', () => {

/****************************
 * 📊 GLOBAL DATA VARIABLES
 ****************************/

// Global variables for data management
let originalData = [];
let currentSort = { column: 'created_at', direction: 'desc' };
let currentFilter = '';
let currentPage = 1;
let itemsPerPage = 10;

// Global variables for modal state
let currentEditingItem = null;
let currentDeletingItem = null;

// Global variables for bulk actions
let selectedItems = new Set();

/****************************
 * 🍞 TOAST NOTIFICATION SYSTEM
 ****************************/

let toastCounter = 0;

function showToast(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toastId = `toast-${++toastCounter}`;
  
  // Icon mapping
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  // Title mapping
  const titles = {
    success: 'สำเร็จ',
    error: 'เกิดข้อผิดพลาด',
    warning: 'คำเตือน',
    info: 'ข้อมูล'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.id = toastId;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${titles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="ปิด" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // Add progress bar if duration is set
  if (duration > 0) {
    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    progress.style.width = '100%';
    toast.appendChild(progress);
    
    // Animate progress
    setTimeout(() => {
      progress.style.width = '0%';
      progress.style.transition = `width ${duration}ms linear`;
    }, 10);
  }

  // Close button handler
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });

  // Add to container
  container.appendChild(toast);

  // Announce to screen reader
  announceToScreenReader(`${titles[type]}: ${message}`);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }

  return toastId;
}

function removeToast(toast) {
  if (!toast) return;
  
  toast.classList.add('removing');
  toast.addEventListener('animationend', () => {
    toast.remove();
  });
}

function removeAllToasts() {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toasts = container.querySelectorAll('.toast');
  toasts.forEach(toast => removeToast(toast));
}

/****************************
 * ♿ ACCESSIBILITY HELPERS
 ****************************/

// Announce messages to screen readers
function announceToScreenReader(message) {
  const liveRegion = document.getElementById('ariaLiveRegion');
  if (liveRegion) {
    liveRegion.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}

// Enhanced showAuthMessage with screen reader support
function showAuthMessageAccessible(message, type = 'info') {
  showAuthMessage(message, type);
  announceToScreenReader(message);
}

/****************************
 * 🌙 DARK MODE TOGGLE
 ****************************/

const darkModeToggle = document.getElementById('darkModeToggle');
const sunIcon = darkModeToggle.querySelector('.sun-icon');
const moonIcon = darkModeToggle.querySelector('.moon-icon');

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';

// Apply saved theme on load
if (currentTheme === 'dark') {
  document.documentElement.classList.add('dark-mode');
  sunIcon.classList.add('d-none');
  moonIcon.classList.remove('d-none');
}

// Toggle dark mode
darkModeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark-mode');
  
  const isDark = document.documentElement.classList.contains('dark-mode');
  
  // Toggle icons
  sunIcon.classList.toggle('d-none', isDark);
  moonIcon.classList.toggle('d-none', !isDark);
  
  // Save preference
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  // Announce to screen readers
  announceToScreenReader(isDark ? 'เปิดโหมดมืด' : 'เปิดโหมดสว่าง');
});

/****************************
 * � RATE LIMITING (Client-side)
 ****************************/

const rateLimiter = {
  attempts: {},
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  
  isRateLimited(key) {
    const now = Date.now();
    const userAttempts = this.attempts[key] || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    this.attempts[key] = recentAttempts;
    
    if (recentAttempts.length >= this.maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts);
      const timeLeft = Math.ceil((this.windowMs - (now - oldestAttempt)) / 1000 / 60);
      return { limited: true, timeLeft };
    }
    
    return { limited: false };
  },
  
  recordAttempt(key) {
    if (!this.attempts[key]) {
      this.attempts[key] = [];
    }
    this.attempts[key].push(Date.now());
  },
  
  reset(key) {
    delete this.attempts[key];
  }
};

/****************************
 * �🔑 PASSWORD TOGGLE FUNCTIONALITY
 ****************************/
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('loginPassword');
const eyeIcon = togglePasswordBtn.querySelector('.eye-icon');
const eyeOffIcon = togglePasswordBtn.querySelector('.eye-off-icon');

togglePasswordBtn.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  
  // Toggle icons
  eyeIcon.classList.toggle('d-none');
  eyeOffIcon.classList.toggle('d-none');
});

/****************************
 * 🔒 PASSWORD STRENGTH CHECKER
 ****************************/
const passwordStrengthDiv = document.getElementById('passwordStrength');
const passwordRequirements = document.getElementById('passwordRequirements');
const passwordRequirementsBtn = document.getElementById('passwordRequirementsBtn');

// Toggle password requirements tooltip
passwordRequirementsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  passwordRequirements.classList.toggle('d-none');
});

// Show requirements on focus, hide on blur
passwordInput.addEventListener('focus', () => {
  passwordRequirements.classList.remove('d-none');
});

passwordInput.addEventListener('blur', () => {
  setTimeout(() => {
    passwordRequirements.classList.add('d-none');
  }, 200);
});

// Check individual password requirements
function checkPasswordRequirements(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  // Update UI for each requirement
  document.getElementById('req-length').classList.toggle('met', requirements.length);
  document.getElementById('req-uppercase').classList.toggle('met', requirements.uppercase);
  document.getElementById('req-lowercase').classList.toggle('met', requirements.lowercase);
  document.getElementById('req-number').classList.toggle('met', requirements.number);
  document.getElementById('req-special').classList.toggle('met', requirements.special);
  
  return requirements;
}

passwordInput.addEventListener('input', () => {
  const password = passwordInput.value;
  
  // Update requirements checklist
  if (password.length > 0) {
    checkPasswordRequirements(password);
  }
  
  if (password.length === 0) {
    passwordStrengthDiv.classList.add('d-none');
    return;
  }
  
  const strength = checkPasswordStrength(password);
  passwordStrengthDiv.classList.remove('d-none');
  passwordStrengthDiv.className = 'password-strength mt-1';
  
  if (strength.score === 0) {
    passwordStrengthDiv.classList.add('weak');
    passwordStrengthDiv.textContent = `อ่อนแอ: ${strength.feedback}`;
  } else if (strength.score === 1) {
    passwordStrengthDiv.classList.add('medium');
    passwordStrengthDiv.textContent = `ปานกลาง: ${strength.feedback}`;
  } else {
    passwordStrengthDiv.classList.add('strong');
    passwordStrengthDiv.textContent = `แข็งแกร่ง: ${strength.feedback}`;
  }
});

function checkPasswordStrength(password) {
  let score = 0;
  let feedback = [];
  
  // Length check
  if (password.length >= 8) {
    score++;
    feedback.push('ความยาวดี');
  } else {
    feedback.push('ควรมีอย่างน้อย 8 ตัวอักษร');
  }
  
  // Complexity checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
    feedback.push('มีตัวพิมพ์เล็กและใหญ่');
  } else {
    feedback.push('ควรมีตัวพิมพ์เล็กและใหญ่');
  }
  
  if (/\d/.test(password)) {
    score += 0.5;
    feedback.push('มีตัวเลข');
  } else {
    feedback.push('ควรมีตัวเลข');
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 0.5;
    feedback.push('มีอักขระพิเศษ');
  } else {
    feedback.push('ควรมีอักขระพิเศษ');
  }
  
  // Normalize score to 0, 1, or 2
  const normalizedScore = score < 1 ? 0 : score < 2 ? 1 : 2;
  
  return {
    score: normalizedScore,
    feedback: feedback.slice(0, 2).join(', ')
  };
}

/****************************
 * 💾 REMEMBER ME FUNCTIONALITY
 ****************************/
const rememberMeCheckbox = document.getElementById('rememberMe');
const loginEmailInput = document.getElementById('loginEmail');

// Load saved email on page load
const savedEmail = localStorage.getItem('rememberedEmail');
if (savedEmail) {
  loginEmailInput.value = savedEmail;
  rememberMeCheckbox.checked = true;
}

// Save/remove email based on checkbox
rememberMeCheckbox.addEventListener('change', () => {
  if (!rememberMeCheckbox.checked) {
    localStorage.removeItem('rememberedEmail');
  }
});

/****************************
 * 📧 EMAIL VALIDATION REALTIME
 ****************************/

// Email validation regex
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get email input elements early
const loginEmailError = document.getElementById('loginEmailError');
const resetEmailInput = document.getElementById('resetEmail');
const resetEmailError = document.getElementById('resetEmailError');

// Validate email and show feedback
function validateEmailInput(inputElement, errorElement) {
  const email = inputElement.value.trim();
  const wrapper = inputElement.closest('.email-input-wrapper');
  const validationIcon = wrapper.querySelector('.email-validation-icon');
  const checkIcon = validationIcon.querySelector('.check-icon');
  const xIcon = validationIcon.querySelector('.x-icon');
  
  // Clear previous state
  inputElement.classList.remove('email-valid', 'email-invalid');
  checkIcon.classList.add('d-none');
  xIcon.classList.add('d-none');
  errorElement.classList.add('d-none');
  
  if (email.length === 0) {
    // Empty - no validation
    return true;
  }
  
  if (isValidEmail(email)) {
    // Valid email
    inputElement.classList.add('email-valid');
    checkIcon.classList.remove('d-none');
    return true;
  } else {
    // Invalid email
    inputElement.classList.add('email-invalid');
    xIcon.classList.remove('d-none');
    
    // Show error message
    if (email.length > 0) {
      if (!email.includes('@')) {
        errorElement.textContent = '⚠️ อีเมลต้องมี @';
      } else if (!email.includes('.')) {
        errorElement.textContent = '⚠️ รูปแบบอีเมลไม่ถูกต้อง';
      } else {
        errorElement.textContent = '⚠️ รูปแบบอีเมลไม่ถูกต้อง';
      }
      errorElement.classList.remove('d-none');
    }
    return false;
  }
}

// Login email validation
loginEmailInput.addEventListener('input', () => {
  validateEmailInput(loginEmailInput, loginEmailError);
});

loginEmailInput.addEventListener('blur', () => {
  validateEmailInput(loginEmailInput, loginEmailError);
});

// Reset email validation
resetEmailInput.addEventListener('input', () => {
  validateEmailInput(resetEmailInput, resetEmailError);
});

resetEmailInput.addEventListener('blur', () => {
  validateEmailInput(resetEmailInput, resetEmailError);
});

/****************************
 * PWA / UI เดิม
 ****************************/

// Button test
document.getElementById('btn').addEventListener('click', () => {
  document.getElementById('status').textContent = '✅ Button Clicked';
});

// Online / Offline
window.addEventListener('online', () => {
  document.getElementById('status').textContent = '🟢 Online';
});

window.addEventListener('offline', () => {
  document.getElementById('status').textContent = '🔴 Offline';
});

// PWA Install Banner
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  installBtn.classList.add('hidden');
  await deferredPrompt.prompt();
  deferredPrompt = null;
});


/****************************
 * Supabase Config (CDN)
 ****************************/

const SUPABASE_URL = 'https://vlqhwnsdheoljyexkpls.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscWh3bnNkaGVvbGp5ZXhrcGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MzE2MjAsImV4cCI6MjA4MzMwNzYyMH0.AWHo-1nnu9hdVUivKLC2O98wQhDFA7nhTE1qt9ZeZfs';

// Check if Supabase is loaded
if (!window.supabase) {
  console.error('❌ Supabase SDK not loaded! Check if the CDN script is working.');
  showToast('เกิดข้อผิดพลาด: ไม่สามารถโหลด Supabase SDK กรุณา refresh หน้าเว็บ', 'error', 0);
}

// ✅ สำคัญ: ใช้ window.supabase และตั้งชื่อใหม่เป็น db
// ใช้ localStorage โดยตรง ไม่ใช้ custom adapter
const db = window.supabase?.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
);

if (!db) {
  console.error('❌ Failed to create Supabase client');
} else {
  console.log('✅ Supabase client created with persistent storage');
}

console.log('🔍 Supabase check:', {
  sdkLoaded: !!window.supabase,
  clientCreated: !!db,
  localStorage: !!window.localStorage
});

// Test localStorage
try {
  localStorage.setItem('test', 'works');
  const testValue = localStorage.getItem('test');
  console.log('✅ localStorage test:', testValue);
  localStorage.removeItem('test');
} catch (e) {
  console.error('❌ localStorage blocked:', e);
}

// Check current session immediately
setTimeout(async () => {
  const { data: { session } } = await db.auth.getSession();
  console.log('🔍 Current session:', session);
  console.log('📦 All localStorage keys:', Object.keys(localStorage));
  
  if (session) {
    console.log('🎯 Session found! Should show app now...');
    console.log('🔍 Checking if checkAuthStatus will be called...');
  } else {
    console.log('❌ No session found in initial check');
  }
}, 1000);


/****************************
 * 🔐 AUTHENTICATION SYSTEM
 ****************************/

// ตรวจสอบสถานะการล็อกอินเมื่อโหลดหน้า
async function checkAuthStatus() {
  console.log('🔍 Checking auth status...');
  console.log('📦 localStorage keys at check:', Object.keys(localStorage));
  
  try {
    const { data: { session }, error } = await db.auth.getSession();
    
    console.log('🔍 getSession result:', { session: !!session, error });
    
    if (error) {
      console.error('❌ Error getting session:', error);
      showLogin();
      return;
    }
    
    if (session) {
      console.log('✅ User is logged in:', session.user.email);
      showApp(session.user);
    } else {
      console.log('ℹ️ No active session, showing login');
      console.log('📦 But localStorage has:', Object.keys(localStorage));
      showLogin();
    }
  } catch (err) {
    console.error('❌ Exception in checkAuthStatus:', err);
    showLogin();
  }
}

// แสดงหน้าล็อกอิน
function showLogin() {
  console.log('📱 Showing login page');
  document.getElementById('loginContainer').classList.remove('d-none');
  document.getElementById('appContainer').classList.add('d-none');
  
  // Reset all initialization flags when logging out
  resetInitializationFlags();
}

// Reset all initialization flags to allow fresh setup on next login
function resetInitializationFlags() {
  console.log('🔄 Resetting all initialization flags');
  
  // Remove document-level event listeners
  if (typeof userDropdownHandlers !== 'undefined' && userDropdownHandlers.closeOutsideHandler) {
    document.removeEventListener('click', userDropdownHandlers.closeOutsideHandler);
    userDropdownHandlers.closeOutsideHandler = null;
  }
  
  // Reset flags
  if (typeof userDropdownHandlers !== 'undefined') {
    userDropdownHandlers.isInitialized = false;
  }
  if (typeof dataManagementHandlers !== 'undefined') {
    dataManagementHandlers.isInitialized = false;
  }
  if (typeof helloButtonHandlers !== 'undefined') {
    helloButtonHandlers.isInitialized = false;
  }
  
  console.log('✅ All flags and listeners reset');
}

// แสดงหน้าแอปหลัก
async function showApp(user) {
  console.log('🚀 Showing app for user:', user?.email);
  document.getElementById('loginContainer').classList.add('d-none');
  document.getElementById('appContainer').classList.remove('d-none');
  
  // แสดงข้อมูลผู้ใช้
  if (user && user.email) {
    const emailElements = document.querySelectorAll('#userEmail, #dropdownEmail');
    emailElements.forEach(el => {
      if (el) el.textContent = user.email;
    });
    
    // Update avatar with first letter or saved avatar
    const savedAvatar = localStorage.getItem('userAvatar');
    const firstLetter = user.email.charAt(0).toUpperCase();
    const avatarToUse = savedAvatar || firstLetter;
    
    const avatarElements = document.querySelectorAll('.user-avatar, .dropdown-avatar');
    avatarElements.forEach(avatar => {
      if (avatar) avatar.textContent = avatarToUse;
    });
    
    // Update dropdown meta info
    const createdDate = new Date(user.created_at);
    const formattedDate = createdDate.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const dropdownMeta = document.getElementById('dropdownMeta');
    if (dropdownMeta) {
      dropdownMeta.textContent = `สมาชิกตั้งแต่: ${formattedDate}`;
    }
  }
  
  // Setup user dropdown menu after app is shown
  setupUserDropdown();
  
  // Setup profile modal
  setupProfileModal();
  
  // Setup change password modal
  setupChangePasswordModal();
  
  // Setup avatar picker
  setupAvatarPicker();
  
  // Setup data management buttons
  setupDataManagement();
  
  // Setup hello user button
  setupHelloUserButton();
  
  // Load user profile data
  await loadUserProfile();
  
  // Auto-load data
  loadData();
}

// แสดงข้อความ
function showAuthMessage(message, type = 'info') {
  const authMessage = document.getElementById('authMessage');
  authMessage.textContent = message;
  authMessage.className = `alert alert-${type} mt-3`;
  authMessage.classList.remove('d-none');
  
  // ซ่อนข้อความหลัง 5 วินาที
  setTimeout(() => {
    authMessage.classList.add('d-none');
  }, 5000);
}

// Helper function for button loading state
function setButtonLoading(button, isLoading) {
  const btnText = button.querySelector('.btn-text');
  const spinner = button.querySelector('.spinner-border');
  
  if (isLoading) {
    button.disabled = true;
    button.classList.add('loading');
    spinner.classList.remove('d-none');
  } else {
    button.disabled = false;
    button.classList.remove('loading');
    spinner.classList.add('d-none');
  }
}

// Add shake animation on error
function shakeElement(element) {
  element.classList.add('shake');
  setTimeout(() => {
    element.classList.remove('shake');
  }, 500);
}

// Add success pulse animation
function pulseSuccess(element) {
  element.classList.add('pulse-success');
  setTimeout(() => {
    element.classList.remove('pulse-success');
  }, 1000);
}

// Login Form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = document.getElementById('loginSubmitBtn');
  
  // Check rate limiting
  const rateLimitCheck = rateLimiter.isRateLimited('login');
  if (rateLimitCheck.limited) {
    showToast(`พยายามเข้าสู่ระบบมากเกินไป กรุณารอ ${rateLimitCheck.timeLeft} นาที`, 'warning');
    shakeElement(document.getElementById('loginForm'));
    return;
  }
  
  // Validate email before submission
  if (!isValidEmail(email)) {
    validateEmailInput(loginEmailInput, loginEmailError);
    showToast('กรุณากรอกอีเมลให้ถูกต้อง', 'warning');
    shakeElement(loginEmailInput);
    return;
  }
  
  // Show loading state
  setButtonLoading(submitBtn, true);
  
  console.log('🔐 Attempting login for:', email);
  
  try {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });
    
    // Hide loading state
    setButtonLoading(submitBtn, false);
    
    if (error) {
      console.error('❌ Login error:', error);
      rateLimiter.recordAttempt('login');
      showToast(error.message, 'error');
      shakeElement(document.getElementById('loginForm'));
    } else {
      console.log('✅ Login successful!', data);
      rateLimiter.reset('login');
      
      // Check if session was saved
      setTimeout(() => {
        const savedToken = localStorage.getItem('sb-vlqhwnsdheoljyexkpls-auth-token');
        console.log('🔍 Token saved after login?', savedToken ? 'YES ✅' : 'NO ❌');
        if (savedToken) {
          console.log('📝 Token preview:', savedToken.substring(0, 50) + '...');
        }
      }, 500);
      
      // Save email if remember me is checked
      if (rememberMeCheckbox.checked) {
        localStorage.setItem('rememberedEmail', email);
      }
      
      showToast('เข้าสู่ระบบสำเร็จ!', 'success', 2000);
      pulseSuccess(submitBtn);
      
      // Wait for animation then show app
      setTimeout(() => {
        console.log('🚀 Switching to app view...');
        showApp(data.user);
      }, 1000);
    }
  } catch (err) {
    console.error('❌ Exception during login:', err);
    setButtonLoading(submitBtn, false);
    showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    shakeElement(document.getElementById('loginForm'));
  }
});

// Signup Button
document.getElementById('signupBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const signupBtn = document.getElementById('signupBtn');
  
  if (!email || !password) {
    showToast('กรุณากรอกอีเมลและรหัสผ่าน', 'warning');
    return;
  }
  
  // Validate email before signup
  if (!isValidEmail(email)) {
    validateEmailInput(loginEmailInput, loginEmailError);
    showToast('กรุณากรอกอีเมลให้ถูกต้อง', 'warning');
    return;
  }
  
  if (password.length < 6) {
    showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'warning');
    return;
  }
  
  // Show loading state
  setButtonLoading(signupBtn, true);
  
  const { data, error } = await db.auth.signUp({
    email,
    password
  });
  
  // Hide loading state
  setButtonLoading(signupBtn, false);
  
  if (error) {
    showToast(error.message, 'error');
  } else {
    // Show success message with email verification instruction
    showToast('ส่งอีเมลยืนยันแล้ว! กรุณาตรวจสอบอีเมลของคุณ', 'success', 8000);
    
    // Show additional modal with instructions
    showEmailVerificationModal(email);
  }
});

// Email Verification Modal
function showEmailVerificationModal(email) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'emailVerificationModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  
  modal.innerHTML = `
    <div class="modal-content verification-modal" style="max-width: 480px;">
      <div class="modal-header">
        <h3>📧 ยืนยันอีเมลของคุณ</h3>
        <button type="button" class="modal-close-btn" onclick="document.getElementById('emailVerificationModal').remove()" aria-label="ปิดหน้าต่าง">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div style="text-align: center; padding: 1rem 0;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">📬</div>
          <h4 style="margin-bottom: 1rem;">เราได้ส่งอีเมลยืนยันไปที่:</h4>
          <p style="font-weight: 600; color: hsl(var(--primary)); font-size: 1rem; margin-bottom: 1.5rem;">${email}</p>
          
          <div style="text-align: left; background: hsl(var(--accent)); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem;">
            <p style="margin-bottom: 0.5rem;"><strong>📌 ขั้นตอนต่อไป:</strong></p>
            <ol style="margin: 0; padding-left: 1.5rem; line-height: 1.8;">
              <li>เปิดอีเมลของคุณ</li>
              <li>ค้นหาอีเมลจาก <strong>Supabase</strong></li>
              <li>คลิกลิงก์ยืนยันในอีเมล</li>
              <li>กลับมาเข้าสู่ระบบ</li>
            </ol>
          </div>
          
          <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground)); margin-bottom: 1rem;">
            <strong>เคล็ดลับ:</strong> ถ้าไม่เห็นอีเมล ลองตรวจสอบใน Spam/Junk folder
          </p>
          
          <button class="btn btn-primary w-100" onclick="document.getElementById('emailVerificationModal').remove()">
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Close on ESC key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

/****************************
 * 🔑 OAUTH LOGIN (GitHub & Google)
 ****************************/

// GitHub Login
document.getElementById('githubLoginBtn').addEventListener('click', async () => {
  const githubBtn = document.getElementById('githubLoginBtn');
  
  try {
    githubBtn.disabled = true;
    githubBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังเชื่อมต่อ...';
    
    const { data, error } = await db.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    
  } catch (error) {
    console.error('GitHub login error:', error);
    showToast('ไม่สามารถเข้าสู่ระบบด้วย GitHub ได้: ' + error.message, 'error');
    
    // Reset button
    githubBtn.disabled = false;
    githubBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="me-1">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      GitHub
    `;
  }
});

// Google Login
document.getElementById('googleLoginBtn').addEventListener('click', async () => {
  const googleBtn = document.getElementById('googleLoginBtn');
  
  try {
    googleBtn.disabled = true;
    googleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังเชื่อมต่อ...';
    
    const { data, error } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    
  } catch (error) {
    console.error('Google login error:', error);
    showToast('ไม่สามารถเข้าสู่ระบบด้วย Google ได้: ' + error.message, 'error');
    
    // Reset button
    googleBtn.disabled = false;
    googleBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="me-1">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Google
    `;
  }
});

/****************************
 * 🔑 FORGOT PASSWORD FUNCTIONALITY
 ****************************/

const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeForgotModal = document.getElementById('closeForgotModal');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
// resetEmailInput and resetEmailError already declared in EMAIL VALIDATION section
const resetPasswordBtn = document.getElementById('resetPasswordBtn');

// Open modal
forgotPasswordLink.addEventListener('click', (e) => {
  e.preventDefault();
  forgotPasswordModal.classList.remove('d-none');
  const loginEmail = document.getElementById('loginEmail').value.trim();
  resetEmailInput.value = loginEmail; // Pre-fill with login email
  
  // Validate pre-filled email
  if (loginEmail) {
    setTimeout(() => {
      validateEmailInput(resetEmailInput, resetEmailError);
    }, 100);
  }
  
  resetEmailInput.focus();
});

// Close modal
closeForgotModal.addEventListener('click', () => {
  forgotPasswordModal.classList.add('d-none');
});

// Close modal on overlay click
forgotPasswordModal.addEventListener('click', (e) => {
  if (e.target === forgotPasswordModal) {
    forgotPasswordModal.classList.add('d-none');
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !forgotPasswordModal.classList.contains('d-none')) {
    forgotPasswordModal.classList.add('d-none');
  }
});

// Handle forgot password form submission
forgotPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = resetEmailInput.value.trim();
  const resetMessage = document.getElementById('resetMessage');
  
  // Validate email before submission
  if (!isValidEmail(email)) {
    validateEmailInput(resetEmailInput, resetEmailError);
    resetMessage.textContent = '⚠️ กรุณากรอกอีเมลให้ถูกต้อง';
    resetMessage.className = 'alert alert-warning mt-3';
    resetMessage.classList.remove('d-none');
    return;
  }
  
  // Show loading state
  setButtonLoading(resetPasswordBtn, true);
  
  try {
    const { data, error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });
    
    if (error) throw error;
    
    // Show success message
    resetMessage.textContent = '✅ ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย';
    resetMessage.className = 'alert alert-success mt-3';
    resetMessage.classList.remove('d-none');
    
    // Clear form
    resetEmailInput.value = '';
    
    // Close modal after 3 seconds
    setTimeout(() => {
      forgotPasswordModal.classList.add('d-none');
      resetMessage.classList.add('d-none');
    }, 3000);
    
  } catch (error) {
    console.error('Password reset error:', error);
    resetMessage.textContent = '❌ เกิดข้อผิดพลาด: ' + error.message;
    resetMessage.className = 'alert alert-danger mt-3';
    resetMessage.classList.remove('d-none');
  } finally {
    // Hide loading state
    setButtonLoading(resetPasswordBtn, false);
  }
});

/****************************
 * ⌨️ KEYBOARD SHORTCUTS
 ****************************/

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // ESC key - Close modals
  if (e.key === 'Escape') {
    if (!forgotPasswordModal.classList.contains('d-none')) {
      forgotPasswordModal.classList.add('d-none');
    }
    const userProfileModal = document.getElementById('userProfileModal');
    if (userProfileModal && !userProfileModal.classList.contains('d-none')) {
      userProfileModal.classList.add('d-none');
    }
    const changePasswordModal = document.getElementById('changePasswordModal');
    if (changePasswordModal && !changePasswordModal.classList.contains('d-none')) {
      changePasswordModal.classList.add('d-none');
    }
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown && !userDropdown.classList.contains('d-none')) {
      if (window.closeUserDropdown) {
        window.closeUserDropdown();
      }
    }
  }
  
  // Ctrl/Cmd + K - Focus on search (if logged in)
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('searchInput');
    if (searchInput && !document.getElementById('appContainer').classList.contains('d-none')) {
      searchInput.focus();
      searchInput.select();
    }
  }
  
  // Alt + L - Focus on login email (if on login page)
  if (e.altKey && e.key === 'l') {
    e.preventDefault();
    if (!document.getElementById('loginContainer').classList.contains('d-none')) {
      loginEmailInput.focus();
    }
  }
  
  // Alt + P - Focus on password (if on login page)
  if (e.altKey && e.key === 'p') {
    e.preventDefault();
    if (!document.getElementById('loginContainer').classList.contains('d-none')) {
      passwordInput.focus();
    }
  }
  
  // Alt + F - Open forgot password modal
  if (e.altKey && e.key === 'f') {
    e.preventDefault();
    if (!document.getElementById('loginContainer').classList.contains('d-none')) {
      forgotPasswordLink.click();
    }
  }
});

// Enter key on email field - Move to password field
loginEmailInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    passwordInput.focus();
  }
});

// Enter key on password field - Submit form
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // Let the form's submit event handle it
    document.getElementById('loginForm').requestSubmit();
  }
});

// Enter key in forgot password modal - Submit form
resetEmailInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    forgotPasswordForm.requestSubmit();
  }
});

// Tab key handling for better focus management
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    // Add visible focus indicator
    document.body.classList.add('keyboard-navigation');
  }
});

// Mouse click - Remove keyboard navigation class
document.addEventListener('mousedown', () => {
  document.body.classList.remove('keyboard-navigation');
});

// Logout Button - Now handled in setupUserDropdown()
// Removed duplicate code to prevent errors

// ฟังการเปลี่ยนแปลง auth state
// Listen for auth state changes
let authInitialized = false;

db.auth.onAuthStateChange((event, session) => {
  console.log('🔄 Auth state changed:', event, session?.user?.email);
  
  if (event === 'INITIAL_SESSION') {
    authInitialized = true;
    if (session) {
      console.log('✅ Session restored from storage');
      showApp(session.user);
    } else {
      console.log('ℹ️ No stored session, showing login');
      showLogin();
    }
  } else if (event === 'SIGNED_IN' && session) {
    console.log('✅ User signed in');
    showApp(session.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out');
    showLogin();
  } else if (event === 'TOKEN_REFRESHED' && session) {
    console.log('🔄 Token refreshed');
  }
});

// Fallback if INITIAL_SESSION doesn't fire
setTimeout(() => {
  if (!authInitialized) {
    console.warn('⚠️ INITIAL_SESSION not fired, checking manually...');
    checkAuthStatus();
  }
}, 2000);


/****************************
 * Supabase READ
 ****************************/

async function loadData() {
  const loadingSpinner = document.getElementById('loadingSpinner');
  const errorMessage = document.getElementById('errorMessage');
  const tableContainer = document.getElementById('tableContainer');
  const dataTableBody = document.getElementById('dataTableBody');

  // Show loading skeleton instead of spinner
  loadingSpinner.classList.remove('d-none');
  errorMessage.classList.add('d-none');
  tableContainer.classList.add('d-none');
  
  // Show skeleton table
  showTableSkeleton();

  const { data, error } = await db
    .from('ID') // 👈 ชื่อตารางใน Supabase
    .select('*')
    .order('created_at', { ascending: false });

  loadingSpinner.classList.add('d-none');

  if (error) {
    console.error(error);
    showToast('Error loading data: ' + error.message, 'error');
    errorMessage.textContent = '❌ Error: ' + error.message;
    errorMessage.classList.remove('d-none');
    return;
  }

  // Store original data
  originalData = data;

  // Reset pagination and apply current sort and filter
  resetPagination();
  displayData();

  tableContainer.classList.remove('d-none');
  showToast('Data loaded successfully!', 'success', 2000);
}

/****************************
 * Edit and Delete Functions
 ****************************/

function enableEditMode(row, item) {
  // Store the item being edited
  currentEditingItem = item;
  
  // Get modal elements
  const editModal = document.getElementById('editItemModal');
  const editItemNameInput = document.getElementById('editItemName');
  const editCharCounter = document.getElementById('editCharCounter');
  
  // Populate modal with current values
  editItemNameInput.value = item.NAME || '';
  
  // Update character counter
  const length = editItemNameInput.value.length;
  editCharCounter.textContent = `${length}/100`;
  editCharCounter.classList.remove('warning', 'danger');
  if (length > 80) {
    editCharCounter.classList.add('danger');
  } else if (length > 50) {
    editCharCounter.classList.add('warning');
  }
  
  // Show modal
  editModal.classList.remove('d-none');
  setTimeout(() => {
    editModal.classList.add('show');
    editItemNameInput.focus();
    editItemNameInput.select();
  }, 10);
}

// Close Edit Modal function
function closeEditItemModal() {
  const editModal = document.getElementById('editItemModal');
  const editItemNameInput = document.getElementById('editItemName');
  const editItemNameError = document.getElementById('editItemNameError');
  const submitBtn = document.getElementById('submitEditItem');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner-border');
  
  editModal.classList.remove('show');
  setTimeout(() => {
    editModal.classList.add('d-none');
    editItemNameInput.value = '';
    editItemNameError.textContent = '';
    editItemNameError.classList.remove('show');
    currentEditingItem = null;
    
    // Reset button state
    submitBtn.disabled = false;
    btnText.textContent = 'บันทึกการเปลี่ยนแปลง';
    spinner.classList.add('d-none');
  }, 300);
}

function cancelEdit(row, originalName) {
  // This function is no longer needed for modal approach
  // But keeping it for compatibility
  closeEditItemModal();
}

async function saveEdit(row, itemId, newName) {
  if (!newName) {
    showToast('ชื่อรายการไม่สามารถว่างเปล่าได้', 'warning');
    return;
  }

  try {
    const { error } = await db
      .from('ID')
      .update({ NAME: newName })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating record:', error);
      showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
      return;
    }

    // Update local data
    const itemIndex = originalData.findIndex(d => d.id === itemId);
    if (itemIndex !== -1) {
      originalData[itemIndex].NAME = newName;
    }

    // Refresh display
    displayData();

    showToast('แก้ไขข้อมูลสำเร็จ!', 'success');
  } catch (error) {
    console.error('Error:', error);
    showToast('เกิดข้อผิดพลาดระหว่างการแก้ไข', 'error');
  }
}

function deleteRecord(itemId, itemName) {
  // Store the item being deleted
  currentDeletingItem = { id: itemId, name: itemName };
  
  // Get modal elements
  const deleteModal = document.getElementById('deleteConfirmModal');
  const deleteItemNameSpan = document.getElementById('deleteItemName');
  
  // Populate modal with item name
  deleteItemNameSpan.textContent = itemName || 'Unknown';
  
  // Show modal
  deleteModal.classList.remove('d-none');
  setTimeout(() => {
    deleteModal.classList.add('show');
  }, 10);
}

// Close Delete Confirmation Modal function
function closeDeleteConfirmModal() {
  const deleteModal = document.getElementById('deleteConfirmModal');
  const confirmBtn = document.getElementById('confirmDelete');
  const btnText = confirmBtn.querySelector('.btn-text');
  const spinner = confirmBtn.querySelector('.spinner-border');
  
  deleteModal.classList.remove('show');
  setTimeout(() => {
    deleteModal.classList.add('d-none');
    currentDeletingItem = null;
    
    // Reset button state
    confirmBtn.disabled = false;
    btnText.textContent = 'ลบรายการ';
    spinner.classList.add('d-none');
  }, 300);
}

async function performDelete(itemId, itemName) {
  try {
    const { error } = await db
      .from('ID')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting record:', error);
      showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
      return;
    }

    // Remove from local data
    originalData = originalData.filter(d => d.id !== itemId);

    // Refresh display
    displayData();

    showToast(`✅ ลบรายการ "${itemName}" สำเร็จ!`, 'success');
  } catch (error) {
    console.error('Error:', error);
    showToast('เกิดข้อผิดพลาดระหว่างการลบ', 'error');
  }
}

/****************************
 * Bulk Actions Functions
 ****************************/

function updateBulkActionsUI() {
  // Get all checked checkboxes
  const checkboxes = document.querySelectorAll('.row-checkbox:checked');
  selectedItems.clear();
  
  checkboxes.forEach(cb => {
    selectedItems.add(cb.dataset.itemId);
  });
  
  // Update UI
  const bulkActionsBar = document.getElementById('bulkActionsBar');
  const selectedCount = document.getElementById('selectedCount');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  
  if (bulkActionsBar) {
    if (selectedItems.size > 0) {
      bulkActionsBar.classList.remove('d-none');
      if (selectedCount) selectedCount.textContent = selectedItems.size;
    } else {
      bulkActionsBar.classList.add('d-none');
    }
  }
  
  // Update select all checkbox state
  if (selectAllCheckbox) {
    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    selectAllCheckbox.checked = allCheckboxes.length > 0 && checkboxes.length === allCheckboxes.length;
    selectAllCheckbox.indeterminate = checkboxes.length > 0 && checkboxes.length < allCheckboxes.length;
  }
  
  // Update CSV and PDF button text
  const csvBtnText = document.getElementById('csvBtnText');
  const pdfBtnText = document.getElementById('pdfBtnText');
  
  if (csvBtnText) {
    if (selectedItems.size > 0) {
      csvBtnText.textContent = `CSV (${selectedItems.size} รายการที่เลือก)`;
    } else {
      csvBtnText.textContent = 'CSV';
    }
  }
  
  if (pdfBtnText) {
    if (selectedItems.size > 0) {
      pdfBtnText.textContent = `PDF (${selectedItems.size} รายการที่เลือก)`;
    } else {
      pdfBtnText.textContent = 'PDF';
    }
  }
}

function selectAll() {
  const checkboxes = document.querySelectorAll('.row-checkbox');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  
  checkboxes.forEach(cb => {
    cb.checked = selectAllCheckbox.checked;
  });
  
  updateBulkActionsUI();
}

function deselectAll() {
  const checkboxes = document.querySelectorAll('.row-checkbox');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  
  checkboxes.forEach(cb => {
    cb.checked = false;
  });
  
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  }
  
  selectedItems.clear();
  updateBulkActionsUI();
}

function bulkDelete() {
  if (selectedItems.size === 0) {
    showToast('กรุณาเลือกรายการที่ต้องการลบ', 'warning');
    return;
  }
  
  // Get selected items names
  const selectedNames = Array.from(selectedItems).map(id => {
    const item = originalData.find(d => d.id === id);
    return item ? item.NAME || 'Unknown' : 'Unknown';
  });
  
  // Show bulk delete confirmation modal
  const bulkDeleteModal = document.getElementById('bulkDeleteModal');
  const bulkDeleteCount = document.getElementById('bulkDeleteCount');
  const bulkDeleteList = document.getElementById('bulkDeleteList');
  
  if (bulkDeleteCount) bulkDeleteCount.textContent = selectedItems.size;
  if (bulkDeleteList) {
    bulkDeleteList.innerHTML = selectedNames
      .slice(0, 5)
      .map(name => `<li>${name}</li>`)
      .join('');
    
    if (selectedNames.length > 5) {
      bulkDeleteList.innerHTML += `<li class="text-muted">และอีก ${selectedNames.length - 5} รายการ...</li>`;
    }
  }
  
  // Show modal
  bulkDeleteModal.classList.remove('d-none');
  setTimeout(() => {
    bulkDeleteModal.classList.add('show');
  }, 10);
}

async function confirmBulkDelete() {
  if (selectedItems.size === 0) return;
  
  const confirmBtn = document.getElementById('confirmBulkDelete');
  const btnText = confirmBtn.querySelector('.btn-text');
  const spinner = confirmBtn.querySelector('.spinner-border');
  
  // Show loading
  if (btnText) btnText.classList.add('d-none');
  if (spinner) spinner.classList.remove('d-none');
  confirmBtn.disabled = true;
  
  try {
    // Delete all selected items
    const deletePromises = Array.from(selectedItems).map(id =>
      db.from('ID').delete().eq('id', id)
    );
    
    const results = await Promise.all(deletePromises);
    
    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Some deletions failed:', errors);
      showToast(`ลบสำเร็จ ${selectedItems.size - errors.length}/${selectedItems.size} รายการ`, 'warning');
    } else {
      showToast(`✅ ลบ ${selectedItems.size} รายการสำเร็จ!`, 'success');
    }
    
    // Remove deleted items from local data
    originalData = originalData.filter(d => !selectedItems.has(d.id));
    
    // Clear selection
    selectedItems.clear();
    
    // Clear all checkboxes
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    }
    
    // Hide bulk actions bar
    const bulkActionsBar = document.getElementById('bulkActionsBar');
    if (bulkActionsBar) {
      bulkActionsBar.classList.add('d-none');
    }
    
    // Close modal and refresh
    closeBulkDeleteModal();
    displayData();
    
  } catch (error) {
    console.error('Error during bulk delete:', error);
    showToast('เกิดข้อผิดพลาดระหว่างการลบ', 'error');
  } finally {
    // Hide loading
    if (btnText) btnText.classList.remove('d-none');
    if (spinner) spinner.classList.add('d-none');
    confirmBtn.disabled = false;
  }
}

function closeBulkDeleteModal() {
  const bulkDeleteModal = document.getElementById('bulkDeleteModal');
  bulkDeleteModal.classList.remove('show');
  setTimeout(() => {
    bulkDeleteModal.classList.add('d-none');
  }, 300);
}

/****************************
 * Data Display and Manipulation
 ****************************/

// Helper function to highlight search terms
function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function displayData() {
  const dataTableBody = document.getElementById('dataTableBody');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('tableContainer');
  const paginationContainer = document.getElementById('paginationContainer');

  // Check if originalData is completely empty (no data at all)
  if (originalData.length === 0) {
    // Show empty state, hide table and pagination
    emptyState.classList.remove('d-none');
    tableContainer.classList.add('d-none');
    paginationContainer.classList.add('d-none');
    return;
  } else {
    // Hide empty state, show table
    emptyState.classList.add('d-none');
    tableContainer.classList.remove('d-none');
  }

  // Filter data
  let filteredData = originalData.filter(item => {
    if (!currentFilter) return true;

    const searchTerm = currentFilter.toLowerCase();

    // Search across all relevant fields
    const searchableFields = [
      item.NAME || '',
      new Date(item.created_at).toLocaleString(),
      new Date(item.created_at).toLocaleDateString(),
      new Date(item.created_at).toLocaleTimeString(),
      item.created_at, // ISO string
    ];

    return searchableFields.some(field =>
      field.toString().toLowerCase().includes(searchTerm)
    );
  });

  // Sort data
  filteredData.sort((a, b) => {
    let aVal, bVal;

    switch (currentSort.column) {
      case 'index':
        aVal = originalData.indexOf(a);
        bVal = originalData.indexOf(b);
        break;
      case 'name':
        aVal = (a.NAME || '').toLowerCase();
        bVal = (b.NAME || '').toLowerCase();
        break;
      case 'created_at':
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Clear existing rows
  dataTableBody.innerHTML = '';

  // Update result count
  if (currentFilter && filteredData.length === 0) {
    resultCount.textContent = `No results found for "${currentFilter}"`;
    resultCount.className = 'text-warning';
  } else {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredData.length);
    resultCount.textContent = `Showing ${startItem}-${endItem} of ${filteredData.length} records (Page ${currentPage} of ${totalPages})`;
    resultCount.className = 'text-muted';
  }

  // Apply paging
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pagedData = filteredData.slice(startIndex, endIndex);

  // Populate table
  if (pagedData.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 5; // Updated to 5 columns (added expand column)
    emptyCell.className = 'text-center text-muted py-4';
    emptyCell.innerHTML = currentFilter
      ? `<em>No records match your search for "${currentFilter}"</em>`
      : '<em>No data available</em>';
    emptyRow.appendChild(emptyCell);
    dataTableBody.appendChild(emptyRow);
  } else {
    pagedData.forEach((item, index) => {
      const row = document.createElement('tr');
      row.dataset.id = item.id; // Store the record ID for edit/delete operations

      // Checkbox column
      const checkboxCell = document.createElement('td');
      checkboxCell.className = 'text-center';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'row-checkbox';
      checkbox.dataset.itemId = item.id;
      checkbox.onchange = () => updateBulkActionsUI();
      checkboxCell.appendChild(checkbox);
      row.appendChild(checkboxCell);

      // Expand/collapse button column
      const expandCell = document.createElement('td');
      expandCell.className = 'text-center';
      const expandBtn = document.createElement('button');
      expandBtn.className = 'btn btn-sm btn-outline-secondary expand-btn';
      expandBtn.innerHTML = '➕';
      expandBtn.title = 'Show Details';
      expandBtn.onclick = () => toggleDetails(row, item);
      expandCell.appendChild(expandBtn);
      row.appendChild(expandCell);

      const indexCell = document.createElement('th');
      indexCell.scope = 'row';
      indexCell.textContent = (currentPage - 1) * itemsPerPage + index + 1;
      row.appendChild(indexCell);

      const nameCell = document.createElement('td');
      const nameValue = item.NAME || 'N/A';
      // Highlight search term in name
      if (currentFilter && nameValue !== 'N/A') {
        nameCell.innerHTML = highlightSearchTerm(nameValue, currentFilter);
      } else {
        nameCell.textContent = nameValue;
      }
      nameCell.dataset.field = 'name';
      row.appendChild(nameCell);

      const dateCell = document.createElement('td');
      const createdDate = new Date(item.created_at);
      const dateString = createdDate.toLocaleString();
      // Highlight search term in date
      if (currentFilter) {
        dateCell.innerHTML = highlightSearchTerm(dateString, currentFilter);
      } else {
        dateCell.textContent = dateString;
      }
      row.appendChild(dateCell);

      // Actions column
      const actionsCell = document.createElement('td');
      actionsCell.className = 'text-center';

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-warning me-1';
      editBtn.innerHTML = '✏️ Edit';
      editBtn.onclick = () => enableEditMode(row, item);
      actionsCell.appendChild(editBtn);

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-danger';
      deleteBtn.innerHTML = '🗑️ Delete';
      deleteBtn.onclick = () => deleteRecord(item.id, item.NAME || 'Unknown');
      actionsCell.appendChild(deleteBtn);

      row.appendChild(actionsCell);

      dataTableBody.appendChild(row);
    });
  }

  // Render pagination controls
  renderPagination(filteredData);
}

function sortData(column) {
  // Update sort indicators
  document.querySelectorAll('.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
  });

  // Toggle sort direction
  if (currentSort.column === column) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.column = column;
    currentSort.direction = 'asc';
  }

  // Update visual indicator
  const header = document.querySelector(`[data-column="${column}"]`);
  header.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');

  // Reset pagination and redisplay data
  resetPagination();
  displayData();
}

function filterData() {
  currentFilter = document.getElementById('searchInput').value.trim();
  resetPagination();
  displayData();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  currentFilter = '';
  resetPagination();
  displayData();
}

/****************************
 * 📊 DATA MANAGEMENT SETUP
 ****************************/

// Store initialization state to prevent duplicate handlers
let dataManagementHandlers = {
  isInitialized: false
};

function setupDataManagement() {
  console.log('📊 Setting up data management...', {
    alreadyInitialized: dataManagementHandlers.isInitialized
  });
  
  // Prevent duplicate initialization
  if (dataManagementHandlers.isInitialized) {
    console.log('⚠️ Data management already initialized, skipping');
    return;
  }
  
  // Load Data Button
  const loadBtn = document.getElementById('loadDataBtn');
  if (loadBtn) {
    console.log('✅ Load Data button found');
    loadBtn.addEventListener('click', () => {
      console.log('🔄 Load Data button clicked');
      loadData();
    });
  } else {
    console.error('❌ Load Data button not found');
  }
  
  // Add Item Modal Management
  const addItemModal = document.getElementById('addItemModal');
  const addItemBtn = document.getElementById('addItemBtn');
  const closeAddItemModal = document.getElementById('closeAddItemModal');
  const cancelAddItem = document.getElementById('cancelAddItem');
  const addItemForm = document.getElementById('addItemForm');
  const itemNameInput = document.getElementById('itemName');
  const charCounter = document.getElementById('charCounter');
  const submitAddItem = document.getElementById('submitAddItem');

  // Character counter
  if (itemNameInput && charCounter) {
    itemNameInput.addEventListener('input', () => {
      const length = itemNameInput.value.length;
      charCounter.textContent = `${length}/100`;
      
      // Visual feedback
      if (length > 80) {
        charCounter.style.color = '#dc3545';
      } else if (length > 50) {
        charCounter.style.color = '#ffc107';
      } else {
        charCounter.style.color = '#6c757d';
      }
    });
  }

  // Open modal
  if (addItemBtn) {
    console.log('✅ Add Item button found');
    addItemBtn.addEventListener('click', () => {
      console.log('➕ Add Item button clicked');
      if (addItemModal) {
        addItemModal.classList.remove('d-none');
        setTimeout(() => {
          addItemModal.classList.add('show');
          if (itemNameInput) itemNameInput.focus();
        }, 10);
      }
    });
  } else {
    console.error('❌ Add Item button not found');
  }

  // Empty state add button
  const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
  if (emptyStateAddBtn) {
    emptyStateAddBtn.addEventListener('click', () => {
      console.log('➕ Empty state add button clicked');
      if (addItemModal) {
        addItemModal.classList.remove('d-none');
        setTimeout(() => {
          addItemModal.classList.add('show');
          if (itemNameInput) itemNameInput.focus();
        }, 10);
      }
    });
  }

  // Close modal function
  function closeAddItemModalFunc() {
    if (addItemModal) {
      addItemModal.classList.remove('show');
      setTimeout(() => {
        addItemModal.classList.add('d-none');
        if (addItemForm) addItemForm.reset();
        if (charCounter) charCounter.textContent = '0/100';
        if (itemNameInput) itemNameInput.classList.remove('is-invalid');
      }, 300);
    }
  }

  // Close modal events
  if (closeAddItemModal) {
    closeAddItemModal.addEventListener('click', closeAddItemModalFunc);
  }

  if (cancelAddItem) {
    cancelAddItem.addEventListener('click', closeAddItemModalFunc);
  }

  // Close on overlay click
  if (addItemModal) {
    addItemModal.addEventListener('click', (e) => {
      if (e.target === addItemModal) {
        closeAddItemModalFunc();
      }
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && addItemModal && !addItemModal.classList.contains('d-none')) {
      closeAddItemModalFunc();
    }
  });

  // Submit form
  if (addItemForm) {
    addItemForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = itemNameInput.value.trim();
      if (!name) {
        itemNameInput.classList.add('is-invalid');
        document.getElementById('itemNameError').textContent = 'กรุณากรอกชื่อรายการ';
        return;
      }

      // Check for duplicate names (case-insensitive)
      const duplicateExists = originalData.some(item => 
        item.NAME && item.NAME.toLowerCase() === name.toLowerCase()
      );
      
      if (duplicateExists) {
        itemNameInput.classList.add('is-invalid');
        document.getElementById('itemNameError').textContent = 'ชื่อนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น';
        showToast('⚠️ ชื่อรายการนี้มีอยู่แล้ว', 'warning');
        return;
      }

      // Check for only whitespace or special characters
      if (!/[a-zA-Z0-9ก-๙]/.test(name)) {
        itemNameInput.classList.add('is-invalid');
        document.getElementById('itemNameError').textContent = 'กรุณากรอกชื่อที่มีตัวอักษรหรือตัวเลข';
        return;
      }

      // Show loading
      const btnText = submitAddItem.querySelector('.btn-text');
      const spinner = submitAddItem.querySelector('.spinner-border');
      if (btnText) btnText.classList.add('d-none');
      if (spinner) spinner.classList.remove('d-none');
      submitAddItem.disabled = true;

      try {
        const { error } = await db
          .from('ID')
          .insert([{ NAME: name }]);

        if (error) {
          console.error('Error adding item:', error);
          showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
        } else {
          showToast('✅ เพิ่มรายการสำเร็จ!', 'success', 2000);
          closeAddItemModalFunc();
          loadData(); // Reload data
        }
      } catch (err) {
        console.error('Error:', err);
        showToast('เกิดข้อผิดพลาดในการเพิ่มรายการ', 'error');
      } finally {
        // Hide loading
        if (btnText) btnText.classList.remove('d-none');
        if (spinner) spinner.classList.add('d-none');
        submitAddItem.disabled = false;
      }
    });
  }

  // Remove validation error on input
  if (itemNameInput) {
    itemNameInput.addEventListener('input', () => {
      itemNameInput.classList.remove('is-invalid');
    });
  }
  
  /****************************
   * Edit Item Modal
   ****************************/
  const editItemModal = document.getElementById('editItemModal');
  const editItemNameInput = document.getElementById('editItemName');
  const editCharCounter = document.getElementById('editCharCounter');
  const editItemForm = document.getElementById('editItemForm');
  const closeEditItemModal_btn = document.getElementById('closeEditItemModal');
  const cancelEditItem = document.getElementById('cancelEditItem');
  const submitEditItem = document.getElementById('submitEditItem');

  // Character counter for Edit Item Modal
  if (editItemNameInput && editCharCounter) {
    editItemNameInput.addEventListener('input', () => {
      const length = editItemNameInput.value.length;
      editCharCounter.textContent = `${length}/100`;
      
      // Update color based on length
      editCharCounter.classList.remove('warning', 'danger');
      if (length > 80) {
        editCharCounter.classList.add('danger');
      } else if (length > 50) {
        editCharCounter.classList.add('warning');
      }
    });
  }

  // Close Edit Modal handlers
  if (closeEditItemModal_btn) {
    closeEditItemModal_btn.addEventListener('click', closeEditItemModal);
  }

  if (cancelEditItem) {
    cancelEditItem.addEventListener('click', closeEditItemModal);
  }

  // Click outside to close
  if (editItemModal) {
    editItemModal.addEventListener('click', (e) => {
      if (e.target === editItemModal) {
        closeEditItemModal();
      }
    });
  }

  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editItemModal && !editItemModal.classList.contains('d-none')) {
      closeEditItemModal();
    }
  });

  // Form submission
  if (editItemForm) {
    editItemForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newName = editItemNameInput.value.trim();
      const editItemNameError = document.getElementById('editItemNameError');
      
      // Validation
      if (!newName) {
        editItemNameInput.classList.add('is-invalid');
        editItemNameError.textContent = 'กรุณากรอกชื่อรายการ';
        editItemNameError.classList.add('show');
        return;
      }

      // Check for duplicate names (excluding current item)
      const duplicateExists = originalData.some(item => 
        item.id !== currentEditingItem.id && 
        item.NAME && 
        item.NAME.toLowerCase() === newName.toLowerCase()
      );
      
      if (duplicateExists) {
        editItemNameInput.classList.add('is-invalid');
        editItemNameError.textContent = 'ชื่อนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น';
        editItemNameError.classList.add('show');
        showToast('⚠️ ชื่อรายการนี้มีอยู่แล้ว', 'warning');
        return;
      }

      // Check for only whitespace or special characters
      if (!/[a-zA-Z0-9ก-๙]/.test(newName)) {
        editItemNameInput.classList.add('is-invalid');
        editItemNameError.textContent = 'กรุณากรอกชื่อที่มีตัวอักษรหรือตัวเลข';
        editItemNameError.classList.add('show');
        return;
      }

      if (!currentEditingItem) {
        showToast('ไม่พบรายการที่จะแก้ไข', 'error');
        return;
      }

      // Show loading state
      const btnText = submitEditItem.querySelector('.btn-text');
      const spinner = submitEditItem.querySelector('.spinner-border');
      if (btnText) btnText.classList.add('d-none');
      if (spinner) spinner.classList.remove('d-none');
      submitEditItem.disabled = true;

      try {
        const { error } = await db
          .from('ID')
          .update({ NAME: newName })
          .eq('id', currentEditingItem.id);

        if (error) {
          console.error('Error updating item:', error);
          showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
        } else {
          // Update local data
          const itemIndex = originalData.findIndex(d => d.id === currentEditingItem.id);
          if (itemIndex !== -1) {
            originalData[itemIndex].NAME = newName;
          }
          
          showToast('✅ แก้ไขรายการสำเร็จ!', 'success', 2000);
          closeEditItemModal();
          displayData(); // Refresh display
        }
      } catch (err) {
        console.error('Error:', err);
        showToast('เกิดข้อผิดพลาดในการแก้ไขรายการ', 'error');
      } finally {
        // Hide loading
        if (btnText) btnText.classList.remove('d-none');
        if (spinner) spinner.classList.add('d-none');
        submitEditItem.disabled = false;
      }
    });
  }

  // Remove validation error on input (Edit Modal)
  if (editItemNameInput) {
    editItemNameInput.addEventListener('input', () => {
      editItemNameInput.classList.remove('is-invalid');
    });
  }
  
  /****************************
   * Delete Confirmation Modal
   ****************************/
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  const closeDeleteConfirmModal_btn = document.getElementById('closeDeleteConfirmModal');
  const cancelDeleteBtn = document.getElementById('cancelDelete');
  const confirmDeleteBtn = document.getElementById('confirmDelete');

  // Close Delete Modal handlers
  if (closeDeleteConfirmModal_btn) {
    closeDeleteConfirmModal_btn.addEventListener('click', closeDeleteConfirmModal);
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);
  }

  // Click outside to close
  if (deleteConfirmModal) {
    deleteConfirmModal.addEventListener('click', (e) => {
      if (e.target === deleteConfirmModal) {
        closeDeleteConfirmModal();
      }
    });
  }

  // ESC key to close (already handled globally, but let's ensure it works)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && deleteConfirmModal && !deleteConfirmModal.classList.contains('d-none')) {
      closeDeleteConfirmModal();
    }
  });

  // Confirm delete action
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!currentDeletingItem) {
        showToast('ไม่พบรายการที่จะลบ', 'error');
        return;
      }

      // Show loading state
      const btnText = confirmDeleteBtn.querySelector('.btn-text');
      const spinner = confirmDeleteBtn.querySelector('.spinner-border');
      if (btnText) btnText.classList.add('d-none');
      if (spinner) spinner.classList.remove('d-none');
      confirmDeleteBtn.disabled = true;

      try {
        await performDelete(currentDeletingItem.id, currentDeletingItem.name);
        closeDeleteConfirmModal();
      } catch (error) {
        console.error('Error during delete:', error);
        showToast('เกิดข้อผิดพลาดระหว่างการลบ', 'error');
      } finally {
        // Hide loading
        if (btnText) btnText.classList.remove('d-none');
        if (spinner) spinner.classList.add('d-none');
        confirmDeleteBtn.disabled = false;
      }
    });
  }
  
  /****************************
   * Bulk Actions Event Listeners
   ****************************/
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const deselectAllBtn = document.getElementById('deselectAllBtn');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  const bulkDeleteModal = document.getElementById('bulkDeleteModal');
  const closeBulkDeleteModal_btn = document.getElementById('closeBulkDeleteModal');
  const cancelBulkDeleteBtn = document.getElementById('cancelBulkDelete');
  const confirmBulkDeleteBtn = document.getElementById('confirmBulkDelete');

  // Select All checkbox
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', selectAll);
  }

  // Deselect All button
  if (deselectAllBtn) {
    deselectAllBtn.addEventListener('click', deselectAll);
  }

  // Bulk Delete button
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', bulkDelete);
  }

  // Close Bulk Delete Modal handlers
  if (closeBulkDeleteModal_btn) {
    closeBulkDeleteModal_btn.addEventListener('click', closeBulkDeleteModal);
  }

  if (cancelBulkDeleteBtn) {
    cancelBulkDeleteBtn.addEventListener('click', closeBulkDeleteModal);
  }

  // Confirm Bulk Delete
  if (confirmBulkDeleteBtn) {
    confirmBulkDeleteBtn.addEventListener('click', confirmBulkDelete);
  }

  // Click outside to close bulk delete modal
  if (bulkDeleteModal) {
    bulkDeleteModal.addEventListener('click', (e) => {
      if (e.target === bulkDeleteModal) {
        closeBulkDeleteModal();
      }
    });
  }

  // ESC key to close bulk delete modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bulkDeleteModal && !bulkDeleteModal.classList.contains('d-none')) {
      closeBulkDeleteModal();
    }
  });
  
  // Download CSV Button
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  if (downloadCsvBtn) {
    downloadCsvBtn.addEventListener('click', (e) => {
      e.preventDefault();
      downloadCSV();
    });
  }
  
  // Download PDF Button
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', (e) => {
      e.preventDefault();
      downloadPDF();
    });
  }
  
  // Search functionality
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  
  if (searchInput && searchBtn) {
    searchBtn.addEventListener('click', () => {
      currentFilter = searchInput.value;
      resetPagination();
      displayData();
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        currentFilter = searchInput.value;
        resetPagination();
        displayData();
      }
    });
  }
  
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      currentFilter = '';
      resetPagination();
      displayData();
    });
  }
  
  // Items per page selector
  const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
  if (itemsPerPageSelect) {
    console.log('✅ Items per page selector found');
    itemsPerPageSelect.addEventListener('change', (e) => {
      itemsPerPage = parseInt(e.target.value);
      console.log(`📊 Items per page changed to: ${itemsPerPage}`);
      resetPagination();
      displayData();
    });
  } else {
    console.error('❌ Items per page selector not found');
  }
  
  // Mark as initialized
  dataManagementHandlers.isInitialized = true;
  console.log('✅ Data management setup complete');
}

/****************************
 * Table Sorting and Filtering
 ****************************/

// Sortable headers
document.querySelectorAll('.sortable').forEach(header => {
  header.addEventListener('click', () => {
    const column = header.dataset.column;
    sortData(column);
  });
});

// Search input
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', filterData);

  // Add keyboard shortcuts
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSearch();
      searchInput.blur(); // Remove focus
    }
  });
}

function downloadCSV() {
  if (originalData.length === 0) {
    showToast('ไม่มีข้อมูลให้ดาวน์โหลด', 'warning');
    return;
  }

  let filteredData;
  
  // If items are selected, export only selected items
  if (selectedItems.size > 0) {
    filteredData = originalData.filter(item => selectedItems.has(item.id));
    showToast(`กำลังดาวน์โหลด ${filteredData.length} รายการที่เลือก`, 'info', 2000);
  } else {
    // Get filtered data (same logic as displayData)
    filteredData = originalData.filter(item => {
      if (!currentFilter) return true;

      const searchTerm = currentFilter.toLowerCase();

      const searchableFields = [
        item.NAME || '',
        new Date(item.created_at).toLocaleString(),
        new Date(item.created_at).toLocaleDateString(),
        new Date(item.created_at).toLocaleTimeString(),
        item.created_at,
      ];

      return searchableFields.some(field =>
        field.toString().toLowerCase().includes(searchTerm)
      );
    });
  }

  // Sort data (same as displayData)
  filteredData.sort((a, b) => {
    let aVal, bVal;

    switch (currentSort.column) {
      case 'index':
        aVal = originalData.indexOf(a);
        bVal = originalData.indexOf(b);
        break;
      case 'name':
        aVal = (a.NAME || '').toLowerCase();
        bVal = (b.NAME || '').toLowerCase();
        break;
      case 'created_at':
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Create CSV content
  let csv = 'Index,Name,Created At\n';
  filteredData.forEach((item, index) => {
    const name = item.NAME || 'N/A';
    const createdAt = new Date(item.created_at).toLocaleString();
    csv += `${index + 1},"${name.replace(/"/g, '""')}","${createdAt}"\n`;
  });

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'data.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadPDF() {
  if (originalData.length === 0) {
    showToast('ไม่มีข้อมูลให้ดาวน์โหลด', 'warning');
    return;
  }

  let filteredData;
  
  // If items are selected, export only selected items
  if (selectedItems.size > 0) {
    filteredData = originalData.filter(item => selectedItems.has(item.id));
    showToast(`กำลังดาวน์โหลด ${filteredData.length} รายการที่เลือก`, 'info', 2000);
  } else {
    // Get filtered data (same logic as displayData)
    filteredData = originalData.filter(item => {
      if (!currentFilter) return true;

      const searchTerm = currentFilter.toLowerCase();

      const searchableFields = [
        item.NAME || '',
        new Date(item.created_at).toLocaleString(),
        new Date(item.created_at).toLocaleDateString(),
        new Date(item.created_at).toLocaleTimeString(),
        item.created_at,
      ];

      return searchableFields.some(field =>
        field.toString().toLowerCase().includes(searchTerm)
      );
    });
  }

  // Sort data (same as displayData)
  filteredData.sort((a, b) => {
    let aVal, bVal;

    switch (currentSort.column) {
      case 'index':
        aVal = originalData.indexOf(a);
        bVal = originalData.indexOf(b);
        break;
      case 'name':
        aVal = (a.NAME || '').toLowerCase();
        bVal = (b.NAME || '').toLowerCase();
        break;
      case 'created_at':
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Create PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text('Data Export', 14, 20);

  // Add metadata
  doc.setFontSize(12);
  doc.text(`Total Records: ${filteredData.length}`, 14, 30);
  doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, 38);
  if (currentFilter) {
    doc.text(`Filter: "${currentFilter}"`, 14, 46);
  }

  // Add table headers
  const headers = ['#', 'Name', 'Created At'];
  let yPosition = currentFilter ? 60 : 50;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  headers.forEach((header, index) => {
    doc.text(header, 14 + (index * 50), yPosition);
  });

  // Add table data
  doc.setFont('helvetica', 'normal');
  yPosition += 8;

  filteredData.forEach((item, index) => {
    if (yPosition > 270) { // New page if needed
      doc.addPage();
      yPosition = 20;
    }

    const name = item.NAME || 'N/A';
    const createdAt = new Date(item.created_at).toLocaleString();

    doc.text(`${index + 1}`, 14, yPosition);
    doc.text(name.length > 15 ? name.substring(0, 15) + '...' : name, 14 + 50, yPosition);
    doc.text(createdAt, 14 + 100, yPosition);

    yPosition += 6;
  });

  // Download PDF
  doc.save('data.pdf');
}

/****************************
 * Hello User Button Handler
 ****************************/

let helloButtonHandlers = {
  isInitialized: false
};

function setupHelloUserButton() {
  const helloBtn = document.getElementById('helloBtn');
  if (!helloBtn) {
    console.error('❌ Hello button not found');
    return;
  }
  
  // Prevent duplicate initialization
  if (helloButtonHandlers.isInitialized) {
    console.log('⚠️ Hello button already initialized, skipping');
    return;
  }
  
  console.log('✅ Hello button found, setting up...');
  
  const clickHandler = async () => {
    console.log('🔘 Hello button clicked');
    const input = document.getElementById('username');
    const greeting = document.getElementById('greeting');
    
    if (!input) {
      console.error('❌ Username input not found');
      return;
    }
    
    const name = input.value.trim();

    if (!name) {
      showToast('กรุณาใส่ชื่อ', 'warning');
      if (greeting) greeting.textContent = '';
      return;
    }

    if (greeting) {
      greeting.textContent = '⏳ Saving...';
      greeting.className = 'alert alert-info';
      greeting.classList.remove('d-none');
    }

    console.log('📤 Inserting name:', name);
    const { error } = await db
      .from('ID')
      .insert([{ NAME: name }]);

    if (error) {
      console.error('❌ Insert error:', error);
      showToast('Error: ' + error.message, 'error');
      if (greeting) {
        greeting.textContent = '';
        greeting.classList.add('d-none');
      }
      return;
    }

    console.log('✅ Insert successful');
    showToast(`Hello ${name}!`, 'success', 3000);
    if (greeting) {
      greeting.textContent = `✅ Hello ${name}`;
      greeting.className = 'alert alert-success';
    }
    input.value = '';

    // โหลดข้อมูลใหม่
    loadData();
  };
  
  helloBtn.addEventListener('click', clickHandler);
  
  // Mark as initialized
  helloButtonHandlers.isInitialized = true;
  console.log('✅ Hello button setup complete');
}


/****************************
 * Pagination Functions
 ****************************/

function renderPagination(filteredData) {
  const paginationContainer = document.getElementById('paginationContainer');
  const paginationControls = document.getElementById('paginationControls');

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Hide pagination if only one page or no data
  if (totalPages <= 1) {
    paginationContainer.classList.add('d-none');
    return;
  }

  paginationContainer.classList.remove('d-none');

  // Clear existing controls
  paginationControls.innerHTML = '';

  // Previous button
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  const prevLink = document.createElement('a');
  prevLink.className = 'page-link';
  prevLink.href = '#';
  prevLink.innerHTML = 'Previous';
  prevLink.onclick = (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      displayData();
    }
  };
  prevLi.appendChild(prevLink);
  paginationControls.appendChild(prevLi);

  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // First page + ellipsis if needed
  if (startPage > 1) {
    const firstLi = document.createElement('li');
    firstLi.className = 'page-item';
    const firstLink = document.createElement('a');
    firstLink.className = 'page-link';
    firstLink.href = '#';
    firstLink.textContent = '1';
    firstLink.onclick = (e) => {
      e.preventDefault();
      currentPage = 1;
      displayData();
    };
    firstLi.appendChild(firstLink);
    paginationControls.appendChild(firstLi);

    if (startPage > 2) {
      const ellipsisLi = document.createElement('li');
      ellipsisLi.className = 'page-item disabled';
      const ellipsisSpan = document.createElement('span');
      ellipsisSpan.className = 'page-link';
      ellipsisSpan.textContent = '...';
      ellipsisLi.appendChild(ellipsisSpan);
      paginationControls.appendChild(ellipsisLi);
    }
  }

  // Visible page numbers
  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement('li');
    pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
    const pageLink = document.createElement('a');
    pageLink.className = 'page-link';
    pageLink.href = '#';
    pageLink.textContent = i;
    pageLink.onclick = (e) => {
      e.preventDefault();
      currentPage = i;
      displayData();
    };
    pageLi.appendChild(pageLink);
    paginationControls.appendChild(pageLi);
  }

  // Last page + ellipsis if needed
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsisLi = document.createElement('li');
      ellipsisLi.className = 'page-item disabled';
      const ellipsisSpan = document.createElement('span');
      ellipsisSpan.className = 'page-link';
      ellipsisSpan.textContent = '...';
      ellipsisLi.appendChild(ellipsisSpan);
      paginationControls.appendChild(ellipsisLi);
    }

    const lastLi = document.createElement('li');
    lastLi.className = 'page-item';
    const lastLink = document.createElement('a');
    lastLink.className = 'page-link';
    lastLink.href = '#';
    lastLink.textContent = totalPages;
    lastLink.onclick = (e) => {
      e.preventDefault();
      currentPage = totalPages;
      displayData();
    };
    lastLi.appendChild(lastLink);
    paginationControls.appendChild(lastLi);
  }

  // Next button
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  const nextLink = document.createElement('a');
  nextLink.className = 'page-link';
  nextLink.href = '#';
  nextLink.innerHTML = 'Next';
  nextLink.onclick = (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      displayData();
    }
  };
  nextLi.appendChild(nextLink);
  paginationControls.appendChild(nextLi);
}

function resetPagination() {
  currentPage = 1;
}

/****************************
 * 👤 USER DROPDOWN MENU
 ****************************/

// Store event handlers to prevent duplicates
let userDropdownHandlers = {
  isInitialized: false,
  closeOutsideHandler: null
};

// Toggle dropdown menu
function setupUserDropdown() {
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  const openProfileMenu = document.getElementById('openProfileMenu');
  const settingsMenu = document.getElementById('settingsMenu');
  const changePasswordMenu = document.getElementById('changePasswordMenu');
  const logoutMenuBtn = document.getElementById('logoutMenuBtn');

  console.log('🔍 User Dropdown Setup:', {
    userMenuBtn: !!userMenuBtn,
    userDropdown: !!userDropdown,
    openProfileMenu: !!openProfileMenu,
    settingsMenu: !!settingsMenu,
    changePasswordMenu: !!changePasswordMenu,
    logoutMenuBtn: !!logoutMenuBtn,
    alreadyInitialized: userDropdownHandlers.isInitialized
  });

  if (!userMenuBtn || !userDropdown) {
    console.error('❌ User menu button or dropdown not found');
    return;
  }

  // Prevent duplicate initialization
  if (userDropdownHandlers.isInitialized) {
    console.log('⚠️ User dropdown already initialized, skipping');
    return;
  }

  // Helper functions
  function openUserDropdown() {
    console.log('📂 Opening user dropdown');
    userDropdown.classList.remove('d-none');
    userMenuBtn.setAttribute('aria-expanded', 'true');
    updateDropdownUserInfo();
  }

  function closeUserDropdown() {
    if (userDropdown && !userDropdown.classList.contains('d-none')) {
      userDropdown.classList.add('d-none');
      userMenuBtn.setAttribute('aria-expanded', 'false');
    }
  }

  // Main toggle handler
  const toggleHandler = (e) => {
    console.log('🖱️ User menu button clicked');
    e.stopPropagation();
    const isExpanded = userMenuBtn.getAttribute('aria-expanded') === 'true';
    console.log('Current state:', { isExpanded });
    
    if (isExpanded) {
      console.log('Closing dropdown');
      closeUserDropdown();
    } else {
      console.log('Opening dropdown');
      openUserDropdown();
    }
  };

  userMenuBtn.addEventListener('click', toggleHandler);

  // Close dropdown when clicking outside
  // Remove old listener first if exists
  if (userDropdownHandlers.closeOutsideHandler) {
    document.removeEventListener('click', userDropdownHandlers.closeOutsideHandler);
  }
  
  userDropdownHandlers.closeOutsideHandler = (e) => {
    if (userDropdown && !userDropdown.classList.contains('d-none')) {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        console.log('Closing dropdown (clicked outside)');
        closeUserDropdown();
      }
    }
  };
  
  document.addEventListener('click', userDropdownHandlers.closeOutsideHandler);

  // Dropdown menu actions
  if (openProfileMenu) {
    openProfileMenu.addEventListener('click', async (e) => {
      e.preventDefault();
      closeUserDropdown();
      const userProfileModal = document.getElementById('userProfileModal');
      if (userProfileModal) {
        userProfileModal.classList.remove('d-none');
        await loadUserProfile();
      }
    });
  }

  if (settingsMenu) {
    settingsMenu.addEventListener('click', (e) => {
      e.preventDefault();
      closeUserDropdown();
      showToast('ฟีเจอร์ตั้งค่ากำลังพัฒนา', 'info', 3000);
    });
  }

  if (changePasswordMenu) {
    changePasswordMenu.addEventListener('click', (e) => {
      e.preventDefault();
      closeUserDropdown();
      const changePasswordModal = document.getElementById('changePasswordModal');
      if (changePasswordModal) {
        changePasswordModal.classList.remove('d-none');
        
        // Clear form
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) changePasswordForm.reset();
        
        const passwordMatchError = document.getElementById('passwordMatchError');
        if (passwordMatchError) passwordMatchError.classList.remove('show');
        
        // Reset strength indicator
        const strengthFill = document.querySelector('#newPasswordStrength .strength-fill');
        const strengthLabel = document.querySelector('#newPasswordStrength .strength-label');
        if (strengthFill) strengthFill.className = 'strength-fill';
        if (strengthLabel) {
          strengthLabel.className = 'strength-label';
          strengthLabel.textContent = '-';
        }
        
        // Focus on first input
        setTimeout(() => {
          const newPasswordInput = document.getElementById('newPassword');
          if (newPasswordInput) newPasswordInput.focus();
        }, 100);
      }
    });
  }

  if (logoutMenuBtn) {
    console.log('✅ Logout button event listener attached');
    logoutMenuBtn.addEventListener('click', async (e) => {
      console.log('🚪 Logout button clicked');
      e.preventDefault();
      closeUserDropdown();
      
      try {
        // Logout
        await db.auth.signOut();
        showLogin();
        showToast('ออกจากระบบสำเร็จ', 'success', 2000);
      } catch (error) {
        console.error('❌ Logout error:', error);
        showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
      }
    });
  } else {
    console.error('❌ Logout button not found');
  }

  // Mark as initialized
  userDropdownHandlers.isInitialized = true;
  console.log('✅ User dropdown fully initialized');
}

// Update dropdown user info
async function updateDropdownUserInfo() {
  try {
    const { data: { user }, error } = await db.auth.getUser();
    
    if (error) throw error;
    
    if (user) {
      // Update dropdown email
      const dropdownEmail = document.getElementById('dropdownEmail');
      if (dropdownEmail) {
        dropdownEmail.textContent = user.email;
      }
      
      // Format created date for meta
      const createdDate = new Date(user.created_at);
      const formattedDate = createdDate.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const dropdownMeta = document.getElementById('dropdownMeta');
      if (dropdownMeta) {
        dropdownMeta.textContent = `สมาชิกตั้งแต่: ${formattedDate}`;
      }
      
      // Update dropdown avatar
      const savedAvatar = localStorage.getItem('userAvatar');
      const avatarToUse = savedAvatar || user.email.charAt(0).toUpperCase();
      
      const dropdownAvatar = document.querySelector('.dropdown-avatar');
      if (dropdownAvatar) {
        dropdownAvatar.textContent = avatarToUse;
      }
    }
  } catch (error) {
    console.error('Error updating dropdown user info:', error);
  }
}

/****************************
 * 👤 USER PROFILE MODAL
 ****************************/

function setupProfileModal() {
  const userProfileModal = document.getElementById('userProfileModal');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const refreshProfileBtn = document.getElementById('refreshProfileBtn');
  const changePasswordBtn = document.getElementById('changePasswordBtn');

  if (!userProfileModal) return;

  // Close profile modal
  if (closeProfileModal) {
    closeProfileModal.addEventListener('click', () => {
      userProfileModal.classList.add('d-none');
    });
  }

  // Close on backdrop click
  userProfileModal.addEventListener('click', (e) => {
    if (e.target === userProfileModal) {
      userProfileModal.classList.add('d-none');
    }
  });

  // Refresh profile data
  if (refreshProfileBtn) {
    refreshProfileBtn.addEventListener('click', async () => {
      refreshProfileBtn.disabled = true;
      refreshProfileBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังโหลด...';
      
      await loadUserProfile();
      
      refreshProfileBtn.disabled = false;
      refreshProfileBtn.innerHTML = '🔄 รีเฟรชข้อมูล';
      showToast('โหลดข้อมูลสำเร็จ', 'success', 2000);
    });
  }

  // Change password handler
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      // Close profile modal and open password modal
      userProfileModal.classList.add('d-none');
      const changePasswordModal = document.getElementById('changePasswordModal');
      if (changePasswordModal) {
        changePasswordModal.classList.remove('d-none');
        
        // Clear form
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) changePasswordForm.reset();
        
        const passwordMatchError = document.getElementById('passwordMatchError');
        if (passwordMatchError) passwordMatchError.classList.remove('show');
        
        // Reset strength indicator
        const strengthFill = document.querySelector('#newPasswordStrength .strength-fill');
        const strengthLabel = document.querySelector('#newPasswordStrength .strength-label');
        if (strengthFill) strengthFill.className = 'strength-fill';
        if (strengthLabel) {
          strengthLabel.className = 'strength-label';
          strengthLabel.textContent = '-';
        }
        
        // Focus on first input
        setTimeout(() => {
          const newPasswordInput = document.getElementById('newPassword');
          if (newPasswordInput) newPasswordInput.focus();
        }, 100);
      }
    });
  }
}

/****************************
 * 🔐 CHANGE PASSWORD MODAL
 ****************************/

function setupChangePasswordModal() {
  const changePasswordModal = document.getElementById('changePasswordModal');
  const closePasswordModal = document.getElementById('closePasswordModal');
  const cancelPasswordChange = document.getElementById('cancelPasswordChange');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordMatchError = document.getElementById('passwordMatchError');
  const toggleNewPassword = document.getElementById('toggleNewPassword');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

  if (!changePasswordModal) return;

  // Close password modal handlers
  function closeModal() {
    changePasswordModal.classList.add('d-none');
    if (changePasswordForm) changePasswordForm.reset();
    if (passwordMatchError) passwordMatchError.classList.remove('show');
  }

  if (closePasswordModal) {
    closePasswordModal.addEventListener('click', closeModal);
  }

  if (cancelPasswordChange) {
    cancelPasswordChange.addEventListener('click', closeModal);
  }

  // Close on backdrop click
  changePasswordModal.addEventListener('click', (e) => {
    if (e.target === changePasswordModal) {
      closeModal();
    }
  });

  // Password toggle buttons
  if (toggleNewPassword && newPasswordInput) {
    toggleNewPassword.addEventListener('click', () => {
      const eyeIcon = toggleNewPassword.querySelector('.eye-icon');
      const eyeOffIcon = toggleNewPassword.querySelector('.eye-off-icon');
      
      if (newPasswordInput.type === 'password') {
        newPasswordInput.type = 'text';
        if (eyeIcon) eyeIcon.classList.add('d-none');
        if (eyeOffIcon) eyeOffIcon.classList.remove('d-none');
      } else {
        newPasswordInput.type = 'password';
        if (eyeIcon) eyeIcon.classList.remove('d-none');
        if (eyeOffIcon) eyeOffIcon.classList.add('d-none');
      }
    });
  }

  if (toggleConfirmPassword && confirmPasswordInput) {
    toggleConfirmPassword.addEventListener('click', () => {
      const eyeIcon = toggleConfirmPassword.querySelector('.eye-icon');
      const eyeOffIcon = toggleConfirmPassword.querySelector('.eye-off-icon');
      
      if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        if (eyeIcon) eyeIcon.classList.add('d-none');
        if (eyeOffIcon) eyeOffIcon.classList.remove('d-none');
      } else {
        confirmPasswordInput.type = 'password';
        if (eyeIcon) eyeIcon.classList.remove('d-none');
        if (eyeOffIcon) eyeOffIcon.classList.add('d-none');
      }
    });
  }

  // Password strength checker
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', () => {
      const password = newPasswordInput.value;
      const strengthFill = document.querySelector('#newPasswordStrength .strength-fill');
      const strengthLabel = document.querySelector('#newPasswordStrength .strength-label');
      
      if (!strengthFill || !strengthLabel) return;
      
      // Reset classes
      strengthFill.className = 'strength-fill';
      strengthLabel.className = 'strength-label';
      
      if (password.length === 0) {
        strengthLabel.textContent = '-';
        return;
      }
      
      const strengthResult = checkPasswordStrength(password);
      const score = strengthResult.score;
      
      if (score === 0) {
        strengthFill.classList.add('weak');
        strengthLabel.classList.add('weak');
        strengthLabel.textContent = 'อ่อนแอ';
      } else if (score === 1) {
        strengthFill.classList.add('medium');
        strengthLabel.classList.add('medium');
        strengthLabel.textContent = 'ปานกลาง';
      } else {
        strengthFill.classList.add('strong');
        strengthLabel.classList.add('strong');
        strengthLabel.textContent = 'แข็งแกร่ง';
      }
      
      checkPasswordsMatch();
    });
  }

  // Check password match
  function checkPasswordsMatch() {
    if (!newPasswordInput || !confirmPasswordInput || !passwordMatchError) return;
    
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword.length === 0) {
      passwordMatchError.classList.remove('show');
      confirmPasswordInput.classList.remove('is-invalid');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      passwordMatchError.textContent = '❌ รหัสผ่านไม่ตรงกัน';
      passwordMatchError.classList.add('show');
      confirmPasswordInput.classList.add('is-invalid');
    } else {
      passwordMatchError.textContent = '✓ รหัสผ่านตรงกัน';
      passwordMatchError.classList.remove('show');
      confirmPasswordInput.classList.remove('is-invalid');
    }
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', checkPasswordsMatch);
  }

  // Form submission
  if (changePasswordForm) {
    console.log('✅ Change password form event listener attached');
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('🔄 Form submitted with values:', { newPassword: '***', confirmPassword: '***' });
      
      if (!newPasswordInput || !confirmPasswordInput) return;
      
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const submitBtn = document.getElementById('submitPasswordChange');
      
      if (!submitBtn) {
        console.error('❌ Submit button not found');
        return;
      }
      
      const btnText = submitBtn.querySelector('.btn-text');
      const spinner = submitBtn.querySelector('.spinner-border');
      
      if (newPassword.length < 6) {
        showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'warning');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        showToast('รหัสผ่านไม่ตรงกัน กรุณาลองใหม่', 'error');
        return;
      }
      
      try {
        submitBtn.disabled = true;
        if (btnText) btnText.classList.add('d-none');
        if (spinner) spinner.classList.remove('d-none');
        
        const { data, error } = await db.auth.updateUser({
          password: newPassword
        });
        
        if (error) throw error;
        
        // Clear remembered credentials
        localStorage.removeItem('rememberedEmail');
        
        // Clear all password fields
        document.querySelectorAll('input[type="password"]').forEach(field => {
          field.value = '';
        });
        
        showToast('เปลี่ยนรหัสผ่านสำเร็จ! กำลังออกจากระบบ...', 'success', 3000);
        closeModal();
        
        // Auto logout after 1.5 seconds
        setTimeout(async () => {
          await db.auth.signOut();
          showLogin();
          showToast('กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่', 'info', 5000);
        }, 1500);
        
      } catch (error) {
        console.error('Error changing password:', error);
        showToast('ไม่สามารถเปลี่ยนรหัสผ่านได้: ' + error.message, 'error');
        submitBtn.disabled = false;
        if (btnText) btnText.classList.remove('d-none');
        if (spinner) spinner.classList.add('d-none');
      }
    });
  }
}

// Change Password Modal handlers moved to setupChangePasswordModal function

// Change avatar functionality
function setupAvatarPicker() {
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  const avatarOptions = document.getElementById('avatarOptions');

  if (!changeAvatarBtn || !avatarOptions) return;

  changeAvatarBtn.addEventListener('click', () => {
    avatarOptions.classList.toggle('d-none');
  });
  
  // Handle avatar selection
  const avatarButtons = document.querySelectorAll('.avatar-option');
  avatarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedAvatar = btn.dataset.avatar;
      
      // Update all avatar displays
      const profileAvatarLarge = document.getElementById('profileAvatarLarge');
      if (profileAvatarLarge) {
        profileAvatarLarge.textContent = selectedAvatar;
      }
      
      const userAvatars = document.querySelectorAll('.user-avatar');
      userAvatars.forEach(avatar => {
        avatar.textContent = selectedAvatar;
      });
      
      const dropdownAvatar = document.querySelector('.dropdown-avatar');
      if (dropdownAvatar) {
        dropdownAvatar.textContent = selectedAvatar;
      }
      
      // Save to localStorage
      localStorage.setItem('userAvatar', selectedAvatar);
      
      // Hide options and show success
      avatarOptions.classList.add('d-none');
      showToast('เปลี่ยนรูปโปรไฟล์สำเร็จ!', 'success', 2000);
    });
  });
}

// Load user profile data
async function loadUserProfile() {
  try {
    const { data: { user }, error } = await db.auth.getUser();
    
    if (error) throw error;
    
    if (user) {
      // Update email displays
      document.getElementById('profileEmailDisplay').textContent = user.email;
      
      // Format created date
      const createdDate = new Date(user.created_at);
      const formattedDate = createdDate.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      document.getElementById('profileCreatedAt').textContent = `สมาชิกตั้งแต่: ${formattedDate}`;
      
      // Last sign in
      if (user.last_sign_in_at) {
        const lastSignIn = new Date(user.last_sign_in_at);
        const timeAgo = getTimeAgo(lastSignIn);
        document.getElementById('lastSignIn').textContent = timeAgo;
      } else {
        document.getElementById('lastSignIn').textContent = 'ไม่ทราบ';
      }
      
      // Email verification status
      const emailVerifiedEl = document.getElementById('emailVerified');
      if (user.email_confirmed_at) {
        emailVerifiedEl.innerHTML = '<span class="badge badge-success">✓ ยืนยันแล้ว</span>';
      } else {
        emailVerifiedEl.innerHTML = '<span class="badge badge-warning">ยังไม่ยืนยัน</span>';
      }
      
      // Load saved avatar or use first letter of email
      const savedAvatar = localStorage.getItem('userAvatar');
      const avatarToUse = savedAvatar || user.email.charAt(0).toUpperCase();
      
      document.getElementById('profileAvatarLarge').textContent = avatarToUse;
      const userAvatars = document.querySelectorAll('.user-avatar');
      userAvatars.forEach(avatar => {
        avatar.textContent = avatarToUse;
      });
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    showToast('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้', 'error');
  }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 30) return `${diffDays} วันที่แล้ว`;
  
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/****************************
 * 💀 LOADING SKELETON SCREENS
 ****************************/

function showLoginSkeleton() {
  const loginContainer = document.getElementById('loginContainer');
  const originalContent = loginContainer.innerHTML;
  
  loginContainer.innerHTML = `
    <div class="skeleton-card">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-input"></div>
      <div class="skeleton skeleton-input"></div>
      <div class="skeleton skeleton-button"></div>
      <div class="skeleton skeleton-text short" style="margin-top: 1rem;"></div>
    </div>
  `;
  
  return originalContent;
}

function showTableSkeleton() {
  const dataTableBody = document.getElementById('dataTableBody');
  if (!dataTableBody) return;
  
  dataTableBody.innerHTML = '';
  
  for (let i = 0; i < 5; i++) {
    const row = document.createElement('tr');
    row.className = 'skeleton-table-row';
    row.innerHTML = `
      <td class="skeleton-table-cell">
        <div class="skeleton skeleton-text"></div>
      </td>
      <td class="skeleton-table-cell">
        <div class="skeleton skeleton-text"></div>
      </td>
      <td class="skeleton-table-cell">
        <div class="skeleton skeleton-text short"></div>
      </td>
      <td class="skeleton-table-cell">
        <div class="skeleton skeleton-text medium"></div>
      </td>
      <td class="skeleton-table-cell">
        <div class="skeleton skeleton-text short"></div>
      </td>
    `;
    dataTableBody.appendChild(row);
  }
}

function hideSkeletons() {
  const skeletons = document.querySelectorAll('.skeleton, .skeleton-card, .skeleton-table-row');
  skeletons.forEach(el => {
    el.style.display = 'none';
  });
}

/****************************
 * Expandable Details Functions
 ****************************/

function toggleDetails(row, item) {
  const expandBtn = row.querySelector('.expand-btn');
  const existingDetailRow = row.nextElementSibling;

  // If detail row exists, remove it (collapse)
  if (existingDetailRow && existingDetailRow.classList.contains('detail-row')) {
    existingDetailRow.remove();
    expandBtn.innerHTML = '➕';
    expandBtn.title = 'Show Details';
    row.classList.remove('expanded');
    return;
  }

  // Create detail row
  const detailRow = document.createElement('tr');
  detailRow.className = 'detail-row';
  detailRow.style.backgroundColor = '#f8f9fa';

  const detailCell = document.createElement('td');
  detailCell.colSpan = 5; // Span all columns
  detailCell.className = 'p-3';

  // Create detail content
  const detailContent = document.createElement('div');
  detailContent.className = 'detail-content';

  // Header information
  const headerInfo = document.createElement('div');
  headerInfo.className = 'row mb-3';
  headerInfo.innerHTML = `
    <div class="col-md-6">
      <h6 class="text-primary mb-2">📋 Record Details</h6>
      <table class="table table-sm table-borderless">
        <tr>
          <td class="fw-bold" style="width: 120px;">ID:</td>
          <td><code>${item.id}</code></td>
        </tr>
        <tr>
          <td class="fw-bold">Name:</td>
          <td>${item.NAME || 'N/A'}</td>
        </tr>
        <tr>
          <td class="fw-bold">Created:</td>
          <td>${new Date(item.created_at).toLocaleString()}</td>
        </tr>
      </table>
    </div>
    <div class="col-md-6">
      <h6 class="text-primary mb-2">📊 Additional Information</h6>
      <table class="table table-sm table-borderless">
        <tr>
          <td class="fw-bold" style="width: 120px;">Timestamp:</td>
          <td><small>${item.created_at}</small></td>
        </tr>
        <tr>
          <td class="fw-bold">Days Since:</td>
          <td>${Math.floor((new Date() - new Date(item.created_at)) / (1000 * 60 * 60 * 24))} days ago</td>
        </tr>
        <tr>
          <td class="fw-bold">Status:</td>
          <td><span class="badge bg-success">Active</span></td>
        </tr>
      </table>
    </div>
  `;

  detailContent.appendChild(headerInfo);
  detailCell.appendChild(detailContent);
  detailRow.appendChild(detailCell);

  // Insert detail row after the current row
  row.parentNode.insertBefore(detailRow, row.nextSibling);

  // Update button and add expanded class
  expandBtn.innerHTML = '➖';
  expandBtn.title = 'Hide Details';
  row.classList.add('expanded');
}

/****************************
 * Auto load data on start
 ****************************/

// Initialize sort indicator when table is shown
const defaultSortHeader = document.querySelector('[data-column="created_at"]');
if (defaultSortHeader) {
  defaultSortHeader.classList.add('sort-desc');
}

/****************************
 * Global Keyboard Shortcuts
 ****************************/
document.addEventListener('keydown', (e) => {
  // Ctrl+N: Open Add Item Modal
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn && !document.querySelector('.modal-overlay.show')) {
      addItemBtn.click();
    }
  }
  
  // Delete key: Delete selected items
  if (e.key === 'Delete' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    // Check if not focused on input fields
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return; // Don't trigger if typing in a field
    }
    
    // Check if any items are selected
    if (selectedItems.size > 0) {
      e.preventDefault();
      const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
      if (bulkDeleteBtn) {
        bulkDeleteBtn.click();
      }
    }
  }
  
  // Ctrl+A: Select all items on current page
  if (e.ctrlKey && e.key === 'a') {
    // Check if not focused on input fields
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return; // Allow default behavior in input fields
    }
    
    // If table is visible, select all
    const tableContainer = document.getElementById('tableContainer');
    if (tableContainer && !tableContainer.classList.contains('d-none')) {
      e.preventDefault();
      selectAll();
    }
  }
  
  // ESC: Deselect all (if any selected and no modal open)
  if (e.key === 'Escape') {
    const hasOpenModal = document.querySelector('.modal-overlay.show');
    if (!hasOpenModal && selectedItems.size > 0) {
      deselectAll();
    }
  }
});

}); // สิ้นสุด DOMContentLoaded








