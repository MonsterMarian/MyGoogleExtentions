/**
 * Configuration for restricted hours.
 * Restricted: 00:00 - 18:00 and 20:30 - 23:59
 * Accessible: 18:00 - 20:30
 */
const RESTRICTED_START_1 = 0; // 00:00
const RESTRICTED_END_1 = 18 * 60; // 18:00
const RESTRICTED_START_2 = 20 * 60 + 30; // 20:30
const RESTRICTED_END_2 = 24 * 60; // 23:59 (approx)

function isRestrictedTime() {
  const now = new Date();
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

  const isMorningRestriction = currentTimeInMinutes >= RESTRICTED_START_1 && currentTimeInMinutes < RESTRICTED_END_1;
  const isNightRestriction = currentTimeInMinutes >= RESTRICTED_START_2 && currentTimeInMinutes < RESTRICTED_END_2;

  return isMorningRestriction || isNightRestriction;
}

function checkAndCloseTab(tab) {
  if (!tab) return;

  const url = tab.url || tab.pendingUrl;
  if (!url) return;

  // 1. Ochrana Extensions tabu
  if (url.startsWith('chrome://extensions')) {
    if (isRestrictedTime()) {
      console.log('Restricted time detected. Closing Extensions tab.');
      chrome.tabs.remove(tab.id).catch(err => console.log('Nelze zavřít tab:', err));
      return; // Už nemá smysl dělat další kontroly
    }
  }

  // 2. Blokování YouTube Shorts
  if (url.includes("youtube.com/shorts")) {
    console.log('YouTube Shorts detected. Closing tab.');
    chrome.tabs.remove(tab.id).catch(err => console.log('Nelze zavřít tab:', err));
  }
}

// Listen for tab updates (e.g., when the user navigates)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' || changeInfo.status === 'complete' || changeInfo.url) {
    checkAndCloseTab(tab);
  }
});

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
  checkAndCloseTab(tab);
});

console.log('Focus Blocker (ET & Shorts) service worker initialized.');
