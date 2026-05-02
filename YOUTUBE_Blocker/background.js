// zachytení navigace v rámci jedné stránky (YouTube je SPA - Single Page Application)
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  if (details.url.includes("youtube.com/watch")) {
    chrome.tabs.sendMessage(details.tabId, { action: "yt-navigate" }).catch(() => {});
  }
}, {url: [{hostSuffix: "youtube.com"}]});
