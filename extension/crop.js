/**
 * GemmaLens Resizable Snipping Tool & Area Analyzer
 * Provides an interactive, resizable, and draggable crop box directly on any webpage,
 * extracting targeted sections for local Gemma 4 vision analysis and side-panel sync.
 */

(() => {
  const BACKEND_URL = 'http://localhost:3000';

  // Remove any previous active instances
  const prevOverlay = document.getElementById('gemmalens-snipping-overlay');
  if (prevOverlay) prevOverlay.remove();
  const prevPanel = document.getElementById('gemmalens-floating-panel');
  if (prevPanel) prevPanel.remove();

  // 1. Create Fullscreen Overlay
  const overlay = document.createElement('div');
  overlay.id = 'gemmalens-snipping-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483640;
    cursor: crosshair;
    background: rgba(15, 23, 42, 0.4);
    user-select: none;
    backdrop-filter: blur(2px);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  // 2. Top HUD Guide Banner
  const hud = document.createElement('div');
  hud.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 999px;
    padding: 8px 20px;
    font-size: 13px;
    font-weight: 600;
    color: #1D1D1F;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: none;
    z-index: 2147483646;
  `;
  hud.innerHTML = `
    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#0071E3;"></span>
    <span>Drag to snip a zone, then resize with handles</span>
    <span style="font-size: 11px; background: rgba(0,0,0,0.06); padding: 2px 8px; border-radius: 99px; color: #6E6E73;">ESC to Cancel</span>
  `;
  overlay.appendChild(hud);

  // 3. Resizable Snipping Box
  const box = document.createElement('div');
  box.id = 'gemmalens-snip-box';
  box.style.cssText = `
    position: fixed;
    border: 2px solid #0071E3;
    background: rgba(0, 113, 227, 0.08);
    display: none;
    z-index: 2147483643;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
    cursor: move;
  `;

  // Dimension tag
  const dimTag = document.createElement('div');
  dimTag.style.cssText = `
    position: absolute;
    top: -26px;
    left: 0;
    background: #1D1D1F;
    color: white;
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
  `;
  box.appendChild(dimTag);

  // 8 Resize Handles
  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  const handleElements = {};
  handles.forEach(pos => {
    const h = document.createElement('div');
    h.className = `gl-snip-handle gl-handle-${pos}`;
    h.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background: #FFFFFF;
      border: 2px solid #0071E3;
      border-radius: 2px;
      z-index: 2147483645;
      cursor: ${pos}-resize;
    `;
    // Position handles
    if (pos.includes('n')) h.style.top = '-6px';
    if (pos.includes('s')) h.style.bottom = '-6px';
    if (pos.includes('w')) h.style.left = '-6px';
    if (pos.includes('e')) h.style.right = '-6px';
    if (pos === 'n' || pos === 's') h.style.left = 'calc(50% - 5px)';
    if (pos === 'w' || pos === 'e') h.style.top = 'calc(50% - 5px)';

    box.appendChild(h);
    handleElements[pos] = h;
  });

  // Attached Floating Action Bar
  const toolbar = document.createElement('div');
  toolbar.id = 'gemmalens-snip-toolbar';
  toolbar.style.cssText = `
    position: absolute;
    bottom: -46px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 999px;
    padding: 6px 10px;
    display: none;
    align-items: center;
    gap: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 2147483646;
    pointer-events: auto;
  `;
  toolbar.innerHTML = `
    <button id="glAnalyzeBtn" style="background:#0071E3; color:white; border:none; border-radius:999px; padding:6px 14px; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:5px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <span>Analyze Selected Zone</span>
    </button>
    <button id="glResetBtn" style="background:rgba(0,0,0,0.06); color:#1D1D1F; border:none; border-radius:999px; padding:6px 10px; font-size:11.5px; font-weight:600; cursor:pointer;">Redraw</button>
    <button id="glCancelBtn" style="background:none; border:none; color:#8E8E93; font-size:16px; cursor:pointer; padding:0 6px;">&times;</button>
  `;
  box.appendChild(toolbar);

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Geometry State
  let rect = { left: 0, top: 0, width: 0, height: 0 };
  let mode = 'drawing'; // 'drawing' | 'idle' | 'resizing' | 'moving'
  let activeHandle = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialRect = { ...rect };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') cleanup();
  };
  window.addEventListener('keydown', onKeyDown);

  // Mouse interaction
  overlay.addEventListener('mousedown', (e) => {
    if (e.target.closest('#gemmalens-snip-toolbar')) return;

    // Check if clicking a handle
    for (const pos of handles) {
      if (e.target === handleElements[pos]) {
        mode = 'resizing';
        activeHandle = pos;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        initialRect = { ...rect };
        e.stopPropagation();
        return;
      }
    }

    // Check if clicking inside box to move
    if (e.target === box && rect.width > 20) {
      mode = 'moving';
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialRect = { ...rect };
      e.stopPropagation();
      return;
    }

    // Otherwise, start drawing a new crop box
    mode = 'drawing';
    rect.left = e.clientX;
    rect.top = e.clientY;
    rect.width = 0;
    rect.height = 0;
    toolbar.style.display = 'none';
    box.style.display = 'block';
    updateBoxUI();
  });

  window.addEventListener('mousemove', (e) => {
    if (mode === 'drawing') {
      const currentX = e.clientX;
      const currentY = e.clientY;
      rect.left = Math.min(rect.left, currentX);
      rect.top = Math.min(rect.top, currentY);
      rect.width = Math.abs(currentX - rect.left);
      rect.height = Math.abs(currentY - rect.top);
      updateBoxUI();
    } else if (mode === 'moving') {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      rect.left = Math.max(0, Math.min(window.innerWidth - initialRect.width, initialRect.left + dx));
      rect.top = Math.max(0, Math.min(window.innerHeight - initialRect.height, initialRect.top + dy));
      updateBoxUI();
    } else if (mode === 'resizing') {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      let newLeft = initialRect.left;
      let newTop = initialRect.top;
      let newWidth = initialRect.width;
      let newHeight = initialRect.height;

      if (activeHandle.includes('e')) newWidth = Math.max(30, initialRect.width + dx);
      if (activeHandle.includes('s')) newHeight = Math.max(30, initialRect.height + dy);
      if (activeHandle.includes('w')) {
        const proposedW = initialRect.width - dx;
        if (proposedW >= 30) {
          newLeft = initialRect.left + dx;
          newWidth = proposedW;
        }
      }
      if (activeHandle.includes('n')) {
        const proposedH = initialRect.height - dy;
        if (proposedH >= 30) {
          newTop = initialRect.top + dy;
          newHeight = proposedH;
        }
      }

      rect.left = newLeft;
      rect.top = newTop;
      rect.width = newWidth;
      rect.height = newHeight;
      updateBoxUI();
    }
  });

  window.addEventListener('mouseup', () => {
    if (mode === 'drawing' || mode === 'resizing' || mode === 'moving') {
      if (rect.width > 30 && rect.height > 30) {
        toolbar.style.display = 'flex';
        // Adjust toolbar position if near bottom edge
        if (rect.top + rect.height + 60 > window.innerHeight) {
          toolbar.style.bottom = 'auto';
          toolbar.style.top = '-46px';
        } else {
          toolbar.style.top = 'auto';
          toolbar.style.bottom = '-46px';
        }
      } else {
        box.style.display = 'none';
        toolbar.style.display = 'none';
      }
      mode = 'idle';
      activeHandle = null;
    }
  });

  function updateBoxUI() {
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
    dimTag.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;
  }

  // Toolbar button handlers
  document.getElementById('glCancelBtn')?.addEventListener('click', cleanup);
  document.getElementById('glResetBtn')?.addEventListener('click', () => {
    box.style.display = 'none';
    toolbar.style.display = 'none';
    rect = { left: 0, top: 0, width: 0, height: 0 };
  });

  document.getElementById('glAnalyzeBtn')?.addEventListener('click', () => {
    if (rect.width < 30 || rect.height < 30) return;

    const dpr = window.devicePixelRatio || 1;
    const cropCoordinates = {
      x: rect.left * dpr,
      y: rect.top * dpr,
      width: rect.width * dpr,
      height: rect.height * dpr,
      clientX: rect.left,
      clientY: rect.top,
      cssWidth: rect.width,
      cssHeight: rect.height
    };

    cleanup();

    // Capture tab & crop
    chrome.runtime.sendMessage({ action: 'captureTab' }, (res) => {
      if (!res || !res.success || !res.dataUrl) {
        alert('Could not capture visible tab.');
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = cropCoordinates.width;
        canvas.height = cropCoordinates.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          img,
          cropCoordinates.x, cropCoordinates.y, cropCoordinates.width, cropCoordinates.height,
          0, 0, cropCoordinates.width, cropCoordinates.height
        );
        const croppedBase64 = canvas.toDataURL('image/png');
        showFloatingResults(croppedBase64, cropCoordinates);
      };
      img.src = res.dataUrl;
    });
  });

  function cleanup() {
    window.removeEventListener('keydown', onKeyDown);
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  // 4. In-Page Floating Glass HUD
  function showFloatingResults(imageThumbnail, coords) {
    const panel = document.createElement('div');
    panel.id = 'gemmalens-floating-panel';

    let leftPos = Math.min(window.innerWidth - 440, Math.max(20, coords.clientX));
    let topPos = coords.clientY + coords.cssHeight + 12;
    if (topPos + 480 > window.innerHeight) {
      topPos = Math.max(20, coords.clientY - 490);
    }

    panel.style.cssText = `
      position: fixed;
      left: ${leftPos}px;
      top: ${topPos}px;
      width: 420px;
      max-height: 540px;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(28px);
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 16px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18), 0 0 1px rgba(0, 0, 0, 0.2);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1D1D1F;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: glSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    `;

    panel.innerHTML = `
      <style>
        @keyframes glSlideIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .gl-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); background: rgba(245, 245, 247, 0.85); }
        .gl-panel-brand { font-size: 13px; font-weight: 700; color: #1D1D1F; display: flex; align-items: center; gap: 8px; }
        .gl-panel-close { background: none; border: none; font-size: 18px; color: #86868B; cursor: pointer; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
        .gl-panel-close:hover { background: rgba(0,0,0,0.06); color: #1D1D1F; }
        .gl-panel-body { padding: 16px; overflow-y: auto; flex: 1; font-size: 13px; line-height: 1.5; }
        .gl-loading { text-align: center; padding: 28px 0; color: #6E6E73; }
        .gl-spinner { width: 28px; height: 28px; border: 3px solid rgba(0,113,227,0.2); border-top-color: #0071E3; border-radius: 50%; margin: 0 auto 10px; animation: glSpin 0.8s linear infinite; }
        @keyframes glSpin { to { transform: rotate(360deg); } }
        .gl-tag { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 99px; background: rgba(0,113,227,0.1); color: #0071E3; margin-bottom: 6px; }
        .gl-title { font-size: 15px; font-weight: 700; color: #1D1D1F; margin-bottom: 6px; }
        .gl-summary { font-size: 12.5px; color: #374151; margin-bottom: 12px; line-height: 1.5; }
        .gl-warning-box { background: rgba(255, 59, 48, 0.08); border-left: 3px solid #FF3B30; padding: 8px 10px; border-radius: 6px; font-size: 11.5px; color: #D70015; margin-bottom: 12px; }
        .gl-checklist { background: #F9FAFB; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; }
        .gl-checklist-item { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; margin: 5px 0; color: #1F2937; }
        .gl-actions-bar { display: flex; gap: 8px; margin-bottom: 12px; }
        .gl-btn-primary { background: #0071E3; color: white; border: none; padding: 6px 12px; border-radius: 99px; font-size: 11.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .gl-btn-primary:hover { background: #0077ED; }
        .gl-btn-sync { background: rgba(0,113,227,0.1); color: #0071E3; border: 1px solid rgba(0,113,227,0.2); padding: 6px 12px; border-radius: 99px; font-size: 11.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
        .gl-btn-sync:hover { background: rgba(0,113,227,0.18); }
        .gl-qna-box { border-top: 1px solid rgba(0,0,0,0.08); padding-top: 12px; margin-top: 8px; }
        .gl-qna-thread { max-height: 110px; overflow-y: auto; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px; }
        .gl-chat-q { background: #E5E5EA; align-self: flex-end; padding: 5px 10px; border-radius: 12px 12px 2px 12px; font-size: 11.5px; color: #1D1D1F; max-width: 85%; }
        .gl-chat-a { background: rgba(0, 113, 227, 0.08); border-left: 2px solid #0071E3; align-self: flex-start; padding: 5px 10px; border-radius: 2px 12px 12px 12px; font-size: 11.5px; color: #004085; max-width: 90%; }
        .gl-qna-form { display: flex; gap: 6px; }
        .gl-qna-input { flex: 1; border: 1px solid rgba(0,0,0,0.12); border-radius: 99px; padding: 6px 12px; font-size: 12px; outline: none; }
        .gl-qna-input:focus { border-color: #0071E3; }
        .gl-qna-submit { background: #1D1D1F; color: white; border: none; border-radius: 99px; padding: 6px 12px; font-size: 11.5px; font-weight: 600; cursor: pointer; }
      </style>
      <div class="gl-panel-header">
        <div class="gl-panel-brand">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0071E3" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>GemmaLens Snipped Zone</span>
        </div>
        <button class="gl-panel-close" id="glCloseBtn">&times;</button>
      </div>
      <div class="gl-panel-body" id="glBody">
        <div class="gl-loading">
          <div class="gl-spinner"></div>
          <div>Analyzing snipped area with local Gemma 4...</div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    document.getElementById('glCloseBtn').addEventListener('click', () => {
      panel.remove();
      window.speechSynthesis?.cancel();
    });

    fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageThumbnail })
    })
    .then(r => r.json())
    .then(res => {
      if (!res.success) throw new Error(res.error || 'Failed to analyze zone');
      renderResults(res.data, imageThumbnail);
    })
    .catch(err => {
      const body = document.getElementById('glBody');
      if (body) {
        body.innerHTML = `
          <div style="padding: 20px 0; text-align: center; color: #D70015;">
            <div style="font-weight: 700; margin-bottom: 4px;">Zone Analysis Unavailable</div>
            <div style="font-size: 12px; color: #6E6E73; margin-bottom: 12px;">${err.message}</div>
            <div style="font-size: 11px; color: #86868B;">Ensure GemmaLens server is running at localhost:3000</div>
          </div>
        `;
      }
    });

    function renderResults(data, thumb) {
      const body = document.getElementById('glBody');
      if (!body) return;

      const sessionId = 'sync_' + Date.now();

      // Sync session to local server
      fetch(`${BACKEND_URL}/api/sync-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: {
            id: sessionId,
            data,
            image: thumb,
            title: data.title,
            category: data.category
          }
        })
      }).catch(console.warn);

      // Save to chrome storage
      try {
        chrome.storage.local.get({ scanHistory: [] }, (res) => {
          const list = res.scanHistory || [];
          list.unshift({
            id: sessionId,
            timestamp: new Date().toISOString(),
            type: 'Snipped Zone',
            title: data.title || 'Snipped Zone Analysis',
            category: data.category || 'Zone',
            plainSummary: data.plainSummary || '',
            actionSteps: data.actionSteps || [],
            criticalWarnings: data.criticalWarnings || [],
            imageThumbnail: thumb
          });
          chrome.storage.local.set({ scanHistory: list.slice(0, 30) });
        });
      } catch (_) {}

      let warningsHtml = '';
      if (data.criticalWarnings && data.criticalWarnings.length > 0) {
        warningsHtml = `
          <div class="gl-warning-box">
            <strong>Important Safety Notice:</strong>
            <div>${data.criticalWarnings.map(w => typeof w === 'string' ? w : w.description || w.title).join('<br>')}</div>
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

      body.innerHTML = `
        <span class="gl-tag">${data.category || data.domainRole || 'Snipped Zone'}</span>
        <h3 class="gl-title">${data.title || 'Selected Section'}</h3>
        <p class="gl-summary">${data.plainSummary || 'Analyzed successfully.'}</p>
        ${warningsHtml}
        ${checklistHtml}
        <div class="gl-actions-bar">
          <button class="gl-btn-primary" id="glVoiceBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <span id="glVoiceLabel">Listen</span>
          </button>
          <button class="gl-btn-sync" id="glSyncAppBtn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            <span>Open & Sync in App &rarr;</span>
          </button>
        </div>
        <div class="gl-qna-box">
          <div style="font-size:11px; font-weight:700; color:#6E6E73; text-transform:uppercase; margin-bottom:6px;">Ask Follow-up Doubt</div>
          <div class="gl-qna-thread" id="glThread"></div>
          <form class="gl-qna-form" id="glForm">
            <input type="text" class="gl-qna-input" id="glInput" placeholder="Ask about this specific area..." required autocomplete="off">
            <button type="submit" class="gl-qna-submit">Ask</button>
          </form>
        </div>
      `;

      // Sync button
      document.getElementById('glSyncAppBtn')?.addEventListener('click', () => {
        window.open(`http://localhost:3000/?session=${sessionId}`, '_blank');
      });

      // Voice
      let isPlaying = false;
      const voiceBtn = document.getElementById('glVoiceBtn');
      const voiceLabel = document.getElementById('glVoiceLabel');
      voiceBtn.addEventListener('click', () => {
        if (isPlaying) {
          window.speechSynthesis?.cancel();
          isPlaying = false;
          voiceLabel.textContent = 'Listen';
        } else {
          window.speechSynthesis?.cancel();
          const utter = new SpeechSynthesisUtterance(data.audioReadAloudScript || data.plainSummary);
          utter.rate = 0.95;
          utter.onend = () => { isPlaying = false; voiceLabel.textContent = 'Listen'; };
          utter.onerror = () => { isPlaying = false; voiceLabel.textContent = 'Listen'; };
          window.speechSynthesis?.speak(utter);
          isPlaying = true;
          voiceLabel.textContent = 'Stop';
        }
      });

      // Follow-up Q&A
      const form = document.getElementById('glForm');
      const input = document.getElementById('glInput');
      const thread = document.getElementById('glThread');
      const history = [];

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = input.value.trim();
        if (!q) return;

        const qBubble = document.createElement('div');
        qBubble.className = 'gl-chat-q';
        qBubble.textContent = q;
        thread.appendChild(qBubble);
        input.value = '';
        thread.scrollTop = thread.scrollHeight;

        const aBubble = document.createElement('div');
        aBubble.className = 'gl-chat-a';
        aBubble.textContent = 'Thinking...';
        thread.appendChild(aBubble);
        thread.scrollTop = thread.scrollHeight;

        fetch(`${BACKEND_URL}/api/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q,
            context: `Title: ${data.title}\nCategory: ${data.category}\nSummary: ${data.plainSummary}`,
            history
          })
        })
        .then(r => r.json())
        .then(askRes => {
          if (!askRes.success) throw new Error(askRes.error);
          aBubble.textContent = askRes.answer;
          history.push({ question: q, answer: askRes.answer });
          thread.scrollTop = thread.scrollHeight;
        })
        .catch(err => {
          aBubble.textContent = 'Error: ' + err.message;
        });
      });
    }
  }
})();
