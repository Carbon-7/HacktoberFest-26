/**
 * GemmaLens Dynamic Speech & Audio Engine
 * Synchronizes visual soundwave bars with spoken words using real speech boundary events
 * and a physics-based spring animation loop.
 */

export class AudioEngine {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.rate = 0.9;
    this.pitch = 1.0;
    this.voice = null;
    this.onStateChange = null;
    this.onWaveUpdate = null; // Callback passing an array of 5 dynamic bar heights [px, px, ...]

    // Physics wave simulation state
    this.waveLevels = [4, 4, 4, 4, 4];
    this.targetLevels = [4, 4, 4, 4, 4];
    this.animFrameId = null;
    this.lastWordTime = 0;

    this.initVoices();
    this.startWavePhysicsLoop();
  }

  initVoices() {
    if (!this.synth) return;

    const selectVoice = () => {
      const voices = this.synth.getVoices();
      this.voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Enhanced'))) 
        || voices.find(v => v.lang.startsWith('en')) 
        || voices[0];
    };

    selectVoice();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = selectVoice;
    }
  }

  startWavePhysicsLoop() {
    const updatePhysics = () => {
      if (this.isPlaying) {
        const now = performance.now();
        const timeSinceWord = now - this.lastWordTime;

        // Active speech modulation driven by word cadence
        if (timeSinceWord < 420) {
          const t = now * 0.014;
          const energy = Math.max(0.2, 1 - (timeSinceWord / 420));
          for (let i = 0; i < 5; i++) {
            const harmonic = Math.sin(t * (1.2 + i * 0.35) + i * 1.5) * (3.5 * energy);
            const target = Math.max(3, (this.targetLevels[i] * energy) + harmonic);
            this.waveLevels[i] += (target - this.waveLevels[i]) * 0.28;
          }
        } else {
          // Between words or breath pause: settle toward idle baseline
          for (let i = 0; i < 5; i++) {
            this.waveLevels[i] += (4 - this.waveLevels[i]) * 0.18;
          }
        }
      } else {
        // Stopped: smoothly rest at 4px
        for (let i = 0; i < 5; i++) {
          this.waveLevels[i] += (4 - this.waveLevels[i]) * 0.15;
        }
      }

      if (this.onWaveUpdate) {
        this.onWaveUpdate(this.waveLevels);
      }

      this.animFrameId = requestAnimationFrame(updatePhysics);
    };

    this.animFrameId = requestAnimationFrame(updatePhysics);
  }

  isSupported() {
    return !!this.synth;
  }

  setRate(rate) {
    this.rate = Math.max(0.7, Math.min(1.5, rate));
  }

  speak(text, onEndCallback = null) {
    if (!this.synth || !text) return;

    this.stop();

    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
    if (this.voice) {
      this.currentUtterance.voice = this.voice;
    }
    this.currentUtterance.rate = this.rate;
    this.currentUtterance.pitch = this.pitch;

    // Word boundary event: fires precisely as each word is spoken!
    this.currentUtterance.onboundary = (event) => {
      this.lastWordTime = performance.now();
      // Calculate cadence intensity based on word length and position
      const charLen = event.charLength || 5;
      const baseEnergy = Math.min(22, 10 + charLen * 1.8);
      
      // Dynamic rhythm heights across 5 equalizer channels
      this.targetLevels = [
        Math.max(5, baseEnergy * 0.65 + (Math.random() * 4 - 2)),
        Math.max(8, baseEnergy * 0.95 + (Math.random() * 5 - 2)),
        Math.max(10, baseEnergy * 1.1 + (Math.random() * 6 - 3)),
        Math.max(8, baseEnergy * 0.9 + (Math.random() * 5 - 2)),
        Math.max(5, baseEnergy * 0.6 + (Math.random() * 4 - 2))
      ];
    };

    this.currentUtterance.onstart = () => {
      this.isPlaying = true;
      this.lastWordTime = performance.now();
      if (this.onStateChange) this.onStateChange(true);
    };

    this.currentUtterance.onend = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
      this.targetLevels = [4, 4, 4, 4, 4];
      if (this.onStateChange) this.onStateChange(false);
      if (onEndCallback) onEndCallback();
    };

    this.currentUtterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isPlaying = false;
      this.currentUtterance = null;
      this.targetLevels = [4, 4, 4, 4, 4];
      if (this.onStateChange) this.onStateChange(false);
    };

    this.synth.speak(this.currentUtterance);
  }

  pause() {
    if (this.synth && this.isPlaying) {
      this.synth.pause();
      this.isPlaying = false;
      this.targetLevels = [4, 4, 4, 4, 4];
      if (this.onStateChange) this.onStateChange(false);
    }
  }

  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.isPlaying = true;
      this.lastWordTime = performance.now();
      if (this.onStateChange) this.onStateChange(true);
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
      this.currentUtterance = null;
      this.targetLevels = [4, 4, 4, 4, 4];
      if (this.onStateChange) this.onStateChange(false);
    }
  }
}
