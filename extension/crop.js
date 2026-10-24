/**
 * GemmaLens Area Selection & In-Page Analysis HUD
 * Injected on-demand when the user selects "Select Specific Zone"
 */

(() => {
  const BACKEND_URL = 'http://localhost:3000';

  // Prevent multiple overlays
  const existingOverlay = document.getElementById('gemmalens-crop-overlay');
  if (existingOverlay) existingOverlay.remove();
  const existingPanel = document.getElementById('gemmalens-floating-panel');
  if (existingPanel) existingPanel.remove();

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'gemmalens-crop-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483640;
    cursor: crosshair;
    background: rgba(15, 23, 42, 0.35);
    user-select: none;
    backdrop-filter: blur(2px);
  `;

  // HUD Guide Banner
  const hud = document.createElement('div');
  hud.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 999px;
    padding: 10px 22px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #1D1D1F;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: none;
    z-index: 2147483645;
  `;
  hud.innerHTML = `
    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#0071E3;"></span>
    <span>Drag to snapshot any zone or paragraph to explain</span>
    <span style="font-size: 11px; background: rgba(0,0,0,0.06); padding: 2px 8px; border-radius: 99px; color: #6E6E73;">ESC to Cancel</span>
  `;
  overlay.appendChild(hud);

  // Selection box
  const box = document.createElement('div');
  box.style.cssText = `
    position: fixed;
    border: 2px solid #0071E3;
    background: rgba(0, 113, 227, 0.08);
    display: none;
    pointer-events: none;
    z-index: 2147483642;
    border-radius: 4px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
  `;
  overlay.appendChild(box);

  // Dimensions indicator
  const dimPill = document.createElement('div');
  dimPill.style.cssText = `
    position: absolute;
    bottom: -28px;
    right: 0;
    background: #1D1D1F;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
    white-space: nowrap;
  `;
  box.appendChild(dimPill);

  document.body.appendChild(overlay);

  let startX = 0;
  let startY = 0;
  let isDragging = false;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      cleanup();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  overlay.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    box.style.left = `${startX}px`;
    box.style.top = `${startY}px`;
    box.style.width = '0px';
    box.style.height = '0px';
    box.style.display = 'block';
  });

  overlay.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
    dimPill.textContent = `${Math.round(width)} × ${Math.round(height)} px`;
  });

  overlay.addEventListener('mouseup', async (e) => {
    if (!isDragging) return;
    isDragging = false;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    if (width < 30 || height < 30) {
      cleanup();
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const cropRect = {
      x: left * dpr,
      y: top * dpr,
      width: width * dpr,
      height: height * dpr,
      clientX: left,
      clientY: top,
      cssWidth: width,
      cssHeight: height
    };

    cleanup();

    // Trigger tab capture and crop
    try {
      chrome.runtime.sendMessage({ action: 'captureTab' }, (res) => {
        if (!res || !res.success || !res.dataUrl) {
          alert('Could not capture visible tab.');
          return;
        }

        cropAndAnalyze(res.dataUrl, cropRect);
      });
    } catch (err) {
      console.error('Capture failed:', err);
    }
  });

  function cleanup() {
    window.removeEventListener('keydown', onKeyDown);
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  function cropAndAnalyze(dataUrl, rect) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        img,
        rect.x, rect.y, rect.width, rect.height,
        0, 0, rect.width, rect.height
      );

      const croppedDataUrl = canvas.toDataURL('image/png');
      showFloatingResultsPanel(croppedDataUrl, rect);
    };
    img.src = dataUrl;
  }

  function showFloatingResultsPanel(imageThumbnail, rect) {
    const panel = document.createElement('div');
    panel.id = 'gemmalens-floating-panel';

    // Position panel near the cropped box, staying inside viewport
    let panelLeft = Math.min(window.innerWidth - 440, Math.max(20, rect.clientX));
    let panelTop = rect.clientY + rect.cssHeight + 12;
    if (panelTop + 450 > window.innerHeight) {
      panelTop = Math.max(20, rect.clientY - 460);
    }

    panel.style.cssText = `
      position: fixed;
      left: ${panelLeft}px;
      top: ${panelTop}px;
      width: 420px;
      max-height: 540px;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 16px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18), 0 0 1px rgba(0, 0, 0, 0.2);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1D1D1F;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: gemmaSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    `;

    panel.innerHTML = `
      <style>
        @keyframes gemmaSlideIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .gl-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); background: rgba(245, 245, 247, 0.8); }
        .gl-panel-brand { font-size: 13px; font-weight: 700; color: #1D1D1F; display: flex; align-items: center; gap: 8px; }
        .gl-panel-close { background: none; border: none; font-size: 18px; color: #86868B; cursor: pointer; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
        .gl-panel-close:hover { background: rgba(0,0,0,0.06); color: #1D1D1F; }
        .gl-panel-body { padding: 16px; overflow-y: auto; flex: 1; font-size: 13px; line-height: 1.5; }
        .gl-loading { text-align: center; padding: 30px 0; color: #6E6E73; }
        .gl-spinner { width: 28px; height: 28px; border: 3px solid rgba(0,113,227,0.2); border-top-color: #0071E3; border-radius: 50%; margin: 0 auto 10px; animation: glSpin 0.8s linear infinite; }
        @keyframes glSpin { to { transform: rotate(360deg); } }
        .gl-tag { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 99px; background: rgba(0,113,227,0.1); color: #0071E3; margin-bottom: 6px; }
        .gl-title { font-size: 15px; font-weight: 700; color: #1D1D1F; margin-bottom: 6px; }
        .gl-summary { font-size: 12.5px; color: #374151; margin-bottom: 12px; line-height: 1.5; }
        .gl-warning-box { background: rgba(255, 59, 48, 0.08); border-left: 3px solid #FF3B30; padding: 8px 10px; border-radius: 6px; font-size: 11.5px; color: #D70015; margin-bottom: 12px; }
        .gl-checklist { background: #F9FAFB; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; }
        .gl-checklist-item { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; margin: 5px 0; color: #1F2937; }
        .gl-actions-bar { display: flex; gap: 8px; margin-bottom: 12px; }
        .gl-btn-listen { background: #0071E3; color: white; border: none; padding: 6px 12px; border-radius: 99px; font-size: 11.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .gl-btn-listen:hover { background: #0077ED; }
        .gl-btn-secondary { background: rgba(0,0,0,0.05); color: #1D1D1F; border: none; padding: 6px 12px; border-radius: 99px; font-size: 11.5px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
        .gl-btn-secondary:hover { background: rgba(0,0,0,0.09); }
        .gl-qna-box { border-top: 1px solid rgba(0,0,0,0.08); padding-top: 12px; margin-top: 8px; }
        .gl-qna-title { font-size: 11px; font-weight: 700; color: #6E6E73; text-transform: uppercase; margin-bottom: 6px; }
        .gl-qna-thread { max-height: 120px; overflow-y: auto; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px; }
        .gl-chat-bubble-q { background: #E5E5EA; align-self: flex-end; padding: 5px 10px; border-radius: 12px 12px 2px 12px; font-size: 11.5px; color: #1D1D1F; max-width: 85%; }
        .gl-chat-bubble-a { background: rgba(0, 113, 227, 0.1); border-left: 2px solid #0071E3; align-self: flex-start; padding: 5px 10px; border-radius: 2px 12px 12px 12px; font-size: 11.5px; color: #004085; max-width: 90%; }
        .gl-qna-form { display: flex; gap: 6px; }
        .gl-qna-input { flex: 1; border: 1px solid rgba(0,0,0,0.12); border-radius: 99px; padding: 6px 12px; font-size: 12px; outline: none; }
        .gl-qna-input:focus { border-color: #0071E3; }
        .gl-qna-submit { background: #1D1D1F; color: white; border: none; border-radius: 99px; padding: 6px 12px; font-size: 11.5px; font-weight: 600; cursor: pointer; }
      </style>
      <div class="gl-panel-header">
        <div class="gl-panel-brand">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>GemmaLens Zone Assistant</span>
        </div>
        <button class="gl-panel-close" id="glCloseBtn">&times;</button>
      </div>
      <div class="gl-panel-body" id="glContentArea">
        <div class="gl-loading">
          <div class="gl-spinner"></div>
          <div>Reading zone with local Gemma 4...</div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    document.getElementById('glCloseBtn').addEventListener('click', () => {
      panel.remove();
      window.speechSynthesis?.cancel();
    });

    // Send cropped image to local backend
    fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageThumbnail })
    })
    .then(r => r.json())
    .then(res => {
      if (!res.success) throw new Error(res.error || 'Failed to analyze zone');
      renderZoneResults(res.data, imageThumbnail, panel);
    })
    .catch(err => {
      const content = document.getElementById('glContentArea');
      if (content) {
        content.innerHTML = `
          <div style="padding: 20px 0; text-align: center; color: #D70015;">
            <div style="font-weight: 700; margin-bottom: 4px;">Zone Analysis Unavailable</div>
            <div style="font-size: 12px; color: #6E6E73; margin-bottom: 12px;">${err.message}</div>
            <div style="font-size: 11px; color: #86868B;">Please confirm GemmaLens is running at localhost:3000</div>
          </div>
        `;
      }
    });
  }

  function renderZoneResults(data, imageThumbnail, panel) {
    const content = document.getElementById('glContentArea');
    if (!content) return;

    // Save to local storage for history
    saveScanToHistory({
      id: 'scan_' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'Zone Snapshot',
      title: data.title || 'Selected Zone Analysis',
      category: data.category || 'Document',
      plainSummary: data.plainSummary || '',
      actionSteps: data.actionSteps || [],
      criticalWarnings: data.criticalWarnings || [],
      keyExtractedDetails: data.keyExtractedDetails || {},
      audioScript: data.audioReadAloudScript || data.plainSummary || '',
      imageThumbnail: imageThumbnail
    });

    let warningsHtml = '';
    if (data.criticalWarnings && data.criticalWarnings.length > 0) {
      warningsHtml = `
        <div class="gl-warning-box">
          <strong>Important Warning:</strong>
          <div>${data.criticalWarnings.join('<br>')}</div>
        </div>
      `;
    }

    let checklistHtml = '';
    if (data.actionSteps && data.actionSteps.length > 0) {
      checklistHtml = `
        <div class="gl-checklist">
          <div style="font-size:11px; font-weight:700; color:#4B5563; margin-bottom:4px; text-transform:uppercase;">Action Checklist</div>
          ${data.actionSteps.map(step => `
            <label class="gl-checklist-item">
              <input type="checkbox" style="margin-top:2px; accent-color:#0071E3;">
              <span>${step}</span>
            </label>
          `).join('')}
        </div>
      `;
    }

    content.innerHTML = `
      <span class="gl-tag">${data.category || 'Zone Snapshot'}</span>
      <h3 class="gl-title">${data.title || 'Extracted Zone'}</h3>
      <p class="gl-summary">${data.plainSummary || 'Analyzed successfully.'}</p>
      ${warningsHtml}
      ${checklistHtml}
      <div class="gl-actions-bar">
        <button class="gl-btn-listen" id="glListenBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <span id="glListenLabel">Listen</span>
        </button>
        <a class="gl-btn-secondary" href="http://localhost:3000" target="_blank">Open Full App &rarr;</a>
      </div>
      <div class="gl-qna-box">
        <div class="gl-qna-title">Ask Follow-up Doubt</div>
        <div class="gl-qna-thread" id="glQnaThread"></div>
        <form class="gl-qna-form" id="glQnaForm">
          <input type="text" class="gl-qna-input" id="glQnaInput" placeholder="Ask about this specific area..." required autocomplete="off">
          <button type="submit" class="gl-qna-submit" id="glQnaSubmit">Ask</button>
        </form>
      </div>
    `;

    // Listen Button
    const listenBtn = document.getElementById('glListenBtn');
    const listenLabel = document.getElementById('glListenLabel');
    let isSpeaking = false;

    listenBtn.addEventListener('click', () => {
      if (isSpeaking) {
        window.speechSynthesis?.cancel();
        isSpeaking = false;
        listenLabel.textContent = 'Listen';
      } else {
        window.speechSynthesis?.cancel();
        const text = data.audioReadAloudScript || data.plainSummary;
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.95;
        utter.onend = () => { isSpeaking = false; listenLabel.textContent = 'Listen'; };
        utter.onerror = () => { isSpeaking = false; listenLabel.textContent = 'Listen'; };
        window.speechSynthesis?.speak(utter);
        isSpeaking = true;
        listenLabel.textContent = 'Stop';
      }
    });

    // Follow-up Q&A Form
    const qnaForm = document.getElementById('glQnaForm');
    const qnaInput = document.getElementById('glQnaInput');
    const qnaThread = document.getElementById('glQnaThread');
    const conversationHistory = [];

    qnaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const question = qnaInput.value.trim();
      if (!question) return;

      // Add user bubble
      const userBubble = document.createElement('div');
      userBubble.className = 'gl-chat-bubble-q';
      userBubble.textContent = question;
      qnaThread.appendChild(userBubble);
      qnaInput.value = '';
      qnaThread.scrollTop = qnaThread.scrollHeight;

      // Add thinking bubble
      const aiBubble = document.createElement('div');
      aiBubble.className = 'gl-chat-bubble-a';
      aiBubble.textContent = 'Answering...';
      qnaThread.appendChild(aiBubble);
      qnaThread.scrollTop = qnaThread.scrollHeight;

      fetch(`${BACKEND_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: `Title: ${data.title}\nCategory: ${data.category}\nSummary: ${data.plainSummary}\nKey Details: ${JSON.stringify(data.keyExtractedDetails || {})}`,
          history: conversationHistory
        })
      })
      .then(r => r.json())
      .then(askRes => {
        if (!askRes.success) throw new Error(askRes.error || 'Failed to get answer');
        aiBubble.textContent = askRes.answer;
        conversationHistory.push({ question, answer: askRes.answer });
        qnaThread.scrollTop = qnaThread.scrollHeight;
      })
      .catch(err => {
        aiBubble.textContent = 'Unable to answer: ' + err.message;
      });
    });
  }

  function saveScanToHistory(scanItem) {
    try {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get({ scanHistory: [] }, (res) => {
          const list = res.scanHistory || [];
          list.unshift(scanItem);
          chrome.storage.local.set({ scanHistory: list.slice(0, 30) });
        });
      } else {
        const list = JSON.parse(localStorage.getItem('gemmalens_history') || '[]');
        list.unshift(scanItem);
        localStorage.setItem('gemmalens_history', JSON.stringify(list.slice(0, 30)));
      }
    } catch (e) {
      console.warn('Could not persist to storage:', e);
    }
  }
})();
