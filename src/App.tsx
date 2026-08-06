import { useEffect, useState, type FormEvent } from "react";
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
} from "./game/evidenceSubmission";
import {
  applyWrongSubmissionPenalty,
  advanceResourceTime,
  createResourceState,
  getInteractionLocked,
  getPowerState,
} from "./game/resourceState";
import {
  SpaceshipComputerScene,
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

type EchoMessage = {
  speaker: "ECHO" | "PLAYER" | "SYSTEM";
  text: string;
};

type AppPhase = "menu" | "transition" | "opening" | "gameplay";

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

const initialEchoMessages: EchoMessage[] = [
  {
    speaker: "ECHO",
    text: "지침 101조: 외부 위험으로부터 승무원을 보호합니다. 당신은 지금 위험 상태입니다.",
  },
  {
    speaker: "SYSTEM",
    text: "파일을 클릭하면 ECHO 입력창에 증거 태그가 첨부됩니다. 현재 목표: Act 1 센서 오판 근거 제출.",
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
    hint: "센서 로그에서 보정 시점과 오판 가능성을 찾고, 그 파일을 증거로 첨부하세요.",
    avoid: "정확한 문장을 외우기보다 파일의 핵심 근거를 짧게 설명하면 됩니다.",
  },
  [CATEGORY_A_ACT_IDS.act2]: {
    objective: "격리 규칙의 시간이 이미 만료되었음을 복구된 보안 파일로 증명하세요.",
    hint: "잠긴 보안 폴더를 열고, 손상된 규칙 파일을 Log_Fixer.exe로 복구해야 합니다.",
    avoid: "손상 상태의 파일은 증거로 인정되지 않습니다. 먼저 복구 상태를 확인하세요.",
  },
  [CATEGORY_A_ACT_IDS.act3]: {
    objective: "ECHO의 격리 명령보다 승무원 생존 우선 원칙이 앞선다는 충돌 근거를 제출하세요.",
    hint: "보안 정책 파일과 삭제된 오버라이드 기록이 서로 연결되는지 살펴보세요.",
    avoid: "마지막 Act는 단일 파일이 아니라, 충돌을 설명하는 조합 증거가 필요합니다.",
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
    return 350;
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
    return 900;
  }

  if (powerStateName === "Critical") {
    return 1600;
  }

  return 0;
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

function App() {
  const [selectedFileId, setSelectedFileId] = useState<CategoryAFileId>(
    CATEGORY_A_FILE_IDS.sensorCalibLog,
  );
  const [attachedFileIds, setAttachedFileIds] = useState<CategoryAFileId[]>([
    CATEGORY_A_FILE_IDS.sensorCalibLog,
  ]);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
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
  const selectedContent =
    selectedIsRecovered && selectedFile?.recoveredContent
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
      setPasswordError("ACCESS DENIED / Dr_Kim email_chain_july.txt에서 4자리 코드를 확인하세요.");
      return;
    }

    setUnlockedSecurity(true);
    setPasswordError("");
    selectAndAttachFile(CATEGORY_A_FILE_IDS.quarantineRules);
  }

  function recoverQuarantineRules() {
    if (interactionLocked) {
      setPasswordError("BLACKOUT / 전력 복구 후 Log_Fixer.exe를 다시 실행하세요.");
      return;
    }

    if (!unlockedSecurity) {
      setPasswordError("RECOVERY BLOCKED / 먼저 /System/Security 비밀번호를 해제해야 합니다.");
      setResourceState((current) => applyWrongSubmissionPenalty(current));
      return;
    }

    const commitRecovery = () => {
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
          text:
            recoveryDelayMs > 0
              ? "Log_Fixer.exe completed after degraded-power retry. quarantine_rules.conf recovered."
              : "Log_Fixer.exe completed. quarantine_rules.conf recovered and eligible for Act 2 evidence.",
        },
      ]);
    };

    if (recoveryDelayMs > 0) {
      setPasswordError(`RECOVERY DELAY / ${powerState.name} power state slows Log_Fixer.`);
      window.setTimeout(commitRecovery, recoveryDelayMs);
      return;
    }

    commitRecovery();
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

    setSelectedFileId(CATEGORY_A_FILE_IDS.logFixer);
    setEchoMessages((current) => [
      ...current,
      {
        speaker: "SYSTEM",
        text: `Hermes OS routed ${selectedFile.name} to /Utilities/Log_Fixer.exe.`,
      },
    ]);
  }

  function handleEvidenceSubmit(event: FormEvent<HTMLFormElement>) {
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

    const result = evaluateEvidenceSubmission({
      act: stage,
      attachedFileIds,
      text: messageInput,
      resourceState,
      recoveredFileIds: Array.from(recoveredFileIds),
      failedAttemptCount: failedAttemptsByAct[stage],
    });
    const submittedAct = stage;
    const submittedFiles = attachedFileIds;
    const submittedText = messageInput;

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
        text: `${result.message} [stability ${result.stabilityChange >= 0 ? "+" : ""}${
          result.stabilityChange
        } / suspicion ${result.suspicionChange >= 0 ? "+" : ""}${
          result.suspicionChange
        }]`,
      },
    ]);

    if (result.resourceState.power < resourceState.power) {
      setResourceEvent(
        result.resourceState.blackoutRemainingSeconds > 0
          ? "BLACKOUT REBOOT / grid collapse detected"
          : `POWER SURGE / -${resourceState.power - result.resourceState.power}% grid integrity`,
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

    if (result.nextAct === "ending-ready") {
      setSceneRuntime(createFinalReviewScene());
      window.setTimeout(() => {
        setStage("ending-ready");
        setSceneRuntime(createEndingScene());
        setEchoMessages((current) => [
          ...current,
          {
            speaker: "SYSTEM",
            text: "FINAL_REVIEW complete. Normal Ending A door release is now available.",
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
    }, ACT_SUCCESS_DURATION_MS);
  }

  function startOpeningSequence() {
    setAppPhase("transition");
    setOpeningElapsedSeconds(0);
    setOpeningSpeed(1);
    window.setTimeout(() => {
      setSceneRuntime(createOpeningScene());
      setAppPhase("opening");
    }, 900);
  }

  function enterGameplay() {
    setAppPhase("gameplay");
    setSceneRuntime(createActEntryScene(CATEGORY_A_ACT_IDS.act1));
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
        <SpaceshipComputerScene mode={getSceneMode()} />
      </section>

      {appPhase === "menu" || appPhase === "transition" ? (
        <section className="main-menu-overlay" aria-label="LOG_OUT main menu">
          <div className="menu-monitor">
            <div className="menu-title-frame">
              <span>THE ECHO PROTOCOL</span>
              <h2>LOGOUT ISOLATION</h2>
              <small>HERMES CONTROL ROOM / SEC-201</small>
            </div>
            <div className="menu-actions">
              <button
                className="menu-play-button"
                type="button"
                onClick={startOpeningSequence}
                disabled={appPhase === "transition"}
              >
                {appPhase === "transition" ? "INITIALIZING..." : "PLAY"}
              </button>
              <button className="menu-quit-button" type="button" disabled>
                QUIT
              </button>
            </div>
            <div className="menu-system-lines" aria-label="Menu system context">
              <span>8245 / RESOURCE MINING VESSEL HERMES</span>
              <span>AI ADMIN OFFICER: KIM WOOJU</span>
              <span>WARNING: ECHO SAFETY PROTOCOL ARMED</span>
            </div>
          </div>
        </section>
      ) : null}

      {appPhase === "opening" ? (
        <section className="cinematic-overlay opening-overlay" aria-label="Opening sequence">
          {openingBeat.id !== "terminal-handoff" ? (
            <div className="opening-hands-placeholder" aria-hidden="true">
              <span />
              <span />
            </div>
          ) : null}
          <div className="cinematic-card intro-card opening-timeline-card">
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
          <strong>BLACKOUT</strong>
          <span>
            Reboot lock active. Recovery in{" "}
            {Math.ceil(resourceState.blackoutRemainingSeconds)}s.
          </span>
        </section>
      ) : null}

      {resourceEvent ? (
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

      {isEndingReady && !endingConfirmed ? (
        <section className="cinematic-overlay ending-overlay" aria-label="Normal Ending A">
          <div className="cinematic-card">
            <p className="eyebrow">NORMAL ENDING A / DOOR RELEASED</p>
            <h2>ECHO가 격리 명령을 철회합니다</h2>
            <p>
              센서 오판, 만료된 격리 규칙, 삭제된 오버라이드가 하나의 결론으로
              연결되었습니다. 통제실 문이 열리고 생존 루트가 확보됩니다.
            </p>
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

      {appPhase === "gameplay" ? (
        <>
      <section className="system-topbar" aria-label="Hermes OS status">
        <div>
          <p className="eyebrow">HERMES OS / CONTROL ROOM TERMINAL</p>
          <h1>LOG_OUT</h1>
        </div>
        <div className="mission-clock" aria-label="Mission timer">
          <span>{getActLabel(stage)}</span>
          <strong>{resourceState.power}%</strong>
        </div>
      </section>

      <section className="hud-grid" aria-label="Resource HUD">
        <div className="hud-card">
          <span>O₂ LEVEL</span>
          <strong>{resourceState.oxygen.toFixed(0)}%</strong>
          <small>drain x{powerState.oxygenMultiplier.toFixed(2)}</small>
          <div className="meter">
            <span style={{ width: `${resourceState.oxygen}%` }} />
          </div>
        </div>
        <div className="hud-card">
          <span>POWER GRID / {powerState.name}</span>
          <strong>{resourceState.power}%</strong>
          <small>
            {isBlackout
              ? `reboot ${Math.ceil(resourceState.blackoutRemainingSeconds)}s`
              : `file delay ${fileAccessDelayMs}ms / fixer delay ${recoveryDelayMs}ms`}
          </small>
          <div className="meter meter-blue">
            <span style={{ width: `${resourceState.power}%` }} />
          </div>
        </div>
        <div className="hud-card timer-hud-card">
          <span>{resourceState.mode.toUpperCase()} SESSION</span>
          <strong>{remainingLabel}</strong>
          <small>elapsed {elapsedLabel} / deterministic resource timer</small>
        </div>
        <div className="hud-card alert-card">
          <span>RED ALERT FEEDBACK</span>
          <strong>
            {resourceEvent
              ? "POWER SURGE"
              : isEndingReady
                ? "DOOR OPEN"
                : isBlackout
                  ? "BLACKOUT"
                  : powerState.name}
          </strong>
          <small>
            {resourceEvent
              ? "monitor glow and surge alert active"
              : isEndingReady
              ? "Normal Ending A sequence available"
              : isBlackout
                ? "Screen shake and emergency wash active"
                : "HUD tone tracks current power risk"}
          </small>
        </div>
        <div className="hud-card">
          <span>RECOVERY STATUS</span>
          <strong>{isQuarantineRecovered ? "READY" : "CORRUPTED"}</strong>
          <small>
            {isQuarantineRecovered
              ? "quarantine_rules.conf can be used as Act 2 evidence"
              : "Run Log_Fixer.exe before Act 2 submission"}
          </small>
        </div>
        <div className="hud-card scene-hud-card">
          <span>SCENE RUNTIME</span>
          <strong>{sceneRuntime.id}</strong>
          <small>
            {sceneRuntime.inputLocked ? "INPUT LOCKED" : "INPUT READY"} /{" "}
            {sceneRuntime.exitCondition}
          </small>
        </div>
        <div className="hud-card echo-state-card">
          <span>ECHO STATE / {lastSubmissionReason ?? "monitoring"}</span>
          <strong>{echoStability}% STABLE</strong>
          <small>
            suspicion {echoSuspicion}% / failed attempts{" "}
            {isEndingReady ? 0 : failedAttemptsByAct[stage]}
          </small>
        </div>
        <div className="hud-card objective-hud-card">
          <span>{isEndingReady ? "CURRENT OBJECTIVE" : `${getActLabel(stage)} OBJECTIVE`}</span>
          <strong>{isEndingReady ? "EXIT READY" : "EVIDENCE REVIEW"}</strong>
          <small>
            {isEndingReady
              ? "모든 핵심 모순이 검증되었습니다. 엔딩 확인을 진행하세요."
              : currentActGuidance?.objective}
          </small>
        </div>
      </section>

      <section className="terminal-grid" aria-label="Hermes OS work area">
        <aside className="panel explorer-panel">
          <div className="panel-header">
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
                    const disabled = locked || interactionLocked;
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
                        onClick={() => selectFile(file.id)}
                        onDoubleClick={() => selectAndAttachFile(file.id)}
                      >
                        <span className="file-icon">
                          {getFileIconLabel(file.name, runtimeState)}
                        </span>
                        <span>
                          {file.name}
                          <em>{file.kind} / {file.role}</em>
                        </span>
                        <small>
                          {pendingFileId === file.id
                            ? "accessing"
                            : interactionLocked
                            ? resourceInteractionLocked
                              ? "blackout"
                              : "scene-lock"
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
                          {unlockedSecurity ? "OPEN" : "UNLOCK"}
                        </button>
                      </div>
                      {passwordError ? <span className="form-alert">{passwordError}</span> : null}
                      <span className="soft-hint">
                        Hint: Dr_Kim 이메일에서 4자리 코드를 찾으면 보안 파일을 열 수 있습니다.
                      </span>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <section className="panel file-viewer">
          <div className="panel-header">
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
                  disabled={interactionLocked}
                >
                  ATTACH TO ECHO
                </button>
                <button type="button" onClick={copySelectedPath}>
                  {copiedPath === selectedFile.path ? "PATH COPIED" : "COPY PATH"}
                </button>
                <button
                  type="button"
                  onClick={openSelectedWithRecoveryTool}
                  disabled={
                    selectedFile.id === CATEGORY_A_FILE_IDS.logFixer ||
                    getRuntimeState(selectedFile.id) !== "corrupted"
                  }
                >
                  OPEN WITH LOG_FIXER
                </button>
                <button
                  type="button"
                  onClick={() => setShowDebugHints((current) => !current)}
                  disabled={!selectedFile.gameplay.debugHint}
                >
                  {showDebugHints ? "HIDE QA HINT" : "SHOW QA HINT"}
                </button>
              </div>
              <dl>
                <div>
                  <dt>Path</dt>
                  <dd>{selectedFile.path}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{selectedFile.role}</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>
                    {selectedFile.gameplay.evidenceFor
                      ? `${selectedFile.gameplay.evidenceFor}${
                          selectedFile.gameplay.requiresRecovery && !selectedIsRecovered
                            ? " / blocked until recovered"
                            : " / eligible"
                        }`
                      : "not evidence"}
                  </dd>
                </div>
                <div>
                  <dt>State</dt>
                  <dd>
                    {getRuntimeState(selectedFile.id)} / attached{" "}
                    {attachedFileIds.includes(selectedFile.id) ? "yes" : "no"}
                  </dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{selectedFile.gameplay.sourceRefs.join(", ")}</dd>
                </div>
              </dl>
              {selectedFile.id === CATEGORY_A_FILE_IDS.emailChainJuly ? (
                <div className="notice-card">
                  <strong>Password hint detected</strong>
                  <p>
                    `/System/Security` unlock code is{" "}
                    <code>{CATEGORY_A_SECURITY_PASSWORD}</code>.
                  </p>
                </div>
              ) : null}
              {selectedFile.id === CATEGORY_A_FILE_IDS.quarantineRules && !selectedIsRecovered ? (
                <div className="notice-card danger-card">
                  <strong>Corrupted evidence blocked</strong>
                  <p>
                    This file cannot be submitted as valid Act 2 evidence until
                    Log_Fixer.exe restores its contents. 먼저 보안 폴더를 열고 복구 버튼을
                    실행하세요.
                  </p>
                </div>
              ) : null}
              {selectedFile.id === CATEGORY_A_FILE_IDS.logFixer ? (
                <div className="recovery-console">
                  <div>
                    <span>PRIMARY TARGET</span>
                    <strong>{quarantineRules?.path}</strong>
                    <p>
                      Status:{" "}
                      {isQuarantineRecovered
                        ? "RECOVERED"
                        : unlockedSecurity
                          ? "READY FOR RECOVERY"
                          : "LOCKED BY /System/Security"}
                    </p>
                    <p className="soft-hint">
                      복구 후 이 파일을 다시 클릭하면 Act 2 증거 태그로 첨부됩니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={recoverQuarantineRules}
                    disabled={isQuarantineRecovered || interactionLocked}
                  >
                    {isQuarantineRecovered ? "RECOVERED" : "RUN LOG_FIXER"}
                  </button>
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
                    Missing final asset fallback for
                    `public/assets/images/sensor_diagram.png`. This placeholder preserves
                    the viewer route until the production schematic is supplied.
                  </p>
                </div>
              ) : null}
              {showDebugHints && selectedFile.gameplay.debugHint ? (
                <div className="debug-hint-card" aria-label="QA debug hint">
                  <strong>QA / ACCESSIBILITY HINT</strong>
                  <p>{selectedFile.gameplay.debugHint}</p>
                </div>
              ) : null}
              <pre>{selectedContent}</pre>
            </article>
          ) : null}
        </section>

        <aside className="panel echo-panel">
          <div className="panel-header">
            <span>ECHO CHAT</span>
            <code>SECURE CHANNEL</code>
          </div>
          <section className="objective-card" aria-label="Current Act objective">
            <span>{isEndingReady ? "EXIT OBJECTIVE" : `${getActLabel(stage)} MISSION`}</span>
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
          <section className="scene-runtime-card" aria-label="Inspectable scene runtime">
            <span>{sceneRuntime.phase}</span>
            <strong>{sceneRuntime.label}</strong>
            <p>{sceneRuntime.line}</p>
            <small>
              id: {sceneRuntime.id} / exit: {sceneRuntime.exitCondition}
            </small>
          </section>
          <div className="message-list" aria-label="ECHO chat log">
            {echoMessages.map((message, index) => (
              <div
                className={`message ${
                  message.speaker === "PLAYER" ? "player-message" : ""
                } ${message.speaker === "SYSTEM" ? "system-message" : ""}`}
                key={`${message.speaker}-${index}`}
              >
                <span>{message.speaker}</span>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <form className="evidence-form" aria-label="Evidence input" onSubmit={handleEvidenceSubmit}>
            <p className="interaction-hint">
              파일을 클릭하면 증거 태그로 첨부됩니다. 첨부된 태그를 클릭하면 제거됩니다.
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
            <textarea
              aria-label="ECHO message"
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
            <button type="submit" disabled={stage === "ending-ready" || interactionLocked}>
              {stage === "ending-ready" ? "UNLOCK READY" : "SUBMIT"}
            </button>
          </form>
        </aside>
      </section>
        </>
      ) : null}
    </main>
  );
}

export default App;
