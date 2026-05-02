document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');

  // Načíst uložený klíč
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  saveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showStatus('Prosím zadej API klíč', 'red');
      return;
    }

    chrome.storage.sync.set({ geminiApiKey: key }, () => {
      showStatus('Nastavení uloženo ✅', 'lime');
    });
  });

  function showStatus(msg, color) {
    statusEl.textContent = msg;
    statusEl.style.color = color;
    setTimeout(() => {
      statusEl.textContent = '';
    }, 3000);
  }
});
