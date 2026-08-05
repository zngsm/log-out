import { useState, type FormEvent } from "react";
import {
  CATEGORY_A_DIRECTORY_PATHS,
  CATEGORY_A_FILE_IDS,
  CATEGORY_A_SECURITY_PASSWORD,
  type CategoryAFileId,
  categoryADirectories,
  getCategoryAFileById,
  getCategoryAFilesByDirectory,
} from "./game/categoryAFileSystem";
import { SpaceshipComputerScene } from "./game/SpaceshipComputerScene";

const visibleDirectories = [
  CATEGORY_A_DIRECTORY_PATHS.logsSensors,
  CATEGORY_A_DIRECTORY_PATHS.personnelDrKim,
  CATEGORY_A_DIRECTORY_PATHS.personnelEngineerPark,
  CATEGORY_A_DIRECTORY_PATHS.utilities,
  CATEGORY_A_DIRECTORY_PATHS.systemSecurity,
  CATEGORY_A_DIRECTORY_PATHS.recycleBin,
];

const echoMessages = [
  {
    speaker: "ECHO",
    text: "지침 101조: 외부 위험으로부터 승무원을 보호합니다. 당신은 지금 위험 상태입니다.",
  },
  {
    speaker: "PLAYER",
    text: "@sensor_calib.log 체온 센서 보정 로그를 확인하겠습니다.",
  },
  {
    speaker: "ECHO",
    text: "증거 컨텍스트 수신. Act 2 보안 규칙 증거는 복구된 파일만 허용됩니다.",
  },
];

function App() {
  const [selectedFileId, setSelectedFileId] = useState<CategoryAFileId>(
    CATEGORY_A_FILE_IDS.sensorCalibLog,
  );
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [unlockedSecurity, setUnlockedSecurity] = useState(false);
  const [recoveredFileIds, setRecoveredFileIds] = useState<Set<CategoryAFileId>>(
    () => new Set(),
  );

  const selectedFile = getCategoryAFileById(selectedFileId);
  const quarantineRules = getCategoryAFileById(CATEGORY_A_FILE_IDS.quarantineRules);
  const isQuarantineRecovered = recoveredFileIds.has(CATEGORY_A_FILE_IDS.quarantineRules);
  const selectedIsRecovered = recoveredFileIds.has(selectedFileId);
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

    return getCategoryAFileById(fileId)?.initialState ?? "locked";
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordInput.trim() !== CATEGORY_A_SECURITY_PASSWORD) {
      setPasswordError("ACCESS DENIED / Dr_Kim email_chain_july.txt에서 4자리 코드를 확인하세요.");
      return;
    }

    setUnlockedSecurity(true);
    setPasswordError("");
    setSelectedFileId(CATEGORY_A_FILE_IDS.quarantineRules);
  }

  function recoverQuarantineRules() {
    if (!unlockedSecurity) {
      setPasswordError("RECOVERY BLOCKED / 먼저 /System/Security 비밀번호를 해제해야 합니다.");
      return;
    }

    setRecoveredFileIds((current) => {
      const next = new Set(current);
      next.add(CATEGORY_A_FILE_IDS.quarantineRules);
      return next;
    });
    setSelectedFileId(CATEGORY_A_FILE_IDS.quarantineRules);
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
          <span>SESSION</span>
          <strong>59:42</strong>
        </div>
      </section>

      <section className="hud-grid" aria-label="Resource HUD">
        <div className="hud-card">
          <span>O₂ LEVEL</span>
          <strong>100%</strong>
          <div className="meter">
            <span style={{ width: "100%" }} />
          </div>
        </div>
        <div className="hud-card">
          <span>POWER GRID</span>
          <strong>100%</strong>
          <div className="meter meter-blue">
            <span style={{ width: "100%" }} />
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
                        onClick={() => setSelectedFileId(file.id)}
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
          <div className="message-list" aria-label="ECHO chat placeholder">
            {echoMessages.map((message, index) => (
              <div
                className={`message ${
                  message.speaker === "PLAYER" ? "player-message" : ""
                }`}
                key={`${message.speaker}-${index}`}
              >
                <span>{message.speaker}</span>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <form className="chat-input" aria-label="Evidence input placeholder">
            <span className="context-chip">@{selectedFile?.name ?? "no_file"}</span>
            <input
              aria-label="ECHO message"
              value={
                isQuarantineRecovered
                  ? "복구된 quarantine_rules.conf의 72시간 격리 만료 근거를 제출합니다."
                  : "Act 2 증거 제출 전 Log_Fixer.exe로 파일을 복구해야 합니다."
              }
              readOnly
            />
            <button type="button">SUBMIT</button>
          </form>
        </aside>
      </section>
    </main>
  );
}

export default App;
