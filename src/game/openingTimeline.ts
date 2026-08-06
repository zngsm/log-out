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
    camera: "모니터 중앙 고정. 대각선 메뉴 뷰의 블러가 천천히 걷힘.",
    handDirection: "키보드 위에서 리드미컬한 타이핑 placeholder 표시.",
    lighting: "쿨 블루/화이트 정상 조명.",
    monitorState: "Hermes OS 일상 업무 화면 유지.",
    soundCue: "amb_ship_hum_loop / subtle typing",
    telemetry: ["Crew: Kim Wooju", "Role: ECHO management officer", "Ship: Hermes"],
  },
  {
    id: "alarm",
    range: "00:10 - 00:20",
    startSecond: 10,
    endSecond: 20,
    title: "비상 경보 발동",
    camera: "모니터에서 천장/벽면 비상 조명으로 흔들리는 시선.",
    handDirection: "타이핑 중단, 손이 공중에서 움찔거리는 placeholder.",
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
    camera: "비상 조명에서 출입문 쪽으로 시선 이동.",
    handDirection: "책상 가장자리를 불안하게 짚는 placeholder.",
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
    camera: "출입문에서 모니터 알림 스택으로 복귀.",
    handDirection: "마우스를 잡은 손이 떨리는 placeholder.",
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
    camera: "모니터 우측 ECHO PROTOCOL 패널에 집중.",
    handDirection: "마우스 옆에서 정지. 더 이상 사용자의 손 조작은 보이지 않음.",
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
    camera: "모니터가 화면의 90% 이상을 차지하도록 smooth zoom-in.",
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
