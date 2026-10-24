# GemmaLens — System Architecture & Workflow (`ARCHITECTURE.md`)

## 1. System Overview

GemmaLens is an open-source, local-first multimodal AI assistant built specifically for the **"AI for Everyone"** Hack Day challenge. It leverages **Google's Gemma 4 (7.5B Q4_K_M)** open-weight model with vision and thinking capabilities running 100% locally via **Ollama**.

```mermaid
graph TD
    User["User / Screen / Camera / Presets"] -->|Image (Base64) + Lens Mode| UI["Frontend Web Client (Accessible UI)"]
    UI -->|TTS Audio Waveform| Audio["Web Speech API (Voice Engine)"]
    UI -->|REST POST /api/analyze| Server["Express.js Local Server (Node.js)"]
    
    subgraph Local_AI_Engine ["Local AI Engine (100% Offline & Private)"]
        Server -->|Validate & Inject Mode Prompts| PromptEngine["System Prompt & Schema Engine"]
        PromptEngine -->|REST POST /api/generate| Ollama["Ollama Daemon (localhost:11434)"]
        Ollama -->|Vision Clip Projector + LLM| Gemma4["Gemma 4 (7.5B Q4_K_M)"]
        Gemma4 -->|Thinking Tokens + Response Payload| StreamParser["Response & Thinking Parser"]
    end

    StreamParser -->|Structured JSON + Reasoning| Server
    Server -->|Sanitized Result Object| UI
```

---

## 2. Component Layers

### 2.1 Presentation Layer (`client/` or `public/`)
* **Framework:** Pure modern Vanilla JavaScript (ES2024) + Semantic HTML5 + Custom Property CSS.
* **Zero Heavy Framework Lock-in:** Ultra-fast load times, zero bundling friction, full offline-capable caching.
* **Audio Layer:** Native `window.speechSynthesis` with speech rate control (`0.85x` for elderly/accessibility) and pitch modulation.
* **State Management:** Reactive lightweight state store managing:
  * Current Lens Mode (`medicine`, `bill`, `label`, `general`).
  * Current Image Base64 buffer.
  * Inference state (`idle`, `thinking`, `complete`, `error`).
  * Gemma 4 reasoning trail.

### 2.2 Application / API Layer (`server/`)
* **Runtime:** Node.js (v24+) with Express ESM.
* **CORS & Static Serving:** Serves client assets and provides unified local proxy to Ollama to prevent CORS issues.
* **Endpoints:**
  * `GET /api/health`: Polls `http://localhost:11434/api/tags` to verify Ollama status, detects `gemma4` presence, and returns model details.
  * `POST /api/analyze`: Accepts `{ image: string, mode: string, query?: string }`. Formats prompt with strict JSON output specifications, calls Ollama `/api/generate`, parses thinking trace, and returns validated schema.
  * `GET /api/presets`: Returns pre-packaged test cases with real images and scenarios for 1-click zero-friction judge evaluation.

### 2.3 Model & Inference Layer
* **Model:** `gemma4:latest` (ID: `dc35e8d9c606`, 7.5B params, context 131k, clip vision projector).
* **Thinking Protocol:** Gemma 4 features native thinking mode (`thinking: true`). The server captures both the `<think>` reasoning trace and the final JSON response, exposing full cognitive transparency to the user.

---

## 3. Data Flow & API Contracts

### 3.1 `POST /api/analyze`

#### Request Payload
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "mode": "medicine", // "medicine" | "bill" | "label" | "general"
  "query": "Optional user question or specific concern",
  "enableThinking": true
}
```

#### Response Payload
```json
{
  "success": true,
  "mode": "medicine",
  "thinking": "1. Inspect image labels: identifies Amoxicillin 500mg capsule...\n2. Check dosage instructions...\n3. Identify warnings...",
  "data": {
    "title": "Amoxicillin 500mg Oral Capsule",
    "plainSummary": "This is an antibiotic medicine used to treat bacterial infections. It will NOT work for viral infections like colds or the flu.",
    "keyDetails": [
      { "label": "Dosage", "value": "Take 1 capsule every 8 hours with a full glass of water." },
      { "label": "Duration", "value": "Finish all 10 days even if you feel better." }
    ],
    "actionChecklist": [
      "Set an alarm for 8:00 AM, 4:00 PM, and 12:00 AM.",
      "Take with meals if it upsets your stomach.",
      "Do NOT stop early without consulting your physician."
    ],
    "criticalWarnings": [
      {
        "severity": "high",
        "title": "Penicillin Allergy Alert",
        "description": "Stop immediately and seek emergency medical care if you experience hives, face swelling, or difficulty breathing."
      }
    ],
    "confidenceScore": "High"
  },
  "metrics": {
    "totalDurationMs": 2840,
    "evalCount": 312
  }
}
```

---

## 4. Prompt Engineering & Reasoning Strategy

Each lens mode injects a specialized system prompt enforcing **5th-grade reading level**, **zero clinical/legal fluff**, and **strict JSON output formatting**:

```javascript
const MODE_PROMPTS = {
  medicine: `You are GemmaLens Medicine Assistant for everyday patients and elderly.
Examine the image of this medicine packaging/prescription.
Translate all medical jargon into simple 5th-grade plain language.
Identify: Drug Name, What it treats, Exact Dosage, How to take it, and Critical Safety Warnings.
Output ONLY a valid JSON object matching the requested schema.`,

  bill: `You are GemmaLens Civic & Bill Assistant.
Examine this bill, invoice, or official civic document.
Identify: Who is billing, Total Amount Due, Strict Due Date, What happens if late, and 3 immediate steps to take.
Translate all fine print into plain everyday words.
Output ONLY a valid JSON object matching the requested schema.`,

  label: `You are GemmaLens Consumer & Food Allergen Watchdog.
Examine this nutrition/ingredient label or product packaging.
Highlight: Common allergens (nuts, gluten, dairy, soy), hidden sugars/additives, and a clear safety verdict for sensitive consumers.
Output ONLY a valid JSON object matching the requested schema.`
};
```

---

## 5. Resiliency & Error Recovery

1. **Ollama Unavailability Fallback:** If Ollama daemon is offline or model is missing, the API returns a graceful diagnostic status code with exact instructions on how to start Ollama.
2. **JSON Malformation Resilience:** The server uses regex parsing to extract `{ ... }` from LLM outputs even if surrounded by conversational markdown or thinking blocks.
3. **Payload Truncation Protection:** Large images are safely compressed/scaled on client canvas before transmission to keep latency under 4 seconds on local hardware.
