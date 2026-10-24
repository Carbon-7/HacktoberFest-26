/**
 * Client for interacting with local Ollama daemon and Gemma 4 model.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = 'gemma4';

/**
 * Strips data URI header from base64 string if present.
 */
export function cleanBase64(base64Str) {
  if (!base64Str) return '';
  return base64Str.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
}

/**
 * Health check for Ollama daemon and Gemma 4 model presence.
 */
export async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) {
      return {
        online: false,
        error: `Ollama returned HTTP ${res.status}: ${res.statusText}`,
        modelFound: false
      };
    }

    const data = await res.json();
    const models = data.models || [];
    const gemmaModel = models.find(m => m.name.startsWith('gemma4') || m.name.includes('gemma4'));

    return {
      online: true,
      url: OLLAMA_BASE_URL,
      modelFound: !!gemmaModel,
      activeModel: gemmaModel ? gemmaModel.name : null,
      modelDetails: gemmaModel ? {
        size: gemmaModel.size,
        modifiedAt: gemmaModel.modified_at
      } : null,
      availableModels: models.map(m => m.name)
    };
  } catch (err) {
    return {
      online: false,
      error: err.message || 'Cannot connect to Ollama daemon on localhost:11434',
      modelFound: false
    };
  }
}

/**
 * Extract and sanitize JSON from model output.
 */
export function parseModelJSON(text) {
  if (!text) throw new Error('Empty response from model');

  // Attempt 1: Direct parse
  try {
    return JSON.parse(text.trim());
  } catch (_) {}

  // Attempt 2: Strip markdown code blocks
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    try {
      return JSON.parse(markdownMatch[1].trim());
    } catch (_) {}
  }

  // Attempt 3: Find outermost JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0].trim());
    } catch (_) {}
  }

  // Fallback: Construct structured object from raw text so app never fails
  return {
    title: 'Visual Analysis Result',
    plainSummary: text.substring(0, 300) + '...',
    keyDetails: [
      { label: 'Note', value: 'Generated with plain text parsing fallback' }
    ],
    actionChecklist: [
      'Review the full explanation above'
    ],
    criticalWarnings: [],
    audioReadAloudScript: text.substring(0, 200)
  };
}

/**
 * Analyze an image with Gemma 4 Vision via Ollama.
 */
export async function analyzeImageWithGemma4({ base64Image, prompt, model = DEFAULT_MODEL, endpoint = OLLAMA_BASE_URL }) {
  const startTime = Date.now();
  const cleanedImage = cleanBase64(base64Image);

  // Sanitize model name if default or empty
  const activeModel = (!model || model === 'gemma4') ? DEFAULT_MODEL : model;
  const baseUrl = (endpoint || OLLAMA_BASE_URL).replace(/\/+$/, '');

  const payload = {
    model: activeModel,
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.2, // Low temperature for high factual accuracy
      top_p: 0.95
    }
  };

  // Only include images array if cleanedImage is available
  if (cleanedImage) {
    payload.images = [cleanedImage];
  }

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama inference failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const totalDurationMs = Date.now() - startTime;

  // Extract thinking trace and final JSON
  const thinkingTrace = result.thinking || '';
  const rawResponse = result.response || '';
  const structuredData = parseModelJSON(rawResponse);

  return {
    success: true,
    data: structuredData,
    thinking: thinkingTrace,
    metrics: {
      totalDurationMs,
      evalCount: result.eval_count || 0,
      promptEvalCount: result.prompt_eval_count || 0,
      loadDurationMs: result.load_duration ? Math.round(result.load_duration / 1e6) : 0
    }
  };
}
