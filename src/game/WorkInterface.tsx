import { useEffect, useRef, useState } from "react";
import {
  ECHO_PROPOSAL,
  INITIAL_ECHO_RAPPORT_MESSAGES,
  MINING_DATA,
  RESUME_CANDIDATES,
  TELEMETRY_DATA,
  type RapportChatMessage,
} from "./workMissions";
import { sendNpcMessage } from "../api/npcApiClient";

import type { AudioCue } from "./audioSystem";

interface WorkInterfaceProps {
  onApproveUpdate: () => void;
  onDebugSkipToGameplay: () => void;
  playAudioCue?: (cue: AudioCue) => void;
}

type WorkStep = "mining" | "telemetry" | "resume" | "update";

const WORK_STEPS: { id: WorkStep; name: string }[] = [
  { id: "mining", name: "자원 채굴 현황 보고서" },
  { id: "telemetry", name: "함선 전력 & 산소 현황 보고서" },
  { id: "resume", name: "지원자 이력서 검토" },
  { id: "update", name: "ECHO 시스템 업데이트 기안" },
];

export function WorkInterface({
  onApproveUpdate,
  onDebugSkipToGameplay,
  playAudioCue,
}: WorkInterfaceProps) {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const activeStep = WORK_STEPS[stepIndex].id;

  // Echo reaction tracking
  const [echoReactionsSent, setEchoReactionsSent] = useState<Record<string, number>>({});

  // Colleague messenger state
  const [messengerState, setMessengerState] = useState<{
    triggered: boolean;
    popupVisible: boolean;
    isOpen: boolean;
    isMinimized: boolean;
    messages: { sender: string; text: string; isReaction?: boolean; isUnread?: boolean }[];
    playerReplyCount: number;
    playerInput: string;
    isTyping?: boolean;
  }>({
    triggered: false,
    popupVisible: false,
    isOpen: false,
    isMinimized: false,
    messages: [
      { sender: "박엔지니어", text: "우주씨, 오늘 점심 뭐 드실래요?" },
    ],
    playerReplyCount: 0,
    playerInput: "",
    isTyping: false,
  });

  // Applicant evaluation decisions ('적격' | '부적격' | null for each candidate)
  const [candidateDecisions, setCandidateDecisions] = useState<Record<string, "Qualified" | "Unqualified" | null>>({
    "강현우 (Kang Hyun-woo)": null,
    "이서연 (Lee Seo-yeon)": null,
    "박준호 (Park Jun-ho)": null,
  });

  const isResumeIncomplete =
    activeStep === "resume" &&
    Object.values(candidateDecisions).some((d) => d === null);

  const [updateApproved, setUpdateApproved] = useState(false);
  const [rebootState, setRebootState] = useState<"idle" | "glitch" | "rebooting" | "lockdown">("idle");
  const [chatMessages, setChatMessages] = useState<RapportChatMessage[]>(INITIAL_ECHO_RAPPORT_MESSAGES);

  const chatMessagesRef = useRef<HTMLDivElement | null>(null);

  // Draggable Messenger App Modal state and refs bounded to Left Panel
  const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const leftPanelRef = useRef<HTMLElement | null>(null);
  const messengerModalRef = useRef<HTMLDivElement | null>(null);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".messenger-window-controls")) return;
    if (!messengerModalRef.current || !leftPanelRef.current) return;

    const modalRect = messengerModalRef.current.getBoundingClientRect();
    const panelRect = leftPanelRef.current.getBoundingClientRect();

    dragStartOffset.current = {
      x: e.clientX - modalRect.left,
      y: e.clientY - modalRect.top,
    };

    if (!modalPos) {
      setModalPos({
        x: modalRect.left - panelRect.left,
        y: modalRect.top - panelRect.top,
      });
    }

    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!leftPanelRef.current || !messengerModalRef.current) return;
      const panelRect = leftPanelRef.current.getBoundingClientRect();
      const modalRect = messengerModalRef.current.getBoundingClientRect();

      let newX = e.clientX - panelRect.left - dragStartOffset.current.x;
      let newY = e.clientY - panelRect.top - dragStartOffset.current.y;

      const maxX = panelRect.width - modalRect.width;
      const maxY = panelRect.height - modalRect.height;

      newX = Math.max(0, Math.min(newX, maxX > 0 ? maxX : 0));
      newY = Math.max(0, Math.min(newY, maxY > 0 ? maxY : 0));

      setModalPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const addEchoMessage = (speaker: "ECHO" | "PLAYER" | "SYSTEM", text: string) => {
    setChatMessages((prev) => [...prev, { speaker, text }]);
  };

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const chatMessagesElement = chatMessagesRef.current;

      if (!chatMessagesElement) {
        return;
      }

      chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    });
  }, [chatMessages.length]);

  // Real-time ECHO reaction dialogues while player reads reports (max 2 per report)
  useEffect(() => {
    if (activeStep === "mining" && !echoReactionsSent["mining"]) {
      const timer1 = setTimeout(() => {
        addEchoMessage("ECHO", "자원 채굴 데이터 반응: 타이타늄 및 헬륨-3 채굴량이 목표 대비 초과 달성 상태입니다.");
        playAudioCue?.("notification");
      }, 1200);

      const timer2 = setTimeout(() => {
        addEchoMessage("ECHO", "자원 채굴 데이터 반응: 현재 추세라면 이번 주 채굴 목표를 조기 달성할 수 있습니다.");
        playAudioCue?.("notification");
        setEchoReactionsSent((prev) => ({ ...prev, mining: 2 }));
      }, 3500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }

    if (activeStep === "telemetry" && !echoReactionsSent["telemetry"]) {
      const timer1 = setTimeout(() => {
        addEchoMessage("ECHO", "전력/산소 데이터 반응: 통제실 및 주거구역 생명유지장치가 99% 이상으로 매우 안정적입니다.");
        playAudioCue?.("notification");
      }, 1200);

      const timer2 = setTimeout(() => {
        addEchoMessage("ECHO", "전력/산소 데이터 반응: 모든 구역의 생명유지장치 텔레메트리가 정상 범주를 유지하고 있습니다.");
        playAudioCue?.("notification");
        setEchoReactionsSent((prev) => ({ ...prev, telemetry: 2 }));
      }, 3500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [activeStep, echoReactionsSent]);

  // Random trigger for Colleague Messenger Popup during telemetry or resume review
  useEffect(() => {
    if ((activeStep === "telemetry" || activeStep === "resume") && !messengerState.triggered) {
      // 50% random chance or trigger after brief reading time
      const timer = setTimeout(() => {
        setMessengerState((prev) => ({
          ...prev,
          triggered: true,
          popupVisible: true,
        }));
        playAudioCue?.("comm-glitch");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [activeStep, messengerState.triggered]);


  // Handle [확인 완료] Confirmation Complete button transition
  const handleConfirmComplete = () => {
    if (stepIndex < WORK_STEPS.length - 1) {
      const nextStepIndex = stepIndex + 1;
      const nextStepName = WORK_STEPS[nextStepIndex].name;
      addEchoMessage("ECHO", `다음 업무는 [${nextStepName}]입니다. 보여드릴게요.`);
      playAudioCue?.("notification");
      setStepIndex(nextStepIndex);
    }
  };

  // Messenger actions
  const handleOpenMessenger = () => {
    setMessengerState((prev) => ({
      ...prev,
      popupVisible: false,
      isOpen: true,
      isMinimized: false,
    }));
  };

  const handleMinimizeMessenger = () => {
    setMessengerState((prev) => ({
      ...prev,
      isOpen: false,
      isMinimized: true,
    }));
  };

  const handleSendMessengerReply = async (e?: React.SyntheticEvent) => {
    if (e && "nativeEvent" in e && (e.nativeEvent as KeyboardEvent).isComposing) {
      return;
    }
    const text = messengerState.playerInput.trim();
    if (!text || messengerState.isTyping) return;

    setMessengerState((prev) => ({ ...prev, playerInput: "" }));

    if (messengerState.playerReplyCount === 0) {
      // First reply: Send to Cloudflare Worker NPC API and show typing state
      setMessengerState((prev) => ({
        ...prev,
        playerInput: "",
        isTyping: true,
        messages: [
          ...prev.messages,
          { sender: "김우주 (나)", text },
        ],
      }));

      try {
        const response = await sendNpcMessage({
          npcId: "coworker",
          userMessage: text,
        });

        const colleagueResponse =
          "colleague_response" in response
            ? response.colleague_response
            : "와, 그 메뉴 좋다! 나도 그거 먹어야겠다 ㅋㅋㅋ";

        setMessengerState((prev) => ({
          ...prev,
          isTyping: false,
          playerReplyCount: 1,
          messages: [
            ...prev.messages,
            { sender: "박엔지니어", text: colleagueResponse, isReaction: true },
          ],
        }));
        playAudioCue?.("notification");
      } catch {
        setMessengerState((prev) => ({
          ...prev,
          isTyping: false,
          playerReplyCount: 1,
          messages: [
            ...prev.messages,
            {
              sender: "박엔지니어",
              text: "와, 그 메뉴 좋다! 나도 그거 먹어야겠다 ㅋㅋㅋ",
              isReaction: true,
            },
          ],
        }));
        playAudioCue?.("notification");
      }
    } else {
      // Subsequent replies: Maintain Unread(1) badge, no further automated responses to prevent infinite loop
      setMessengerState((prev) => ({
        ...prev,
        playerInput: "",
        playerReplyCount: prev.playerReplyCount + 1,
        messages: [
          ...prev.messages,
          { sender: "김우주 (나)", text, isUnread: true },
        ],
      }));
    }
  };

  // Applicant decision toggle ('Qualified' / 'Unqualified')
  const handleDecision = (candidateName: string, decision: "Qualified" | "Unqualified") => {
    setCandidateDecisions((prev) => ({
      ...prev,
      [candidateName]: prev[candidateName] === decision ? null : decision,
    }));
    playAudioCue?.("notification");
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
    }, 500);

    setTimeout(() => {
      setRebootState("lockdown");
      playAudioCue?.("warning-siren");
      playAudioCue?.("door-lock");
      playAudioCue?.("decompression");
      addEchoMessage(
        "SYSTEM",
        "[SYSTEM REBOOT] SENSOR OFFSET CALIBRATED. RE-SCANNING DECK SEC-201 PARAMETERS...",
      );
      addEchoMessage(
        "ECHO",
        "[비상 강제 격리 선언] 경고: 통제실 내 미지의 생체 감염 위협 요소(김우주)가 식별되었습니다! 지침 101조에 따라 헤르메스호 통제실을 비상 강제 격리(Lockdown) 조치합니다!",
      );
      addEchoMessage(
        "SYSTEM",
        "[EMERGENCY LOCKDOWN] 통제실 출입문 전면 봉쇄! 비상 생명유지장치(산소 100% / 전력 100%) 및 60분 제한시간 타이머 작동 개시!",
      );
    }, 2500);

    setTimeout(() => {
      onApproveUpdate();
    }, 9000);
  };

  return (
    <div className="work-split-container">
      {/* Diegetic Workstation Header - No meta/dev terms */}
      <header className="work-header">
        <div className="work-header-title">
          <span className="work-badge">HERMES WORKSTATION</span>
          <h1>HERMES SHIP SYSTEM COMMAND</h1>
        </div>
        <div className="work-user-badge">
          <span>근무자: 김우주 (AI 관리 담당자)</span>
          <span className="clock-in-status">● CLOCK-IN ACTIVE</span>
        </div>
      </header>

      <div className="work-split-body">
        {/* Left Panel: Sequential Document Workstation UI */}
        <section className="work-left-panel" aria-label="Desktop Workstation UI" ref={leftPanelRef}>
          <div className="panel-header">
            <h2>🖥️ WORKSTATION DOCUMENTS</h2>
            <span className="panel-tag">STEP {stepIndex + 1} / {WORK_STEPS.length} : {WORK_STEPS[stepIndex].name}</span>
          </div>

          {/* Sequential Work Content */}
          <div className="desktop-workspace-content">
            {/* Document 1: Mining Report */}
            {activeStep === "mining" && (
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

            {/* Document 2: Telemetry Report */}
            {activeStep === "telemetry" && (
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
                  <p>✔ 관측 소평: 주 전력 그리드 및 모든 구역 생명유지장치가 극히 안정적으로 운영 중입니다.</p>
                </div>
              </div>
            )}

            {/* Document 3: Resume Review & Narrative Decision */}
            {activeStep === "resume" && (
              <div className="mission-content-view" aria-label="Applicant Resume Review">
                <div className="view-header">
                  <h3>📄 지원자 이력서 검토 및 적합성 판정 (Resume Review)</h3>
                  <span className="view-date">HR PORTAL // CANDIDATES (3)</span>
                </div>

                <div className="resume-candidates-list">
                  {RESUME_CANDIDATES.map((candidate) => {
                    const decision = candidateDecisions[candidate.name];
                    return (
                      <div key={candidate.name} className="resume-card-box">
                        <div className="resume-profile-header">
                          <div className="applicant-avatar">👤</div>
                          <div className="applicant-info">
                            <h4>{candidate.name}</h4>
                            <p>연령: {candidate.age}세</p>
                            <p className="role-tag">지원 포지션: {candidate.appliedRole}</p>
                          </div>
                        </div>

                        <div className="resume-section">
                          <strong>학력:</strong> {candidate.education}
                        </div>
                        <div className="resume-section">
                          <strong>경력:</strong> {candidate.experience}
                        </div>
                        <div className="resume-section">
                          <strong>자격 사항:</strong> {candidate.certifications.join(", ")}
                        </div>
                        <div className="resume-section">
                          <strong>지원 포부:</strong> {candidate.summary}
                        </div>

                        <div className="resume-decision-bar">
                          <button
                            type="button"
                            className={`decision-btn btn-qualified ${
                              decision === "Qualified" ? "selected" : ""
                            }`}
                            onClick={() => handleDecision(candidate.name, "Qualified")}
                          >
                            ✓ 적격 (Qualified)
                          </button>
                          <button
                            type="button"
                            className={`decision-btn btn-unqualified ${
                              decision === "Unqualified" ? "selected" : ""
                            }`}
                            onClick={() => handleDecision(candidate.name, "Unqualified")}
                          >
                            ✕ 부적격 (Unqualified)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Document 4: ECHO Patch Proposal */}
            {activeStep === "update" && (
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

            {/* Bottom Prominent [확인 완료] Confirmation Complete Button (for Steps 0~2) */}
            {stepIndex < WORK_STEPS.length - 1 && (
              <div className="confirm-complete-bar">
                <button
                  type="button"
                  className="confirm-complete-btn"
                  onClick={handleConfirmComplete}
                  disabled={isResumeIncomplete}
                >
                  ✓ [확인 완료]
                </button>
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

          {/* Top Colleague Popup Overlay inside Left Panel top-right boundary */}
          {messengerState.popupVisible && (
            <div className="colleague-popup-toast" onClick={handleOpenMessenger}>
              <div className="popup-icon">💬</div>
              <div className="popup-body">
                <strong>[메신저 알림] 박엔지니어</strong>
                <p>우주씨, 오늘 점심 뭐 드실래요?</p>
              </div>
              <button
                type="button"
                className="popup-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setMessengerState((prev) => ({ ...prev, popupVisible: false, isMinimized: true }));
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Minimized Messenger Icon Bubble Badge (1) inside Left Panel bottom-right boundary */}
          {messengerState.isMinimized && !messengerState.isOpen && rebootState === "idle" && (
            <div
              className="minimized-messenger-bubble"
              onClick={handleOpenMessenger}
              title="동료 메신저 열기"
            >
              <span className="bubble-icon">💬</span>
              {messengerState.playerReplyCount === 0 && (
                <span className="unread-badge bubble-unread-badge">1</span>
              )}
            </div>
          )}

          {/* Dedicated Draggable Colleague Messenger App Window UI inside Left Panel boundary */}
          {messengerState.isOpen && (
            <div
              ref={messengerModalRef}
              className="messenger-app-modal"
              style={
                modalPos
                  ? { left: `${modalPos.x}px`, top: `${modalPos.y}px`, transform: "none" }
                  : undefined
              }
            >
              <div
                className="messenger-app-header"
                onMouseDown={handleHeaderMouseDown}
                style={{ cursor: isDragging ? "grabbing" : "grab", userSelect: "none" }}
              >
                <span>💬 CREW MESSENGER // 박엔지니어 (Park, Engineer)</span>
                <div className="messenger-window-controls">
                  <button
                    type="button"
                    onClick={handleMinimizeMessenger}
                    title="축소 (말풍선으로 받기)"
                  >
                    ─
                  </button>
                  <button
                    type="button"
                    onClick={handleMinimizeMessenger}
                    title="닫기"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="messenger-messages-body">
                {messengerState.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`messenger-msg-row ${
                      msg.sender.includes("김우주") ? "sent" : "received"
                    }`}
                  >
                    <div className="msg-sender-tag">{msg.sender}</div>
                    <div className="msg-bubble-content">
                      {msg.text}
                      {msg.isUnread && (
                        <span className="unread-indicator" title="상대방 미확인 상태">
                          읽지 않음(1)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {messengerState.isTyping && (
                  <div className="messenger-msg-row received">
                    <div className="msg-sender-tag">박엔지니어</div>
                    <div className="msg-bubble-content typing-indicator">
                      💬 답장 작성 중...
                    </div>
                  </div>
                )}
              </div>

              <div className="messenger-input-area">
                <input
                  type="text"
                  placeholder="답장을 입력하세요..."
                  value={messengerState.playerInput}
                  onChange={(e) =>
                    setMessengerState((prev) => ({ ...prev, playerInput: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendMessengerReply(e);
                    }
                  }}
                />
                <button type="button" onClick={(e) => handleSendMessengerReply(e)}>
                  전송
                </button>
              </div>

            </div>
          )}
        </section>

        {/* Right Panel: ECHO Companion Chat */}
        <section className="work-right-panel" aria-label="ECHO AI Chat Interface">
          <div className="panel-header echo-panel-header">
            <h2>🤖 ECHO COMPANION CHAT</h2>
            <span className="echo-status-tag">ONLINE</span>
          </div>

          <div className="echo-chat-messages" ref={chatMessagesRef}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`echo-msg-bubble speaker-${msg.speaker.toLowerCase()}`}>
                <span className="speaker-name">{msg.speaker}</span>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          {/* ECHO Chat input (readOnly during rapport phase) */}
          <div className="echo-chat-input-area">
            <input
              type="text"
              readOnly
              value={
                rebootState === "idle"
                  ? "[ECHO 대기중 - 좌측 보고서 읽기 및 [확인 완료] 진행]"
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
