/**
 * GemmaLens Frontend Application Controller
 * Handles image ingestion, local Ollama telemetry, interactive results, and audio narration.
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
    // Header & Status
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    this.contrastToggle = document.getElementById('contrastToggle');
    this.fontDecBtn = document.getElementById('fontDecBtn');
    this.fontIncBtn = document.getElementById('fontIncBtn');

    // Modes & Inputs
    this.modePills = document.querySelectorAll('.mode-pill');
    this.inputStage = document.getElementById('inputStage');
    this.fileInput = document.getElementById('fileInput');
    this.cameraBtn = document.getElementById('cameraBtn');
    this.queryInput = document.getElementById('queryInput');
    this.presetsGrid = document.getElementById('presetsGrid');

    // Loading & Results
    this.loadingPanel = document.getElementById('loadingPanel');
    this.loadingStepText = document.getElementById('loadingStepText');
    this.loadingSubtext = document.getElementById('loadingSubtext');
    this.resultsStage = document.getElementById('resultsStage');
    this.resultTitle = document.getElementById('resultTitle');
    this.resultModeTag = document.getElementById('resultModeTag');
    this.previewImg = document.getElementById('previewImg');
    this.plainSummary = document.getElementById('plainSummary');
    this.checklistUl = document.getElementById('checklistUl');
    this.warningsContainer = document.getElementById('warningsContainer');
    this.detailsGrid = document.getElementById('detailsGrid');
    this.thinkingDetails = document.getElementById('thinkingDetails');
    this.thinkingBody = document.getElementById('thinkingBody');
    this.thinkingMetrics = document.getElementById('thinkingMetrics');

    // Audio controls
    this.ttsBtn = document.getElementById('ttsBtn');
    this.soundwave = document.getElementById('soundwave');
    this.ttsLabel = document.getElementById('ttsLabel');

    // Camera Modal
    this.cameraModal = document.getElementById('cameraModal');
    this.cameraVideo = document.getElementById('cameraVideo');
    this.captureBtn = document.getElementById('captureBtn');
    this.closeCameraBtn = document.getElementById('closeCameraBtn');
  }

  bindEvents() {
    // Mode switcher
    this.modePills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.modePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentMode = pill.dataset.mode;
      });
    });

    // File drag & drop
    this.inputStage.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.inputStage.classList.add('dragover');
    });

    this.inputStage.addEventListener('dragleave', () => {
      this.inputStage.classList.remove('dragover');
    });

    this.inputStage.addEventListener('drop', (e) => {
      e.preventDefault();
      this.inputStage.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) this.handleImageFile(files[0]);
    });

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) this.handleImageFile(e.target.files[0]);
    });

    // Camera modal
    this.cameraBtn.addEventListener('click', () => this.openCamera());
    this.closeCameraBtn.addEventListener('click', () => this.closeCamera());
    this.captureBtn.addEventListener('click', () => this.captureSnapshot());

    // Audio playback toggle
    this.ttsBtn.addEventListener('click', () => this.toggleAudio());
    this.audio.onStateChange = (isPlaying) => {
      if (isPlaying) {
        this.soundwave.classList.add('active');
        this.ttsLabel.textContent = 'Pause Reading';
        this.ttsBtn.setAttribute('aria-label', 'Pause audio reading');
      } else {
        this.soundwave.classList.remove('active');
        this.ttsLabel.textContent = 'Read Aloud';
        this.ttsBtn.setAttribute('aria-label', 'Read aloud explanation');
      }
    };

    // Accessibility
    this.contrastToggle.addEventListener('click', () => {
      document.body.classList.toggle('high-contrast');
    });

    this.fontIncBtn.addEventListener('click', () => {
      this.fontScale = Math.min(1.35, this.fontScale + 0.08);
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
        this.statusText.textContent = `Ollama: ${data.ollama.activeModel} Online [Local]`;
      } else {
        this.statusDot.classList.add('offline');
        this.statusText.textContent = data.ollama.online 
          ? 'Gemma 4 model not loaded in Ollama' 
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
      console.warn('Could not load presets:', err);
    }
  }

  renderPresets() {
    this.presetsGrid.innerHTML = '';
    this.presets.forEach(preset => {
      const card = document.createElement('div');
      card.className = 'preset-card';
      card.innerHTML = `
        <div>
          <div class="preset-header">
            <span class="preset-tag ${preset.tagColor}">${preset.tag}</span>
            <span style="font-size: 0.75rem; color: #94A3B8;">1-Click Demo</span>
          </div>
          <h3>${preset.title}</h3>
          <h4>${preset.subtitle}</h4>
          <p>${preset.description}</p>
        </div>
        <div class="preset-action-bar">
          <span>⚡ Click to Analyze</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      `;
      card.addEventListener('click', () => this.selectPreset(preset));
      this.presetsGrid.appendChild(card);
    });
  }

  selectPreset(preset) {
    // Set matching mode
    this.modePills.forEach(p => {
      if (p.dataset.mode === preset.mode) {
        p.click();
      }
    });

    if (preset.promptHint) {
      this.queryInput.value = preset.promptHint;
    }

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
      callback(canvas.toDataURL('image/jpeg', 0.88));
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
      this.cameraModal.style.display = 'flex';
    } catch (err) {
      alert('Camera access denied or unavailable: ' + err.message);
    }
  }

  closeCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    this.cameraModal.style.display = 'none';
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
    this.loadingPanel.style.display = 'block';
    this.resultsStage.style.display = 'none';

    const steps = [
      { text: 'Inspecting visual details with Gemma 4 Vision...', sub: 'Preprocessing image and activating CLIP projector' },
      { text: 'Engaging Gemma 4 internal reasoning chain...', sub: 'Analyzing entities, text, dosage, and warnings' },
      { text: 'Translating jargon into 5th-grade plain language...', sub: 'Structuring action checklist and safety alerts' },
      { text: 'Synthesizing audio narration script...', sub: 'Finalizing response' }
    ];

    let stepIdx = 0;
    this.loadingStepText.textContent = steps[0].text;
    this.loadingSubtext.textContent = steps[0].sub;

    this.loadingInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      this.loadingStepText.textContent = steps[stepIdx].text;
      this.loadingSubtext.textContent = steps[stepIdx].sub;
    }, 2800);
  }

  stopLoadingAnimation() {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
    this.loadingPanel.style.display = 'none';
  }

  async startAnalysis() {
    if (!this.currentImageBase64 || this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.audio.stop();
    this.startLoadingAnimation();

    const payload = {
      image: this.currentImageBase64,
      mode: this.currentMode,
      query: this.queryInput.value
    };

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze image');
      }

      this.displayResults(result);
    } catch (err) {
      alert('Analysis Error: ' + err.message + '\n\nPlease verify that Ollama is running.');
    } finally {
      this.isAnalyzing = false;
      this.stopLoadingAnimation();
    }
  }

  displayResults(result) {
    const data = result.data;

    // Header & Preview
    this.resultTitle.textContent = data.title || 'Visual Analysis Result';
    this.resultModeTag.textContent = `Mode: ${result.modeName || result.mode}`;
    this.previewImg.src = this.currentImageBase64;

    // Plain Summary
    this.plainSummary.textContent = data.plainSummary || 'No summary provided.';

    // Key Details Grid
    this.detailsGrid.innerHTML = '';
    if (data.keyDetails && data.keyDetails.length > 0) {
      data.keyDetails.forEach(d => {
        const div = document.createElement('div');
        div.className = 'detail-box';
        div.innerHTML = `
          <div class="detail-label">${this.escapeHtml(d.label)}</div>
          <div class="detail-value">${this.escapeHtml(d.value)}</div>
        `;
        this.detailsGrid.appendChild(div);
      });
    }

    // Action Checklist
    this.checklistUl.innerHTML = '';
    if (data.actionChecklist && data.actionChecklist.length > 0) {
      data.actionChecklist.forEach((step, idx) => {
        const li = document.createElement('li');
        li.className = 'checklist-item';
        li.innerHTML = `
          <input type="checkbox" id="chk-${idx}" class="checklist-checkbox">
          <label for="chk-${idx}" class="checklist-text">${this.escapeHtml(step)}</label>
        `;
        li.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            const chk = li.querySelector('input');
            chk.checked = !chk.checked;
          }
          li.classList.toggle('checked', li.querySelector('input').checked);
        });
        this.checklistUl.appendChild(li);
      });
    }

    // Critical Warnings
    this.warningsContainer.innerHTML = '';
    if (data.criticalWarnings && data.criticalWarnings.length > 0) {
      data.criticalWarnings.forEach(w => {
        const box = document.createElement('div');
        box.className = 'warning-alert-box';
        box.innerHTML = `
          <div class="warning-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="warning-content">
            <h4>${this.escapeHtml(w.title)}</h4>
            <p>${this.escapeHtml(w.description)}</p>
          </div>
        `;
        this.warningsContainer.appendChild(box);
      });
      document.getElementById('warningsCard').style.display = 'block';
    } else {
      document.getElementById('warningsCard').style.display = 'none';
    }

    // Thinking Accordion
    if (result.thinking && result.thinking.trim()) {
      this.thinkingDetails.style.display = 'block';
      this.thinkingBody.textContent = result.thinking;
      const ms = result.metrics?.totalDurationMs ? `${(result.metrics.totalDurationMs / 1000).toFixed(1)}s` : '';
      const tokens = result.metrics?.evalCount ? `${result.metrics.evalCount} tokens` : '';
      this.thinkingMetrics.textContent = [ms, tokens].filter(Boolean).join(' • ') || 'Verified';
    } else {
      this.thinkingDetails.style.display = 'none';
    }

    // Audio script
    this.currentAudioScript = data.audioReadAloudScript || `${data.title}. ${data.plainSummary}`;

    // Reveal results and scroll smoothly
    this.resultsStage.style.display = 'block';
    this.resultsStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

// Bootstrap on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new GemmaLensApp();
});
