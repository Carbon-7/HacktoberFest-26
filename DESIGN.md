# GemmaLens — Design System & UI Specification (`DESIGN.md`)

## 1. Design Philosophy: "Radical Accessibility"
GemmaLens is built for **everyone** — especially the elderly, visually impaired, neurodivergent, and non-native speakers. The design rejects sterile AI chatbots and generic dashboards in favor of a calm, authoritative, high-contrast, sensory-friendly interface that feels like a trusted personal assistant.

---

## 2. Typography

We use modern, human-readable Google Fonts loaded via preconnect with native system fallbacks for offline resilience.

* **Primary Body & Headings:** `Plus Jakarta Sans`, sans-serif
  * *Weights:* 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)
  * *Purpose:* Highly legible geometry with open apertures, optimized for small screens, elderly eyes, and dyslexic readers.
* **Thinking & Technical Telemetry:** `JetBrains Mono`, monospace
  * *Weights:* 400 (Regular), 500 (Medium)
  * *Purpose:* Displays Gemma 4's internal chain-of-thought and confidence metrics with unambiguous letterforms.

```css
--font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Menlo, monospace;
```

---

## 3. Color Palette & Design Tokens

A tailored, high-contrast palette compliant with **WCAG 2.1 AAA** contrast ratios.

### Dark Mode (Default — Low Eye Strain)
* **Canvas Background:** `#0B0F19` (Deep Obsidian Void)
* **Surface Card (Elevated):** `#111827` (Rich Slate)
* **Surface Card (Border/Divider):** `#1F2937` (Muted Steel)
* **Primary Text:** `#F9FAFB` (98% Crisp Light)
* **Secondary / Subdued Text:** `#9CA3AF` (Muted Cool Gray)
* **Primary Accent (Gemma Brand):** `#4F46E5` (Electric Indigo) / `#6366F1` (Hover)
* **Gemma Gradient Accent:** `linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)`

### Semantic Action Tokens
* **Safe / Verified (Green):** `#10B981` (Surface: `rgba(16, 185, 129, 0.12)`)
* **Caution / Attention (Amber):** `#F59E0B` (Surface: `rgba(245, 158, 11, 0.12)`)
* **Hazard / Red Flag (Rose/Crimson):** `#F43F5E` (Surface: `rgba(244, 63, 94, 0.12)`)
* **Action Required (Blue/Cyan):** `#06B6D4` (Surface: `rgba(6, 182, 212, 0.12)`)

---

## 4. UI Components & Layout Structure

### 4.1 Header Bar
* **Brand Identity:** GemmaLens emblem with animated glowing gradient ring.
* **Status Indicator:** Live pill badge showing **"Ollama: Gemma 4 (7.5B) Online [Local]"** with green pulse dot.
* **High Contrast & Font Size Toggle:** Quick buttons for `A-` / `A+` font scaling and Speech toggle.

### 4.2 Lens Mode Selector (Horizontal Pill Bar)
1. 🩺 **Medicine & Rx:** Focuses on dosage, warnings, interactions, and schedule.
2. 📄 **Bills & Civic:** Focuses on amount due, payment deadline, traps, and step-by-step resolution.
3. 🥗 **Food & Allergens:** Focuses on harmful additives, allergen alerts, and dietary flags.
4. 🔍 **Universal / Freeform:** Multi-purpose visual understanding with custom voice/text query.

### 4.3 Input Stage (Dual Modal)
* **Drag-and-Drop Zone:** Large, welcoming dropzone with clear dashed borders, webcam trigger, and file upload button.
* **1-Click Preset Gallery:** 3 preloaded real-world high-resolution samples so judges and users can test without uploading their own images:
  * *Sample 1:* Prescription & Medicine Box (Amoxicillin dosage).
  * *Sample 2:* High-Stakes Electric Utility Disconnection Notice.
  * *Sample 3:* Food Nutritional Label with Hidden Allergens.

### 4.4 Results Stage (The Multimodal Dashboard)
* **Image Thumbnail & Quick Zoom:** Sticky side preview of the analyzed document.
* **Auditory Voice Player:** Big, prominent "🔊 Read Aloud" floating control with play/pause/stop and speech rate controls.
* **Structured 3-Pillar Breakdown:**
  1. **5th-Grade Plain Language Explanation:** Jargon-free explanation in everyday terms.
  2. **Action Checklist:** Checkboxes with immediate next steps.
  3. **Gotchas, Deadlines & Risks:** Highlighted red/amber warnings.
* **Gemma 4 "Thinking Process" Accordion:**
  * Collapsible terminal-style box showing Gemma 4's raw step-by-step reasoning tokens before final output.

---

## 5. Micro-Interactions & Motion
* **Pulse Shimmer on Processing:** Subtle CSS gradient shimmer while Ollama is computing inference.
* **Hover Micro-Lifts:** Cards elevate 3px with `cubic-bezier(0.16, 1, 0.3, 1)` easing.
* **Voice Wave Animation:** Soundbar waveform activates when Text-to-Speech is speaking.
* **Reduced Motion Support:** `@media (prefers-reduced-motion: reduce)` disables non-essential animations.

---

## 6. Iconography
* **Format:** Inline SVG sprites for zero external network dependency (100% offline-ready).
* **Style:** 24px grid, 2px stroke, rounded caps and joins (Lucide/Feather style).
