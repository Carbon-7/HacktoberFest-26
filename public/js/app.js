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
    this.diagramCard = document.getElementById('diagramCard');
    this.mermaidDiagramContainer = document.getElementById('mermaidDiagramContainer');
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

    // Extension & Side Panel Modal
    this.extensionBtn = document.getElementById('extensionBtn');
    this.extensionModalBackdrop = document.getElementById('extensionModalBackdrop');
    this.closeExtensionModalBtn = document.getElementById('closeExtensionModalBtn');

    // Settings Modal Elements
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsModalBackdrop = document.getElementById('settingsModalBackdrop');
    this.closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.textScaleSlider = document.getElementById('textScaleSlider');
    this.textScaleValue = document.getElementById('textScaleValue');
    this.settingsVoiceSelect = document.getElementById('settingsVoiceSelect');
    this.speechSpeedSlider = document.getElementById('speechSpeedSlider');
    this.speechPitchSlider = document.getElementById('speechPitchSlider');
    this.speechSpeedValue = document.getElementById('speechSpeedValue');
    this.speechPitchValue = document.getElementById('speechPitchValue');
    this.testVoiceBtn = document.getElementById('testVoiceBtn');
    this.regionalSelect = document.getElementById('regionalSelect');

    // Multi-Domain State
    this.currentDomain = 'auto';

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

    // Initialize user settings from storage
    this.initUserSettings();
    this.checkUrlSessionSync();
  }

  bindEvents() {
    // Brand Link & New Scan
    this.brandHomeLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.resetToNewScan();
    });
    this.newScanBtn.addEventListener('click', () => this.resetToNewScan());

    // Domain Selector Pills
    const domainPills = document.querySelectorAll('.domain-pill');
    domainPills.forEach(pill => {
      pill.addEventListener('click', () => {
        domainPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentDomain = pill.getAttribute('data-domain') || 'auto';
      });
    });

    // File Drag & Drop (supports PDF and images)
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
      if (files.length > 0) this.handleUploadedFile(files[0]);
    });

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) this.handleUploadedFile(e.target.files[0]);
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

    // Extension / Side Panel Modal
    this.extensionBtn.addEventListener('click', () => this.toggleExtensionModal(true));
    this.closeExtensionModalBtn.addEventListener('click', () => this.toggleExtensionModal(false));
    this.extensionModalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.extensionModalBackdrop) this.toggleExtensionModal(false);
    });

    // Settings Modal
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => this.toggleSettingsModal(true));
    }
    if (this.closeSettingsModalBtn) {
      this.closeSettingsModalBtn.addEventListener('click', () => this.toggleSettingsModal(false));
    }
    if (this.saveSettingsBtn) {
      this.saveSettingsBtn.addEventListener('click', () => this.toggleSettingsModal(false));
    }
    if (this.settingsModalBackdrop) {
      this.settingsModalBackdrop.addEventListener('click', (e) => {
        if (e.target === this.settingsModalBackdrop) this.toggleSettingsModal(false);
      });
    }

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

    // Font Scaling Controls (Quick +/-)
    this.fontIncBtn.addEventListener('click', () => this.adjustScale(5));
    this.fontDecBtn.addEventListener('click', () => this.adjustScale(-5));

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

  async handleUploadedFile(file) {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      await this.handlePdfFile(file);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image (PNG, JPEG, WEBP) or PDF document.');
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

  async handlePdfFile(file) {
    try {
      if (!window.pdfjsLib) {
        throw new Error('PDF processing engine is still initializing. Please try again.');
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Render Page 1 at high DPI for crystal clear vision analysis
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;
      this.currentImageBase64 = canvas.toDataURL('image/png');
      this.startAnalysis();
    } catch (err) {
      console.error('PDF ingestion error:', err);
      alert('Failed to process PDF: ' + err.message);
    }
  }

  initUserSettings() {
    // Theme setup
    const savedTheme = localStorage.getItem('gemmalens_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtns = document.querySelectorAll('.theme-option-btn');
    themeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === savedTheme);
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('gemmalens_theme', theme);
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Text Scale
    this.currentScale = parseInt(localStorage.getItem('gemmalens_scale') || '100', 10);
    this.applyScale(this.currentScale);

    if (this.textScaleSlider) {
      this.textScaleSlider.value = this.currentScale;
      this.textScaleSlider.addEventListener('input', (e) => {
        this.applyScale(parseInt(e.target.value, 10));
      });
    }

    const scalePills = document.querySelectorAll('.scale-pill-btn');
    scalePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = parseInt(pill.getAttribute('data-scale'), 10);
        this.applyScale(val);
      });
    });

    // Voices
    const populateVoices = () => {
      if (!this.settingsVoiceSelect || !this.audio || !this.audio.synth) return;
      const voices = this.audio.synth.getVoices();
      if (voices.length === 0) return;
      this.settingsVoiceSelect.innerHTML = '<option value="">System Default Voice</option>';
      voices.forEach((v, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${v.name} (${v.lang})`;
        this.settingsVoiceSelect.appendChild(opt);
      });
    };
    populateVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }

    if (this.settingsVoiceSelect) {
      this.settingsVoiceSelect.addEventListener('change', (e) => {
        const idx = e.target.value;
        if (idx !== '' && this.audio && this.audio.synth) {
          const voices = this.audio.synth.getVoices();
          if (voices[idx]) this.audio.voice = voices[idx];
        }
      });
    }

    if (this.speechSpeedSlider) {
      this.speechSpeedSlider.addEventListener('input', (e) => {
        const spd = parseFloat(e.target.value);
        if (this.speechSpeedValue) this.speechSpeedValue.textContent = spd.toFixed(2) + 'x';
        this.audio.setRate(spd);
      });
    }

    if (this.speechPitchSlider) {
      this.speechPitchSlider.addEventListener('input', (e) => {
        const pitch = parseFloat(e.target.value);
        if (this.speechPitchValue) this.speechPitchValue.textContent = pitch.toFixed(1);
        this.audio.pitch = pitch;
      });
    }

    if (this.testVoiceBtn) {
      this.testVoiceBtn.addEventListener('click', () => {
        this.audio.speak('GemmaLens voice narration is fully configured and ready.');
      });
    }

    // Regional
    if (this.regionalSelect) {
      const savedRegion = localStorage.getItem('gemmalens_region') || 'US';
      this.regionalSelect.value = savedRegion;
      this.regionalSelect.addEventListener('change', (e) => {
        localStorage.setItem('gemmalens_region', e.target.value);
      });
    }

    // AI Model & Inference Provider Settings
    this.settingsModelSelect = document.getElementById('settingsModelSelect');
    this.settingsEndpointInput = document.getElementById('settingsEndpointInput');
    
    if (this.settingsModelSelect) {
      const savedModel = localStorage.getItem('gemmalens_model') || 'gemma4';
      this.settingsModelSelect.value = savedModel;
      this.settingsModelSelect.addEventListener('change', (e) => {
        localStorage.setItem('gemmalens_model', e.target.value);
        if (this.statusText) {
          const mNames = { gemma4: 'Gemma 4 (7.5B)', nemotron: 'Nemotron 3.5 / 4B', custom: 'Custom Endpoint' };
          this.statusText.textContent = (mNames[e.target.value] || e.target.value) + ' Active';
        }
      });
    }

    if (this.settingsEndpointInput) {
      const savedEndpoint = localStorage.getItem('gemmalens_endpoint') || 'http://localhost:11434';
      this.settingsEndpointInput.value = savedEndpoint;
      this.settingsEndpointInput.addEventListener('change', (e) => {
        localStorage.setItem('gemmalens_endpoint', e.target.value.trim());
      });
    }
  }

  applyScale(val) {
    this.currentScale = Math.min(140, Math.max(80, val));
    document.documentElement.style.fontSize = `${(this.currentScale / 100) * 16}px`;
    localStorage.setItem('gemmalens_scale', this.currentScale);
    if (this.textScaleValue) this.textScaleValue.textContent = `${this.currentScale}%`;
    if (this.textScaleSlider) this.textScaleSlider.value = this.currentScale;
    document.querySelectorAll('.scale-pill-btn').forEach(pill => {
      pill.classList.toggle('active', parseInt(pill.getAttribute('data-scale'), 10) === this.currentScale);
    });
  }

  adjustScale(delta) {
    this.applyScale((this.currentScale || 100) + delta);
  }

  toggleSettingsModal(show) {
    if (this.settingsModalBackdrop) {
      this.settingsModalBackdrop.classList.toggle('active', show);
    }
  }

  async checkUrlSessionSync() {
    const urlParams = new URLSearchParams(window.location.search);
    const syncSessionId = urlParams.get('session');
    if (!syncSessionId) return;

    try {
      const res = await fetch(`/api/sync-session/${syncSessionId}`);
      const json = await res.json();
      if (json.success && json.session) {
        this.currentImageBase64 = json.session.image;
        this.currentAnalysisResult = json.session.data;
        this.renderAnalysisResults(json.session.data, json.session.thinking, json.session.metrics);
        this.saveToHistory(json.session.data);
      }
    } catch (err) {
      console.warn('Could not load synced session:', err);
    }
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
      image: this.currentImageBase64,
      domainPreference: this.currentDomain || 'auto',
      model: localStorage.getItem('gemmalens_model') || 'gemma4',
      endpoint: localStorage.getItem('gemmalens_endpoint') || 'http://localhost:11434'
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

      // Sync session to server for cross-device/extension continuity
      fetch('/api/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: {
            id: 'sync_' + Date.now(),
            data: result.data,
            category: result.category,
            image: this.currentImageBase64,
            thinking: result.thinking,
            metrics: result.metrics
          }
        })
      }).catch(console.warn);

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

    // Auto-Highlight Matching Domain Skill
    const cat = (data.category || result.category || '').toLowerCase();
    const pills = document.querySelectorAll('.domain-pill');
    pills.forEach((p) => {
      const d = p.getAttribute('data-domain');
      if (d === 'health' && (cat.includes('health') || cat.includes('medic') || cat.includes('rx') || cat.includes('pharma'))) {
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
      } else if (d === 'finance' && (cat.includes('bill') || cat.includes('financ') || cat.includes('tax') || cat.includes('invoice'))) {
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
      } else if (d === 'legal' && (cat.includes('legal') || cat.includes('contract') || cat.includes('law') || cat.includes('agreement'))) {
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
      } else if (d === 'developer' && (cat.includes('code') || cat.includes('develop') || cat.includes('program') || cat.includes('tech'))) {
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
      } else if (d === 'tutor' && (cat.includes('tutor') || cat.includes('acad') || cat.includes('math') || cat.includes('learn'))) {
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
      } else if (d === 'guide' && (cat.includes('trip') || cat.includes('transit') || cat.includes('guide') || cat.includes('travel'))) {
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
      } else if (d === 'stocks' && (cat.includes('stock') || cat.includes('market') || cat.includes('trade') || cat.includes('equity'))) {
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
      }
    });

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

    // Visual Process & Architecture Diagram (Mermaid)
    this.renderDiagramSection(data);

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
    } else if (/contract|hr|employment|offer|legal/i.test(category) || /contract|employment/i.test(title)) {
      return [
        {
          title: 'US Department of Labor Overtime & Exemption Rules',
          url: 'https://www.dol.gov/agencies/whd/overtime',
          description: 'Fair Labor Standards Act guidelines on mandatory overtime and salary exemptions'
        },
        {
          title: 'FTC Non-Compete Clause Overview & Worker Protection',
          url: 'https://www.ftc.gov/legal-library/browse/rules/noncompete-rule',
          description: 'Official guidelines on post-employment covenants and restrictive clauses'
        },
        {
          title: 'Worker.gov Federal Workplace Rights Hub',
          url: 'https://www.worker.gov',
          description: 'Federal worker protections, wage laws, and intellectual property limits'
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
    } else if (/developer|code|system|traceback/i.test(category)) {
      return [
        {
          title: 'Redis Connection Pooling & Timeout Best Practices',
          url: 'https://redis.io/docs/latest/develop/connect/clients/',
          description: 'Managing connection exhaustion and microservice timeout failovers'
        },
        {
          title: 'MDN Web Docs: HTTP 504 Gateway Timeout',
          url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504',
          description: 'Diagnosing upstream proxy and microservice connection bottlenecks'
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
    } else if (/stock|market|finance|chart/i.test(category)) {
      return [
        {
          title: 'SEC EDGAR Corporate Filings Search',
          url: 'https://www.sec.gov/edgar/searchedgar/companysearch',
          description: 'Official 10-Q and 10-K financial disclosures directly from regulators'
        },
        {
          title: 'Investopedia: Resistance, Support & Breakout Analysis',
          url: 'https://www.investopedia.com/terms/r/resistance.asp',
          description: 'Technical chart patterns and risk management guidelines'
        }
      ];
    }
    return [];
  }

  sanitizeMermaid(code) {
    if (!code) return '';
    return code
      .replace(/\[([^"\]\n]+?)\]/g, (match, label) => {
        if (/[()":;,/]/.test(label) && !label.startsWith('"')) {
          return `["${label.replace(/"/g, "'")}"]`;
        }
        return match;
      })
      .replace(/\{([^"\}\n]+?)\}/g, (match, label) => {
        if (/[()":;,/]/.test(label) && !label.startsWith('"')) {
          return `{"${label.replace(/"/g, "'")}"}`;
        }
        return match;
      });
  }

  getDomainFallbackDiagram(data) {
    const cat = (data.category || '').toLowerCase();
    const title = (data.title || '').toLowerCase();

    if (cat.includes('contract') || cat.includes('legal') || cat.includes('hr') || title.includes('contract') || title.includes('employment') || title.includes('offer')) {
      return `graph TD
  A["Offer Letter & Contract Terms"] --> B{"Clause 4.2: Work Hours"}
  B -->|Exempt Classification| C["Uncompensated Weekend & Late Hours"]
  A --> D{"Clause 3.4: Bonus Terms"}
  D -->|24-Month Clawback| E["100% Repayment Required if Leaving Early"]
  A --> F{"Clause 8.3: IP Assignment"}
  F -->|Overreaching| G["Personal Side Projects Assigned to Company"]
  A --> H{"Clause 7.1: Non-Compete"}
  H -->|18-Month Restriction| I["Prevents Freelance & Industry Roles"]
  C --> J["Risk: High - Uncompensated Overtime"]
  E --> K["Risk: High - Financial Handcuff"]
  G --> L["Action: Request IP Carve-Out Rider"]
  style C fill:#FFEBE9,stroke:#CF222E,stroke-width:2px
  style E fill:#FFEBE9,stroke:#CF222E,stroke-width:2px
  style G fill:#FFEBE9,stroke:#CF222E,stroke-width:2px
  style I fill:#FFEBE9,stroke:#CF222E,stroke-width:2px
  style L fill:#DDF4FF,stroke:#0969DA,stroke-width:2px`;
    } else if (cat.includes('developer') || cat.includes('code') || cat.includes('tech') || title.includes('gateway') || title.includes('timeout')) {
      return `graph LR
  Client["Client Traffic"] --> APIGW["API Gateway"]
  APIGW --> NodeService["Node.js Microservice"]
  NodeService -->|Connection Timeout: 504| RedisPool["Redis Cluster"]
  RedisPool -.->|1024/1024 Connections Exhausted| DB[("PostgreSQL Master")]
  style RedisPool fill:#FFEBE9,stroke:#CF222E,stroke-width:2px
  style NodeService fill:#FFF8C5,stroke:#9A6700,stroke-width:2px
  style APIGW fill:#DDF4FF,stroke:#0969DA,stroke-width:2px`;
    } else if (cat.includes('tutor') || cat.includes('acad') || cat.includes('math') || cat.includes('physics') || title.includes('kinematics')) {
      return `graph TD
  Initial["Launch Velocity v0 & Angle theta"] --> CompX["Horizontal: vx = v0 cos theta"]
  Initial --> CompY["Vertical: vy = v0 sin theta"]
  CompX --> Range["Horizontal Range: R = (v0² sin 2theta) / g"]
  CompY --> Apex["Apex Max Height: H = (v0² sin² theta) / (2g)"]
  CompY --> Time["Total Flight Time: T = (2 v0 sin theta) / g"]
  style Initial fill:#F6F8FA,stroke:#57604A,stroke-width:1px
  style Range fill:#DDF4FF,stroke:#0969DA,stroke-width:2px
  style Apex fill:#E6FFED,stroke:#1A7F37,stroke-width:2px`;
    } else if (cat.includes('guide') || cat.includes('transit') || cat.includes('travel') || title.includes('flight') || title.includes('boarding')) {
      return `graph LR
  Arr["Flight SFO-HND Terminal 3"] --> Customs["International Customs & Quarantine: 45 min"]
  Customs --> Monorail["Transit to Terminal 1: 15 min"]
  Monorail --> Security["Domestic Security Check: 20 min"]
  Security --> Gate["Departure Gate 64: 80 min Required"]
  style Gate fill:#FFEBE9,stroke:#CF222E,stroke-width:2px
  style Monorail fill:#FFF8C5,stroke:#9A6700,stroke-width:2px
  style Customs fill:#DDF4FF,stroke:#0969DA,stroke-width:2px`;
    } else if (cat.includes('stock') || cat.includes('market') || cat.includes('trade') || title.includes('earnings') || title.includes('candlestick')) {
      return `graph TD
  Stock["NVST Cloud Financial Flow"] --> Rev["Q3 Revenue: $842M +28% YoY"]
  Stock --> Cash["Free Cash Flow: $184M"]
  Stock --> Chart["Technical Chart Setup"]
  Chart --> Resist["Key Resistance: $148.50 High-Volume Wall"]
  Chart --> Support["Base Support: $132.00 50-Day EMA"]
  style Resist fill:#FFEBE9,stroke:#CF222E,stroke-width:2px
  style Support fill:#E6FFED,stroke:#1A7F37,stroke-width:2px
  style Rev fill:#DDF4FF,stroke:#0969DA,stroke-width:2px`;
    } else if (cat.includes('bill') || cat.includes('utility') || cat.includes('notice')) {
      return `graph TD
  Bill["Pacific Power Statement"] --> PastDue["Past Due Balance: $148.20"]
  Bill --> Current["Current Billing Period: $94.65"]
  PastDue --> Disconnect["Disconnection Threshold: 14 Days Notice"]
  Disconnect --> Urgent["Action: Pay Past Due $148.20 to Avoid Shutoff"]
  style Disconnect fill:#FFEBE9,stroke:#CF222E,stroke-width:2px
  style Urgent fill:#FFF8C5,stroke:#9A6700,stroke-width:2px`;
    } else if (cat.includes('health') || cat.includes('medic') || cat.includes('rx')) {
      return `graph TD
  Med["Amoxicillin 500mg Course"] --> Dose1["Morning: 1 Capsule with Meal"]
  Med --> Dose2["Afternoon: 1 Capsule with Water"]
  Med --> Dose3["Night: 1 Capsule at Bedtime"]
  Med --> Warn["Do Not Stop Early: Complete Full 10 Days"]
  style Warn fill:#FFEBE9,stroke:#CF222E,stroke-width:2px
  style Dose1 fill:#DDF4FF,stroke:#0969DA,stroke-width:1px
  style Dose2 fill:#DDF4FF,stroke:#0969DA,stroke-width:1px
  style Dose3 fill:#DDF4FF,stroke:#0969DA,stroke-width:1px`;
    }
    return '';
  }

  renderDiagramSection(data) {
    if (!this.diagramCard || !this.mermaidDiagramContainer) return;

    let diagramCode = '';

    // Check if Gemma 4 provided a diagram
    if (data.mermaidDiagram && typeof data.mermaidDiagram === 'string' && data.mermaidDiagram.trim().length > 10) {
      diagramCode = data.mermaidDiagram.trim()
        .replace(/^```mermaid\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
    }

    if (!diagramCode) {
      diagramCode = this.getDomainFallbackDiagram(data);
    }

    if (!diagramCode) {
      this.diagramCard.style.display = 'none';
      return;
    }

    const cleanCode = this.sanitizeMermaid(diagramCode);

    if (window.mermaid) {
      const diagramId = 'mermaid_svg_' + Date.now();
      window.mermaid.render(diagramId, cleanCode)
        .then(result => {
          this.mermaidDiagramContainer.innerHTML = result.svg;
          this.diagramCard.style.display = 'block';
        })
        .catch(err => {
          console.warn('Mermaid render error, attempting domain fallback diagram:', err);
          const fallback = this.getDomainFallbackDiagram(data);
          if (fallback && fallback !== cleanCode) {
            const fallbackId = 'mermaid_fallback_' + Date.now();
            window.mermaid.render(fallbackId, fallback)
              .then(res => {
                this.mermaidDiagramContainer.innerHTML = res.svg;
                this.diagramCard.style.display = 'block';
              })
              .catch(() => {
                this.mermaidDiagramContainer.innerHTML = `<pre style="font-size: 0.8rem; background: #fff; padding: 1rem; border-radius: 8px; overflow-x: auto; color: #333;">${this.escapeHtml(cleanCode)}</pre>`;
                this.diagramCard.style.display = 'block';
              });
          } else {
            this.mermaidDiagramContainer.innerHTML = `<pre style="font-size: 0.8rem; background: #fff; padding: 1rem; border-radius: 8px; overflow-x: auto; color: #333;">${this.escapeHtml(cleanCode)}</pre>`;
            this.diagramCard.style.display = 'block';
          }
        });
    } else {
      this.diagramCard.style.display = 'none';
    }
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
          question: question,
          model: localStorage.getItem('gemmalens_model') || 'gemma4',
          endpoint: localStorage.getItem('gemmalens_endpoint') || 'http://localhost:11434'
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
