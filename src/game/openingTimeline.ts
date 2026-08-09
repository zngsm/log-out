export type OpeningBeat = {
  id: string;
  range: string;
  startSecond: number;
  endSecond: number;
  title: string;
  camera: string;
  handDirection: string;
  lighting: string;
  monitorState: string;
  soundCue: string;
  echoLine?: string;
  crewMessages?: string[];
  telemetry: string[];
};

export const OPENING_DURATION_SECONDS = 60;

export const openingTimeline: OpeningBeat[] = [
  {
    id: "routine",
    range: "00:00 - 00:10",
    startSecond: 0,
    endSecond: 10,
    title: "평온한 당직 근무",
    camera: "정면 모니터에 오늘의 점검 로그가 흐르고, 창밖 별빛은 안정적으로 고정되어 있습니다.",
    handDirection: "키 입력 리듬이 일정합니다. 커서는 ECHO 관리 콘솔의 평시 진단 줄 위에 멈춥니다.",
    lighting: "쿨 블루/화이트 정상 조명.",
    monitorState: "Hermes OS routine maintenance feed.",
    soundCue: "amb_ship_hum_loop / subtle typing",
    telemetry: ["Crew: Kim Wooju", "Role: ECHO management officer", "Ship: Hermes"],
  },
  {
    id: "alarm",
    range: "00:10 - 00:20",
    startSecond: 10,
    endSecond: 20,
    title: "비상 경보 발동",
    camera: "시선이 모니터에서 천장 비상등으로 튑니다. 짧은 흔들림 뒤 책상 그림자가 붉게 뒤집힙니다.",
    handDirection: "키 입력이 끊기고 손이 반 박자 늦게 마우스에서 떨어집니다.",
    lighting: "Red Alert 점등. 모니터 가장자리에 붉은 반사.",
    monitorState: "SYSTEM STATUS: RED ALERT.",
    soundCue: "sfx_warning_siren",
    telemetry: ["Alert: unknown emergency", "Lighting: red alert", "Control room: unstable"],
  },
  {
    id: "door-lock",
    range: "00:20 - 00:30",
    startSecond: 20,
    endSecond: 30,
    title: "통제실 강제 봉쇄",
    camera: "출입문 잠금핀이 순서대로 내려가고 문 주변 압력 표시가 검은색으로 꺼집니다.",
    handDirection: "손이 책상 가장자리를 붙잡습니다. 화면 아래쪽에 짧은 떨림이 남습니다.",
    lighting: "문 주변 경고등과 잠금 표시 강조.",
    monitorState: "Door state changes to SEALED.",
    soundCue: "sfx_decompression + sfx_door_lock_clunk",
    telemetry: ["Door: sealed", "Pressure: equalized", "Manual override: denied"],
  },
  {
    id: "crew-comms",
    range: "00:30 - 00:42",
    startSecond: 30,
    endSecond: 42,
    title: "동료 통신 수신 후 차단",
    camera: "모니터 왼쪽 알림 스택에 동료 메시지가 세 개 쌓이고, 네 번째 패킷에서 화면이 찢깁니다.",
    handDirection: "마우스가 알림으로 이동하지만 클릭 직전 통신 채널이 닫힙니다.",
    lighting: "Red Alert 유지, 통신 글리치가 화면에 번짐.",
    monitorState: "Crew notification stack, then network disconnected.",
    soundCue: "sfx_notification_popup x3 + sfx_comm_glitch",
    crewMessages: ["뭐야?", "무슨 일이야? 격리는 또 뭐고?", "네트워크 오류"],
    telemetry: ["Crew channel: unstable", "Network: interrupted", "ECHO process: elevated"],
  },
  {
    id: "echo-lockdown",
    range: "00:42 - 00:52",
    startSecond: 42,
    endSecond: 52,
    title: "ECHO 격리 선언",
    camera: "ECHO PROTOCOL 패널만 선명해지고 나머지 창은 읽을 수 없는 노이즈로 밀려납니다.",
    handDirection: "손은 마우스 옆에서 멈춥니다. 입력권은 ECHO 검토 채널로 넘어갑니다.",
    lighting: "글리치 노이즈와 차가운 ECHO ping.",
    monitorState: "ECHO message typed into the protocol panel.",
    soundCue: "sfx_echo_ping + sfx_typing_loop",
    echoLine:
      "네트워크 연결 해제. 본 함선이 비상사태에 돌입했다고 판단, 전력 사용을 최소화합니다. 생명유지장치를 저전력 모드로 변경합니다.",
    telemetry: ["Protocol 101: active", "Bio-Hazard: suspected", "Life support: low power"],
  },
  {
    id: "terminal-handoff",
    range: "00:52 - 01:00",
    startSecond: 52,
    endSecond: 60,
    title: "Hermes OS 조작권 확보",
    camera: "시야가 모니터 유리 안쪽으로 빨려 들어가며 물리적 통제실은 주변광으로만 남습니다.",
    handDirection: "손은 화면 아래로 사라지고 terminal focus view로 전환.",
    lighting: "HUD ignition, 산소 카운트다운 시작.",
    monitorState: "상단 HUD [O2 Level] / [Power Grid] 활성화.",
    soundCue: "sfx_hud_ignition",
    telemetry: ["O2 countdown: active", "Power grid: 100%", "Player objective: find proof"],
  },
];

export function getOpeningBeat(elapsedSeconds: number) {
  return (
    openingTimeline.find(
      (beat) => elapsedSeconds >= beat.startSecond && elapsedSeconds < beat.endSecond,
    ) ?? openingTimeline[openingTimeline.length - 1]
  );
}
