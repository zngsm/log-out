export type AudioCue =
  | "ambient"
  | "play-start"
  | "warning-siren"
  | "decompression"
  | "door-lock"
  | "notification"
  | "comm-glitch"
  | "echo-ping"
  | "typing"
  | "hud-ignition"
  | "wrong-surge"
  | "success"
  | "blackout"
  | "reboot";

type CueShape = {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

const cueShapes: Record<AudioCue, CueShape> = {
  ambient: { frequency: 72, duration: 0.9, type: "sine", gain: 0.025 },
  "play-start": { frequency: 420, duration: 0.18, type: "triangle", gain: 0.08 },
  "warning-siren": { frequency: 220, duration: 0.42, type: "sawtooth", gain: 0.06 },
  decompression: { frequency: 96, duration: 0.5, type: "sawtooth", gain: 0.07 },
  "door-lock": { frequency: 138, duration: 0.22, type: "square", gain: 0.08 },
  notification: { frequency: 660, duration: 0.12, type: "sine", gain: 0.06 },
  "comm-glitch": { frequency: 880, duration: 0.16, type: "square", gain: 0.05 },
  "echo-ping": { frequency: 520, duration: 0.16, type: "triangle", gain: 0.06 },
  typing: { frequency: 740, duration: 0.08, type: "square", gain: 0.035 },
  "hud-ignition": { frequency: 360, duration: 0.25, type: "triangle", gain: 0.07 },
  "wrong-surge": { frequency: 110, duration: 0.32, type: "sawtooth", gain: 0.08 },
  success: { frequency: 720, duration: 0.28, type: "sine", gain: 0.07 },
  blackout: { frequency: 54, duration: 0.5, type: "square", gain: 0.085 },
  reboot: { frequency: 300, duration: 0.22, type: "triangle", gain: 0.065 },
};

export type AudioRuntime = {
  enabled: boolean;
  muted: boolean;
  volume: number;
  playCue: (cue: AudioCue) => void;
  unlock: () => Promise<void>;
  startLockdownAlarm: () => void;
  stopLockdownAlarm: () => void;
  startTensionBgm: () => void;
  stopTensionBgm: () => void;
};

export function createAudioRuntime(): AudioRuntime {
  let audioContext: AudioContext | null = null;
  let enabled = false;
  let muted = false;
  let volume = 0.55;

  // Lockdown Siren Loop state
  let lockdownActive = false;
  let lockdownOsc: OscillatorNode | null = null;
  let lockdownGain: GainNode | null = null;
  let lockdownInterval: number | null = null;

  // Dark Tension Ambient BGM state
  let tensionActive = false;
  let tensionOsc1: OscillatorNode | null = null;
  let tensionOsc2: OscillatorNode | null = null;
  let tensionLfo: OscillatorNode | null = null;
  let tensionLfoGain: GainNode | null = null;
  let tensionMasterGain: GainNode | null = null;

  async function unlock() {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    audioContext ??= new AudioContextClass();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    enabled = true;

    if (lockdownActive && !lockdownOsc) {
      startLockdownAlarm();
    }
    if (tensionActive && !tensionOsc1) {
      startTensionBgm();
    }
  }

  function updateLockdownGain() {
    if (!lockdownGain || !audioContext) return;
    const now = audioContext.currentTime;
    const targetGain = !enabled || muted ? 0.0001 : 0.05 * volume;
    lockdownGain.gain.setValueAtTime(lockdownGain.gain.value, now);
    lockdownGain.gain.linearRampToValueAtTime(Math.max(0.0001, targetGain), now + 0.05);
  }

  function updateTensionGain() {
    if (!tensionMasterGain || !audioContext) return;
    const now = audioContext.currentTime;
    const targetGain = !enabled || muted ? 0.0001 : 0.035 * volume;
    tensionMasterGain.gain.setValueAtTime(tensionMasterGain.gain.value, now);
    tensionMasterGain.gain.linearRampToValueAtTime(Math.max(0.0001, targetGain), now + 0.08);
  }

  function updateActiveAudioStates() {
    updateLockdownGain();
    updateTensionGain();
  }

  function startLockdownAlarm() {
    lockdownActive = true;
    if (!enabled || !audioContext) {
      return;
    }
    if (lockdownOsc) {
      updateLockdownGain();
      return;
    }

    try {
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);

      const initialGain = !enabled || muted ? 0.0001 : 0.05 * volume;
      gain.gain.setValueAtTime(initialGain, now);

      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(now);

      lockdownOsc = osc;
      lockdownGain = gain;

      let isHighPitch = false;
      lockdownInterval = window.setInterval(() => {
        if (!audioContext || !lockdownOsc || !lockdownActive) return;
        const currentTime = audioContext.currentTime;
        isHighPitch = !isHighPitch;
        const targetFreq = isHighPitch ? 330 : 220;
        lockdownOsc.frequency.cancelScheduledValues(currentTime);
        lockdownOsc.frequency.linearRampToValueAtTime(targetFreq, currentTime + 0.12);
      }, 380);
    } catch (e) {
      console.warn("Failed to start lockdown alarm:", e);
    }
  }

  function stopLockdownAlarm() {
    lockdownActive = false;
    if (lockdownInterval !== null) {
      clearInterval(lockdownInterval);
      lockdownInterval = null;
    }
    if (lockdownOsc) {
      try {
        const now = audioContext?.currentTime ?? 0;
        if (lockdownGain && audioContext) {
          lockdownGain.gain.cancelScheduledValues(now);
          lockdownGain.gain.linearRampToValueAtTime(0.0001, now + 0.08);
        }
        lockdownOsc.stop(now + 0.1);
        setTimeout(() => {
          lockdownOsc?.disconnect();
          lockdownGain?.disconnect();
          lockdownOsc = null;
          lockdownGain = null;
        }, 120);
      } catch {
        lockdownOsc = null;
        lockdownGain = null;
      }
    }
  }

  function startTensionBgm() {
    tensionActive = true;
    if (!enabled || !audioContext) {
      return;
    }
    if (tensionOsc1) {
      updateTensionGain();
      return;
    }

    try {
      const now = audioContext.currentTime;

      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      const masterGain = audioContext.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(55, now);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(87.31, now);

      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.25, now);
      lfoGain.gain.setValueAtTime(0.008, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc2.frequency);

      const initialGain = !enabled || muted ? 0.0001 : 0.035 * volume;
      masterGain.gain.setValueAtTime(initialGain, now);

      osc1.connect(masterGain);
      osc2.connect(masterGain);
      masterGain.connect(audioContext.destination);

      osc1.start(now);
      osc2.start(now);
      lfo.start(now);

      tensionOsc1 = osc1;
      tensionOsc2 = osc2;
      tensionLfo = lfo;
      tensionLfoGain = lfoGain;
      tensionMasterGain = masterGain;
    } catch (e) {
      console.warn("Failed to start tension BGM:", e);
    }
  }

  function stopTensionBgm() {
    tensionActive = false;
    if (tensionOsc1) {
      try {
        const now = audioContext?.currentTime ?? 0;
        if (tensionMasterGain && audioContext) {
          tensionMasterGain.gain.cancelScheduledValues(now);
          tensionMasterGain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
        }
        tensionOsc1.stop(now + 0.2);
        tensionOsc2?.stop(now + 0.2);
        tensionLfo?.stop(now + 0.2);
        setTimeout(() => {
          tensionOsc1?.disconnect();
          tensionOsc2?.disconnect();
          tensionLfo?.disconnect();
          tensionLfoGain?.disconnect();
          tensionMasterGain?.disconnect();
          tensionOsc1 = null;
          tensionOsc2 = null;
          tensionLfo = null;
          tensionLfoGain = null;
          tensionMasterGain = null;
        }, 220);
      } catch {
        tensionOsc1 = null;
        tensionOsc2 = null;
        tensionLfo = null;
        tensionLfoGain = null;
        tensionMasterGain = null;
      }
    }
  }

  function playCue(cue: AudioCue) {
    if (!enabled || muted || !audioContext) {
      return;
    }

    const shape = cueShapes[cue];
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = shape.type ?? "sine";
    oscillator.frequency.setValueAtTime(shape.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(24, shape.frequency * 0.72),
      now + shape.duration,
    );
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime((shape.gain ?? 0.05) * volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + shape.duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + shape.duration + 0.02);
  }

  return {
    get enabled() {
      return enabled;
    },
    get muted() {
      return muted;
    },
    set muted(nextMuted: boolean) {
      muted = nextMuted;
      updateActiveAudioStates();
    },
    get volume() {
      return volume;
    },
    set volume(nextVolume: number) {
      volume = Math.min(1, Math.max(0, nextVolume));
      updateActiveAudioStates();
    },
    playCue,
    unlock,
    startLockdownAlarm,
    stopLockdownAlarm,
    startTensionBgm,
    stopTensionBgm,
  };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
