export type SessionMode = "normal" | "debug";

export type PowerStateName =
  | "Normal"
  | "Caution"
  | "Warning"
  | "Critical"
  | "Blackout";

export type GameOutcome = "playing" | "lost";

export type ResourceState = {
  mode: SessionMode;
  oxygen: number;
  power: number;
  elapsedSeconds: number;
  blackoutRemainingSeconds: number;
  outcome: GameOutcome;
};

export type PowerState = {
  name: PowerStateName;
  oxygenMultiplier: number;
  interactionLocked: boolean;
};

export const WRONG_SUBMISSION_POWER_PENALTY = 15;
export const BLACKOUT_DURATION_SECONDS = 10;
export const BLACKOUT_RECOVERY_POWER = 10;

const SESSION_LENGTH_SECONDS: Record<SessionMode, number> = {
  normal: 60 * 60,
  debug: 15 * 60,
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export function createResourceState(mode: SessionMode = "normal"): ResourceState {
  return {
    mode,
    oxygen: 100,
    power: 100,
    elapsedSeconds: 0,
    blackoutRemainingSeconds: 0,
    outcome: "playing",
  };
}

export function getSessionLengthSeconds(mode: SessionMode) {
  return SESSION_LENGTH_SECONDS[mode];
}

export function getPowerState(power: number): PowerState {
  if (power <= 0) {
    return {
      name: "Blackout",
      oxygenMultiplier: 3,
      interactionLocked: true,
    };
  }

  if (power <= 29) {
    return {
      name: "Critical",
      oxygenMultiplier: 2,
      interactionLocked: false,
    };
  }

  if (power <= 59) {
    return {
      name: "Warning",
      oxygenMultiplier: 1.5,
      interactionLocked: false,
    };
  }

  if (power <= 84) {
    return {
      name: "Caution",
      oxygenMultiplier: 1.25,
      interactionLocked: false,
    };
  }

  return {
    name: "Normal",
    oxygenMultiplier: 1,
    interactionLocked: false,
  };
}

export function applyWrongSubmissionPenalty(state: ResourceState): ResourceState {
  if (state.outcome === "lost") {
    return state;
  }

  const nextPower = clampPercent(state.power - WRONG_SUBMISSION_POWER_PENALTY);

  return {
    ...state,
    power: nextPower,
    blackoutRemainingSeconds:
      nextPower === 0 ? BLACKOUT_DURATION_SECONDS : state.blackoutRemainingSeconds,
  };
}

export function advanceResourceTime(
  state: ResourceState,
  deltaSeconds: number,
): ResourceState {
  if (state.outcome === "lost" || deltaSeconds <= 0) {
    return state;
  }

  const powerState = getPowerState(state.power);
  const sessionLengthSeconds = getSessionLengthSeconds(state.mode);
  const oxygenDrain =
    (deltaSeconds / sessionLengthSeconds) * 100 * powerState.oxygenMultiplier;
  const oxygen = clampPercent(state.oxygen - oxygenDrain);
  const blackoutRemainingSeconds = Math.max(
    0,
    state.blackoutRemainingSeconds - deltaSeconds,
  );
  const recoveredFromBlackout =
    state.power === 0 && state.blackoutRemainingSeconds > 0 && blackoutRemainingSeconds === 0;

  return {
    ...state,
    elapsedSeconds: state.elapsedSeconds + deltaSeconds,
    oxygen,
    power: Math.min(100, Math.round(state.power + Math.max(1, Math.floor(deltaSeconds)))),
    blackoutRemainingSeconds,
    outcome: oxygen === 0 ? "lost" : "playing",
  };
}

export function getInteractionLocked(state: ResourceState) {
  return state.blackoutRemainingSeconds > 0 || getPowerState(state.power).interactionLocked;
}
