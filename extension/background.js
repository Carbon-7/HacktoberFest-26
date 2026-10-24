/**
 * GemmaLens Chrome Extension Background Service Worker
 * Coordinates tab captures, zone selection scripts, and message routing.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startZoneCrop') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) return;
      const tabId = tabs[0].id;
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['crop.js']
        });
        sendResponse({ success: true });
      } catch (err) {
        console.error('Failed to inject crop script:', err);
        sendResponse({ success: false, error: err.message });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (message.action === 'captureTab') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        sendResponse({ success: false, error: chrome.runtime.lastError?.message || 'Failed to capture tab' });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true;
  }
});
