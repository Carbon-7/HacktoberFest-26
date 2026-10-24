/**
 * GemmaLens Chrome Extension Background Service Worker
 * Coordinates side panel opening, tab captures, and resizable snipping tool injection.
 */

// Configure action click to immediately open the Chrome Side Panel
chrome.sidePanel
  ?.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.warn('Side panel behavior setup:', err));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startZoneCrop') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }
      const tabId = tabs[0].id;
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['crop.js']
        });
        sendResponse({ success: true });
      } catch (err) {
        console.error('Failed to inject resizable snipping tool:', err);
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  if (message.action === 'captureTab') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        sendResponse({ success: false, error: chrome.runtime.lastError?.message || 'Failed to capture visible tab' });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true;
  }

  if (message.action === 'openAppWithSync') {
    const sessionId = message.sessionId;
    const url = sessionId ? `http://localhost:3000/?session=${sessionId}` : 'http://localhost:3000';
    chrome.tabs.create({ url });
    sendResponse({ success: true });
    return true;
  }
});
