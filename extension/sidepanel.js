/**
 * GemmaLens Chrome Extension Side Panel Controller
 * Handles persistent side panel interactions, full webpage capture,
 * resizable snipping tool integration, session sync to main desktop app,
 * speech narration, and follow-up Q&A continuation.
 */

const BACKEND_URL = 'http://localhost:3000';

let currentScan = null;
let currentSessionId = null;
let currentDomain = 'auto';
let conversationHistory = [];
let isSpeaking = false;
let waveInterval = null;

// DOM Elements
const tabLive = document.getElementById('tabLive');
const tabHistory = document.getElementById('tabHistory');
const liveView = document.getElementById('liveView');
const historyView = document.getElementById('historyView');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const capturePageBtn = document.getElementById('capturePageBtn');
const snipZoneBtn = document.getElementById('snipZoneBtn');
const spFileInput = document.getElementById('spFileInput');
const loadingCard = document.getElementById('loadingCard');
const resultsCard = document.getElementById('resultsCard');

const resCategory = document.getElementById('resCategory');
const resTitle = document.getElementById('resTitle');
const resSummary = document.getElementById('resSummary');
const resWarnings = document.getElementById('resWarnings');
const resChecklist = document.getElementById('resChecklist');

const resAudioBtn = document.getElementById('resAudioBtn');
const resAudioLabel = document.getElementById('resAudioLabel');
const soundwaveBars = document.querySelectorAll('.soundwave-bar');
const syncToAppBtn = document.getElementById('syncToAppBtn');

const qnaForm = document.getElementById('qnaForm');
const qnaInput = document.getElementById('qnaInput');
const chatThread = document.getElementById('chatThread');
const statusPill = document.getElementById('statusPill');
const statusText = document.getElementById('statusText');

document.addEventListener('DOMContentLoaded', () => {
  checkHealth();
  setupTabs();
  setupSkills();
  setupCaptureActions();
  setupAudio();
  setupQnA();
  setupSync();
  setupZoneListener();
  loadLatestScan();
});

// Setup Intelligence Skills Pills
function setupSkills() {
  const pills = document.querySelectorAll('.sp-skill-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      currentDomain = pill.getAttribute('data-domain') || 'auto';
    });
  });
}

function highlightSkillBadge(categoryName) {
  if (!categoryName) return;
  const lower = categoryName.toLowerCase();
  const pills = document.querySelectorAll('.sp-skill-pill');
  pills.forEach((p) => {
    const d = p.getAttribute('data-domain');
    if (d === 'health' && (lower.includes('health') || lower.includes('medic') || lower.includes('rx') || lower.includes('pharma'))) {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
    } else if (d === 'finance' && (lower.includes('bill') || lower.includes('financ') || lower.includes('tax') || lower.includes('invoice'))) {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
    } else if (d === 'legal' && (lower.includes('legal') || lower.includes('contract') || lower.includes('law') || lower.includes('agreement'))) {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
    } else if (d === 'developer' && (lower.includes('code') || lower.includes('develop') || lower.includes('program') || lower.includes('tech'))) {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
    } else if (d === 'tutor' && (lower.includes('tutor') || lower.includes('acad') || lower.includes('math') || lower.includes('learn'))) {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
    } else if (d === 'guide' && (lower.includes('trip') || lower.includes('transit') || lower.includes('guide') || lower.includes('travel'))) {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
    } else if (d === 'stocks' && (lower.includes('stock') || lower.includes('market') || lower.includes('trade') || lower.includes('equity'))) {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
    }
  });
}

function setupZoneListener() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'zoneAnalysisResult' && message.scan) {
      renderScan(message.scan);
      tabLive.click();
    }
  });
}

// 1. Health Check
async function checkHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    const data = await res.json();
    if (data.status === 'online') {
      statusText.textContent = data.ollama?.activeModel || 'Gemma 4 Ready';
    }
  } catch (err) {
    statusText.textContent = 'Server Offline';
    statusPill.style.background = 'rgba(255, 59, 48, 0.12)';
    statusPill.style.color = '#FF3B30';
    const dot = statusPill.querySelector('.status-dot');
    if (dot) dot.style.background = '#FF3B30';
  }
}

// 2. Tab Navigation
function setupTabs() {
  tabLive.addEventListener('click', () => {
    tabLive.classList.add('active');
    tabHistory.classList.remove('active');
    liveView.style.display = 'block';
    historyView.style.display = 'none';
  });

  tabHistory.addEventListener('click', () => {
    tabHistory.classList.add('active');
    tabLive.classList.remove('active');
    liveView.style.display = 'none';
    historyView.style.display = 'block';
    renderHistory();
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all stored scan history?')) {
      chrome.storage.local.set({ scanHistory: [] }, () => renderHistory());
    }
  });
}

// Helper: Query active web tab
async function getActiveWebTab() {
  try {
    let tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tabs || tabs.length === 0 || !tabs[0].id) {
      tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    }
    for (const t of (tabs || [])) {
      if (t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('about:') && !t.url.startsWith('edge://')) {
        return t;
      }
    }
    return tabs && tabs[0] ? tabs[0] : null;
  } catch (e) {
    return null;
  }
}

// 3. Actions: Capture Page, Resizable Snipping, Dropzone
function setupCaptureActions() {
  // Capture Full Webpage
  capturePageBtn.addEventListener('click', async () => {
    setLoading(true);
    try {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
        if (!dataUrl) {
          throw new Error('Could not capture visible tab.');
        }
        await processImageAnalysis(dataUrl, 'Full Webpage');
      });
    } catch (err) {
      alert('Capture Error: ' + err.message);
      setLoading(false);
    }
  });

  // Resizable Snipping Tool
  snipZoneBtn.addEventListener('click', async () => {
    try {
      const tab = await getActiveWebTab();
      if (!tab || !tab.id) {
        alert('Please open or focus a website tab first (e.g. localhost:3000 or any webpage). Snipping tool runs directly on normal websites.');
        return;
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['crop.js']
      });
    } catch (err) {
      console.warn('Direct scripting failed, attempting background fallback:', err);
      chrome.runtime.sendMessage({ action: 'startZoneCrop' }, (res) => {
        if (res && !res.success) {
          alert('Could not start snipping: ' + (res.error || 'Unknown error'));
        }
      });
    }
  });

  // Local File / PDF upload in Side Panel
  spFileInput.addEventListener('change', (e) => {
    if (e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      processImageAnalysis(evt.target.result, 'Uploaded Document: ' + file.name);
    };
    reader.readAsDataURL(file);
  });
}

async function processImageAnalysis(imageBase64, sourceLabel) {
  setLoading(true);
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageBase64,
        domainPreference: currentDomain || 'auto'
      })
    });

    const res = await response.json();
    if (!res.success) throw new Error(res.error || 'Analysis failed');

    const data = res.data;
    const scanItem = {
      id: 'scan_' + Date.now(),
      sessionId: 'sync_' + Date.now(),
      timestamp: new Date().toISOString(),
      type: sourceLabel,
      title: data.title || 'Webpage Analysis',
      category: data.category || data.domainRole || 'Document',
      plainSummary: data.plainSummary || '',
      actionSteps: data.actionSteps || [],
      criticalWarnings: data.criticalWarnings || [],
      keyExtractedDetails: data.keyExtractedDetails || {},
      audioScript: data.audioReadAloudScript || data.plainSummary || '',
      imageThumbnail: imageBase64
    };

    currentSessionId = scanItem.sessionId;

    // Sync to local server so it is openable in GemmaLens app anytime
    fetch(`${BACKEND_URL}/api/sync-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: {
          id: currentSessionId,
          data: data,
          category: data.category,
          image: imageBase64,
          title: data.title
        }
      })
    }).catch(console.warn);

    saveScan(scanItem);
    renderScan(scanItem);
  } catch (err) {
    alert('Analysis Error: ' + err.message + '\n\nPlease ensure GemmaLens is running at localhost:3000.');
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  loadingCard.style.display = isLoading ? 'block' : 'none';
  capturePageBtn.disabled = isLoading;
  snipZoneBtn.disabled = isLoading;
  if (isLoading) resultsCard.style.display = 'none';
}

function renderScan(scan) {
  currentScan = scan;
  currentSessionId = scan.sessionId || ('sync_' + Date.now());
  conversationHistory = [];
  chatThread.innerHTML = '';

  resCategory.textContent = scan.category || 'Document';
  resTitle.textContent = scan.title || 'Page Analysis';
  highlightSkillBadge(scan.category);
  resSummary.textContent = scan.plainSummary || 'Analyzed successfully.';

  // Critical Warnings
  if (scan.criticalWarnings && scan.criticalWarnings.length > 0) {
    resWarnings.innerHTML = `
      <div class="warning-box">
        <strong>Important Safety Notice:</strong><br>
        ${scan.criticalWarnings.map(w => typeof w === 'string' ? w : w.description || w.title).join('<br>')}
      </div>
    `;
  } else {
    resWarnings.innerHTML = '';
  }

  // Action Checklist
  if (scan.actionSteps && scan.actionSteps.length > 0) {
    resChecklist.innerHTML = `
      <div class="checklist-card">
        <div class="checklist-title">Action Steps</div>
        ${scan.actionSteps.map(step => `
          <label class="checklist-item">
            <input type="checkbox" style="margin-top:2px; accent-color:#0071E3;">
            <span>${step}</span>
          </label>
        `).join('')}
      </div>
    `;
  } else {
    resChecklist.innerHTML = '';
  }

  resultsCard.style.display = 'block';
  stopAudio();
}

// 4. Sync to Desktop App
function setupSync() {
  syncToAppBtn.addEventListener('click', () => {
    if (!currentScan) return;
    const sessionId = currentSessionId || ('sync_' + Date.now());

    // Ensure session is pushed to server
    fetch(`${BACKEND_URL}/api/sync-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: {
          id: sessionId,
          data: currentScan,
          image: currentScan.imageThumbnail,
          title: currentScan.title,
          category: currentScan.category
        }
      })
    })
    .finally(() => {
      // Open in GemmaLens app with sync session ID
      chrome.tabs.create({ url: `http://localhost:3000/?session=${sessionId}` });
    });
  });
}

// 5. Speech Audio Narration
function setupAudio() {
  resAudioBtn.addEventListener('click', () => {
    if (isSpeaking) {
      stopAudio();
    } else {
      playAudio();
    }
  });
}

function playAudio() {
  if (!currentScan) return;
  const text = currentScan.audioScript || currentScan.plainSummary;
  if (!text) return;

  stopAudio();

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;

  utter.onstart = () => {
    isSpeaking = true;
    resAudioLabel.textContent = 'Pause';
    startWaveLoop();
  };

  utter.onboundary = () => {
    soundwaveBars.forEach((bar) => {
      const h = Math.floor(Math.random() * 8 + 4);
      bar.style.height = `${h}px`;
    });
  };

  utter.onend = stopAudio;
  utter.onerror = stopAudio;

  window.speechSynthesis?.speak(utter);
}

function stopAudio() {
  window.speechSynthesis?.cancel();
  isSpeaking = false;
  resAudioLabel.textContent = 'Listen';
  if (waveInterval) {
    clearInterval(waveInterval);
    waveInterval = null;
  }
  soundwaveBars.forEach(b => b.style.height = '4px');
}

function startWaveLoop() {
  if (waveInterval) clearInterval(waveInterval);
  waveInterval = setInterval(() => {
    if (!isSpeaking) return;
    soundwaveBars.forEach((bar) => {
      const h = Math.floor(Math.random() * 8 + 3);
      bar.style.height = `${h}px`;
    });
  }, 120);
}

// 6. Continuation / Follow-up Q&A
function setupQnA() {
  qnaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = qnaInput.value.trim();
    if (!question || !currentScan) return;

    // Render user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-q';
    userMsg.textContent = question;
    chatThread.appendChild(userMsg);
    qnaInput.value = '';
    chatThread.scrollTop = chatThread.scrollHeight;

    // Render AI thinking indicator
    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-a';
    aiMsg.textContent = 'Thinking...';
    chatThread.appendChild(aiMsg);
    chatThread.scrollTop = chatThread.scrollHeight;

    try {
      const response = await fetch(`${BACKEND_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: `Title: ${currentScan.title}\nCategory: ${currentScan.category}\nSummary: ${currentScan.plainSummary}`,
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

// 7. Storage & History
function saveScan(item) {
  chrome.storage.local.get({ scanHistory: [] }, (res) => {
    const list = res.scanHistory || [];
    list.unshift(item);
    chrome.storage.local.set({ scanHistory: list.slice(0, 30) });
  });
}

function loadLatestScan() {
  chrome.storage.local.get({ scanHistory: [] }, (res) => {
    const list = res.scanHistory || [];
    if (list.length > 0) {
      renderScan(list[0]);
    }
  });
}

function renderHistory() {
  chrome.storage.local.get({ scanHistory: [] }, (res) => {
    const list = res.scanHistory || [];
    if (list.length === 0) {
      historyList.innerHTML = '<div style="text-align:center; padding:30px 10px; color:#8E8E93;">No scans yet. Capture a webpage or snip a zone to start.</div>';
      return;
    }

    historyList.innerHTML = list.map((item, idx) => {
      const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="history-card" data-idx="${idx}">
          <div class="history-meta">
            <span class="category-badge">${item.category || item.type || 'Document'}</span>
            <span class="history-date">${timeStr}</span>
          </div>
          <div class="history-title">${item.title}</div>
          <div class="history-snippet">${item.plainSummary}</div>
        </div>
      `;
    }).join('');

    historyList.querySelectorAll('.history-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-idx'), 10);
        renderScan(list[idx]);
        tabLive.click();
      });
    });
  });
}
