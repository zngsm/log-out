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

  const selectedFile = getCategoryAFileById(selectedFileId);
  const quarantineRules = getCategoryAFileById(CATEGORY_A_FILE_IDS.quarantineRules);
  const isQuarantineRecovered = recoveredFileIds.has(CATEGORY_A_FILE_IDS.quarantineRules);
  const selectedIsRecovered = recoveredFileIds.has(selectedFileId);
  const powerState = getPowerState(resourceState.power);
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

  return (
    <main className="game-shell">
      <section className="scene-backdrop" aria-label="Hermes control room 3D placeholder">
        <SpaceshipComputerScene />
      </section>

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
