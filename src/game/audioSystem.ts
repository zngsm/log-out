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
};

export function createAudioRuntime(): AudioRuntime {
  let audioContext: AudioContext | null = null;
  let enabled = false;
  let muted = false;
  let volume = 0.55;

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
    },
    get volume() {
      return volume;
    },
    set volume(nextVolume: number) {
      volume = Math.min(1, Math.max(0, nextVolume));
    },
    playCue,
    unlock,
  };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
