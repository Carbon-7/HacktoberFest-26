/**
 * GemmaLens Frontend Application Controller
 * macOS-Inspired Clean Interface, Natural Voice Narration, and Zero Clutter.
 */

import { AudioEngine } from './audio.js';

class GemmaLensApp {
  constructor() {
    this.audio = new AudioEngine();
    this.currentMode = 'medicine';
    this.currentImageBase64 = null;
    this.presets = [];
    this.isAnalyzing = false;
    this.loadingInterval = null;
    this.fontScale = 1.0;

    this.initElements();
    this.bindEvents();
    this.checkHealth();
    this.loadPresets();
  }

  initElements() {
    // Header & Controls
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    this.fontDecBtn = document.getElementById('fontDecBtn');
    this.fontIncBtn = document.getElementById('fontIncBtn');

    // Mode Selector & Ingestion
    this.segmentItems = document.querySelectorAll('.segment-item');
    this.dropzoneCard = document.getElementById('dropzoneCard');
    this.fileInput = document.getElementById('fileInput');
    this.cameraBtn = document.getElementById('cameraBtn');
    this.presetsGrid = document.getElementById('presetsGrid');

    // Loading & Results
    this.loadingCard = document.getElementById('loadingCard');
    this.loadingTitle = document.getElementById('loadingTitle');
    this.loadingDesc = document.getElementById('loadingDesc');
    this.resultsSection = document.getElementById('resultsSection');
    this.resultTitle = document.getElementById('resultTitle');
    this.resultCategoryBadge = document.getElementById('resultCategoryBadge');
    this.previewImage = document.getElementById('previewImage');
    this.plainExplanation = document.getElementById('plainExplanation');
    this.checklistGroup = document.getElementById('checklistGroup');
    this.metricsPillGrid = document.getElementById('metricsPillGrid');
    this.alertCardWarning = document.getElementById('alertCardWarning');
    this.alertTitle = document.getElementById('alertTitle');
    this.alertDescription = document.getElementById('alertDescription');
    this.technicalDetails = document.getElementById('technicalDetails');
    this.technicalSummary = document.getElementById('technicalSummary');
    this.technicalContent = document.getElementById('technicalContent');

    // Audio Playback
    this.audioPlayBtn = document.getElementById('audioPlayBtn');
    this.audioPlayLabel = document.getElementById('audioPlayLabel');
    this.soundwaveBox = document.getElementById('soundwaveBox');

    // Camera Dialog
    this.cameraOverlay = document.getElementById('cameraOverlay');
    this.cameraVideo = document.getElementById('cameraVideo');
    this.captureSnapshotBtn = document.getElementById('captureSnapshotBtn');
    this.closeCameraBtn = document.getElementById('closeCameraBtn');
  }

  bindEvents() {
    // Segmented Mode Selector
    this.segmentItems.forEach(item => {
      item.addEventListener('click', () => {
        this.segmentItems.forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        this.currentMode = item.dataset.mode;
      });
    });

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
    this.audio.onStateChange = (isPlaying) => {
      if (isPlaying) {
        this.soundwaveBox.classList.add('active');
        this.audioPlayLabel.textContent = 'Pause';
      } else {
        this.soundwaveBox.classList.remove('active');
        this.audioPlayLabel.textContent = 'Listen';
      }
    };

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
      card.addEventListener('click', () => this.selectPreset(preset));
      this.presetsGrid.appendChild(card);
    });
  }

  selectPreset(preset) {
    // Synchronize mode
    this.segmentItems.forEach(item => {
      if (item.dataset.mode === preset.mode) {
        item.click();
      }
    });

    this.currentImageBase64 = preset.image;
    this.startAnalysis();
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
    this.loadingCard.style.display = 'block';
    this.resultsSection.style.display = 'none';

    const steps = [
      { title: 'Analyzing visual details...', desc: 'Processing document with Gemma 4 Vision' },
      { title: 'Identifying key information...', desc: 'Reading text, labels, dosage, and warnings' },
      { title: 'Simplifying explanations...', desc: 'Translating into plain everyday language' },
      { title: 'Finalizing voice summary...', desc: 'Preparing spoken narration script' }
    ];

    let stepIdx = 0;
    this.loadingTitle.textContent = steps[0].title;
    this.loadingDesc.textContent = steps[0].desc;

    this.loadingInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      this.loadingTitle.textContent = steps[stepIdx].title;
      this.loadingDesc.textContent = steps[stepIdx].desc;
    }, 2800);
  }

  stopLoadingAnimation() {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
    this.loadingCard.style.display = 'none';
  }

  async startAnalysis() {
    if (!this.currentImageBase64 || this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.audio.stop();
    this.startLoadingAnimation();

    const payload = {
      image: this.currentImageBase64,
      mode: this.currentMode
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

      this.displayResults(result);
    } catch (err) {
      alert('Analysis Error: ' + err.message + '\n\nPlease ensure Ollama daemon is running with Gemma 4 on localhost:11434.');
    } finally {
      this.isAnalyzing = false;
      this.stopLoadingAnimation();
    }
  }

  displayResults(result) {
    const data = result.data;

    // Header & Preview Image
    this.resultTitle.textContent = data.title || 'Visual Analysis Result';
    this.resultCategoryBadge.textContent = this.formatModeLabel(result.mode);
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

    // Warning / Alert Banner (Only displayed if critical warnings exist)
    if (data.criticalWarnings && data.criticalWarnings.length > 0) {
      const topWarning = data.criticalWarnings[0];
      this.alertTitle.textContent = topWarning.title || 'Important Notice';
      this.alertDescription.textContent = topWarning.description || '';
      this.alertCardWarning.style.display = 'block';
    } else {
      this.alertCardWarning.style.display = 'none';
    }

    // Technical Inspection Accordion (Collapsed by default)
    if (result.thinking && result.thinking.trim()) {
      this.technicalDetails.style.display = 'block';
      this.technicalContent.textContent = result.thinking;
      const ms = result.metrics?.totalDurationMs ? `${(result.metrics.totalDurationMs / 1000).toFixed(1)}s` : '';
      const tokens = result.metrics?.evalCount ? `${result.metrics.evalCount} tokens` : '';
      this.technicalSummary.textContent = `Technical Reasoning Trace (${[ms, tokens].filter(Boolean).join(' • ')})`;
    } else {
      this.technicalDetails.style.display = 'none';
    }

    // Prepare Narration Script
    this.currentAudioScript = data.audioReadAloudScript || `${data.title}. ${data.plainSummary}`;

    // Reveal results and scroll smoothly
    this.resultsSection.style.display = 'block';
    this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  formatModeLabel(mode) {
    switch (mode) {
      case 'medicine': return 'Prescription';
      case 'bill': return 'Bill & Notice';
      case 'label': return 'Food & Allergen';
      default: return 'General Visual';
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
