/**
 * GemmaLens Audio Engine
 * Uses browser Web Speech API for natural text-to-speech read-aloud.
 * Optimized for low-latency, natural pacing, and elderly accessibility.
 */

export class AudioEngine {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.rate = 0.9; // Slightly slower than default for clarity
    this.pitch = 1.0;
    this.voice = null;
    this.onStateChange = null;

    this.initVoices();
  }

  initVoices() {
    if (!this.synth) return;

    const selectVoice = () => {
      const voices = this.synth.getVoices();
      // Prefer natural English voices (Google, Natural, Samantha, David)
      this.voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Enhanced'))) 
        || voices.find(v => v.lang.startsWith('en')) 
        || voices[0];
    };

    selectVoice();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = selectVoice;
    }
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

    this.currentUtterance.onstart = () => {
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange(true);
    };

    this.currentUtterance.onend = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange(false);
      if (onEndCallback) onEndCallback();
    };

    this.currentUtterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isPlaying = false;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange(false);
    };

    this.synth.speak(this.currentUtterance);
  }

  pause() {
    if (this.synth && this.isPlaying) {
      this.synth.pause();
      this.isPlaying = false;
      if (this.onStateChange) this.onStateChange(false);
    }
  }

  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange(true);
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange(false);
    }
  }
}
