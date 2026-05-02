chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (tab.url.includes("youtube.com/shorts")) {
      chrome.tabs.remove(tabId); // zavře tab
    }
  }
});
