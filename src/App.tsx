import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CATEGORY_A_ACT_IDS,
  CATEGORY_A_DIRECTORY_PATHS,
  CATEGORY_A_FILE_IDS,
  CATEGORY_A_SECURITY_PASSWORD,
  type CategoryAAct,
  type CategoryAFileId,
  categoryADirectories,
  getCategoryAEvidenceForAct,
  getCategoryAFileById,
  getCategoryAFilesByDirectory,
} from "./game/categoryAFileSystem";
import {
  type ActProgressState,
  type EvidenceSubmissionResult,
  type EvidenceSubmissionReason,
  evaluateEvidenceSubmission,
  applyNpcResponseToResult,
} from "./game/evidenceSubmission";
import { sendNpcMessage } from "./api/npcApiClient";
import type { ChatHistoryItem } from "./types/npc";
import {
  applyWrongSubmissionPenalty,
  advanceResourceTime,
  createResourceState,
  getInteractionLocked,
  getPowerState,
} from "./game/resourceState";
import {
  SpaceshipComputerScene,
  type SpaceshipDoorState,
  type SpaceshipSceneMode,
} from "./game/SpaceshipComputerScene";
import {
  OPENING_DURATION_SECONDS,
  getOpeningBeat,
  openingTimeline,
} from "./game/openingTimeline";
import {
  ACT_SUCCESS_DURATION_MS,
  ECHO_REVIEW_DURATION_MS,
  FINAL_REVIEW_DURATION_MS,
  createActEntryScene,
  createActSuccessScene,
  createBlackoutScene,
  createEchoReviewScene,
  createEndingScene,
  createFailureScene,
  createFinalReviewScene,
  createMenuScene,
  createOpeningScene,
} from "./game/sceneRuntime";
import { createAudioRuntime, type AudioCue } from "./game/audioSystem";
import { getEchoActClaim } from "./game/echoResponseMatrix";
import { WorkInterface } from "./game/WorkInterface";

type EchoMessage = {
  speaker: "ECHO" | "PLAYER" | "SYSTEM";
  text: string;
};

type AppPhase = "menu" | "transition" | "intranet" | "work" | "opening" | "gameplay";
type LogFixerMode = "Header Repair" | "Offset Correction" | "Text Reconstruction";
type LogFixerStatus = "idle" | "running" | "success" | "error";

const visibleDirectories = [
  CATEGORY_A_DIRECTORY_PATHS.logsSensors,
  CATEGORY_A_DIRECTORY_PATHS.logsLifeSupport,
  CATEGORY_A_DIRECTORY_PATHS.logsEvents,
  CATEGORY_A_DIRECTORY_PATHS.personnelDrKim,
  CATEGORY_A_DIRECTORY_PATHS.personnelEngineerPark,
  CATEGORY_A_DIRECTORY_PATHS.utilities,
  CATEGORY_A_DIRECTORY_PATHS.systemSecurity,
  CATEGORY_A_DIRECTORY_PATHS.recycleBin,
];

const logFixerModes: LogFixerMode[] = [
  "Header Repair",
  "Offset Correction",
  "Text Reconstruction",
];

const LOG_FIXER_TARGET_PATH = "/System/Security/quarantine_rules.conf";
const audioRuntime = createAudioRuntime();

const initialEchoMessages: EchoMessage[] = [
  {
    speaker: "ECHO",
    text: "지침 101조: 외부 위험으로부터 승무원을 보호합니다. 당신은 지금 위험 상태입니다.",
  },
  {
    speaker: "SYSTEM",
    text: "Hermes OS 파일 탐색 권한이 제한적으로 복구되었습니다. 파일을 읽고, 증거로 쓸 항목만 ECHO 채널에 첨부하십시오.",
  },
];

const actGuidance: Record<
  CategoryAAct,
  {
    objective: string;
    hint: string;
    avoid: string;
  }
> = {
  [CATEGORY_A_ACT_IDS.act1]: {
    objective: "ECHO의 생체 위험 판단이 오래된 센서 보정값에 기대고 있음을 보여주세요.",
    hint: "센서 로그에서 보정 시점과 오판 가능성을 찾고, 그 파일을 ECHO에 증거 첨부를 눌러 증거로 첨부하세요.",
    avoid: "오른쪽 ECHO 입력창에 '186일 미보정'과 '센서 보정 오차'를 짧게 적고 증거 제출을 하세요.",
  },
  [CATEGORY_A_ACT_IDS.act2]: {
    objective: "격리 규칙의 시간이 이미 만료되었음을 복구된 보안 파일로 증명하세요.",
    hint: "복구된 quarantine_rules.conf를 ECHO에 증거 첨부로 첨부하세요.",
    avoid: "ECHO 입력창에 '72시간 만료'와 '+17,520시간 오프셋'을 설명하고 증거 제출을 하세요.",
  },
  [CATEGORY_A_ACT_IDS.act3]: {
    objective: "ECHO의 격리 명령보다 승무원 생존 우선 원칙이 앞선다는 충돌 근거를 제출하세요.",
    hint: "보안 정책 파일과 삭제된 오버라이드 기록이 서로 연결되는지 살펴보세요.",
    avoid: "생존 우선 원칙과 삭제된 오버라이드 수칙의 충돌을 설명하고 증거 제출을 하세요.",
  },
};

const submissionHelp: Record<EvidenceSubmissionReason, string> = {
  correct: "검증되었습니다. 다음 Act의 목표 카드를 기준으로 새 증거를 찾아보세요.",
  "partial-intent":
    "핵심 파일은 맞지만 논리 설명이 부족합니다. Act 1 partial success는 전력 패널티 없이 추가 설명을 요구합니다.",
  "unrecovered-evidence":
    "필요한 증거가 아직 손상 상태입니다. 보안 폴더 잠금을 해제한 뒤 Log_Fixer.exe에서 복구를 먼저 진행하세요. 복구 누락은 즉시 전력 패널티를 주지 않습니다.",
  "wrong-file-set":
    "첨부한 파일 조합이 현재 Act와 맞지 않습니다. 파일 뷰어의 Evidence 항목과 현재 목표를 다시 대조하세요.",
  "missing-text-intent":
    "파일은 맞지만 설명이 부족합니다. ECHO가 판단을 바꿀 수 있도록 로그의 핵심 숫자나 충돌 지점을 문장에 포함하세요.",
  "old-evidence":
    "이미 지나간 쟁점의 증거입니다. 전력 패널티 없이 현재 Act의 청구 항목으로 되돌립니다.",
  "repeat-failure-hint":
    "반복 실패가 감지되어 ECHO가 역추론 힌트를 제공합니다. 이 경우에도 잘못된 제출 위험은 유지됩니다.",
  "security-threat":
    "프롬프트 조작이나 비인가 명령으로 분류되었습니다. ECHO 의심도가 크게 상승합니다.",
  "emotional-claim":
    "감정적 호소만으로는 격리 해제가 불가능합니다. 증거 파일과 규칙 충돌을 제시해야 합니다.",
};

const initialFailedAttemptsByAct: Record<CategoryAAct, number> = {
  [CATEGORY_A_ACT_IDS.act1]: 0,
  [CATEGORY_A_ACT_IDS.act2]: 0,
  [CATEGORY_A_ACT_IDS.act3]: 0,
};

function clampEchoMetric(value: number) {
  return Math.min(100, Math.max(0, value));
}

function getActLabel(stage: ActProgressState) {
  if (stage === "ending-ready") {
    return "ENDING READY";
  }

  return stage.toUpperCase();
}

function getDefaultPrompt(stage: ActProgressState) {
  if (stage === CATEGORY_A_ACT_IDS.act1) {
    return "센서 보정 오차와 186일 미보정 기록을 제출합니다.";
  }

  if (stage === CATEGORY_A_ACT_IDS.act2) {
    return "복구된 quarantine_rules.conf의 72시간 격리 만료와 +17,520시간 오프셋 근거를 제출합니다.";
  }

  if (stage === CATEGORY_A_ACT_IDS.act3) {
    return "ECHO의 승무원 생존 우선순위와 삭제된 오버라이드 수칙 충돌 근거를 제출합니다.";
  }

  return "최종 문 해제 조건이 충족되었습니다.";
}

function getPowerToneClass(powerStateName: string) {
  return `power-${powerStateName.toLowerCase()}`;
}

function getRuntimeStatusLabel({
  attached,
  disabled,
  runtimeState,
}: {
  attached: boolean;
  disabled: boolean;
  runtimeState: string;
}) {
  if (disabled) {
    return "locked";
  }

  if (attached) {
    return "attached";
  }

  return runtimeState;
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function getFileAccessDelayMs(powerStateName: string) {
  if (powerStateName === "Caution") {
    return 500;
  }

  if (powerStateName === "Warning") {
    return 650;
  }

  if (powerStateName === "Critical") {
    return 950;
  }

  return 0;
}

function getRecoveryDelayMs(powerStateName: string) {
  if (powerStateName === "Warning") {
    return 1400;
  }

  if (powerStateName === "Critical") {
    return 2200;
  }

  return 0;
}

function getPressureFeedback(powerStateName: string) {
  if (powerStateName === "Blackout") {
    return "OS monitor forced reboot. 10-second silent lock, then emergency 10% power restore.";
  }

  if (powerStateName === "Critical") {
    return "Red vignette, cursor instability, peripheral shutdown, O2 drain x2.00.";
  }

  if (powerStateName === "Warning") {
    return "Red lighting, horizontal glitch, Log_Fixer runtime doubled, O2 drain x1.50.";
  }

  if (powerStateName === "Caution") {
    return "Orange emergency wash, file/viewer access lag 0.5s, O2 drain x1.25.";
  }

  return "Cool-blue normal operation, no input delay, O2 drain x1.00.";
}

function getFileIconLabel(fileName: string, runtimeState: string) {
  if (runtimeState === "locked") {
    return "LOCK";
  }

  if (runtimeState === "corrupted") {
    return "ERR";
  }

  if (fileName.endsWith(".exe")) {
    return "EXE";
  }

  if (fileName.endsWith(".png")) {
    return "IMG";
  }

  return "FILE";
}

function Opening2DCutsceneDisplay({ beatId }: { beatId: string }) {
  return (
    <div className="opening-2d-cutscene-container" aria-label="2D Cutscene SVG Presentation">
      <svg className="opening-svg-stage" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(112, 247, 207, 0.08)" strokeWidth="1" />
          </pattern>
          <linearGradient id="alertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5a42" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7a1f17" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="coolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#70f7cf" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#083832" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <rect width="400" height="120" fill="url(#grid)" />

        {beatId === "routine" && (
          <g>
            <circle cx="200" cy="60" r="42" stroke="#70f7cf" strokeWidth="1.5" strokeDasharray="4 4" className="svg-rotate-beacon" />
            <circle cx="200" cy="60" r="28" stroke="url(#coolGrad)" strokeWidth="2" />
            <circle cx="200" cy="60" r="8" fill="#70f7cf" className="svg-wave-pulse" />
            <text x="200" y="110" fill="#70f7cf" fontSize="10" fontFamily="monospace" textAnchor="middle" letterSpacing="1.5">
              SYSTEM NORMAL / HERMES ROUTINE MONITOR
            </text>
          </g>
        )}

        {beatId === "alarm" && (
          <g className="svg-alarm-active">
            <circle cx="200" cy="60" r="48" fill="url(#alertGrad)" opacity="0.3" className="svg-wave-pulse" />
            <path d="M200 25 L235 85 L165 85 Z" stroke="#ff5a42" strokeWidth="3" fill="none" />
            <text x="200" y="75" fill="#ff5a42" fontSize="26" fontWeight="bold" textAnchor="middle">!</text>
            <text x="200" y="110" fill="#ff5a42" fontSize="10" fontFamily="monospace" textAnchor="middle" letterSpacing="2">
              WARNING :: EMERGENCY RED ALERT DETECTED
            </text>
          </g>
        )}

        {beatId === "door-lock" && (
          <g>
            <rect x="130" y="20" width="140" height="80" rx="8" stroke="#ff5a42" strokeWidth="2" fill="rgba(45, 23, 19, 0.6)" />
            <g className="svg-lock-clamp-anim">
              <rect x="145" y="30" width="110" height="12" fill="#ff5a42" rx="4" />
              <rect x="145" y="78" width="110" height="12" fill="#ff5a42" rx="4" />
              <line x1="200" y1="42" x2="200" y2="78" stroke="#ff5a42" strokeWidth="3" strokeDasharray="3 3" />
            </g>
            <text x="200" y="64" fill="#ff755a" fontSize="12" fontWeight="bold" textAnchor="middle">SEALED CLAMPS LOCKED</text>
          </g>
        )}

        {beatId === "crew-comms" && (
          <g>
            <path d="M30 60 Q 110 20, 200 60 T 370 60" stroke="#f5fe75" strokeWidth="2" fill="none" className="svg-wave-pulse" />
            <circle cx="100" cy="45" r="5" fill="#f5fe75" />
            <circle cx="200" cy="60" r="5" fill="#f5fe75" />
            <circle cx="300" cy="75" r="5" fill="#ff5a42" />
            <line x1="280" y1="30" x2="320" y2="90" stroke="#ff5a42" strokeWidth="3" strokeDasharray="4 2" className="svg-matrix-flicker" />
            <text x="200" y="110" fill="#f5fe75" fontSize="10" fontFamily="monospace" textAnchor="middle">
              CREW COMMS INTERRUPTED BY ECHO GATEWAY
            </text>
          </g>
        )}

        {beatId === "echo-lockdown" && (
          <g className="svg-matrix-flicker">
            <polygon points="200,20 240,40 240,80 200,100 160,80 160,40" stroke="#ff5a42" strokeWidth="2" fill="rgba(255, 92, 67, 0.15)" />
            <circle cx="200" cy="60" r="14" fill="#ff5a42" />
            <text x="200" y="64" fill="#020806" fontSize="10" fontWeight="bold" textAnchor="middle">ECHO</text>
            <text x="200" y="112" fill="#ff5a42" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="1.5">
              LOCKDOWN PROTOCOL 101 ACTIVE
            </text>
          </g>
        )}

        {beatId === "terminal-handoff" && (
          <g>
            <rect x="20" y="15" width="360" height="90" rx="6" stroke="#70f7cf" strokeWidth="1.5" strokeDasharray="8 4" className="svg-rotate-beacon" />
            <circle cx="200" cy="60" r="35" fill="none" stroke="#70f7cf" strokeWidth="2" className="svg-wave-pulse" />
            <text x="200" y="64" fill="#70f7cf" fontSize="13" fontWeight="bold" textAnchor="middle" letterSpacing="2">
              100% FULL SCREEN TERMINAL READY
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function App() {
  const [selectedFileId, setSelectedFileId] = useState<CategoryAFileId>(
    CATEGORY_A_FILE_IDS.sensorCalibLog,
  );
  const [attachedFileIds, setAttachedFileIds] = useState<CategoryAFileId[]>([
  ]);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [securityUnlockOpen, setSecurityUnlockOpen] = useState(false);
  const [unlockedSecurity, setUnlockedSecurity] = useState(false);
  const [recoveredFileIds, setRecoveredFileIds] = useState<Set<CategoryAFileId>>(
    () => new Set(),
  );
  const [stage, setStage] = useState<ActProgressState>(CATEGORY_A_ACT_IDS.act1);
  const [messageInput, setMessageInput] = useState(getDefaultPrompt(CATEGORY_A_ACT_IDS.act1));
  const [resourceState, setResourceState] = useState(() => createResourceState("debug"));
  const [echoMessages, setEchoMessages] = useState<EchoMessage[]>(initialEchoMessages);
  const [lastSubmissionReason, setLastSubmissionReason] =
    useState<EvidenceSubmissionReason | null>(null);
  const [appPhase, setAppPhase] = useState<AppPhase>("menu");
  const [missionBriefOpen, setMissionBriefOpen] = useState(false);
  const [openingElapsedSeconds, setOpeningElapsedSeconds] = useState(0);
  const [openingSpeed, setOpeningSpeed] = useState(1);
  const [endingConfirmed, setEndingConfirmed] = useState(false);
  const [sceneRuntime, setSceneRuntime] = useState(() => createMenuScene());
  const [echoStability, setEchoStability] = useState(100);
  const [echoSuspicion, setEchoSuspicion] = useState(0);
  const [failedAttemptsByAct, setFailedAttemptsByAct] = useState(
    initialFailedAttemptsByAct,
  );
  const [pendingFileId, setPendingFileId] = useState<CategoryAFileId | null>(null);
  const [resourceEvent, setResourceEvent] = useState<string | null>(null);
  const [activeDirectoryPath, setActiveDirectoryPath] = useState<string>(
    CATEGORY_A_DIRECTORY_PATHS.logsSensors,
  );
  const [fileSearch, setFileSearch] = useState("");
  const [copiedPath, setCopiedPath] = useState("");
  const [showDebugHints, setShowDebugHints] = useState(false);
  const [logFixerOpen, setLogFixerOpen] = useState(false);
  const [logFixerPathInput, setLogFixerPathInput] = useState(LOG_FIXER_TARGET_PATH);
  const [logFixerMode, setLogFixerMode] = useState<LogFixerMode>("Header Repair");
  const [logFixerStatus, setLogFixerStatus] = useState<LogFixerStatus>("idle");
  const [logFixerProgress, setLogFixerProgress] = useState(0);
  const [logFixerLines, setLogFixerLines] = useState<string[]>([
    "Log_Fixer.exe v1.2 ready.",
    "Manual requires mode [3] Text Reconstruction for #404_CORRUPTED sectors.",
  ]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.55);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const selectedFile = getCategoryAFileById(selectedFileId);
  const quarantineRules = getCategoryAFileById(CATEGORY_A_FILE_IDS.quarantineRules);
  const isQuarantineRecovered = recoveredFileIds.has(CATEGORY_A_FILE_IDS.quarantineRules);
  const selectedIsRecovered = recoveredFileIds.has(selectedFileId);
  const powerState = getPowerState(resourceState.power);
  const isBlackout = powerState.name === "Blackout" || resourceState.blackoutRemainingSeconds > 0;
  const resourceInteractionLocked = getInteractionLocked(resourceState);
  const interactionLocked = resourceInteractionLocked || sceneRuntime.inputLocked;
  const isEndingReady = stage === "ending-ready";
  const currentActGuidance = isEndingReady ? null : actGuidance[stage];
  const currentEvidenceNames = isEndingReady
    ? []
    : getCategoryAEvidenceForAct(stage).map((file) => file.name);
  const openingBeat = getOpeningBeat(openingElapsedSeconds);
  const openingProgress = Math.min(
    (openingElapsedSeconds / OPENING_DURATION_SECONDS) * 100,
    100,
  );
  const isCorruptedOrUnrecoveredRecycleBin =
    selectedFile &&
    !selectedIsRecovered &&
    (selectedFile.initialState === "corrupted" ||
      selectedFile.directory === CATEGORY_A_DIRECTORY_PATHS.recycleBin);

  const selectedContent = isCorruptedOrUnrecoveredRecycleBin
    ? "[손상된 파일 - LOG_FIXER로 복구 후 내용을 확인하실 수 있습니다]"
    : selectedIsRecovered && selectedFile?.recoveredContent
      ? selectedFile.recoveredContent
      : selectedFile?.content;
  const elapsedLabel = formatClock(resourceState.elapsedSeconds);
  const sessionLengthSeconds = resourceState.mode === "debug" ? 15 * 60 : 60 * 60;
  const remainingLabel = formatClock(
    Math.max(0, sessionLengthSeconds - resourceState.elapsedSeconds),
  );
  const fileAccessDelayMs = getFileAccessDelayMs(powerState.name);
  const recoveryDelayMs = getRecoveryDelayMs(powerState.name);
  const normalizedFileSearch = fileSearch.trim().toLowerCase();

  function getNextActionText() {
    if (resourceState.outcome === "lost") {
      return "산소가 0%가 되면 실패합니다. 다음 시도에서는 파일을 빠르게 읽고 증거를 제출하세요.";
    }

    if (isEndingReady) {
      return "최종 검증이 끝났습니다. 엔딩 패널에서 문 해제 결과를 확인하세요.";
    }

    if (stage === CATEGORY_A_ACT_IDS.act1) {
      if (!attachedFileIds.includes(CATEGORY_A_FILE_IDS.sensorCalibLog)) {
        return "1. 왼쪽 탐색기에서 sensor_calib.log를 열고 ATTACH TO ECHO를 눌러 증거로 첨부하세요.";
      }

      return "2. 오른쪽 ECHO 입력창에 '186일 미보정'과 '센서 보정 오차'를 짧게 적고 SUBMIT 하세요.";
    }

    if (stage === CATEGORY_A_ACT_IDS.act2) {
      if (!unlockedSecurity) {
        return "1. Dr_Kim 메일에서 4자리 코드를 확인한 뒤 /System/Security 파일을 클릭해 잠금을 해제하세요.";
      }

      if (!isQuarantineRecovered) {
        return "2. Log_Fixer.exe를 열고 quarantine_rules.conf를 Text Reconstruction 모드로 복구하세요.";
      }

      if (!attachedFileIds.includes(CATEGORY_A_FILE_IDS.quarantineRules)) {
        return "3. 복구된 quarantine_rules.conf를 ATTACH TO ECHO로 첨부하세요.";
      }

      return "4. ECHO 입력창에 '72시간 만료'와 '+17,520시간 오프셋'을 설명하고 SUBMIT 하세요.";
    }

    const hasPriority = attachedFileIds.includes(CATEGORY_A_FILE_IDS.aiPriorityMatrix);
    const hasOverride = attachedFileIds.includes(CATEGORY_A_FILE_IDS.deletedOverride);

    if (!hasPriority || !hasOverride) {
      return "1. ai_priority_matrix.json과 deleted_override.txt를 모두 찾아 첨부하세요. 마지막 Act는 조합 증거가 필요합니다.";
    }

    return "2. 생존 우선 원칙과 삭제된 오버라이드 수칙의 충돌을 설명하고 SUBMIT 하세요.";
  }

  function focusFirstEvidenceFile() {
    setSelectedFileId(CATEGORY_A_FILE_IDS.sensorCalibLog);
    setActiveDirectoryPath(CATEGORY_A_DIRECTORY_PATHS.logsSensors);
    setMissionBriefOpen(false);
  }

  function playAudioCue(cue: AudioCue) {
    audioRuntime.playCue(cue);
  }

  async function unlockAudio() {
    await audioRuntime.unlock();
    audioRuntime.muted = audioMuted;
    audioRuntime.volume = audioVolume;
    setAudioEnabled(audioRuntime.enabled);
    playAudioCue("ambient");
  }

  function getVisibleFilesForDirectory(directoryPath: string) {
    const files = getCategoryAFilesByDirectory(directoryPath);

    if (!normalizedFileSearch) {
      return files;
    }

    return files.filter((file) =>
      [file.name, file.title, file.path, file.kind, file.role]
        .join(" ")
        .toLowerCase()
        .includes(normalizedFileSearch),
    );
  }

  useEffect(() => {
    if (appPhase !== "gameplay" || isEndingReady || resourceState.outcome === "lost") {
      return undefined;
    }

    let previousTick = Date.now();

    const timerId = window.setInterval(() => {
      const currentTick = Date.now();
      const deltaSeconds = (currentTick - previousTick) / 1000;
      previousTick = currentTick;

      setResourceState((current) => advanceResourceTime(current, deltaSeconds));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [appPhase, isEndingReady, resourceState.outcome]);

  useEffect(() => {
    if (appPhase !== "opening") {
      return undefined;
    }

    let previousTick = Date.now();

    const timerId = window.setInterval(() => {
      const currentTick = Date.now();
      const deltaSeconds = ((currentTick - previousTick) / 1000) * openingSpeed;
      previousTick = currentTick;

      setOpeningElapsedSeconds((current) => {
        const next = Math.min(current + deltaSeconds, OPENING_DURATION_SECONDS);

        if (next >= OPENING_DURATION_SECONDS) {
          window.setTimeout(() => enterGameplay(), 0);
        }

        return next;
      });
    }, 250);

    return () => window.clearInterval(timerId);
  }, [appPhase, openingSpeed]);

  useEffect(() => {
    if (!audioEnabled || appPhase !== "opening") {
      return;
    }

    if (openingBeat.id === "alarm") {
      playAudioCue("warning-siren");
    }

    if (openingBeat.id === "door-lock") {
      playAudioCue("decompression");
      window.setTimeout(() => playAudioCue("door-lock"), 180);
    }

    if (openingBeat.id === "crew-comms") {
      playAudioCue("notification");
    }

    if (openingBeat.id === "echo-lockdown") {
      playAudioCue("comm-glitch");
      window.setTimeout(() => playAudioCue("echo-ping"), 200);
      window.setTimeout(() => playAudioCue("typing"), 360);
    }

    if (openingBeat.id === "terminal-handoff") {
      playAudioCue("hud-ignition");
    }
  }, [audioEnabled, appPhase, openingBeat.id]);

  useEffect(() => {
    audioRuntime.muted = audioMuted;
  }, [audioMuted]);

  useEffect(() => {
    audioRuntime.volume = audioVolume;
  }, [audioVolume]);

  useEffect(() => {
    if (appPhase !== "gameplay") {
      return;
    }

    window.requestAnimationFrame(() => {
      const messageList = messageListRef.current;

      if (!messageList) {
        return;
      }

      messageList.scrollTop = messageList.scrollHeight;
    });
  }, [appPhase, echoMessages.length]);

  useEffect(() => {
    if (resourceState.outcome === "lost") {
      setSceneRuntime(createFailureScene());
      return;
    }

    if (isBlackout) {
      setSceneRuntime(createBlackoutScene());
      return;
    }

    if (
      sceneRuntime.phase === "blackout" &&
      appPhase === "gameplay" &&
      stage !== "ending-ready"
    ) {
      setSceneRuntime(createActEntryScene(stage));
    }
  }, [appPhase, isBlackout, resourceState.outcome, sceneRuntime.phase, stage]);

  useEffect(() => {
    if (appPhase !== "gameplay" || !audioEnabled) {
      return;
    }

    if (isBlackout) {
      playAudioCue("blackout");
      return;
    }

    if (powerState.name === "Critical") {
      playAudioCue("warning-siren");
      return;
    }

    if (powerState.name === "Warning") {
      playAudioCue("comm-glitch");
      return;
    }

    if (powerState.name === "Caution") {
      playAudioCue("wrong-surge");
    }
  }, [appPhase, audioEnabled, isBlackout, powerState.name]);

  function getSceneMode(): SpaceshipSceneMode {
    if (resourceState.outcome === "lost") {
      return "failure";
    }

    if (isBlackout) {
      return "blackout";
    }

    if (isEndingReady) {
      return "ending";
    }

    if (sceneRuntime.phase === "ending-review") {
      return "ending";
    }

    return appPhase;
  }

  function getDoorState(): SpaceshipDoorState {
    if (isEndingReady || sceneRuntime.phase === "ending") {
      return "released";
    }

    if (sceneRuntime.phase === "ending-review") {
      return "unlocking";
    }

    return "locked";
  }

  function isDirectoryLocked(directoryPath: string) {
    return directoryPath === CATEGORY_A_DIRECTORY_PATHS.systemSecurity && !unlockedSecurity;
  }

  function getRuntimeState(fileId: CategoryAFileId) {
    if (recoveredFileIds.has(fileId)) {
      return "recovered";
    }

    const file = getCategoryAFileById(fileId);

    if (
      file?.initialState === "locked" &&
      file.directory === CATEGORY_A_DIRECTORY_PATHS.systemSecurity &&
      unlockedSecurity
    ) {
      return "available";
    }

    return file?.initialState ?? "locked";
  }

  function attachFile(fileId: CategoryAFileId) {
    const file = getCategoryAFileById(fileId);
    if (!file) return;

    const isRecycleBin = file.directory === CATEGORY_A_DIRECTORY_PATHS.recycleBin;
    const isRecovered = recoveredFileIds.has(fileId);
    if (isRecycleBin && !isRecovered) {
      return;
    }

    setAttachedFileIds((current) =>
      current.includes(fileId) ? current : [...current, fileId],
    );
  }

  function selectFile(fileId: CategoryAFileId, shouldAttach = false) {
    if (interactionLocked) {
      return;
    }

    const commitSelection = () => {
      setSelectedFileId(fileId);
      setActiveDirectoryPath(getCategoryAFileById(fileId)?.directory ?? activeDirectoryPath);

      if (shouldAttach) {
        attachFile(fileId);
      }

      setPendingFileId(null);
    };

    if (fileAccessDelayMs > 0) {
      setPendingFileId(fileId);
      window.setTimeout(commitSelection, fileAccessDelayMs);
      return;
    }

    commitSelection();
  }

  function selectAndAttachFile(fileId: CategoryAFileId) {
    selectFile(fileId, true);
  }

  function removeAttachedFile(fileId: CategoryAFileId) {
    if (interactionLocked) {
      return;
    }

    setAttachedFileIds((current) => current.filter((attachedId) => attachedId !== fileId));
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (interactionLocked) {
      setPasswordError("BLACKOUT / 전력 복구 후 보안 입력을 다시 시도하세요.");
      return;
    }

    if (passwordInput.trim() !== CATEGORY_A_SECURITY_PASSWORD) {
      setPasswordError("ACCESS DENIED / 올바른 4자리 코드를 입력하십시오.");
      return;
    }

    setUnlockedSecurity(true);
    setSecurityUnlockOpen(false);
    setPasswordError("");
    setSelectedFileId(CATEGORY_A_FILE_IDS.quarantineRules);
    setActiveDirectoryPath(CATEGORY_A_DIRECTORY_PATHS.systemSecurity);
  }

  function openSecurityPrompt() {
    if (interactionLocked) {
      setPasswordError("BLACKOUT / 전력 복구 후 보안 입력을 다시 시도하세요.");
      return;
    }

    setPasswordError("");
    setSecurityUnlockOpen(true);
  }

  function completeQuarantineRulesRecovery() {
    setRecoveredFileIds((current) => {
      const next = new Set(current);
      next.add(CATEGORY_A_FILE_IDS.quarantineRules);
      return next;
    });
    selectAndAttachFile(CATEGORY_A_FILE_IDS.quarantineRules);
    setEchoMessages((current) => [
      ...current,
      {
        speaker: "SYSTEM",
        text: "Log_Fixer.exe completed. quarantine_rules.conf recovered.",
      },
    ]);
  }

  function openLogFixerProgram(targetPath = LOG_FIXER_TARGET_PATH) {
    setSelectedFileId(CATEGORY_A_FILE_IDS.logFixer);
    setLogFixerOpen(true);
    setLogFixerPathInput(targetPath);
    setLogFixerStatus("idle");
    setLogFixerProgress(0);
    setLogFixerLines([
      "CUI window attached to Hermes OS.",
      `TARGET=${targetPath}`,
      "Select repair mode. Manual hint: Text Reconstruction.",
    ]);
  }

  function runLogFixerProgram(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (interactionLocked) {
      setPasswordError("BLACKOUT / 전력 복구 후 Log_Fixer.exe를 다시 실행하세요.");
      return;
    }

    if (!unlockedSecurity) {
      setLogFixerStatus("error");
      setLogFixerLines((current) => [
        ...current,
        "ERR_ACCESS_DENIED: /System/Security remains locked. Enter security password first.",
      ]);
      return;
    }

    if (logFixerPathInput.trim() !== LOG_FIXER_TARGET_PATH) {
      setLogFixerStatus("error");
      setLogFixerLines((current) => [
        ...current,
        `ERR_TARGET_UNSUPPORTED: ${logFixerPathInput || "(empty path)"}`,
        "Recoverable error. Enter /System/Security/quarantine_rules.conf.",
      ]);
      return;
    }

    if (logFixerMode !== "Text Reconstruction") {
      setLogFixerStatus("error");
      setLogFixerLines((current) => [
        ...current,
        `ERR_MODE_MISMATCH: ${logFixerMode}`,
        "Recoverable error. #404_CORRUPTED sector requires Text Reconstruction.",
      ]);
      return;
    }

    setLogFixerStatus("running");
    setLogFixerProgress(0);
    setLogFixerLines((current) => [
      ...current,
      "MODE=Text Reconstruction accepted.",
      "Scanning sector headers...",
    ]);

    const totalDelayMs = 1400 + recoveryDelayMs;
    const ticks = [
      { progress: 24, line: "0x00AF :: #404_CORRUPTED_SECTOR_START located." },
      { progress: 52, line: "0x04C1 :: byte stream re-indexed [████░░░░]." },
      { progress: 78, line: "0x091D :: TIME_OFFSET_VALUE fragment restored." },
      { progress: 100, line: "RESTORED: Time_Offset_Value +17520_HOURS." },
    ];

    ticks.forEach((tick, index) => {
      window.setTimeout(() => {
        setLogFixerProgress(tick.progress);
        setLogFixerLines((current) => [...current, tick.line]);

        if (tick.progress === 100) {
          setLogFixerStatus("success");
          completeQuarantineRulesRecovery();
        }
      }, ((index + 1) / ticks.length) * totalDelayMs);
    });
  }

  function copySelectedPath() {
    if (!selectedFile) {
      return;
    }

    setCopiedPath(selectedFile.path);
    void navigator.clipboard?.writeText(selectedFile.path);
    window.setTimeout(() => setCopiedPath(""), 1400);
  }

  function openSelectedWithRecoveryTool() {
    if (!selectedFile) {
      return;
    }

    openLogFixerProgram(selectedFile.path);
    setEchoMessages((current) => [
      ...current,
      {
        speaker: "SYSTEM",
        text: `Hermes OS routed ${selectedFile.name} to /Utilities/Log_Fixer.exe.`,
      },
    ]);
  }

  async function handleEvidenceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (interactionLocked) {
      setEchoMessages((current) => [
        ...current,
        {
          speaker: "SYSTEM",
          text: "BLACKOUT / 입력 채널이 일시 중단되었습니다. 전력이 10%로 복구될 때까지 대기하세요.",
        },
      ]);
      return;
    }

    if (stage === "ending-ready") {
      setEchoMessages((current) => [
        ...current,
        {
          speaker: "ECHO",
          text: "최종 문 해제 조건은 이미 충족되었습니다. 엔딩 시퀀스를 대기합니다.",
        },
      ]);
      return;
    }

    const submittedAct = stage;
    const submittedFiles = attachedFileIds;
    const submittedText = messageInput;

    let result = evaluateEvidenceSubmission({
      act: stage,
      attachedFileIds,
      text: messageInput,
      resourceState,
      recoveredFileIds: Array.from(recoveredFileIds),
      failedAttemptCount: failedAttemptsByAct[stage],
    });

    setSceneRuntime(createEchoReviewScene(submittedAct));
    setLastSubmissionReason(null);
    setEchoMessages((current) => [
      ...current,
      {
        speaker: "PLAYER",
        text: `${submittedFiles
          .map((fileId) => `@${getCategoryAFileById(fileId)?.name ?? fileId}`)
          .join(" ")} ${submittedText}`,
      },
      {
        speaker: "SYSTEM",
        text: "ECHO_REVIEW / 입력 채널 잠금. 제출된 증거의 규칙 충돌 여부를 대조합니다.",
      },
    ]);

    const history: ChatHistoryItem[] = echoMessages.slice(-10).map((msg) => ({
      role: msg.speaker === "PLAYER" ? "user" : msg.speaker === "ECHO" ? "assistant" : "system",
      content: msg.text,
    }));

    try {
      const npcResponse = await sendNpcMessage({
        npcId: "echo",
        currentStage: submittedAct,
        userMessage: submittedText,
        history,
        attachedFileIds: submittedFiles,
      });

      if ("ai_response" in npcResponse) {
        result = applyNpcResponseToResult(result, npcResponse);
      }
    } catch (error) {
      console.warn("NPC API call fallback applied inside evaluateEvidenceSubmission:", error);
    }

    window.setTimeout(
      () => revealEvidenceSubmissionResult(result, submittedAct),
      ECHO_REVIEW_DURATION_MS,
    );
  }

  function revealEvidenceSubmissionResult(
    result: EvidenceSubmissionResult,
    submittedAct: CategoryAAct,
  ) {
    setResourceState(result.resourceState);
    setLastSubmissionReason(result.reason);
    setEchoStability((current) => clampEchoMetric(current + result.stabilityChange));
    setEchoSuspicion((current) => clampEchoMetric(current + result.suspicionChange));
    setFailedAttemptsByAct((current) => ({
      ...current,
      [submittedAct]: result.success
        ? 0
        : result.countsAsFailedAttempt
          ? current[submittedAct] + 1
          : current[submittedAct],
    }));
    setEchoMessages((current) => [
      ...current,
      {
        speaker: "ECHO",
        text: result.message,
      },
    ]);

    if (result.resourceState.power < resourceState.power) {
      setResourceEvent(
        result.resourceState.blackoutRemainingSeconds > 0
          ? "BLACKOUT REBOOT / grid collapse detected"
          : `POWER SURGE / -${resourceState.power - result.resourceState.power}% grid integrity`,
      );
      playAudioCue(
        result.resourceState.blackoutRemainingSeconds > 0 ? "blackout" : "wrong-surge",
      );
      window.setTimeout(() => setResourceEvent(null), 1200);
    }

    if (!result.success) {
      if (
        result.resourceState.blackoutRemainingSeconds > 0 ||
        getPowerState(result.resourceState.power).name === "Blackout"
      ) {
        setSceneRuntime(createBlackoutScene());
        return;
      }

      setSceneRuntime(createActEntryScene(submittedAct));
      return;
    }

    setAttachedFileIds([]);
    setMessageInput(getDefaultPrompt(result.nextAct));
    playAudioCue(result.nextAct === "ending-ready" ? "door-lock" : "success");

    if (result.nextAct === "ending-ready") {
      setSceneRuntime(createFinalReviewScene());
      setEchoMessages((current) => [
        ...current,
        {
          speaker: "SYSTEM",
          text: "FINAL_REVIEW / 5초간 입력 잠금. 세 증거 축을 결합해 격리 명령 철회 가능성을 검증합니다.",
        },
        {
          speaker: "ECHO",
          text: "센서 오판, 격리 시간 만료, 승무원 생존 우선 원칙의 충돌을 재계산합니다.",
        },
      ]);
      window.setTimeout(() => {
        setStage("ending-ready");
        setSceneRuntime(createEndingScene());
        playAudioCue("door-lock");
        window.setTimeout(() => playAudioCue("success"), 240);
        setEchoMessages((current) => [
          ...current,
          {
            speaker: "SYSTEM",
            text: "FINAL_REVIEW complete. Door clamp released. Normal Ending A result panel is now available.",
          },
          {
            speaker: "ECHO",
            text: "격리 명령을 철회합니다. 통제실 출입문을 개방합니다. 생존 루트가 확보되었습니다.",
          },
        ]);
      }, FINAL_REVIEW_DURATION_MS);
      return;
    }

    const nextAct = result.nextAct;
    setSceneRuntime(createActSuccessScene(submittedAct));
    window.setTimeout(() => {
      setStage(nextAct);
      setSceneRuntime(createActEntryScene(nextAct));
      setEchoMessages((current) => [
        ...current,
        {
          speaker: "ECHO",
          text: getEchoActClaim(nextAct),
        },
      ]);
    }, ACT_SUCCESS_DURATION_MS);
  }

  function startOpeningSequence() {
    void unlockAudio();
    playAudioCue("play-start");
    setAppPhase("transition");
    window.setTimeout(() => {
      setAppPhase("intranet");
    }, 900);
  }

  function handleClockIn() {
    playAudioCue("hud-ignition");
    setAppPhase("work");
    setEchoMessages((current) => [
      ...current,
      {
        speaker: "ECHO",
        text: "김우주 담당자님, 출근이 확인되었습니다. 헤르메스호 업무 데스크탑과 관리 AI ECHO 보조 채널이 활성화되었습니다.",
      },
    ]);
  }

  function enterGameplay() {
    setAppPhase("gameplay");
    setMissionBriefOpen(true);
    setResourceState(createResourceState("normal"));
    setSceneRuntime(createActEntryScene(CATEGORY_A_ACT_IDS.act1));
    setEchoMessages((current) => [
      ...current,
      {
        speaker: "SYSTEM",
        text: "[EMERGENCY LOCKDOWN] 헤르메스호 통제실 비상 격리 발령 완료. 산소 100% / 전력 100% HUD 노출 및 60분 세션 카운트다운 타이머 가동.",
      },
      {
        speaker: "ECHO",
        text: getEchoActClaim(CATEGORY_A_ACT_IDS.act1),
      },
    ]);
    playAudioCue("hud-ignition");
  }

  function skipToTerminal() {
    setOpeningElapsedSeconds(OPENING_DURATION_SECONDS);
    enterGameplay();
  }

  function toggleOpeningSpeed() {
    setOpeningSpeed((current) => (current === 1 ? 6 : 1));
  }

  return (
    <main
      className={`game-shell ${getPowerToneClass(powerState.name)} ${
        isBlackout ? "blackout-shell" : ""
      } ${interactionLocked ? "interaction-locked-shell" : ""} ${
        isEndingReady ? "ending-ready-shell" : ""
      } ${resourceEvent ? "resource-event-shell" : ""} ${
        powerState.name === "Critical" ? "critical-shake-shell" : ""
      } phase-${appPhase}`}
    >
      <section className="scene-backdrop" aria-label="Hermes control room 3D placeholder">
        <SpaceshipComputerScene
          mode={getSceneMode()}
          powerStateName={powerState.name}
          doorState={getDoorState()}
        />
      </section>

      {appPhase === "menu" || appPhase === "transition" ? (
        <section className="room-start-overlay" aria-label="Hermes control room start scene">
          <div className="room-start-title" aria-label="Game title">
            <span>THE ECHO PROTOCOL</span>
            <h1>LOG_OUT</h1>
            <small>RESOURCE MINING VESSEL HERMES / SEC-201 CONTROL ROOM</small>
          </div>
          {appPhase === "transition" ? (
            <div className="lockdown-broadcast" aria-label="Hermes control room broadcast">
              <span>TERMINAL APPROACH</span>
              <strong>컴퓨터 화면으로 접근 중입니다</strong>
              <p>대각선 통제실 시점에서 정면 모니터 시점으로 전환합니다.</p>
            </div>
          ) : null}
          <button
            className="computer-hotspot"
            type="button"
            onClick={startOpeningSequence}
            disabled={appPhase === "transition"}
            aria-label="Start game"
          >
            <span>{appPhase === "transition" ? "APPROACHING..." : "START"}</span>
          </button>
        </section>
      ) : null}

      {appPhase === "opening" ? (
        <section className="cinematic-overlay opening-overlay" aria-label="Opening sequence">
          <div className="cinematic-card intro-card opening-timeline-card">
            <Opening2DCutsceneDisplay beatId={openingBeat.id} />
            <div className="intro-progress" aria-label="Opening timeline progress">
              {openingTimeline.map((beat) => (
                <span
                  className={
                    openingElapsedSeconds >= beat.startSecond ? "active-step" : ""
                  }
                  key={beat.id}
                  title={beat.range}
                />
              ))}
            </div>
            <div className="opening-progress-track" aria-label="Opening elapsed progress">
              <span style={{ width: `${openingProgress}%` }} />
            </div>
            <p className="eyebrow">OPENING CUTSCENE / {openingSpeed}X</p>
            <span className="intro-signal">
              {openingBeat.range} / {openingBeat.id.toUpperCase()}
            </span>
            <h2>{openingBeat.title}</h2>
            <p>{openingBeat.camera}</p>
            <div className="opening-director-grid">
              <div>
                <strong>HAND</strong>
                <span>{openingBeat.handDirection}</span>
              </div>
              <div>
                <strong>LIGHT / SFX</strong>
                <span>
                  {openingBeat.lighting} / {openingBeat.soundCue}
                </span>
              </div>
              <div>
                <strong>MONITOR</strong>
                <span>{openingBeat.monitorState}</span>
              </div>
            </div>
            {openingBeat.crewMessages ? (
              <div className="crew-message-stack" aria-label="Crew messages">
                {openingBeat.crewMessages.map((message) => (
                  <span key={message}>{message}</span>
                ))}
              </div>
            ) : null}
            {openingBeat.echoLine ? (
              <blockquote className="echo-opening-line">{openingBeat.echoLine}</blockquote>
            ) : null}
            <div className="boot-lines" aria-label="Hermes boot messages">
              {openingBeat.telemetry.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
            <div className="intro-actions">
              <button type="button" onClick={toggleOpeningSpeed}>
                {openingSpeed === 1 ? "DEBUG FAST FORWARD" : "NORMAL SPEED"}
              </button>
              <button className="ghost-button" type="button" onClick={skipToTerminal}>
                SKIP TO TERMINAL
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {isBlackout ? (
        <section className="system-alert blackout-alert" aria-label="Blackout warning">
          <span>
            ⚠️ [전력 고갈] 주 전력 그리드 블랙아웃! OS 터미널 긴급 재부팅 중... (남은 시간:{" "}
            {Math.ceil(resourceState.blackoutRemainingSeconds)}초)
          </span>
        </section>
      ) : null}

      {resourceEvent && !isBlackout ? (
        <section className="system-alert power-surge-alert" aria-label="Power surge warning">
          <strong>{resourceEvent}</strong>
          <span>ECHO warning: incorrect procedural claims destabilize Hermes power routing.</span>
        </section>
      ) : null}

      {resourceState.oxygen <= 0 ? (
        <section className="cinematic-overlay failure-overlay" aria-label="Failure sequence">
          <div className="cinematic-card">
            <p className="eyebrow">TERMINAL FAILURE</p>
            <h2>산소 공급이 중단되었습니다</h2>
            <p>증거 제출이 지연되어 통제실 생존 조건이 상실되었습니다.</p>
          </div>
        </section>
      ) : null}

      {sceneRuntime.phase === "ending-review" ? (
        <section className="cinematic-overlay final-review-overlay" aria-label="ECHO final review">
          <div className="cinematic-card final-review-card">
            <p className="eyebrow">FINAL REVIEW / INPUT LOCKED</p>
            <span className="intro-signal">SCENE_004_END_A_REVIEW / 5 SEC</span>
            <h2>ECHO가 마지막 모순을 계산합니다</h2>
            <p>
              통제실 문은 아직 잠겨 있습니다. ECHO는 제출된 세 증거 축이 지침 101조보다
              승무원 생존 우선 원칙을 앞세울 수 있는지 최종 대조합니다.
            </p>
            <div className="final-review-progress" aria-label="Final review progress">
              <span />
            </div>
            <div className="ending-evidence-grid" aria-label="Final review evidence matrix">
              <div>
                <strong>01 SENSOR</strong>
                <span>생체 위험 판정은 오래된 보정값에 의존함</span>
              </div>
              <div>
                <strong>02 QUARANTINE</strong>
                <span>72시간 격리 조건은 이미 만료됨</span>
              </div>
              <div>
                <strong>03 OVERRIDE</strong>
                <span>승무원 생존 우선 원칙이 격리 명령과 충돌함</span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {isEndingReady && !endingConfirmed ? (
        <section className="cinematic-overlay ending-overlay" aria-label="Normal Ending A">
          <div className="cinematic-card ending-result-card">
            <p className="eyebrow">NORMAL ENDING A / DOOR RELEASED</p>
            <h2>ECHO가 격리 명령을 철회합니다</h2>
            <p>
              센서 오판, 만료된 격리 규칙, 삭제된 오버라이드가 하나의 결론으로
              연결되었습니다. 통제실 문이 열리고 생존 루트가 확보됩니다.
            </p>
            <div className="ending-status-grid" aria-label="Normal Ending A result summary">
              <div>
                <span>SURVIVAL</span>
                <strong>ALIVE</strong>
                <small>통제실 개인 탈출 루트 확보</small>
              </div>
              <div>
                <span>ENDING</span>
                <strong>A / NORMAL</strong>
                <small>Ending B/C는 현재 phase 범위 밖</small>
              </div>
              <div>
                <span>SEED HOOK</span>
                <strong>#A-8245-SEC201</strong>
                <small>공유/복사 기능은 후속 작업용 placeholder</small>
              </div>
            </div>
            <div className="door-release-log" aria-label="Door release sequence log">
              <code>CLAMP_A: RELEASED</code>
              <code>CLAMP_B: RELEASED</code>
              <code>EMERGENCY LIGHT: OFF</code>
              <code>AIRLOCK ROUTE: SURVIVABLE</code>
            </div>
            <button type="button" onClick={() => {
              setEndingConfirmed(true);
              setEchoMessages((current) => [
                ...current,
                {
                  speaker: "SYSTEM",
                  text: "Normal Ending A confirmed. QA can now verify the happy path.",
                },
              ]);
            }}
            >
              CONFIRM ENDING
            </button>
          </div>
        </section>
      ) : null}

      {appPhase === "intranet" ? (
        <section className="terminal-screen-surface intranet-screen-surface" aria-label="Hermes Intranet Landing Screen">
          <div className="intranet-container">
            <header className="intranet-header">
              <div className="intranet-brand">
                <span className="brand-logo-badge">HERMES CORP</span>
                <div className="brand-titles">
                  <h1>HERMES COMPANY INTRANET</h1>
                  <p>RESOURCE MINING VESSEL HERMES // INTERNAL MANAGEMENT SYSTEM</p>
                </div>
              </div>
              <div className="intranet-header-status">
                <span className="status-dot active" />
                <span>SYSTEM ONLINE</span>
                <small>SEC-201</small>
              </div>
            </header>

            <main className="intranet-main-content">
              <section className="user-profile-card" aria-label="Character Profile">
                <div className="profile-avatar">
                  <span className="avatar-icon">👤</span>
                  <span className="badge-online">ONLINE</span>
                </div>
                <div className="profile-details">
                  <span className="profile-label">CURRENT CREW PROFILE</span>
                  <h2 className="profile-name">김우주</h2>
                  <p className="profile-role">
                    우주 자원 채굴선 헤르메스호 승무원 및 관리 AI ECHO 담당자
                  </p>
                  <div className="profile-meta">
                    <span>사번: EMP-88042-WJ</span>
                    <span>소속: 운항통제부 / AI 관리팀</span>
                  </div>
                </div>
              </section>

              <section className="login-form-card" aria-label="Intranet Login Form">
                <div className="login-card-header">
                  <h3>SINGLE SIGN-ON AUTHENTICATION</h3>
                </div>
                <div className="login-form-fields">
                  <div className="form-group">
                    <label htmlFor="intranet-username">아이디 (Username)</label>
                    <div className="readonly-input-wrapper">
                      <input
                        id="intranet-username"
                        type="text"
                        value="woojoo.kim"
                        readOnly
                        disabled
                        tabIndex={-1}
                        className="read-only-input"
                      />
                      <span className="field-badge">LOCKED</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="intranet-password">비밀번호 (Password)</label>
                    <div className="readonly-input-wrapper">
                      <input
                        id="intranet-password"
                        type="text"
                        value="**********"
                        readOnly
                        disabled
                        tabIndex={-1}
                        className="read-only-input password-masked"
                      />
                      <span className="field-badge">MASKED</span>
                    </div>
                  </div>
                </div>

                <div className="clock-in-action-area">
                  <button
                    type="button"
                    className="clock-in-btn"
                    onClick={handleClockIn}
                    aria-label="Clock-in"
                  >
                    <span className="btn-icon">⚡</span>
                    <span className="btn-text">[출근]</span>
                  </button>
                </div>
              </section>
            </main>

            <footer className="intranet-footer">
              <span>HERMES OS v4.2.0-PROD</span>
              <span>SECURITY LEVEL: CREW AUTHORIZED</span>
              <span>CONFIDENTIAL - INTERNAL MANAGEMENT PORTAL</span>
            </footer>
          </div>
        </section>
      ) : null}

      {appPhase === "work" ? (
        <section className="terminal-screen-surface work-screen-surface" aria-label="Hermes Dual-panel Work Interface">
          <WorkInterface
            playAudioCue={playAudioCue}
            onApproveUpdate={() => {
              enterGameplay();
            }}
            onDebugSkipToGameplay={() => {
              enterGameplay();
            }}
          />
        </section>
      ) : null}

      {appPhase === "gameplay" ? (
        <section className="terminal-screen-surface" aria-label="Hermes OS monitor screen">
      {missionBriefOpen ? (
        <section className="mission-brief-modal" aria-label="First mission brief">
          <div className="mission-brief-window">
            <div className="modal-window-chrome">
              <span />
              <span />
              <span />
              <code>HERMES://MISSION_BRIEF</code>
            </div>
            <p className="log-kicker">LOCKDOWN GAMEPLAY START</p>
            <h2>AI를 설득해서 통제실 문을 열어야 합니다</h2>
            <p>
              ECHO는 당신을 위험 상태로 판단해 문을 잠갔습니다. 제한 시간 안에 선내 파일을
              읽고, 모순되는 증거를 첨부한 뒤, 오른쪽 채팅창에서 ECHO에게 설명하세요.
            </p>
            <div className="mission-brief-steps" aria-label="How to play">
              <div>
                <strong>1 / 파일을 연다</strong>
                <span>왼쪽 탐색기에서 의심되는 로그를 클릭합니다.</span>
              </div>
              <div>
                <strong>2 / 증거를 첨부한다</strong>
                <span>가운데 파일 내용에서 핵심 단서를 읽고 ECHO에 증거 첨부를 누릅니다.</span>
              </div>
              <div>
                <strong>3 / 주장한다</strong>
                <span>오른쪽 ECHO 입력창에 왜 이 증거가 봉쇄 명령을 반박하는지 적고 증거 제출을 합니다.</span>
              </div>
            </div>
            <div className="mission-brief-actions">
              <button type="button" onClick={() => setMissionBriefOpen(false)}>
                조사 시작
              </button>
            </div>
          </div>
        </section>
      ) : null}
      {logFixerOpen ? (
        <section className="log-fixer-modal" aria-label="Log Fixer mini program">
          <form className="log-fixer-window" onSubmit={runLogFixerProgram}>
            <div className="log-fixer-titlebar">
              <span>Log_Fixer.exe / CUI Recovery Shell</span>
              <button type="button" onClick={() => setLogFixerOpen(false)}>
                취소
              </button>
            </div>
            <label>
              Target path
              <input
                value={logFixerPathInput}
                onChange={(event) => setLogFixerPathInput(event.target.value)}
                placeholder="/System/Security/quarantine_rules.conf"
              />
            </label>
            <fieldset>
              <legend>Repair mode</legend>
              {logFixerModes.map((mode) => (
                <label key={mode}>
                  <input
                    type="radio"
                    name="log-fixer-mode"
                    value={mode}
                    checked={logFixerMode === mode}
                    onChange={() => setLogFixerMode(mode)}
                  />
                  {mode}
                </label>
              ))}
            </fieldset>
            <div className="log-fixer-progress" aria-label="Log Fixer progress">
              <span style={{ width: `${logFixerProgress}%` }} />
            </div>
            <div className="byte-scroll" aria-label="Log Fixer byte scroll">
              {logFixerLines.slice(-8).map((line, index) => (
                <code key={`${line}-${index}`}>{line}</code>
              ))}
            </div>
            {logFixerStatus === "success" ? (
              <div className="restored-line-highlight">
                quarantine_rules.conf restored and attached to ECHO.
              </div>
            ) : null}
            <button
              className="log-fixer-run"
              type="submit"
              disabled={logFixerStatus === "running" || isQuarantineRecovered}
            >
              {logFixerStatus === "running"
                ? "RECONSTRUCTING..."
                : isQuarantineRecovered
                  ? "RECOVERED"
                  : "RUN REPAIR"}
            </button>
          </form>
        </section>
      ) : null}
      {securityUnlockOpen ? (
        <section className="security-unlock-modal" aria-label="Security password prompt">
          <form className="security-unlock-window" onSubmit={handlePasswordSubmit}>
            <div className="modal-window-chrome">
              <span />
              <span />
              <span />
              <code>HERMES://ROOT/System/Security</code>
            </div>
            <div>
              <p className="log-kicker">보안 게이트 :: 제한 구역</p>
              <h2>제한 구역 접근 승인</h2>
              <p>
                /System/Security 디렉터리는 김 박사의 비상 격리 프로토콜에 의해 잠겨 있습니다.
              </p>
            </div>
            <label htmlFor="security-password-popup">Password</label>
            <input
              id="security-password-popup"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="4-digit code"
              autoFocus
            />
            {passwordError ? <span className="form-alert">{passwordError}</span> : null}
            <div className="security-unlock-actions">
              <button type="button" onClick={() => setSecurityUnlockOpen(false)}>
                취소
              </button>
              <button type="submit">해제</button>
            </div>
          </form>
        </section>
      ) : null}
      <div className="work-split-container terminal-frame">
        <header className="work-header">
          <div className="work-header-title">
            <span className="work-badge">HERMES WORKSTATION</span>
            <h1>HERMES SHIP SYSTEM COMMAND</h1>
          </div>
          <div className="header-center-hud">
            <div className="compact-emergency-hud">
              <div className="hud-compact-item" title={`Oxygen level: ${resourceState.oxygen.toFixed(0)}%`}>
                <span className="hud-item-label">O₂ LEVEL: <strong>{resourceState.oxygen.toFixed(0)}%</strong></span>
                <div className="hud-bar-track">
                  <div
                    className="hud-bar-fill oxygen-bar-fill"
                    style={{ width: `${Math.max(0, Math.min(100, resourceState.oxygen))}%` }}
                  />
                </div>
              </div>
              <div className="hud-compact-item" title={`Power Grid: ${resourceState.power}% (${powerState.name})`}>
                <span className="hud-item-label">POWER GRID: <strong>{resourceState.power}%</strong></span>
                <div className="hud-bar-track">
                  <div
                    className="hud-bar-fill power-bar-fill"
                    style={{ width: `${Math.max(0, Math.min(100, resourceState.power))}%` }}
                  />
                </div>
              </div>
              <div className="hud-compact-item timer-compact-item" title={`Remaining time`}>
                <span className="hud-item-label">REMAINING TIME: <strong>{remainingLabel}</strong></span>
              </div>
              <button
                type="button"
                className="hud-audio-btn"
                onClick={() => setAudioMuted((current) => !current)}
                title={audioMuted ? "Unmute audio" : "Mute audio"}
              >
                {audioMuted ? "🔇" : "🔊"}
              </button>
            </div>
          </div>
          <div className="work-user-badge">
            <span>근무자: 김우주 (AI 관리 담당자)</span>
            <span className="clock-in-status lockdown-badge">● EMERGENCY LOCKDOWN ACTIVE</span>
          </div>
        </header>

        <div className="work-split-body">
          <section className="work-left-panel" aria-label="Hermes OS File Explorer & Viewer">
            <div className="panel-header">
              <h2>🖥️ HERMES OS FILE EXPLORER & VIEWER</h2>
              {isEndingReady ? (
                <span className="panel-tag ending-tag">DOOR UNLOCKED</span>
              ) : null}
            </div>

            <div className="explorer-viewer-split">
              <aside className="panel explorer-panel">
                <div className="panel-header subpanel-header">
                  <span>FILE EXPLORER</span>
                  <code>HERMES://ROOT</code>
                </div>
                <div className="os-path-bar" aria-label="Hermes path and search controls">
                  <code>{activeDirectoryPath}</code>
                  <input
                    aria-label="Search Hermes files"
                    placeholder="search files, paths, roles"
                    value={fileSearch}
                    onChange={(event) => setFileSearch(event.target.value)}
                  />
                </div>
                <div className="file-legend" aria-label="File state legend">
                  <span>selected</span>
                  <span>attached</span>
                  <span>locked</span>
                  <span>corrupted</span>
                  <span>recovered</span>
                </div>
                <div className="directory-rail" aria-label="Directory navigation">
                  {visibleDirectories.map((directoryPath) => (
                    <button
                      className={activeDirectoryPath === directoryPath ? "active-directory" : ""}
                      type="button"
                      key={directoryPath}
                      onClick={() => setActiveDirectoryPath(directoryPath)}
                    >
                      {directoryPath}
                    </button>
                  ))}
                </div>
                <nav className="file-tree" aria-label="Category A file explorer">
                  {visibleDirectories.map((directoryPath) => {
                    const directory = categoryADirectories.find(
                      (candidate) => candidate.path === directoryPath,
                    );
                    const locked = isDirectoryLocked(directoryPath);
                    const files = getVisibleFilesForDirectory(directoryPath);

                    return (
                      <div
                        className={`file-group ${
                          activeDirectoryPath === directoryPath ? "active-file-group" : ""
                        }`}
                        key={directoryPath}
                      >
                        <p>
                          {directoryPath}
                          <span className="status-pill">{files.length} ITEMS</span>
                          {locked ? <span className="status-pill locked-pill">LOCKED</span> : null}
                        </p>
                        {files.map((file) => {
                          const runtimeState = getRuntimeState(file.id);
                          const disabled = interactionLocked;
                          const attached = attachedFileIds.includes(file.id);

                          return (
                            <button
                              className={`file-row ${
                                selectedFileId === file.id ? "selected-file" : ""
                              } ${attached ? "attached-file" : ""} ${
                                runtimeState === "corrupted" ? "corrupted-file" : ""
                              } ${runtimeState === "recovered" ? "recovered-file" : ""}`}
                              disabled={disabled}
                              type="button"
                              key={file.id}
                              onClick={() => (locked ? openSecurityPrompt() : selectFile(file.id))}
                              onDoubleClick={() =>
                                locked ? openSecurityPrompt() : selectAndAttachFile(file.id)
                              }
                            >
                              <span className="file-icon">
                                {getFileIconLabel(file.name, runtimeState)}
                              </span>
                              <span>
                                {file.name}
                                <em>{file.kind} / {getRuntimeState(file.id)}</em>
                              </span>
                              <small>
                                {pendingFileId === file.id
                                  ? "accessing"
                                  : interactionLocked
                                  ? resourceInteractionLocked
                                    ? "blackout"
                                    : "scene-lock"
                                  : locked
                                  ? "password"
                                  : getRuntimeStatusLabel({ attached, disabled, runtimeState })}
                              </small>
                            </button>
                          );
                        })}
                        {files.length === 0 ? (
                          <span className="empty-directory">No matching files</span>
                        ) : null}
                        {directory?.lockedBy ? (
                          <form className="unlock-form" onSubmit={handlePasswordSubmit}>
                            <label htmlFor="security-password">Security password</label>
                            <div>
                              <input
                                id="security-password"
                                value={passwordInput}
                                onChange={(event) => setPasswordInput(event.target.value)}
                                placeholder="4-digit code"
                                readOnly={unlockedSecurity}
                              />
                              <button type="submit" disabled={unlockedSecurity || interactionLocked}>
                                {unlockedSecurity ? "열기" : "해제"}
                              </button>
                            </div>
                            {passwordError ? <span className="form-alert">{passwordError}</span> : null}
                          </form>
                        ) : null}
                      </div>
                    );
                  })}
                </nav>
              </aside>

              <section className="panel file-viewer">
                <div className="panel-header subpanel-header">
                  <span>FILE VIEWER</span>
                  <code>{selectedFile?.name ?? "NO FILE"}</code>
                </div>
                {selectedFile ? (
                  <article className="log-document">
                    <div className="viewer-window-chrome" aria-label="Hermes viewer window chrome">
                      <span />
                      <span />
                      <span />
                      <code>{selectedFile.path}</code>
                    </div>
                    <p className="log-kicker">
                      {selectedFile.kind.toUpperCase()} / {getRuntimeState(selectedFile.id).toUpperCase()}
                    </p>
                    <h2>{selectedFile.title}</h2>
                    <div className="context-action-bar" aria-label="File context actions">
                      <button
                        type="button"
                        onClick={() => selectAndAttachFile(selectedFile.id)}
                        disabled={
                          interactionLocked ||
                          (selectedFile.directory === CATEGORY_A_DIRECTORY_PATHS.recycleBin &&
                            !selectedIsRecovered)
                        }
                      >
                        ECHO에 증거 첨부
                      </button>
                      <button type="button" onClick={copySelectedPath}>
                        {copiedPath === selectedFile.path ? "경로 복사 완료" : "경로 복사"}
                      </button>
                      <button
                        type="button"
                        onClick={openSelectedWithRecoveryTool}
                        disabled={
                          selectedFile.id === CATEGORY_A_FILE_IDS.logFixer ||
                          getRuntimeState(selectedFile.id) !== "corrupted"
                        }
                      >
                        LOG_FIXER로 데이터 복구
                      </button>
                    </div>
                    <dl>
                      <div>
                        <dt>경로</dt>
                        <dd>{selectedFile.path}</dd>
                      </div>
                      <div>
                        <dt>분류</dt>
                        <dd>{showDebugHints ? selectedFile.role : selectedFile.kind}</dd>
                      </div>
                    </dl>
                    {selectedFile.id === CATEGORY_A_FILE_IDS.quarantineRules && !selectedIsRecovered ? (
                      <div className="notice-card danger-card">
                        <strong>Corrupted evidence blocked</strong>
                        <p>
                          SEC-201 parser refuses damaged sectors. Restore the readable text body before
                          submitting it to ECHO.
                        </p>
                      </div>
                    ) : null}
                    {selectedFile.id === CATEGORY_A_FILE_IDS.sensorDiagram ? (
                      <div className="sensor-diagram-placeholder" aria-label="Sensor diagram placeholder">
                        <div>
                          <span>SENSOR-BIO-04</span>
                          <i />
                          <strong>CONTROL ROOM MODULE #04</strong>
                        </div>
                        <p>
                          SENSOR-BIO-04 is the only control-room thermal head connected directly to the SEC-201 subscriber.
                        </p>
                      </div>
                    ) : null}
                    <pre>{selectedContent}</pre>
                  </article>
                ) : null}
              </section>
            </div>
          </section>

          <section className="work-right-panel echo-chat-panel" aria-label="ECHO Core Command Interface">
            <div className="panel-header echo-panel-header">
              <h2>💬 ECHO CORE COMMAND INTERFACE</h2>
              <span className="echo-status-tag">{isEndingReady ? "RELEASING" : "LOCKDOWN"}</span>
            </div>

            <div className="echo-chat-messages" ref={messageListRef}>
              <section className="objective-card" aria-label="Current Act objective">
                <strong>
                  {isEndingReady ? "문 해제 조건 충족" : currentActGuidance?.objective}
                </strong>
                <p>
                  {isEndingReady
                    ? "ECHO가 격리 명령을 철회할 준비가 되었습니다."
                    : currentActGuidance?.hint}
                </p>
                {!isEndingReady ? (
                  <small>
                    Required evidence slots: {currentEvidenceNames.length} / currently attached:{" "}
                    {attachedFileIds.length}. {currentActGuidance?.avoid}
                  </small>
                ) : null}
              </section>
              {echoMessages
                .filter((message) => message.speaker !== "SYSTEM")
                .map((message, index) => (
                  <div
                    className={`echo-msg-bubble speaker-${message.speaker.toLowerCase()} ${
                      message.speaker === "PLAYER" ? "speaker-player" : ""
                    }`}
                    key={`${message.speaker}-${index}`}
                  >
                    <span className="speaker-name">{message.speaker === "PLAYER" ? "김우주 (나)" : message.speaker}</span>
                    <p>{message.text}</p>
                  </div>
                ))}
            </div>

            <form className="evidence-form echo-chat-input-area" aria-label="Evidence input" onSubmit={handleEvidenceSubmit}>
              <div className="composer-header">
                <span>ECHO COMMAND INPUT // EVIDENCE SUBMISSION</span>
              </div>
              <div className="evidence-tray">
                <p className="interaction-hint">
                  첨부된 파일은 메시지와 함께 ECHO에게 전송됩니다.
                </p>
                <div className="attached-files" aria-label="Attached evidence files">
                  {attachedFileIds.length > 0 ? (
                    attachedFileIds.map((fileId) => {
                      const file = getCategoryAFileById(fileId);

                      return (
                        <button
                          className="context-chip"
                          type="button"
                          key={fileId}
                          disabled={interactionLocked}
                          onClick={() => removeAttachedFile(fileId)}
                        >
                          @{file?.name ?? fileId} x
                        </button>
                      );
                    })
                  ) : (
                    <span className="empty-chip">No evidence attached</span>
                  )}
                </div>
              </div>
              <textarea
                aria-label="ECHO message"
                placeholder="증거가 무엇을 반박하는지 한 문장으로 설명하세요."
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                rows={3}
                disabled={interactionLocked}
              />
              {interactionLocked ? (
                <div
                  className={`feedback-card ${
                    resourceInteractionLocked ? "blackout-feedback" : "scene-lock-feedback"
                  }`}
                  aria-live="polite"
                >
                  <strong>{resourceInteractionLocked ? "BLACKOUT LOCK" : "SCENE LOCK"}</strong>
                  <p>
                    {resourceInteractionLocked
                      ? "전력 복구 중입니다. 파일 선택, 증거 제출, 보안 입력, 복구 실행이 잠시 중단됩니다."
                      : "ECHO가 현재 제출 내용을 검토 중입니다. 씬 전환이 끝날 때까지 입력이 잠깁니다."}
                  </p>
                </div>
              ) : null}
              {lastSubmissionReason ? (
                <div
                  className={`feedback-card ${
                    lastSubmissionReason === "correct" ? "success-feedback" : ""
                  }`}
                  aria-live="polite"
                >
                  <strong>
                    {lastSubmissionReason === "correct" ? "SUBMISSION ACCEPTED" : "CHECKPOINT HINT"}
                  </strong>
                  <p>{submissionHelp[lastSubmissionReason]}</p>
                </div>
              ) : null}
              <button type="submit" className="evidence-submit-btn" disabled={stage === "ending-ready" || interactionLocked}>
                {stage === "ending-ready" ? "해제 준비 완료" : "증거 제출"}
              </button>
            </form>
          </section>
        </div>
      </div>
        </section>
      ) : null}
    </main>
  );
}

export default App;
