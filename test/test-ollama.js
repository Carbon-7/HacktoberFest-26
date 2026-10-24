import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkOllamaHealth, analyzeImageWithGemma4 } from '../server/ollamaClient.js';
import { buildPrompt } from '../server/prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('--- 1. Testing Ollama Health ---');
  const health = await checkOllamaHealth();
  console.log('Health Result:', health);

  if (!health.online || !health.modelFound) {
    console.error('Ollama or Gemma 4 is not available!');
    process.exit(1);
  }

  console.log('\n--- 2. Testing Medicine Preset Analysis with Gemma 4 Vision ---');
  const imgPath = path.join(__dirname, '../public/assets/presets/preset-medicine.png');
  const imgBuffer = fs.readFileSync(imgPath);
  const base64Img = imgBuffer.toString('base64');

  const prompt = buildPrompt('medicine', 'What is the dosage and what are the critical warnings?');
  console.log('Sending request to Gemma 4 via Ollama...');

  const startTime = Date.now();
  const result = await analyzeImageWithGemma4({
    base64Image: base64Img,
    prompt: prompt
  });

  console.log(`\n--- Completed in ${Date.now() - startTime}ms ---`);
  console.log('Structured Output Title:', result.data.title);
  console.log('Plain Summary:', result.data.plainSummary);
  console.log('Key Details:', result.data.keyDetails);
  console.log('Action Checklist:', result.data.actionChecklist);
  console.log('Critical Warnings:', result.data.criticalWarnings);
  console.log('\nThinking excerpt:', result.thinking ? result.thinking.substring(0, 200) + '...' : '(None)');
}

runTest().catch(console.error);
