/**
 * GemmaLens Frontend Application Controller
 * Auto-Detection, Clean Transition Flow, Follow-Up Q&A, Scan History,
 * Chrome Extension Integration, and Mesmerizing Orbital Loading.
 */

import { AudioEngine } from './audio.js';

class GemmaLensApp {
  constructor() {
    this.audio = new AudioEngine();
    this.currentImageBase64 = null;
    this.currentAnalysisResult = null;
    this.presets = [];
    this.isAnalyzing = false;
    this.loadingInterval = null;
    this.tipInterval = null;
    this.fontScale = 1.0;
    this.history = this.loadHistoryFromStorage();

    this.initElements();
    this.bindEvents();
    this.checkHealth();
    this.loadPresets();
    this.updateHistoryUI();
  }

  initElements() {
    // Header & Controls
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    this.fontDecBtn = document.getElementById('fontDecBtn');
    this.fontIncBtn = document.getElementById('fontIncBtn');
    this.historyToggleBtn = document.getElementById('historyToggleBtn');
    this.historyCount = document.getElementById('historyCount');
    this.brandHomeLink = document.getElementById('brandHomeLink');
    this.extensionBtn = document.getElementById('extensionBtn');

    // Ingestion Stage Elements
    this.ingestionStage = document.getElementById('ingestionStage');
    this.dropzoneCard = document.getElementById('dropzoneCard');
    this.fileInput = document.getElementById('fileInput');
    this.cameraBtn = document.getElementById('cameraBtn');
    this.presetsGrid = document.getElementById('presetsGrid');

    // Loading Elements
    this.loadingCard = document.getElementById('loadingCard');
    this.loadingTitle = document.getElementById('loadingTitle');
    this.loadingDesc = document.getElementById('loadingDesc');
    this.loadingProgressBar = document.getElementById('loadingProgressBar');
    this.loadingTipText = document.getElementById('loadingTipText');

    // Results Elements
    this.resultsSection = document.getElementById('resultsSection');
    this.newScanBtn = document.getElementById('newScanBtn');
    this.resultTitle = document.getElementById('resultTitle');
    this.resultCategoryBadge = document.getElementById('resultCategoryBadge');
    this.previewImage = document.getElementById('previewImage');
    this.plainExplanation = document.getElementById('plainExplanation');
    this.checklistGroup = document.getElementById('checklistGroup');
    this.metricsPillGrid = document.getElementById('metricsPillGrid');
    this.alertCardWarning = document.getElementById('alertCardWarning');
    this.alertTitle = document.getElementById('alertTitle');
    this.alertDescription = document.getElementById('alertDescription');
    this.linksCard = document.getElementById('linksCard');
    this.helpfulLinksList = document.getElementById('helpfulLinksList');
    this.technicalDetails = document.getElementById('technicalDetails');
    this.technicalSummary = document.getElementById('technicalSummary');
    this.technicalContent = document.getElementById('technicalContent');

    // Q&A Follow-Up Elements
    this.qnaForm = document.getElementById('qnaForm');
    this.qnaInput = document.getElementById('qnaInput');
    this.qnaConversation = document.getElementById('qnaConversation');
    this.qnaSubmitBtn = document.getElementById('qnaSubmitBtn');

    // Audio Playback
    this.audioPlayBtn = document.getElementById('audioPlayBtn');
    this.audioPlayLabel = document.getElementById('audioPlayLabel');
    this.soundwaveBox = document.getElementById('soundwaveBox');

    // Extension Modal
    this.extensionModalBackdrop = document.getElementById('extensionModalBackdrop');
    this.closeExtensionModalBtn = document.getElementById('closeExtensionModalBtn');

    // History Drawer
    this.historyDrawer = document.getElementById('historyDrawer');
    this.drawerBackdrop = document.getElementById('drawerBackdrop');
    this.closeHistoryBtn = document.getElementById('closeHistoryBtn');
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    this.historyList = document.getElementById('historyList');

    // Camera Dialog
    this.cameraOverlay = document.getElementById('cameraOverlay');
    this.cameraVideo = document.getElementById('cameraVideo');
    this.captureSnapshotBtn = document.getElementById('captureSnapshotBtn');
    this.closeCameraBtn = document.getElementById('closeCameraBtn');
  }

  bindEvents() {
    // Brand Link & New Scan
    this.brandHomeLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.resetToNewScan();
    });
    this.newScanBtn.addEventListener('click', () => this.resetToNewScan());

    // File Drag & Drop
    this.dropzoneCard.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzoneCard.classList.add('dragover');
    });

    this.dropzoneCard.addEventListener('dragleave', () => {
      this.dropzoneCard.classList.remove('dragover');
    });

    this.dropzoneCard.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzoneCard.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) this.handleImageFile(files[0]);
    });

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) this.handleImageFile(e.target.files[0]);
    });

    // Camera Handlers
    this.cameraBtn.addEventListener('click', () => this.openCamera());
    this.closeCameraBtn.addEventListener('click', () => this.closeCamera());
    this.captureSnapshotBtn.addEventListener('click', () => this.captureSnapshot());

    // Audio Narration
    this.audioPlayBtn.addEventListener('click', () => this.toggleAudio());
    const waveLines = this.soundwaveBox ? this.soundwaveBox.querySelectorAll('.wave-line') : [];
    this.audio.onWaveUpdate = (levels) => {
      if (!waveLines || waveLines.length === 0) return;
      for (let i = 0; i < waveLines.length; i++) {
        const h = levels[i] || 4;
        waveLines[i].style.height = `${Math.round(h)}px`;
      }
    };
    this.audio.onStateChange = (isPlaying) => {
      if (isPlaying) {
        this.soundwaveBox.classList.add('active');
        this.audioPlayLabel.textContent = 'Pause';
      } else {
        this.soundwaveBox.classList.remove('active');
        this.audioPlayLabel.textContent = 'Listen';
        if (waveLines) {
          waveLines.forEach(line => line.style.height = '4px');
        }
      }
    };

    // Extension Modal
    this.extensionBtn.addEventListener('click', () => this.toggleExtensionModal(true));
    this.closeExtensionModalBtn.addEventListener('click', () => this.toggleExtensionModal(false));
    this.extensionModalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.extensionModalBackdrop) this.toggleExtensionModal(false);
    });

    // Follow-up Q&A Submission
    this.qnaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitFollowUpQuestion();
    });

    // History Drawer Handlers
    this.historyToggleBtn.addEventListener('click', () => this.toggleHistoryDrawer(true));
    this.closeHistoryBtn.addEventListener('click', () => this.toggleHistoryDrawer(false));
    this.drawerBackdrop.addEventListener('click', () => this.toggleHistoryDrawer(false));
    this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

    // Font Scaling Controls
    this.fontIncBtn.addEventListener('click', () => {
      this.fontScale = Math.min(1.3, this.fontScale + 0.08);
      document.documentElement.style.setProperty('--user-scale', `${this.fontScale}rem`);
    });

    this.fontDecBtn.addEventListener('click', () => {
      this.fontScale = Math.max(0.85, this.fontScale - 0.08);
      document.documentElement.style.setProperty('--user-scale', `${this.fontScale}rem`);
    });
  }

  toggleExtensionModal(open) {
    if (open) {
      this.extensionModalBackdrop.classList.add('open');
    } else {
      this.extensionModalBackdrop.classList.remove('open');
    }
  }

  resetToNewScan() {
    this.audio.stop();
    this.currentImageBase64 = null;
    this.currentAnalysisResult = null;
    this.fileInput.value = '';
    this.qnaConversation.innerHTML = '';
    this.qnaInput.value = '';

    // Switch visibility back to Ingestion Stage
    this.resultsSection.style.display = 'none';
    this.loadingCard.style.display = 'none';
    this.ingestionStage.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async checkHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.ollama && data.ollama.online && data.ollama.modelFound) {
        this.statusDot.classList.remove('offline');
        this.statusText.textContent = `Gemma 4 Online (Local)`;
      } else {
        this.statusDot.classList.add('offline');
        this.statusText.textContent = data.ollama.online 
          ? 'Gemma 4 not found in Ollama' 
          : 'Ollama daemon offline on :11434';
      }
    } catch (_) {
      this.statusDot.classList.add('offline');
      this.statusText.textContent = 'Server disconnected';
    }
  }

  async loadPresets() {
    try {
      const res = await fetch('/api/presets');
      const json = await res.json();
      if (json.success && json.presets) {
        this.presets = json.presets;
        this.renderPresets();
      }
    } catch (err) {
      console.warn('Could not load sample presets:', err);
    }
  }

  renderPresets() {
    this.presetsGrid.innerHTML = '';
    this.presets.forEach(preset => {
      const card = document.createElement('div');
      card.className = 'preset-card-item';
      card.innerHTML = `
        <div class="preset-thumbnail">
          <img src="${preset.image}" alt="${this.escapeHtml(preset.title)}">
        </div>
        <div class="preset-info">
          <h4>${this.escapeHtml(preset.title)}</h4>
          <p>${this.escapeHtml(preset.subtitle)}</p>
        </div>
      `;
      card.addEventListener('click', () => {
        this.currentImageBase64 = preset.image;
        this.startAnalysis();
      });
      this.presetsGrid.appendChild(card);
    });
  }

  handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPEG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.compressImage(e.target.result, 1600, (compressedBase64) => {
        this.currentImageBase64 = compressedBase64;
        this.startAnalysis();
      });
    };
    reader.readAsDataURL(file);
  }

  compressImage(dataUrl, maxDimension, callback) {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = dataUrl;
  }

  async openCamera() {
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false
      });
      this.cameraVideo.srcObject = this.cameraStream;
      this.cameraOverlay.style.display = 'flex';
    } catch (err) {
      alert('Camera access denied or unavailable: ' + err.message);
    }
  }

  closeCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    this.cameraOverlay.style.display = 'none';
  }

  captureSnapshot() {
    if (!this.cameraVideo) return;
    const canvas = document.createElement('canvas');
    canvas.width = this.cameraVideo.videoWidth || 640;
    canvas.height = this.cameraVideo.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.cameraVideo, 0, 0);
    this.currentImageBase64 = canvas.toDataURL('image/jpeg', 0.9);
    this.closeCamera();
    this.startAnalysis();
  }

  startLoadingAnimation() {
    // Hide dropzone, presets, and hero completely
    this.ingestionStage.style.display = 'none';
    this.resultsSection.style.display = 'none';
    this.loadingCard.style.display = 'block';

    const steps = [
      { title: 'Detecting document type...', desc: 'Gemma 4 Vision classifying category', progress: '30%' },
      { title: 'Reading key details...', desc: 'Extracting dosage, deadlines, or ingredient information', progress: '55%' },
      { title: 'Translating into plain words...', desc: 'Generating 5th-grade explanation and checklist', progress: '80%' },
      { title: 'Synthesizing voice narration...', desc: 'Finalizing response', progress: '95%' }
    ];

    const microTips = [
      'Gemma 4 uses a 478M parameter CLIP vision projector to read high-resolution documents locally.',
      'Your documents are 100% private — inference runs completely on your local machine.',
      'Tip: You can ask follow-up questions after scanning to clarify any details.',
      'Tip: Click the "Listen" button anytime to hear an elderly-friendly audio narration.',
      'Offline Ready: No internet connection is needed for AI document understanding.'
    ];

    let stepIdx = 0;
    this.loadingTitle.textContent = steps[0].title;
    this.loadingDesc.textContent = steps[0].desc;
    this.loadingProgressBar.style.width = steps[0].progress;

    let tipIdx = 0;
    this.loadingTipText.textContent = microTips[0];

    this.loadingInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      this.loadingTitle.textContent = steps[stepIdx].title;
      this.loadingDesc.textContent = steps[stepIdx].desc;
      this.loadingProgressBar.style.width = steps[stepIdx].progress;
    }, 2800);

    this.tipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % microTips.length;
      this.loadingTipText.style.opacity = '0';
      setTimeout(() => {
        this.loadingTipText.textContent = microTips[tipIdx];
        this.loadingTipText.style.opacity = '1';
      }, 200);
    }, 3500);
  }

  stopLoadingAnimation() {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
    if (this.tipInterval) {
      clearInterval(this.tipInterval);
      this.tipInterval = null;
    }
    this.loadingCard.style.display = 'none';
  }

  async startAnalysis() {
    if (!this.currentImageBase64 || this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.audio.stop();
    this.startLoadingAnimation();

    const payload = {
      image: this.currentImageBase64
    };

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze document');
      }

      this.currentAnalysisResult = result;
      this.saveToHistory(result, this.currentImageBase64);
      this.displayResults(result);
    } catch (err) {
      alert('Analysis Error: ' + err.message + '\n\nPlease ensure Ollama daemon is running with Gemma 4 on localhost:11434.');
      this.resetToNewScan();
    } finally {
      this.isAnalyzing = false;
      this.stopLoadingAnimation();
    }
  }

  displayResults(result) {
    const data = result.data;

    // Header & Preview Image
    this.resultTitle.textContent = data.title || 'Visual Analysis Result';
    this.resultCategoryBadge.textContent = data.category || result.category || 'Auto-Detected';
    this.previewImage.src = this.currentImageBase64;

    // Plain Explanation
    this.plainExplanation.textContent = data.plainSummary || 'No summary available.';

    // Action Checklist
    this.checklistGroup.innerHTML = '';
    if (data.actionChecklist && data.actionChecklist.length > 0) {
      data.actionChecklist.forEach((step, idx) => {
        const item = document.createElement('div');
        item.className = 'action-checklist-item';
        item.innerHTML = `
          <input type="checkbox" id="step-${idx}" class="action-checkbox">
          <label for="step-${idx}" class="action-text">${this.escapeHtml(step)}</label>
        `;
        item.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            const chk = item.querySelector('input');
            chk.checked = !chk.checked;
          }
          item.classList.toggle('done', item.querySelector('input').checked);
        });
        this.checklistGroup.appendChild(item);
      });
    }

    // Key Details Grid
    this.metricsPillGrid.innerHTML = '';
    if (data.keyDetails && data.keyDetails.length > 0) {
      data.keyDetails.forEach(d => {
        const box = document.createElement('div');
        box.className = 'metric-pill-item';
        box.innerHTML = `
          <div class="metric-pill-label">${this.escapeHtml(d.label)}</div>
          <div class="metric-pill-value">${this.escapeHtml(d.value)}</div>
        `;
        this.metricsPillGrid.appendChild(box);
      });
    }

    // Critical Warnings Banner
    if (data.criticalWarnings && data.criticalWarnings.length > 0) {
      const topWarning = data.criticalWarnings[0];
      this.alertTitle.textContent = topWarning.title || 'Important Notice';
      this.alertDescription.textContent = topWarning.description || '';
      this.alertCardWarning.style.display = 'block';
    } else {
      this.alertCardWarning.style.display = 'none';
    }

    // Verified Authoritative Links
    this.helpfulLinksList.innerHTML = '';
    const links = data.helpfulLinks || this.getDefaultLinksForCategory(data.category, data.title);
    if (links && links.length > 0) {
      links.forEach(l => {
        const a = document.createElement('a');
        a.className = 'helpful-link-item';
        a.href = l.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.innerHTML = `
          <div>
            <div class="helpful-link-title">${this.escapeHtml(l.title)} &rarr;</div>
            <div class="helpful-link-desc">${this.escapeHtml(l.description || 'Verified official information')}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-tertiary);">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        `;
        this.helpfulLinksList.appendChild(a);
      });
      this.linksCard.style.display = 'block';
    } else {
      this.linksCard.style.display = 'none';
    }

    // Technical Inspection Accordion
    if (result.thinking && result.thinking.trim()) {
      this.technicalDetails.style.display = 'block';
      this.technicalContent.textContent = result.thinking;
      const ms = result.metrics?.totalDurationMs ? `${(result.metrics.totalDurationMs / 1000).toFixed(1)}s` : '';
      const tokens = result.metrics?.evalCount ? `${result.metrics.evalCount} tokens` : '';
      this.technicalSummary.textContent = `Technical Reasoning Trace (${[ms, tokens].filter(Boolean).join(' • ')})`;
    } else {
      this.technicalDetails.style.display = 'none';
    }

    // Audio Script
    this.currentAudioScript = data.audioReadAloudScript || `${data.title}. ${data.plainSummary}`;

    // Reveal results and smoothly scroll
    this.resultsSection.style.display = 'block';
    this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getDefaultLinksForCategory(category = '', title = '') {
    if (/prescription|medicine|med/i.test(category)) {
      return [
        {
          title: 'MedlinePlus Drug & Medication Guide (NIH)',
          url: `https://medlineplus.gov/druginformation.html`,
          description: 'Official US National Library of Medicine safety guidelines'
        },
        {
          title: 'FDA Consumer Drug Safety Portal',
          url: 'https://www.fda.gov/drugs',
          description: 'Official recalls, warnings, and patient information'
        }
      ];
    } else if (/bill|notice|civic/i.test(category)) {
      return [
        {
          title: 'National Consumer Law Center & Hardship Assistance',
          url: 'https://www.nclc.org',
          description: 'Citizen legal rights and utility protection guidelines'
        },
        {
          title: 'Benefits.gov Citizen Assistance Finder',
          url: 'https://www.benefits.gov',
          description: 'Check official government utility subsidies and grants'
        }
      ];
    } else if (/food|allergen|label/i.test(category)) {
      return [
        {
          title: 'FDA Food Allergens Guidance & Alerts',
          url: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
          description: 'Official Food Allergen Labeling & Consumer Protection standard'
        }
      ];
    }
    return [];
  }

  async submitFollowUpQuestion() {
    const question = this.qnaInput.value.trim();
    if (!question || !this.currentImageBase64) return;

    this.qnaInput.value = '';
    this.qnaSubmitBtn.disabled = true;

    // Render User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'qna-bubble qna-bubble-user';
    userMsg.textContent = question;
    this.qnaConversation.appendChild(userMsg);

    // Render Temporary AI Loading Bubble
    const aiMsg = document.createElement('div');
    aiMsg.className = 'qna-bubble qna-bubble-ai';
    aiMsg.textContent = 'Gemma 4 is reviewing the document...';
    this.qnaConversation.appendChild(aiMsg);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: this.currentImageBase64,
          previousAnalysis: this.currentAnalysisResult ? this.currentAnalysisResult.data : {},
          question: question
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Could not process question');

      aiMsg.innerHTML = `
        <div>${this.escapeHtml(json.answer)}</div>
        ${json.actionTip ? `<div class="tip">Tip: ${this.escapeHtml(json.actionTip)}</div>` : ''}
        <button class="scale-btn" style="margin-top: 0.4rem; padding: 2px 8px;" id="qnaSpeakBtn">Listen</button>
      `;

      const speakBtn = aiMsg.querySelector('#qnaSpeakBtn');
      if (speakBtn) {
        speakBtn.addEventListener('click', () => {
          this.audio.speak(json.readAloud || json.answer);
        });
      }
    } catch (err) {
      aiMsg.textContent = 'Sorry, could not answer right now: ' + err.message;
    } finally {
      this.qnaSubmitBtn.disabled = false;
    }
  }

  toggleAudio() {
    if (this.audio.isPlaying) {
      this.audio.stop();
    } else {
      if (this.currentAudioScript) {
        this.audio.speak(this.currentAudioScript);
      }
    }
  }

  // --- Scan History Management ---
  loadHistoryFromStorage() {
    try {
      const raw = localStorage.getItem('gemmalens_history');
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  saveToHistory(result, imageBase64) {
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      title: result.data.title || 'Scanned Document',
      category: result.data.category || result.category || 'Document',
      image: imageBase64,
      result: result
    };

    this.history.unshift(entry);
    if (this.history.length > 20) this.history.pop();

    try {
      localStorage.setItem('gemmalens_history', JSON.stringify(this.history));
    } catch (e) {
      console.warn('LocalStorage full, dropping older entries:', e);
    }

    this.updateHistoryUI();
  }

  updateHistoryUI() {
    this.historyCount.textContent = this.history.length;
    this.historyList.innerHTML = '';

    if (this.history.length === 0) {
      this.historyList.innerHTML = '<div class="history-empty">No previous scans yet.</div>';
      return;
    }

    this.history.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-item-card';
      card.innerHTML = `
        <div class="history-thumb">
          <img src="${item.image}" alt="">
        </div>
        <div class="history-meta">
          <h5>${this.escapeHtml(item.title)}</h5>
          <span>${this.escapeHtml(item.category)} &bull; ${item.timestamp}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        this.toggleHistoryDrawer(false);
        this.currentImageBase64 = item.image;
        this.currentAnalysisResult = item.result;
        this.ingestionStage.style.display = 'none';
        this.loadingCard.style.display = 'none';
        this.displayResults(item.result);
      });
      this.historyList.appendChild(card);
    });
  }

  toggleHistoryDrawer(open) {
    if (open) {
      this.historyDrawer.classList.add('open');
      this.drawerBackdrop.classList.add('open');
    } else {
      this.historyDrawer.classList.remove('open');
      this.drawerBackdrop.classList.remove('open');
    }
  }

  clearHistory() {
    if (confirm('Clear all scan history?')) {
      this.history = [];
      localStorage.removeItem('gemmalens_history');
      this.updateHistoryUI();
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new GemmaLensApp();
});
