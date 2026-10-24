import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkOllamaHealth, analyzeImageWithGemma4 } from './ollamaClient.js';
import { buildPrompt, buildFollowUpPrompt } from './prompts.js';
import { PRESETS } from './presetsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static frontend from public directory
app.use(express.static(path.join(__dirname, '../../public')));

/**
 * GET /api/health
 * Returns health status of local server and Ollama daemon with Gemma 4 model.
 */
app.get('/api/health', async (req, res) => {
  const ollamaStatus = await checkOllamaHealth();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'GemmaLens Universal Visual Assistant',
    ollama: ollamaStatus,
    capabilities: ['auto-detection', 'follow-up-qa', 'local-vision', 'speech-narration']
  });
});

/**
 * GET /api/presets
 * Returns preloaded test presets with image data for 1-click evaluation.
 */
app.get('/api/presets', (req, res) => {
  try {
    const list = PRESETS.map(preset => ({
      id: preset.id,
      mode: preset.mode,
      title: preset.title,
      subtitle: preset.subtitle,
      tag: preset.tag,
      tagColor: preset.tagColor,
      description: preset.description,
      promptHint: preset.promptHint,
      image: preset.getImage()
    }));
    res.json({ success: true, presets: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/analyze
 * Analyzes an uploaded image or preset with Gemma 4 using intelligent auto-detection.
 */
app.post('/api/analyze', async (req, res) => {
  const { image, query = '', model } = req.body;

  if (!image) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: image (base64 string or data URL)'
    });
  }

  try {
    const prompt = buildPrompt(query);
    const result = await analyzeImageWithGemma4({
      base64Image: image,
      prompt: prompt,
      model: model || 'gemma4'
    });

    const category = result.data.category || 'General Visual';

    res.json({
      success: true,
      category: category,
      data: result.data,
      thinking: result.thinking,
      metrics: result.metrics
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Error processing image with Gemma 4',
      diagnostic: {
        suggestion: 'Ensure Ollama daemon is running with `ollama run gemma4` on localhost:11434'
      }
    });
  }
});

/**
 * POST /api/ask
 * Handles follow-up questions about an already analyzed document.
 */
app.post('/api/ask', async (req, res) => {
  const { image, previousAnalysis = {}, question = '', model } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: question'
    });
  }

  try {
    const prompt = buildFollowUpPrompt(previousAnalysis, question);
    const result = await analyzeImageWithGemma4({
      base64Image: image || previousAnalysis.image,
      prompt: prompt,
      model: model || 'gemma4'
    });

    res.json({
      success: true,
      answer: result.data.answer || result.data.plainSummary || 'I reviewed the document regarding your question.',
      actionTip: result.data.actionTip || null,
      readAloud: result.data.readAloud || result.data.audioReadAloudScript || null,
      thinking: result.thinking
    });
  } catch (err) {
    console.error('Follow-up error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Error processing follow-up question'
    });
  }
});

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n------------------------------------------------------`);
  console.log(`GemmaLens server running at: http://localhost:${PORT}`);
  console.log(`Model: Google Gemma 4 (7.5B) via local Ollama`);
  console.log(`Features: Auto-Detection, Follow-Up Q&A, Audio Narration`);
  console.log(`------------------------------------------------------\n`);
});
