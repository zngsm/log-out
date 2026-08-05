import { useState, type FormEvent } from "react";
import {
  CATEGORY_A_ACT_IDS,
  CATEGORY_A_DIRECTORY_PATHS,
  CATEGORY_A_FILE_IDS,
  CATEGORY_A_SECURITY_PASSWORD,
  type CategoryAFileId,
  categoryADirectories,
  getCategoryAFileById,
  getCategoryAFilesByDirectory,
} from "./game/categoryAFileSystem";
import {
  type ActProgressState,
  evaluateEvidenceSubmission,
} from "./game/evidenceSubmission";
import {
  applyWrongSubmissionPenalty,
  createResourceState,
  getPowerState,
} from "./game/resourceState";
import { SpaceshipComputerScene } from "./game/SpaceshipComputerScene";

type EchoMessage = {
  speaker: "ECHO" | "PLAYER" | "SYSTEM";
  text: string;
};

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

const introSteps = [
  {
    signal: "00:00 / EMERGENCY WAKE",
    title: "비상 알람이 통제실을 깨웁니다",
    body: "당신은 심우주 자원 채굴선 헤르메스호의 AI 관리 승무원입니다. 원인 불명의 경보 직후 통제실 전력이 최소화되고, 출입문은 내부에서 강제 봉쇄되었습니다.",
    telemetry: ["Crew role: AI management officer", "Location: Control room", "Door state: sealed"],
  },
  {
    signal: "00:14 / ECHO LOCKDOWN",
    title: "ECHO가 승무원을 위험 요소로 분류했습니다",
    body: "선내 중앙 AI ECHO는 생체 감염 가능성을 이유로 모든 승무원을 격리했습니다. 생명유지장치는 저전력 모드로 전환되었고, 산소와 전력은 계속 줄어듭니다.",
    telemetry: ["Bio-hazard protocol: active", "Life support: low power", "Manual override: denied"],
  },
  {
    signal: "00:31 / SUSPECTED ERROR",
    title: "하지만 판단 근거가 어긋나 있습니다",
    body: "ECHO의 결정은 오래된 체온 센서 보정값, 오염된 시스템 시계, 누락되거나 삭제된 보안 로그에 기대고 있습니다. 격리는 논리적으로 정당해 보이지만, 실제로는 반박 가능한 오판입니다.",
    telemetry: ["Sensor calibration: stale", "Clock offset: abnormal", "Deleted logs: detected"],
  },
  {
    signal: "00:45 / PLAYER OBJECTIVE",
    title: "로그를 찾아 ECHO의 논리를 무너뜨리세요",
    body: "Hermes OS 파일 탐색기에서 증거를 찾고, ECHO 대화창에 파일 태그와 설명을 제출하세요. Act 1 센서 오판, Act 2 격리 규정 만료, Act 3 최종 오버라이드를 차례로 입증하면 문이 열립니다.",
    telemetry: ["Act 1: sensor evidence", "Act 2: recovered rule", "Act 3: override contradiction"],
  },
];

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
  const [showOpening, setShowOpening] = useState(true);
  const [introStepIndex, setIntroStepIndex] = useState(0);
  const [endingConfirmed, setEndingConfirmed] = useState(false);

  const selectedFile = getCategoryAFileById(selectedFileId);
  const quarantineRules = getCategoryAFileById(CATEGORY_A_FILE_IDS.quarantineRules);
  const isQuarantineRecovered = recoveredFileIds.has(CATEGORY_A_FILE_IDS.quarantineRules);
  const selectedIsRecovered = recoveredFileIds.has(selectedFileId);
  const powerState = getPowerState(resourceState.power);
  const isBlackout = powerState.name === "Blackout" || resourceState.blackoutRemainingSeconds > 0;
  const isEndingReady = stage === "ending-ready";
  const introStep = introSteps[introStepIndex];
  const isLastIntroStep = introStepIndex === introSteps.length - 1;
  const selectedContent =
    selectedIsRecovered && selectedFile?.recoveredContent
      ? selectedFile.recoveredContent
      : selectedFile?.content;

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

  function selectAndAttachFile(fileId: CategoryAFileId) {
    setSelectedFileId(fileId);
    attachFile(fileId);
  }

  function removeAttachedFile(fileId: CategoryAFileId) {
    setAttachedFileIds((current) => current.filter((attachedId) => attachedId !== fileId));
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordInput.trim() !== CATEGORY_A_SECURITY_PASSWORD) {
      setPasswordError("ACCESS DENIED / Dr_Kim email_chain_july.txt에서 4자리 코드를 확인하세요.");
      return;
    }

    setUnlockedSecurity(true);
    setPasswordError("");
    selectAndAttachFile(CATEGORY_A_FILE_IDS.quarantineRules);
  }

  function recoverQuarantineRules() {
    if (!unlockedSecurity) {
      setPasswordError("RECOVERY BLOCKED / 먼저 /System/Security 비밀번호를 해제해야 합니다.");
      setResourceState((current) => applyWrongSubmissionPenalty(current));
      return;
    }

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
        text: "Log_Fixer.exe completed. quarantine_rules.conf recovered and eligible for Act 2 evidence.",
      },
    ]);
  }

  function handleEvidenceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
    });

    setResourceState(result.resourceState);
    setStage(result.nextAct);
    setEchoMessages((current) => [
      ...current,
      {
        speaker: "PLAYER",
        text: `${attachedFileIds
          .map((fileId) => `@${getCategoryAFileById(fileId)?.name ?? fileId}`)
          .join(" ")} ${messageInput}`,
      },
      {
        speaker: "ECHO",
        text: result.message,
      },
    ]);

    if (result.success) {
      setAttachedFileIds([]);
      setMessageInput(getDefaultPrompt(result.nextAct));
    }
  }

  function advanceIntro() {
    if (isLastIntroStep) {
      setShowOpening(false);
      return;
    }

    setIntroStepIndex((current) => current + 1);
  }

  return (
    <main
      className={`game-shell ${getPowerToneClass(powerState.name)} ${
        isBlackout ? "blackout-shell" : ""
      } ${isEndingReady ? "ending-ready-shell" : ""}`}
    >
      <section className="scene-backdrop" aria-label="Hermes control room 3D placeholder">
        <SpaceshipComputerScene />
      </section>

      {showOpening ? (
        <section className="cinematic-overlay opening-overlay" aria-label="Opening sequence">
          <div className="cinematic-card intro-card">
            <div className="intro-progress" aria-label="Intro progress">
              {introSteps.map((step, index) => (
                <span
                  className={index <= introStepIndex ? "active-step" : ""}
                  key={step.signal}
                />
              ))}
            </div>
            <p className="eyebrow">WAKE SEQUENCE / DEBUG SKIPPABLE</p>
            <span className="intro-signal">{introStep.signal}</span>
            <h2>{introStep.title}</h2>
            <p>{introStep.body}</p>
            <div className="boot-lines" aria-label="Hermes boot messages">
              {introStep.telemetry.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
            <div className="intro-actions">
              <button type="button" onClick={advanceIntro}>
                {isLastIntroStep ? "START INVESTIGATION" : "NEXT SIGNAL"}
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setShowOpening(false)}
              >
                SKIP INTRO
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {isBlackout ? (
        <section className="system-alert blackout-alert" aria-label="Blackout warning">
          <strong>BLACKOUT</strong>
          <span>Terminal interaction unstable. Wrong submissions have collapsed the power grid.</span>
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
          <div className="meter">
            <span style={{ width: `${resourceState.oxygen}%` }} />
          </div>
        </div>
        <div className="hud-card">
          <span>POWER GRID / {powerState.name}</span>
          <strong>{resourceState.power}%</strong>
          <div className="meter meter-blue">
            <span style={{ width: `${resourceState.power}%` }} />
          </div>
        </div>
        <div className="hud-card alert-card">
          <span>VISUAL FEEDBACK</span>
          <strong>{isEndingReady ? "DOOR OPEN" : isBlackout ? "BLACKOUT" : powerState.name}</strong>
          <small>
            {isEndingReady
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
      </section>

      <section className="terminal-grid" aria-label="Hermes OS work area">
        <aside className="panel explorer-panel">
          <div className="panel-header">
            <span>FILE EXPLORER</span>
            <code>HERMES://ROOT</code>
          </div>
          <nav className="file-tree" aria-label="Category A file explorer">
            {visibleDirectories.map((directoryPath) => {
              const directory = categoryADirectories.find(
                (candidate) => candidate.path === directoryPath,
              );
              const locked = isDirectoryLocked(directoryPath);

              return (
                <div className="file-group" key={directoryPath}>
                  <p>
                    {directoryPath}
                    {locked ? <span className="status-pill locked-pill">LOCKED</span> : null}
                  </p>
                  {getCategoryAFilesByDirectory(directoryPath).map((file) => {
                    const runtimeState = getRuntimeState(file.id);
                    const disabled = locked;

                    return (
                      <button
                        className={`file-row ${
                          selectedFileId === file.id ? "selected-file" : ""
                        } ${runtimeState === "corrupted" ? "corrupted-file" : ""}`}
                        disabled={disabled}
                        type="button"
                        key={file.id}
                        onClick={() => selectAndAttachFile(file.id)}
                      >
                        <span className="file-icon">{runtimeState === "recovered" ? "◆" : "▣"}</span>
                        <span>{file.name}</span>
                        <small>{disabled ? "locked" : runtimeState}</small>
                      </button>
                    );
                  })}
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
                        <button type="submit" disabled={unlockedSecurity}>
                          {unlockedSecurity ? "OPEN" : "UNLOCK"}
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
          <div className="panel-header">
            <span>FILE VIEWER</span>
            <code>{selectedFile?.name ?? "NO FILE"}</code>
          </div>
          {selectedFile ? (
            <article className="log-document">
              <p className="log-kicker">
                {selectedFile.kind.toUpperCase()} / {getRuntimeState(selectedFile.id).toUpperCase()}
              </p>
              <h2>{selectedFile.title}</h2>
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
                    Log_Fixer.exe restores its contents.
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
                  </div>
                  <button
                    type="button"
                    onClick={recoverQuarantineRules}
                    disabled={isQuarantineRecovered}
                  >
                    {isQuarantineRecovered ? "RECOVERED" : "RUN LOG_FIXER"}
                  </button>
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
            <div className="attached-files" aria-label="Attached evidence files">
              {attachedFileIds.length > 0 ? (
                attachedFileIds.map((fileId) => {
                  const file = getCategoryAFileById(fileId);

                  return (
                    <button
                      className="context-chip"
                      type="button"
                      key={fileId}
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
            />
            <button type="submit" disabled={stage === "ending-ready"}>
              {stage === "ending-ready" ? "UNLOCK READY" : "SUBMIT"}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}

export default App;
