// Button Click
document.getElementById('btn').addEventListener('click', () => {
  document.getElementById('status').textContent = '✅ Button Clicked';
});

// Online / Offline status
window.addEventListener('online', () => {
  document.getElementById('status').textContent = '🟢 Online';
});

window.addEventListener('offline', () => {
  document.getElementById('status').textContent = '🔴 Offline';
});

// ===============================
// ✅ PWA Install Banner
// ===============================
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // ปิด banner default
  deferredPrompt = e;
  installBtn.hidden = false; // แสดงปุ่ม Install
});

installBtn.addEventListener('click', async () => {
  installBtn.hidden = true;

  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('Install result:', outcome);

  deferredPrompt = null;
});
