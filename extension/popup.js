const BACKEND_URL = 'http://localhost:3000';

document.getElementById('captureBtn').addEventListener('click', async () => {
  const loadingBox = document.getElementById('loadingBox');
  const resultCard = document.getElementById('resultCard');
  const captureBtn = document.getElementById('captureBtn');

  loadingBox.style.display = 'block';
  resultCard.style.display = 'none';
  captureBtn.disabled = true;

  try {
    // Capture visible tab screenshot
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
      if (!dataUrl) {
        throw new Error('Failed to capture tab. Make sure you are on a standard webpage.');
      }

      // Send to local GemmaLens server
      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl })
      });

      const res = await response.json();
      if (!res.success) throw new Error(res.error || 'Analysis failed');

      const data = res.data;
      document.getElementById('docCategory').textContent = data.category || 'Web Page';
      document.getElementById('docTitle').textContent = data.title || 'Page Summary';
      document.getElementById('docSummary').textContent = data.plainSummary || 'Analyzed successfully.';
      
      resultCard.style.display = 'block';

      // Setup Read Aloud button
      document.getElementById('listenBtn').onclick = () => {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(data.audioReadAloudScript || data.plainSummary);
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      };
    });
  } catch (err) {
    alert('Error: ' + err.message + '\n\nPlease ensure GemmaLens local server is running at localhost:3000.');
  } finally {
    loadingBox.style.display = 'none';
    captureBtn.disabled = false;
  }
});
