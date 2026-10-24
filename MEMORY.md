# GemmaLens — Project Memory & Agent Context (`MEMORY.md`)

## 1. Project Overview
* **Project Name:** GemmaLens (Multimodal AI for Everyone)
* **Hackathon:** Hacktoberfest Hack Day (MLH) — "AI for Everyone"
* **Target Categories:** 
  1. *Best Use of Gemma 4 Project* (Multimodal Vision + Text + Thinking)
  2. *Best Open-Source AI Project* (Open-weight Gemma 4 + Local inference + Open-source agent pipeline)
* **Repository Path:** `e:\Hactoberfest\HacktoberFest-26`
* **License:** MIT (already present in `LICENSE`, Copyright (c) 2026 Kavan)
* **Author / Maintainer:** Kavan

---

## 2. Environment & Tooling Specs
* **Operating System:** Windows (powershell)
* **Node.js:** `v24.14.0`
* **npm:** `11.9.0`
* **Python:** `3.14.3`
* **Ollama Version:** `0.35.1`
* **Local Model:** `gemma4:latest` (ID: `dc35e8d9c606`, 7.5B Q4_K_M, with clip projector, 131k context, native thinking mode)
* **Ollama Endpoint:** `http://localhost:11434`
* **Verified Local Capability:** Vision + Thinking confirmed active and responding in ~380ms - 800ms.

---

## 3. Architecture & Tech Decisions
* **Decision 1: Full-Stack Node.js (Express ESM) + Modern Vanilla Client**
  * *Rationale:* Zero compilation overhead, instant startup (`npm start`), no bundling breakage during live judge evaluations, 100% offline-compatible.
* **Decision 2: 1-Click Judge Presets**
  * *Rationale:* Hackathon judges frequently evaluate projects in 2-3 minutes. Having pre-loaded test images (Prescription, Utility Bill, Food Label) guarantees instant, flawless demonstrations.
* **Decision 3: Thinking Mode Transparency**
  * *Rationale:* Gemma 4 has native thinking. By parsing and displaying Gemma's internal `<think>` reasoning chain in an accordion, we prove the AI isn't a superficial wrapper, but an active reasoning engine.
* **Decision 4: Native Browser Speech API (Text-to-Speech)**
  * *Rationale:* Fulfills the "AI for Everyone" theme for visually impaired, elderly, and low-literacy users without requiring external paid speech APIs.

---

## 4. Work in Progress & State
* Current Milestone: **Phases 1 through 5 Completed!**
* Server running: Active on `http://localhost:3000`
* Tested & Verified: Live multimodal inference with Gemma 4 Vision, thinking extraction, interactive checklists, and Web Speech API audio narration.
* Submission readiness: 100% compliant with MLH Hack Day ground rules and required questions.

---

## 5. Commit Log / History
1. `Initial commit` (Existing repository with MIT License)
2. `docs: establish design system, architecture specifications, project memory, and task tracker`
3. `feat(backend): implement local Ollama Gemma 4 vision API with thinking extraction`
4. `feat(frontend): create accessible multimodal UI with voice narration and thinking accordion`
5. `docs: finalize comprehensive README with screenshots, installation guide, and submission details`
