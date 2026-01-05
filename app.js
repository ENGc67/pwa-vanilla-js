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
