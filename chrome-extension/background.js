const hostName = 'com.notchflow.chrome'

function sendActiveTab(tab) {
  if (!tab?.url || !/^https?:/.test(tab.url)) return
  chrome.runtime.sendNativeMessage(hostName, { type: 'active-tab', url: tab.url, title: tab.title ?? '' }, () => {
    // The desktop app may not yet be installed; avoid surfacing extension errors to the user.
    void chrome.runtime.lastError
  })
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => sendActiveTab(await chrome.tabs.get(tabId)))
chrome.tabs.onUpdated.addListener((_tabId, changes, tab) => { if (changes.status === 'complete' && tab.active) sendActiveTab(tab) })
