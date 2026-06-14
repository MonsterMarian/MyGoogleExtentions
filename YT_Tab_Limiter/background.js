const MAX_YOUTUBE_TABS = 2;

async function enforceTabLimit() {
  try {
    // Získání všech aktuálně otevřených záložek
    const tabs = await chrome.tabs.query({});
    
    // Filtrace záložek, které jsou na YouTube
    const ytTabs = tabs.filter(tab => tab.url && tab.url.includes('youtube.com'));
    
    // Pokud je otevřeno více než povolený počet YouTube záložek
    if (ytTabs.length > MAX_YOUTUBE_TABS) {
      // Seřadíme záložky sestupně podle ID (novější záložky mají obvykle vyšší ID)
      ytTabs.sort((a, b) => b.id - a.id);
      
      // Vybereme ty, které jsou "navíc" a zavřeme je
      const tabsToClose = ytTabs.slice(0, ytTabs.length - MAX_YOUTUBE_TABS);
      
      for (const tab of tabsToClose) {
        chrome.tabs.remove(tab.id);
      }
    }
  } catch (error) {
    console.error("Error enforcing tab limit:", error);
  }
}

// Sledování změn URL u existujících záložek (např. když uživatel přejde na YouTube)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    enforceTabLimit();
  }
});

// Sledování vytvoření nových záložek
chrome.tabs.onCreated.addListener((tab) => {
  enforceTabLimit();
});
