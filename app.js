document.getElementById('btn').addEventListener('click', () => {
  document.getElementById('status').textContent = '✅ Button Clicked';
});

window.addEventListener('online', () => {
  document.getElementById('status').textContent = '🟢 Online';
});

window.addEventListener('offline', () => {
  document.getElementById('status').textContent = '🔴 Offline';
});
