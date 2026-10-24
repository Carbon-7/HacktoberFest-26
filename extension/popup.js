/**
 * GemmaLens Chrome Extension Controller
 * Manages full webpage capture, zone selection routing, speech narration,
 * follow-up Q&A continuation, and persistent scan history.
 */

const BACKEND_URL = 'http://localhost:3000';

let currentScanData = null;
let conversationHistory = [];
let isSpeaking = false;
let waveInterval = null;

// DOM Elements
const tabScan = document.getElementById('tabScan');
const tabHistory = document.getElementById('tabHistory');
const scanView = document.getElementById('scanView');
const historyView = document.getElementById('historyView');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const captureFullBtn = document.getElementById('captureFullBtn');
const cropZoneBtn = document.getElementById('cropZoneBtn');
const loadingBox = document.getElementById('loadingBox');
const resultsCard = document.getElementById('resultsCard');

const cardCategory = document.getElementById('cardCategory');
const cardTitle = document.getElementById('cardTitle');
const cardSummary = document.getElementById('cardSummary');
const cardWarningsContainer = document.getElementById('cardWarningsContainer');
const cardChecklistContainer = document.getElementById('cardChecklistContainer');

const audioBtn = document.getElementById('audioBtn');
const audioLabel = document.getElementById('audioLabel');
const soundwaveBars = document.querySelectorAll('.soundwave-bar');

const qnaForm = document.getElementById('qnaForm');
const qnaInput = document.getElementById('qnaInput');
const chatThread = document.getElementById('chatThread');
const statusPill = document.getElementById('statusPill');
const statusText = document.getElementById('statusText');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkBackendHealth();
  setupTabs();
  setupActions();
  setupAudio();
  setupQnA();
  loadLatestScanOrHistory();
});

// Check if local GemmaLens server is running
async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { method: 'GET' });
    const data = await res.json();
    if (data.status === 'ok') {
      statusText.textContent = data.model || 'Gemma 4 Ready';
    }
  } catch (err) {
    statusText.textContent = 'Server Offline';
    statusPill.style.background = 'rgba(255, 59, 48, 0.12)';
    statusPill.style.color = '#FF3B30';
    const dot = statusPill.querySelector('.status-dot');
    if (dot) dot.style.background = '#FF3B30';
  }
}

// Tab Switching
function setupTabs() {
  tabScan.addEventListener('click', () => {
    tabScan.classList.add('active');
    tabHistory.classList.remove('active');
    scanView.style.display = 'block';
    historyView.style.display = 'none';
  });

  tabHistory.addEventListener('click', () => {
    tabHistory.classList.add('active');
    tabScan.classList.remove('active');
    scanView.style.display = 'none';
    historyView.style.display = 'block';
    renderHistory();
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all stored scan history?')) {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ scanHistory: [] }, () => renderHistory());
      } else {
        localStorage.removeItem('gemmalens_history');
        renderHistory();
      }
    }
  });
}

// Action Handlers
function setupActions() {
  // 1. Full Webpage Capture
  captureFullBtn.addEventListener('click', async () => {
    setLoading(true);

    try {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
        if (!dataUrl) {
          throw new Error('Unable to capture tab. Note: browser settings or empty tabs cannot be captured.');
        }

        const response = await fetch(`${BACKEND_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl })
        });

        const res = await response.json();
        if (!res.success) throw new Error(res.error || 'Analysis failed');

        const scanItem = {
          id: 'scan_' + Date.now(),
          timestamp: new Date().toISOString(),
          type: 'Full Webpage',
          title: res.data.title || 'Webpage Analysis',
          category: res.data.category || 'Web Page',
          plainSummary: res.data.plainSummary || '',
          actionSteps: res.data.actionSteps || [],
          criticalWarnings: res.data.criticalWarnings || [],
          keyExtractedDetails: res.data.keyExtractedDetails || {},
          audioScript: res.data.audioReadAloudScript || res.data.plainSummary || ''
        };

        saveScan(scanItem);
        displayScan(scanItem);
      });
    } catch (err) {
      alert('Error: ' + err.message + '\n\nPlease ensure GemmaLens local server is running at localhost:3000.');
    } finally {
      setLoading(false);
    }
  });

  // 2. Select Specific Zone (Area Crop)
  cropZoneBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'startZoneCrop' }, () => {
      // Close popup so user has unobstructed view of the page
      window.close();
    });
  });
}

function setLoading(isLoading) {
  loadingBox.style.display = isLoading ? 'block' : 'none';
  captureFullBtn.disabled = isLoading;
  cropZoneBtn.disabled = isLoading;
  if (isLoading) {
    resultsCard.style.display = 'none';
  }
}

// Display Scan Data in Popup
function displayScan(data) {
  currentScanData = data;
  conversationHistory = [];
  chatThread.innerHTML = '';

  cardCategory.textContent = data.category || 'Document';
  cardTitle.textContent = data.title || 'Page Analysis';
  cardSummary.textContent = data.plainSummary || 'Analyzed successfully.';

  // Critical Warnings
  if (data.criticalWarnings && data.criticalWarnings.length > 0) {
    cardWarningsContainer.innerHTML = `
      <div class="warning-banner">
        <strong>Important Warning:</strong><br>
        ${data.criticalWarnings.join('<br>')}
      </div>
    `;
  } else {
    cardWarningsContainer.innerHTML = '';
  }

  // Action Steps Checklist
  if (data.actionSteps && data.actionSteps.length > 0) {
    cardChecklistContainer.innerHTML = `
      <div class="checklist-container">
        <div class="checklist-title">Action Steps</div>
        ${data.actionSteps.map(step => `
          <label class="checklist-item">
            <input type="checkbox" style="margin-top:2px; accent-color:#0071E3;">
            <span>${step}</span>
          </label>
        `).join('')}
      </div>
    `;
  } else {
    cardChecklistContainer.innerHTML = '';
  }

  resultsCard.style.display = 'block';

  // Stop any active audio
  stopAudio();
}

// Audio Narration with Dynamic Wave
function setupAudio() {
  audioBtn.addEventListener('click', () => {
    if (isSpeaking) {
      stopAudio();
    } else {
      playAudio();
    }
  });
}

function playAudio() {
  if (!currentScanData) return;
  const text = currentScanData.audioScript || currentScanData.plainSummary;
  if (!text) return;

  stopAudio();

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;

  utter.onstart = () => {
    isSpeaking = true;
    audioLabel.textContent = 'Pause';
    startWaveAnimation();
  };

  utter.onboundary = () => {
    // Dynamically modulate wave heights with speech cadence
    soundwaveBars.forEach((bar) => {
      const h = Math.floor(Math.random() * 8 + 4);
      bar.style.height = `${h}px`;
    });
  };

  utter.onend = () => {
    stopAudio();
  };

  utter.onerror = () => {
    stopAudio();
  };

  window.speechSynthesis?.speak(utter);
}

function stopAudio() {
  window.speechSynthesis?.cancel();
  isSpeaking = false;
  audioLabel.textContent = 'Listen';
  if (waveInterval) {
    clearInterval(waveInterval);
    waveInterval = null;
  }
  soundwaveBars.forEach(b => b.style.height = '4px');
}

function startWaveAnimation() {
  if (waveInterval) clearInterval(waveInterval);
  waveInterval = setInterval(() => {
    if (!isSpeaking) return;
    soundwaveBars.forEach((bar) => {
      const h = Math.floor(Math.random() * 9 + 3);
      bar.style.height = `${h}px`;
    });
  }, 120);
}

// Continuation / Follow-up Q&A
function setupQnA() {
  qnaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = qnaInput.value.trim();
    if (!question || !currentScanData) return;

    // Render user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-bubble-q';
    userMsg.textContent = question;
    chatThread.appendChild(userMsg);
    qnaInput.value = '';
    chatThread.scrollTop = chatThread.scrollHeight;

    // Render AI thinking indicator
    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-bubble-a';
    aiMsg.textContent = 'Thinking...';
    chatThread.appendChild(aiMsg);
    chatThread.scrollTop = chatThread.scrollHeight;

    try {
      const response = await fetch(`${BACKEND_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: `Title: ${currentScanData.title}\nCategory: ${currentScanData.category}\nSummary: ${currentScanData.plainSummary}\nKey Details: ${JSON.stringify(currentScanData.keyExtractedDetails || {})}`,
          history: conversationHistory
        })
      });

      const res = await response.json();
      if (!res.success) throw new Error(res.error || 'Failed to answer');

      aiMsg.textContent = res.answer;
      conversationHistory.push({ question, answer: res.answer });
      chatThread.scrollTop = chatThread.scrollHeight;
    } catch (err) {
      aiMsg.textContent = 'Could not get answer: ' + err.message;
    }
  });
}

// Persistent History
function saveScan(item) {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({ scanHistory: [] }, (res) => {
      const list = res.scanHistory || [];
      list.unshift(item);
      chrome.storage.local.set({ scanHistory: list.slice(0, 30) });
    });
  } else {
    const list = JSON.parse(localStorage.getItem('gemmalens_history') || '[]');
    list.unshift(item);
    localStorage.setItem('gemmalens_history', JSON.stringify(list.slice(0, 30)));
  }
}

function loadLatestScanOrHistory() {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({ scanHistory: [] }, (res) => {
      const list = res.scanHistory || [];
      if (list.length > 0) {
        displayScan(list[0]);
      }
    });
  } else {
    const list = JSON.parse(localStorage.getItem('gemmalens_history') || '[]');
    if (list.length > 0) {
      displayScan(list[0]);
    }
  }
}

function renderHistory() {
  const renderList = (list) => {
    if (!list || list.length === 0) {
      historyList.innerHTML = '<div class="empty-state">No scans yet. Capture a webpage or zone to start.</div>';
      return;
    }

    historyList.innerHTML = list.map((item, idx) => {
      const dateStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="history-card" data-idx="${idx}">
          <div class="history-meta">
            <span class="category-badge">${item.category || item.type || 'Document'}</span>
            <span class="history-date">${dateStr}</span>
          </div>
          <div class="history-title">${item.title}</div>
          <div class="history-snippet">${item.plainSummary}</div>
        </div>
      `;
    }).join('');

    // Attach click to restore
    historyList.querySelectorAll('.history-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-idx'), 10);
        displayScan(list[idx]);
        tabScan.click();
      });
    });
  };

  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({ scanHistory: [] }, (res) => renderList(res.scanHistory || []));
  } else {
    const list = JSON.parse(localStorage.getItem('gemmalens_history') || '[]');
    renderList(list);
  }
}
