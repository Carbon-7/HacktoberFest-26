import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkOllamaHealth, analyzeImageWithGemma4 } from './ollamaClient.js';
import { buildPrompt, MODE_CONFIGS } from './prompts.js';
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
app.use(express.static(path.join(__dirname, '../public')));

/**
 * GET /api/health
 * Returns health status of local server and Ollama daemon with Gemma 4 model.
 */
app.get('/api/health', async (req, res) => {
  const ollamaStatus = await checkOllamaHealth();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'GemmaLens Multimodal Assistant',
    ollama: ollamaStatus,
    availableModes: Object.keys(MODE_CONFIGS)
  });
});

/**
 * GET /api/presets
 * Returns preloaded test presets with image data for 1-click judge evaluation.
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
 * Analyzes an uploaded image or preset with Gemma 4.
 */
app.post('/api/analyze', async (req, res) => {
  const { image, mode = 'medicine', query = '', model } = req.body;

  if (!image) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: image (base64 string or data URL)'
    });
  }

  try {
    const prompt = buildPrompt(mode, query);
    const result = await analyzeImageWithGemma4({
      base64Image: image,
      prompt: prompt,
      model: model || 'gemma4'
    });

    res.json({
      success: true,
      mode,
      modeName: MODE_CONFIGS[mode]?.name || 'Universal Visual Assistant',
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

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 GemmaLens server running at: http://localhost:${PORT}`);
  console.log(`⚡ Connected to local Ollama with Gemma 4`);
  console.log(`♿ Theme: AI for Everyone | Multimodal & Audio-First`);
  console.log(`======================================================\n`);
});
