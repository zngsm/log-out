import { SpaceshipComputerScene } from "./game/SpaceshipComputerScene";

const fileTree = [
  {
    section: "/Logs/Sensors",
    files: ["sensor_calib.log", "thermal_reading.cache", "bio_scan_delta.tmp"],
  },
  {
    section: "/System/Security",
    files: ["quarantine_rules.conf", "access_manifest.lock"],
  },
  {
    section: "/Utilities",
    files: ["Log_Fixer.exe", "checksum_viewer.sys"],
  },
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
    text: "증거 컨텍스트 수신. 격리 판정 검증을 위해 추가 근거를 제출하십시오.",
  },
];

function App() {
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
          <span>ECHO STATUS</span>
          <strong>LOCKDOWN</strong>
          <small>Act 1: sensor proof required</small>
        </div>
      </section>

      <section className="terminal-grid" aria-label="Hermes OS work area">
        <aside className="panel explorer-panel">
          <div className="panel-header">
            <span>FILE EXPLORER</span>
            <code>HERMES://ROOT</code>
          </div>
          <nav className="file-tree" aria-label="File explorer placeholder">
            {fileTree.map((group) => (
              <div className="file-group" key={group.section}>
                <p>{group.section}</p>
                {group.files.map((file) => (
                  <button className="file-row" type="button" key={file}>
                    <span className="file-icon">▣</span>
                    {file}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <section className="panel file-viewer">
          <div className="panel-header">
            <span>FILE VIEWER</span>
            <code>sensor_calib.log</code>
          </div>
          <article className="log-document">
            <p className="log-kicker">CALIBRATION REPORT / READ ONLY</p>
            <h2>Thermal Sensor Calibration Drift</h2>
            <dl>
              <div>
                <dt>Last Calibration</dt>
                <dd>2026-01-10 09:00:00</dd>
              </div>
              <div>
                <dt>Elapsed</dt>
                <dd>186 days</dd>
              </div>
              <div>
                <dt>Thermal Offset</dt>
                <dd>+2.3°C false-positive range</dd>
              </div>
            </dl>
            <pre>{`[WARN] Bio-hazard lock may be based on stale thermal data.
[ACTION] Attach this file to ECHO and explain calibration drift.`}</pre>
          </article>
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
            <span className="context-chip">@sensor_calib.log</span>
            <input
              aria-label="ECHO message"
              value="센서 보정 오차와 186일 미보정 기록을 제출합니다."
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
