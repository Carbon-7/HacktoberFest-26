/**
 * GemmaLens Chrome Extension Background Service Worker
 * Coordinates side panel opening, tab captures, and resizable snipping tool injection.
 */

// Enable action click to open side panel automatically
function initSidePanelBehavior() {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.warn('Side panel behavior setup:', err));
  }
}

initSidePanelBehavior();
chrome.runtime.onInstalled.addListener(initSidePanelBehavior);

// Fallback action click handler
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (err) {
      console.warn('Could not open side panel directly:', err);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startZoneCrop') {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }
      const targetTab = tabs[0];
      try {
        await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          files: ['crop.js']
        });
        sendResponse({ success: true, tabId: targetTab.id });
      } catch (err) {
        console.error('Failed to inject resizable snipping tool:', err);
        sendResponse({ success: false, error: err.message });
      }
    });
    return true; // Keep message port open for async response
  }

  if (message.action === 'captureTab') {
    const targetWinId = sender?.tab?.windowId || null;
    chrome.tabs.captureVisibleTab(targetWinId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        // Fallback with null windowId
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (fallbackUrl) => {
          if (chrome.runtime.lastError || !fallbackUrl) {
            sendResponse({ success: false, error: chrome.runtime.lastError?.message || 'Failed to capture visible tab' });
          } else {
            sendResponse({ success: true, dataUrl: fallbackUrl });
          }
        });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true;
  }
});
