// Web Audio API Sound Synthesizer Engine for MediFlow ERP
// Loud, crystal-clear audio feedback for sales, barcode scans, actions, and errors.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Very Loud Celebratory Chime played upon Invoice Generation / Sale Completion
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Frequencies for a bright C major arpeggio: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const duration = 0.15;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * duration);

      // Boost volume (0.35 gain) for high audibility
      gain.gain.setValueAtTime(0.35, now + idx * duration);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * duration + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * duration);
      osc.stop(now + idx * duration + 0.35);
    });
  } catch (e) {
    console.warn("Audio playback error:", e);
  }
}

/**
 * Crisp Barcode / QR Scanner Beep Sound
 */
export function playBeep() {
  playBarcodeScanSuccessChime();
}

/**
 * Subtle high-fidelity barcode scanner success chime.
 * Plays a pleasant ascending dual-tone chime (C6 -> E6: 1046.5 Hz -> 1318.5 Hz)
 * giving instant auditory confirmation to pharmacy staff upon scanning without looking at screen.
 */
export function playBarcodeScanSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First tone: 1046.5 Hz (C6), 0.07s
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.22, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Second tone: 1318.5 Hz (E6), starts at 0.05s
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.5, now + 0.05);
    gain2.gain.setValueAtTime(0.25, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.16);
  } catch (e) {
    console.warn("Audio playback error:", e);
  }
}

/**
 * Quick UI Action Click Sound
 */
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    console.warn("Audio playback error:", e);
  }
}

/**
 * Low Warning Error Tone
 */
export function playErrorSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "sawtooth";

    osc1.frequency.setValueAtTime(220, now);
    osc2.frequency.setValueAtTime(233, now); // Disjoint interval

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);
  } catch (e) {
    console.warn("Audio playback error:", e);
  }
}

/**
 * Deposit / Money Added Chime
 */
export function playDepositSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.25, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  } catch (e) {
    console.warn("Audio playback error:", e);
  }
}

/**
 * Hold Sale Sound Tone
 */
export function playHoldSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [600, 450];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.18);
    });
  } catch (e) {
    console.warn("Audio playback error:", e);
  }
}

/**
 * Loud Action Confirmation Sound
 */
export function playActionSound() {
  playClickSound();
}
