/****************************
 * รอให้ DOM โหลดเสร็จก่อน
 ****************************/
document.addEventListener('DOMContentLoaded', () => {

/****************************
 * 🔑 PASSWORD TOGGLE FUNCTIONALITY
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

passwordInput.addEventListener('input', () => {
  const password = passwordInput.value;
  
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

// ✅ สำคัญ: ใช้ window.supabase และตั้งชื่อใหม่เป็น db
const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


/****************************
 * 🔐 AUTHENTICATION SYSTEM
 ****************************/

// ตรวจสอบสถานะการล็อกอินเมื่อโหลดหน้า
async function checkAuthStatus() {
  const { data: { session } } = await db.auth.getSession();
  
  if (session) {
    showApp(session.user);
  } else {
    showLogin();
  }
}

// แสดงหน้าล็อกอิน
function showLogin() {
  document.getElementById('loginContainer').classList.remove('d-none');
  document.getElementById('appContainer').classList.add('d-none');
}

// แสดงหน้าแอปหลัก
function showApp(user) {
  document.getElementById('loginContainer').classList.add('d-none');
  document.getElementById('appContainer').classList.remove('d-none');
  
  // แสดงข้อมูลผู้ใช้
  if (user && user.email) {
    document.getElementById('userEmail').textContent = user.email;
  }
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

// Login Form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const submitBtn = document.getElementById('loginSubmitBtn');
  
  // Show loading state
  setButtonLoading(submitBtn, true);
  
  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });
  
  // Hide loading state
  setButtonLoading(submitBtn, false);
  
  if (error) {
    showAuthMessage('❌ ' + error.message, 'danger');
  } else {
    // Save email if remember me is checked
    if (rememberMeCheckbox.checked) {
      localStorage.setItem('rememberedEmail', email);
    }
    
    showAuthMessage('✅ เข้าสู่ระบบสำเร็จ!', 'success');
    setTimeout(() => {
      showApp(data.user);
    }, 1000);
  }
});

// Signup Button
document.getElementById('signupBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const signupBtn = document.getElementById('signupBtn');
  
  if (!email || !password) {
    showAuthMessage('⚠️ กรุณากรอกอีเมลและรหัสผ่าน', 'warning');
    return;
  }
  
  if (password.length < 6) {
    showAuthMessage('⚠️ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'warning');
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
    showAuthMessage('❌ ' + error.message, 'danger');
  } else {
    showAuthMessage('✅ สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ', 'success');
  }
});

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
    showAuthMessage('❌ ไม่สามารถเข้าสู่ระบบด้วย GitHub ได้: ' + error.message, 'danger');
    
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
    showAuthMessage('❌ ไม่สามารถเข้าสู่ระบบด้วย Google ได้: ' + error.message, 'danger');
    
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

// Logout Button
document.getElementById('logoutBtn').addEventListener('click', async () => {
  const { error } = await db.auth.signOut();
  
  if (error) {
    alert('Error logging out: ' + error.message);
  } else {
    showLogin();
    // Clear data
    originalData = [];
    document.getElementById('dataTableBody').innerHTML = '';
    document.getElementById('tableContainer').classList.add('d-none');
  }
});

// ฟังการเปลี่ยนแปลง auth state
db.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    showApp(session.user);
  } else if (event === 'SIGNED_OUT') {
    showLogin();
  }
});

// เรียกใช้เมื่อโหลดหน้า
checkAuthStatus();


/****************************
 * Supabase READ
 ****************************/

// Global variables for data management
let originalData = [];
let currentSort = { column: 'created_at', direction: 'desc' };
let currentFilter = '';
let currentPage = 1;
let itemsPerPage = 10;

/****************************
 * Supabase READ
 ****************************/

async function loadData() {
  const loadingSpinner = document.getElementById('loadingSpinner');
  const errorMessage = document.getElementById('errorMessage');
  const tableContainer = document.getElementById('tableContainer');
  const dataTableBody = document.getElementById('dataTableBody');

  // Show loading, hide others
  loadingSpinner.classList.remove('d-none');
  errorMessage.classList.add('d-none');
  tableContainer.classList.add('d-none');

  const { data, error } = await db
    .from('ID') // 👈 ชื่อตารางใน Supabase
    .select('*')
    .order('created_at', { ascending: false });

  loadingSpinner.classList.add('d-none');

  if (error) {
    console.error(error);
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
}

/****************************
 * Data Display and Manipulation
 ****************************/

function displayData() {
  const dataTableBody = document.getElementById('dataTableBody');
  const resultCount = document.getElementById('resultCount');

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
      nameCell.textContent = item.NAME || 'N/A';
      nameCell.dataset.field = 'name';
      row.appendChild(nameCell);

      const dateCell = document.createElement('td');
      const createdDate = new Date(item.created_at);
      dateCell.textContent = createdDate.toLocaleString();
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
 * Edit and Delete Functions
 ****************************/

function enableEditMode(row, item) {
  const nameCell = row.querySelector('[data-field="name"]');
  const actionsCell = row.querySelector('td:last-child');

  // Store original content
  const originalName = nameCell.textContent;

  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control form-control-sm';
  input.value = originalName === 'N/A' ? '' : originalName;

  // Replace text with input
  nameCell.textContent = '';
  nameCell.appendChild(input);
  input.focus();
  input.select();

  // Replace buttons with Save/Cancel
  actionsCell.innerHTML = '';

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-sm btn-success me-1';
  saveBtn.innerHTML = '💾 Save';
  saveBtn.onclick = () => saveEdit(row, item.id, input.value.trim());
  actionsCell.appendChild(saveBtn);

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-sm btn-secondary';
  cancelBtn.innerHTML = '❌ Cancel';
  cancelBtn.onclick = () => cancelEdit(row, originalName);
  actionsCell.appendChild(cancelBtn);

  // Handle Enter/Escape keys
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      saveEdit(row, item.id, input.value.trim());
    } else if (e.key === 'Escape') {
      cancelEdit(row, originalName);
    }
  };
}

function cancelEdit(row, originalName) {
  const nameCell = row.querySelector('[data-field="name"]');
  const actionsCell = row.querySelector('td:last-child');

  // Restore original content
  nameCell.textContent = originalName;

  // Restore original buttons
  actionsCell.innerHTML = '';
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-sm btn-warning me-1';
  editBtn.innerHTML = '✏️ Edit';
  editBtn.onclick = () => {
    const itemId = row.dataset.id;
    const item = originalData.find(d => d.id === itemId);
    if (item) enableEditMode(row, item);
  };
  actionsCell.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-danger';
  deleteBtn.innerHTML = '🗑️ Delete';
  deleteBtn.onclick = () => {
    const itemId = row.dataset.id;
    const item = originalData.find(d => d.id === itemId);
    if (item) deleteRecord(item.id, item.NAME || 'Unknown');
  };
  actionsCell.appendChild(deleteBtn);
}

async function saveEdit(row, itemId, newName) {
  if (!newName) {
    alert('Name cannot be empty!');
    return;
  }

  try {
    const { error } = await db
      .from('ID')
      .update({ NAME: newName })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating record:', error);
      alert('Error updating record: ' + error.message);
      return;
    }

    // Update local data
    const itemIndex = originalData.findIndex(d => d.id === itemId);
    if (itemIndex !== -1) {
      originalData[itemIndex].NAME = newName;
    }

    // Refresh display
    displayData();

    alert('Record updated successfully!');
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while updating the record.');
  }
}

function deleteRecord(itemId, itemName) {
  const confirmed = confirm(`Are you sure you want to delete the record for "${itemName}"?\n\nThis action cannot be undone!`);

  if (!confirmed) return;

  performDelete(itemId, itemName);
}

async function performDelete(itemId, itemName) {
  try {
    const { error } = await db
      .from('ID')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting record:', error);
      alert('Error deleting record: ' + error.message);
      return;
    }

    // Remove from local data
    originalData = originalData.filter(d => d.id !== itemId);

    // Refresh display
    displayData();

    alert(`Record "${itemName}" deleted successfully!`);
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while deleting the record.');
  }
}

// ปุ่ม Load Data
const loadBtn = document.getElementById('loadDataBtn');
if (loadBtn) {
  loadBtn.addEventListener('click', loadData);
}

// ปุ่ม Add Item
const addItemBtn = document.getElementById('addItemBtn');
if (addItemBtn) {
  addItemBtn.addEventListener('click', async () => {
    const name = prompt('Enter item name:');
    if (!name || !name.trim()) return;

    const { error } = await db
      .from('ID')
      .insert([{ NAME: name.trim() }]);

    if (error) {
      console.error(error);
      alert('Error adding item: ' + error.message);
      return;
    }

    alert('Item added successfully!');
    loadData(); // Reload data
  });
}

// ปุ่ม Download CSV
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
if (downloadCsvBtn) {
  downloadCsvBtn.addEventListener('click', (e) => {
    e.preventDefault();
    downloadCSV();
  });
}

// ปุ่ม Download PDF
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener('click', (e) => {
    e.preventDefault();
    downloadPDF();
  });
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

// Clear search button
const clearSearchBtn = document.getElementById('clearSearchBtn');
if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', clearSearch);
}

// Items per page selector
const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
if (itemsPerPageSelect) {
  itemsPerPageSelect.addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value);
    resetPagination();
    displayData();
  });
}


function downloadCSV() {
  if (originalData.length === 0) {
    alert('No data to download!');
    return;
  }

  // Get filtered data (same logic as displayData)
  let filteredData = originalData.filter(item => {
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
    showWarningToast('No data to download!');
    return;
  }

  // Get filtered data (same logic as displayData)
  let filteredData = originalData.filter(item => {
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

document.getElementById('helloBtn').addEventListener('click', async () => {
  const input = document.getElementById('username');
  const greeting = document.getElementById('greeting');
  const name = input.value.trim();

  if (!name) {
    greeting.textContent = '❗ กรุณาใส่ชื่อ';
    greeting.className = 'alert alert-warning';
    greeting.classList.remove('d-none');
    return;
  }

  greeting.textContent = '⏳ Saving...';
  greeting.className = 'alert alert-info';
  greeting.classList.remove('d-none');

  const { error } = await db
    .from('ID')
    .insert([{ NAME: name }]);

  if (error) {
    console.error(error);
    greeting.textContent = '❌ Error: ' + error.message;
    greeting.className = 'alert alert-danger';
    return;
  }

  greeting.textContent = `✅ Hello ${name}`;
  greeting.className = 'alert alert-success';
  input.value = '';

  // โหลดข้อมูลใหม่
  loadData();
});


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

  // Update button
  expandBtn.innerHTML = '➖';
  expandBtn.title = 'Hide Details';
}

/****************************
 * Auto load data on start
 ****************************/

// Initialize sort indicator when table is shown
const defaultSortHeader = document.querySelector('[data-column="created_at"]');
if (defaultSortHeader) {
  defaultSortHeader.classList.add('sort-desc');
}

}); // สิ้นสุด DOMContentLoaded








