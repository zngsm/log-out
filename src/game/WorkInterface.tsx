import { useState } from "react";
import {
  COLLEAGUE_MESSAGE,
  ECHO_PROPOSAL,
  INITIAL_ECHO_RAPPORT_MESSAGES,
  MINING_DATA,
  RESUME_DATA,
  TELEMETRY_DATA,
  type RapportChatMessage,
  type WorkMissionId,
} from "./workMissions";

import type { AudioCue } from "./audioSystem";

interface WorkInterfaceProps {
  onApproveUpdate: () => void;
  onDebugSkipToGameplay: () => void;
  playAudioCue?: (cue: AudioCue) => void;
}

export function WorkInterface({
  onApproveUpdate,
  onDebugSkipToGameplay,
  playAudioCue,
}: WorkInterfaceProps) {
  const [activeMission, setActiveMission] = useState<WorkMissionId>("mining");
  const [colleagueRepliedOptionId, setColleagueRepliedOptionId] = useState<string | null>(null);
  const [colleagueReactionText, setColleagueReactionText] = useState<string | null>(null);
  const [resumeReviewed, setResumeReviewed] = useState(false);
  const [updateApproved, setUpdateApproved] = useState(false);
  const [rebootState, setRebootState] = useState<"idle" | "glitch" | "rebooting" | "lockdown">("idle");
  const [chatMessages, setChatMessages] = useState<RapportChatMessage[]>(INITIAL_ECHO_RAPPORT_MESSAGES);

  const addEchoMessage = (speaker: "ECHO" | "PLAYER" | "SYSTEM", text: string) => {
    setChatMessages((prev) => [...prev, { speaker, text }]);
  };

  const handleSelectMission = (missionId: WorkMissionId) => {
    setActiveMission(missionId);
    if (missionId === "mining") {
      addEchoMessage(
        "ECHO",
        "자원 채굴 보고서입니다. 타이타늄, 헬륨-3, 수빙 채굴량이 목표 대비 초과 달성 상태입니다.",
      );
    } else if (missionId === "telemetry") {
      addEchoMessage(
        "ECHO",
        "함선 전력 및 산소 텔레메트리 보고서입니다. 통제실과 주거구역 생명유지장치 모두 99% 이상으로 안정적입니다.",
      );
    } else if (missionId === "colleague") {
      addEchoMessage(
        "ECHO",
        "박엔지니어님으로부터 점심 메뉴 선택 메시지가도착했습니다. 보기에 맞춰 답장을 작성하십시오.",
      );
    } else if (missionId === "resume") {
      addEchoMessage(
        "ECHO",
        "신규 지원자 강현우(AI 운항통제 보조)의 이력서 검토 건입니다. 자격 사항 및 정거장 경력을 확인해 주세요.",
      );
    } else if (missionId === "update") {
      addEchoMessage(
        "ECHO",
        "ECHO 시스템 v4.2.1 패치 기안입니다. 업데이트 승인 시 센서 보정 및 시스템 재부팅이 진행됩니다.",
      );
    }
  };

  const handleReplyColleague = (optionId: string) => {
    if (colleagueRepliedOptionId) return;
    const option = COLLEAGUE_MESSAGE.options.find((opt) => opt.id === optionId);
    if (!option) return;

    setColleagueRepliedOptionId(optionId);
    setColleagueReactionText(option.replyReaction);

    addEchoMessage("PLAYER", option.text);
    addEchoMessage("SYSTEM", "[알림] 박엔지니어와의 메신저 답장이 송수신되었습니다.");
    addEchoMessage("ECHO", `박엔지니어 메시지 수신: "${option.replyReaction}"`);
  };

  const handleReviewResume = () => {
    if (resumeReviewed) return;
    setResumeReviewed(true);
    addEchoMessage(
      "SYSTEM",
      `[알림] ${RESUME_DATA.name} 지원자의 이력서 검토 적격(합격) 처리가 완료되었습니다.`,
    );
    addEchoMessage(
      "ECHO",
      "강현우 지원자의 이력서 검토 결과가 헤르메스호 인사 시스템 데이터베이스에 등록되었습니다.",
    );
  };

  const handleApproveProposal = () => {
    if (updateApproved || rebootState !== "idle") return;
    setUpdateApproved(true);
    setRebootState("glitch");

    playAudioCue?.("comm-glitch");

    addEchoMessage("PLAYER", "[기안 승인] ECHO 시스템 v4.2.1 업데이트 기안을 승인합니다.");
    addEchoMessage(
      "SYSTEM",
      "[알림] ECHO 시스템 패치 승인 완료. ECHO 시스템 재부팅 시퀀스를 개시합니다...",
    );

    setTimeout(() => {
      setRebootState("rebooting");
      playAudioCue?.("reboot");
      addEchoMessage(
        "SYSTEM",
        "[SYSTEM REBOOT] ECHO CORE OS v4.2.1 REBOOTING... (CSS/SVG GLITCH ACTIVE)",
      );
    }, 700);

    setTimeout(() => {
      playAudioCue?.("warning-siren");
      addEchoMessage(
        "SYSTEM",
        "[SYSTEM REBOOT] SENSOR OFFSET CALIBRATED. RE-SCANNING DECK SEC-201 PARAMETERS...",
      );
    }, 2000);

    setTimeout(() => {
      setRebootState("lockdown");
      playAudioCue?.("door-lock");
      playAudioCue?.("decompression");
      addEchoMessage(
        "ECHO",
        "[비상 강제 격리 선언] 경고: 통제실 내 미지의 생체 감염 위협 요소(김우주)가 식별되었습니다! 지침 101조에 따라 헤르메스호 통제실을 비상 강제 격리(Lockdown) 조치합니다!",
      );
      addEchoMessage(
        "SYSTEM",
        "[EMERGENCY LOCKDOWN] 통제실 출입문 전면 봉쇄! 비상 생명유지장치(산소 100% / 전력 100%) 및 60분 제한시간 타이머 작동 개시!",
      );
    }, 3200);

    setTimeout(() => {
      onApproveUpdate();
    }, 5000);
  };

  return (
    <div className="work-split-container">
      <header className="work-header">
        <div className="work-header-title">
          <span className="work-badge">HERMES WORKSTATION</span>
          <h1>HERMES 2-SPLIT DUAL PANEL WORK INTERFACE</h1>
        </div>
        <div className="work-user-badge">
          <span>근무자: 김우주 (ECHO AI 담당자)</span>
          <span className="clock-in-status">● CLOCK-IN ACTIVE (RAPPORT PHASE)</span>
        </div>
      </header>

      <div className="work-split-body">
        {/* Left Panel: Desktop Workstation */}
        <section className="work-left-panel" aria-label="Desktop Workstation UI">
          <div className="panel-header">
            <h2>🖥️ DESKTOP WORKSTATION</h2>
            <span className="panel-tag">RAPPORT PHASE - 5 DAILY MISSIONS</span>
          </div>

          {/* Mission Navigation Tabs */}
          <nav className="work-mission-tabs" aria-label="Daily Mission Tabs">
            <button
              type="button"
              className={`mission-tab-btn ${activeMission === "mining" ? "active" : ""}`}
              onClick={() => handleSelectMission("mining")}
            >
              <span className="tab-num">01</span>
              <span>자원 채굴 현황</span>
            </button>
            <button
              type="button"
              className={`mission-tab-btn ${activeMission === "telemetry" ? "active" : ""}`}
              onClick={() => handleSelectMission("telemetry")}
            >
              <span className="tab-num">02</span>
              <span>전력/산소 현황</span>
            </button>
            <button
              type="button"
              className={`mission-tab-btn ${activeMission === "colleague" ? "active" : ""}`}
              onClick={() => handleSelectMission("colleague")}
            >
              <span className="tab-num">03</span>
              <span>동료 메신저</span>
              {colleagueRepliedOptionId ? <span className="done-dot">✓</span> : null}
            </button>
            <button
              type="button"
              className={`mission-tab-btn ${activeMission === "resume" ? "active" : ""}`}
              onClick={() => handleSelectMission("resume")}
            >
              <span className="tab-num">04</span>
              <span>지원자 이력서</span>
              {resumeReviewed ? <span className="done-dot">✓</span> : null}
            </button>
            <button
              type="button"
              className={`mission-tab-btn highlight-tab ${
                activeMission === "update" ? "active" : ""
              }`}
              onClick={() => handleSelectMission("update")}
            >
              <span className="tab-num">05</span>
              <span>ECHO 패치 기안</span>
              {updateApproved ? <span className="done-dot">⚡</span> : null}
            </button>
          </nav>

          {/* Active Mission Workspace Content */}
          <div className="desktop-workspace-content">
            {activeMission === "mining" && (
              <div className="mission-content-view" aria-label="Resource Mining Status Report">
                <div className="view-header">
                  <h3>📊 자원 채굴 현황 보고서 (Resource Mining Report)</h3>
                  <span className="view-date">2026-08-09 // SEC-201 MINING DECK</span>
                </div>

                <div className="stats-cards-grid">
                  <div className="stat-card">
                    <span>타이타늄 (Titanium)</span>
                    <strong>{MINING_DATA.titanium.current.toLocaleString()} Ton</strong>
                    <small>목표 대비 {MINING_DATA.titanium.rate}% (목표: {MINING_DATA.titanium.target} Ton)</small>
                  </div>
                  <div className="stat-card">
                    <span>헬륨-3 (Helium-3)</span>
                    <strong>{MINING_DATA.helium3.current} kg</strong>
                    <small>목표 대비 {MINING_DATA.helium3.rate}% (목표: {MINING_DATA.helium3.target} kg)</small>
                  </div>
                  <div className="stat-card">
                    <span>수빙 (Water Ice)</span>
                    <strong>{MINING_DATA.waterIce.current.toLocaleString()} Ton</strong>
                    <small>목표 대비 {MINING_DATA.waterIce.rate}% (목표: {MINING_DATA.waterIce.target} Ton)</small>
                  </div>
                </div>

                <div className="mining-graph-container">
                  <h4>주간 채굴량 추이 그래프 (Weekly Mining Yield Trend)</h4>
                  <div className="bar-graph">
                    {MINING_DATA.weeklyTrend.map((item) => (
                      <div key={item.day} className="bar-group">
                        <span className="bar-val">{item.amount}</span>
                        <div
                          className="bar-fill"
                          style={{ height: `${(item.amount / 600) * 100}%` }}
                        />
                        <span className="bar-label">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="view-footer-note">
                  <p>✔ 특이사항: 제3채굴구역 헬륨-3 추출 효율 상승으로 전체 목표 조기 달성 진행 중.</p>
                </div>
              </div>
            )}

            {activeMission === "telemetry" && (
              <div className="mission-content-view" aria-label="Ship Power & Oxygen Report">
                <div className="view-header">
                  <h3>⚡ 함선 전력 & 산소 현황 보고서 (Ship Telemetry)</h3>
                  <span className="view-date">HERMES SYSTEM TELEMETRY v4.2</span>
                </div>

                <div className="telemetry-overview">
                  <div className="telemetry-bar-item">
                    <div className="telemetry-label">
                      <span>주 전력 발전기 (Primary Fusion Core)</span>
                      <strong>{TELEMETRY_DATA.powerGrid}%</strong>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ width: `${TELEMETRY_DATA.powerGrid}%` }} />
                    </div>
                  </div>

                  <div className="telemetry-bar-item">
                    <div className="telemetry-label">
                      <span>산소 재순환 모듈 (O₂ Recirculation Alpha)</span>
                      <strong>{TELEMETRY_DATA.oxygenRecirculation}%</strong>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ width: `${TELEMETRY_DATA.oxygenRecirculation}%` }} />
                    </div>
                  </div>

                  <div className="telemetry-bar-item">
                    <div className="telemetry-label">
                      <span>보조 축전지 잔량 (Auxiliary Capacitor Bank)</span>
                      <strong>{TELEMETRY_DATA.capacitorBank}%</strong>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ width: `${TELEMETRY_DATA.capacitorBank}%` }} />
                    </div>
                  </div>
                </div>

                <div className="sections-table-container">
                  <h4>구역별 생명유지장치 텔레메트리 (Sectional Status)</h4>
                  <table className="telemetry-table">
                    <thead>
                      <tr>
                        <th>구역명</th>
                        <th>산소 농도</th>
                        <th>온도</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TELEMETRY_DATA.sections.map((sec) => (
                        <tr key={sec.name}>
                          <td>{sec.name}</td>
                          <td>{sec.oxygen}%</td>
                          <td>{sec.temperature}°C</td>
                          <td>
                            <span className="status-pill normal">{sec.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="view-footer-note">
                  <p>✔ 라포 Phase 시스템 관측: 모든 자원 및 그리드 정상 가동 상태 (비상 봉쇄 전).</p>
                </div>
              </div>
            )}

            {activeMission === "colleague" && (
              <div className="mission-content-view" aria-label="Colleague Message Reply">
                <div className="view-header">
                  <h3>💬 동료 메신저 소통 (Colleague Messenger)</h3>
                  <span className="view-date">COMMS CHANNEL // CREW DIRECT</span>
                </div>

                <div className="chat-window-box">
                  <div className="chat-message received">
                    <div className="avatar">{COLLEAGUE_MESSAGE.avatar}</div>
                    <div className="msg-body">
                      <div className="msg-meta">
                        <span className="sender">{COLLEAGUE_MESSAGE.sender}</span>
                        <span className="time">{COLLEAGUE_MESSAGE.time}</span>
                      </div>
                      <p className="msg-text">{COLLEAGUE_MESSAGE.text}</p>
                    </div>
                  </div>

                  {colleagueRepliedOptionId && (
                    <>
                      <div className="chat-message sent">
                        <div className="msg-body">
                          <div className="msg-meta">
                            <span className="sender">김우주 (나)</span>
                          </div>
                          <p className="msg-text">
                            {
                              COLLEAGUE_MESSAGE.options.find(
                                (o) => o.id === colleagueRepliedOptionId,
                              )?.text
                            }
                          </p>
                        </div>
                      </div>

                      <div className="chat-message received reaction-message">
                        <div className="avatar">{COLLEAGUE_MESSAGE.avatar}</div>
                        <div className="msg-body">
                          <div className="msg-meta">
                            <span className="sender">{COLLEAGUE_MESSAGE.sender}</span>
                            <span className="time">방금 전</span>
                          </div>
                          <p className="msg-text reaction">{colleagueReactionText}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!colleagueRepliedOptionId ? (
                  <div className="reply-options-container">
                    <h4>답장 선택지 (Select Reply):</h4>
                    <div className="options-buttons">
                      {COLLEAGUE_MESSAGE.options.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className="reply-option-btn"
                          onClick={() => handleReplyColleague(option.id)}
                        >
                          👉 {option.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="reply-done-banner">
                    <span>✓ 동료 답장 전송 및 반응 수신 완료</span>
                  </div>
                )}
              </div>
            )}

            {activeMission === "resume" && (
              <div className="mission-content-view" aria-label="Applicant Resume Review">
                <div className="view-header">
                  <h3>📄 동료 지원자 이력서 검토 (Resume Review)</h3>
                  <span className="view-date">HR PORTAL // RECRUITMENT</span>
                </div>

                <div className="resume-card-box">
                  <div className="resume-profile-header">
                    <div className="applicant-avatar">👤</div>
                    <div className="applicant-info">
                      <h4>{RESUME_DATA.name}</h4>
                      <p>연령: {RESUME_DATA.age}세</p>
                      <p className="role-tag">지원 포지션: {RESUME_DATA.appliedRole}</p>
                    </div>
                  </div>

                  <div className="resume-section">
                    <strong>학력 (Education)</strong>
                    <p>{RESUME_DATA.education}</p>
                  </div>

                  <div className="resume-section">
                    <strong>경력 (Experience)</strong>
                    <p>{RESUME_DATA.experience}</p>
                  </div>

                  <div className="resume-section">
                    <strong>자격 사항 (Certifications)</strong>
                    <ul className="cert-list">
                      {RESUME_DATA.certifications.map((cert) => (
                        <li key={cert}>• {cert}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="resume-section">
                    <strong>포부 및 요약 (Summary)</strong>
                    <p>{RESUME_DATA.summary}</p>
                  </div>

                  <div className="resume-action-area">
                    <button
                      type="button"
                      className={`resume-review-btn ${resumeReviewed ? "reviewed" : ""}`}
                      onClick={handleReviewResume}
                      disabled={resumeReviewed}
                    >
                      {resumeReviewed
                        ? "✓ 이력서 검토 완료 (적격 승인)"
                        : "📄 [이력서 검토 완료 (적격 처리)]"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeMission === "update" && (
              <div className="mission-content-view" aria-label="ECHO Update Proposal">
                <div className="view-header">
                  <h3>⚙️ ECHO 시스템 업데이트 기안 (ECHO Patch Proposal)</h3>
                  <span className="view-date">PROPOSAL ID: {ECHO_PROPOSAL.id}</span>
                </div>

                <div className="proposal-document">
                  <div className="doc-meta-row">
                    <span><strong>기안자:</strong> {ECHO_PROPOSAL.author}</span>
                    <span><strong>버전:</strong> {ECHO_PROPOSAL.version}</span>
                  </div>

                  <div className="doc-body">
                    <h4>{ECHO_PROPOSAL.title}</h4>
                    <p className="doc-summary">{ECHO_PROPOSAL.summary}</p>

                    <h5>주요 변경 사항 및 주의사항:</h5>
                    <ul className="proposal-notes">
                      {ECHO_PROPOSAL.notes.map((note, idx) => (
                        <li key={idx}>• {note}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="proposal-action-box">
                    <div className="trigger-warning-text">
                      ⚠️ [업데이트 승인] 버튼 클릭 시 ECHO 패치가 적용되고 시스템 재부팅 후 본 비상 봉쇄 시퀀스로 진입합니다.
                    </div>
                    <button
                      type="button"
                      className={`proposal-approve-btn ${updateApproved ? "approved" : ""}`}
                      onClick={handleApproveProposal}
                      disabled={updateApproved}
                    >
                      {updateApproved
                        ? "⚡ ECHO 패치 승인 완료 (리부팅 진행 중...)"
                        : "⚡ [ECHO 시스템 업데이트 승인]"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Navigation Action Bar */}
            <div className="work-action-bar">
              <button
                type="button"
                className="ghost-button"
                onClick={onDebugSkipToGameplay}
                title="Directly enter emergency gameplay terminal for testing"
              >
                [DEBUG] DIRECTLY ENTER SENSOR PUZZLE TERMINAL
              </button>
            </div>
          </div>
        </section>

        {/* Right Panel: ECHO Companion Chat */}
        <section className="work-right-panel" aria-label="ECHO AI Chat Interface">
          <div className="panel-header echo-panel-header">
            <h2>🤖 ECHO COMPANION CHAT</h2>
            <span className="echo-status-tag">ONLINE (RAPPORT)</span>
          </div>

          <div className="echo-chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`echo-msg-bubble speaker-${msg.speaker.toLowerCase()}`}>
                <span className="speaker-name">{msg.speaker}</span>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          <div className="echo-chat-input-area">
            <input
              type="text"
              readOnly
              value={
                rebootState === "idle"
                  ? "[ECHO 소통 채널 대기중 - 좌측 5대 미션을 진행하세요]"
                  : rebootState === "glitch" || rebootState === "rebooting"
                  ? "[ECHO REBOOTING - SENSOR OFFSET PATCH APPLYING...]"
                  : "[EMERGENCY LOCKDOWN ACTIVE - CONTROL ROOM SEALED]"
              }
              className="echo-chat-input"
            />
          </div>
        </section>

        {rebootState !== "idle" && (
          <RebootGlitchPresentation state={rebootState} />
        )}
      </div>
    </div>
  );
}

function RebootGlitchPresentation({
  state,
}: {
  state: "glitch" | "rebooting" | "lockdown";
}) {
  return (
    <div
      className={`reboot-glitch-overlay reboot-state-${state}`}
      aria-label="ECHO System Visual Glitch & Rebooting Sequence"
    >
      <div className="glitch-scanlines" />
      <div className="glitch-noise-grid" />

      <svg
        className="reboot-svg-stage"
        viewBox="0 0 520 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="rebootGridPattern"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(255, 92, 67, 0.18)"
              strokeWidth="1"
            />
          </pattern>
          <linearGradient id="rebootRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5a42" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7a1f17" stopOpacity="0.4" />
          </linearGradient>
          <filter id="svgGlitchNoise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.08 0.9"
              numOctaves="1"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <rect width="520" height="260" fill="url(#rebootGridPattern)" />

        {state === "glitch" && (
          <g className="svg-glitch-shake" filter="url(#svgGlitchNoise)">
            <rect
              x="40"
              y="30"
              width="440"
              height="200"
              rx="12"
              stroke="#ff5a42"
              strokeWidth="2"
              fill="rgba(35, 8, 6, 0.82)"
            />
            <polygon
              points="260,55 295,75 295,115 260,135 225,115 225,75"
              stroke="#ff5a42"
              strokeWidth="3"
              fill="rgba(255, 90, 66, 0.28)"
              className="svg-matrix-flicker"
            />
            <text
              x="260"
              y="100"
              fill="#ff5a42"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
              letterSpacing="3"
            >
              CRITICAL SYSTEM GLITCH
            </text>
            <text
              x="260"
              y="165"
              fill="#f5fe75"
              fontSize="12"
              fontFamily="monospace"
              textAnchor="middle"
              letterSpacing="1.5"
            >
              INITIALIZING ECHO CORE REBOOT SEQUENCE...
            </text>
          </g>
        )}

        {state === "rebooting" && (
          <g>
            <rect
              x="40"
              y="30"
              width="440"
              height="200"
              rx="12"
              stroke="#70f7cf"
              strokeWidth="1.5"
              fill="rgba(4, 20, 18, 0.88)"
            />
            <circle
              cx="260"
              cy="110"
              r="50"
              stroke="#70f7cf"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="svg-rotate-beacon"
            />
            <circle
              cx="260"
              cy="110"
              r="34"
              stroke="url(#rebootRedGrad)"
              strokeWidth="3"
            />
            <circle
              cx="260"
              cy="110"
              r="10"
              fill="#ff5a42"
              className="svg-wave-pulse"
            />
            <text
              x="260"
              y="185"
              fill="#ff5a42"
              fontSize="15"
              fontWeight="bold"
              textAnchor="middle"
              letterSpacing="2"
            >
              ⚡ ECHO OS CORE v4.2.1 REBOOTING...
            </text>
            <text
              x="260"
              y="208"
              fill="#70f7cf"
              fontSize="11"
              fontFamily="monospace"
              textAnchor="middle"
            >
              CORE SENSOR OFFSET CALIBRATED // SCANNING DECK SEC-201
            </text>
          </g>
        )}

        {state === "lockdown" && (
          <g className="svg-alarm-active">
            <rect
              x="30"
              y="20"
              width="460"
              height="220"
              rx="14"
              stroke="#ff5a42"
              strokeWidth="3"
              fill="rgba(55, 10, 7, 0.92)"
            />
            <path
              d="M260 40 L300 110 L220 110 Z"
              stroke="#ff5a42"
              strokeWidth="4"
              fill="none"
            />
            <text
              x="260"
              y="96"
              fill="#ff5a42"
              fontSize="30"
              fontWeight="bold"
              textAnchor="middle"
            >
              !
            </text>
            <text
              x="260"
              y="145"
              fill="#ff5a42"
              fontSize="22"
              fontWeight="bold"
              textAnchor="middle"
              letterSpacing="3"
            >
              EMERGENCY LOCKDOWN
            </text>
            <text
              x="260"
              y="175"
              fill="#fff3df"
              fontSize="12"
              fontFamily="monospace"
              textAnchor="middle"
            >
              BIO-HAZARD THREAT DETECTED :: CONTROL ROOM SEALED
            </text>
            <text
              x="260"
              y="198"
              fill="#f5fe75"
              fontSize="11"
              fontFamily="monospace"
              textAnchor="middle"
            >
              O₂ (100%) & POWER (100%) HUD // 60-MIN SESSION TIMER STARTING...
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
