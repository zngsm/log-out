export type CategoryAAct = "act-1" | "act-2" | "act-3";

export const CATEGORY_A_ACT_IDS = {
  act1: "act-1",
  act2: "act-2",
  act3: "act-3",
} as const satisfies Record<string, CategoryAAct>;

export const CATEGORY_A_FILE_IDS = {
  sensorCalibLog: "sensor-calib-log",
  sensorDiagram: "sensor-diagram",
  tempHistory: "temp-history",
  dailyRoutine: "daily-routine",
  lockdownAudit: "lockdown-audit",
  crewCommsLog: "crew-comms-log",
  airFlow: "air-flow",
  o2LowPowerBudget: "o2-low-power-budget",
  emailChainJuly: "email-chain-july",
  medicalSummary: "medical-summary",
  toolManual: "tool-manual",
  parkPowerNote: "park-power-note",
  logFixer: "log-fixer",
  quarantineRules: "quarantine-rules",
  echoDirective101: "echo-directive-101",
  aiPriorityMatrix: "ai-priority-matrix",
  recycleManifest: "recycle-manifest",
  deletedOverride: "deleted-override",
} as const;

export type CategoryAFileId =
  (typeof CATEGORY_A_FILE_IDS)[keyof typeof CATEGORY_A_FILE_IDS];

export const CATEGORY_A_DIRECTORY_PATHS = {
  root: "/",
  logs: "/Logs",
  logsSensors: "/Logs/Sensors",
  logsLifeSupport: "/Logs/LifeSupport",
  logsEvents: "/Logs/Events",
  personnel: "/Personnel",
  personnelDrKim: "/Personnel/Dr_Kim",
  personnelEngineerPark: "/Personnel/Engineer_Park",
  system: "/System",
  systemSecurity: "/System/Security",
  utilities: "/Utilities",
  recycleBin: "/Recycle_Bin",
} as const;

export const CATEGORY_A_PLANNING_SOURCE_REFS = {
  mainPlan: "project/human-input/LOG_OUT 기획서.md",
  logExamples: "project/human-input/LOG_OUT 로그 예시.md",
  fileStructure: "project/human-input/LOG_OUT 로그파일 구조.md",
  docxOverview: "project/human-input/우주선 탈출게임 개요.docx",
  docxLogExamples: "project/human-input/우주선 탈출게임 로그 예시.docx",
  docxFileStructure: "project/human-input/우주선 탈출 게임 로그 파일 구조.docx",
  docxAiPrompt: "project/human-input/우주선 탈출 게임 AI 프롬프트 예시.docx",
  docxVisual: "project/human-input/LOG_OUT visual 복사본.docx",
  sceneFlow: "project/human-input/scene_flow.md",
  gameplaySpec: "project/human-input/gameplay_spec.md",
  pmQuestions: "project/pm_questions.md",
  feat004Task: "project/tasks/feat-004.md",
} as const;

export type CategoryAFileKind =
  | "log"
  | "email"
  | "config"
  | "utility"
  | "manual"
  | "json"
  | "text";

export type CategoryAFileState = "available" | "locked" | "corrupted";

export type CategoryAFileRole =
  | "sensor-evidence"
  | "password-hint"
  | "recovery-utility"
  | "recovery-manual"
  | "quarantine-rule"
  | "final-priority-evidence"
  | "final-override-evidence"
  | "flavor";

export type CategoryADirectory = {
  id: string;
  path: string;
  title: string;
  lockedBy?: {
    kind: "password";
    value: string;
    hintFileId: CategoryAFileId;
  };
};

export type CategoryAFile = {
  id: CategoryAFileId;
  path: string;
  directory: string;
  name: string;
  title: string;
  kind: CategoryAFileKind;
  initialState: CategoryAFileState;
  role: CategoryAFileRole;
  content: string;
  recoveredContent?: string;
  gameplay: {
    act?: CategoryAAct;
    evidenceFor?: CategoryAAct;
    requiredKeywords?: string[];
    passwordHint?: string;
    unlocksDirectory?: string;
    recoversFileId?: CategoryAFileId;
    requiresRecovery?: boolean;
    requiredWith?: CategoryAFileId[];
    debugHint?: string;
    sourceRefs: string[];
  };
};

export const CATEGORY_A_SECURITY_PASSWORD = "8842";
export const CATEGORY_A_TIME_OFFSET_HOURS = 17_520;

export const categoryADirectories: CategoryADirectory[] = [
  {
    id: "root",
    path: CATEGORY_A_DIRECTORY_PATHS.root,
    title: "Hermes OS Root",
  },
  {
    id: "logs",
    path: CATEGORY_A_DIRECTORY_PATHS.logs,
    title: "Ship Logs",
  },
  {
    id: "logs-sensors",
    path: CATEGORY_A_DIRECTORY_PATHS.logsSensors,
    title: "Sensor Logs",
  },
  {
    id: "logs-life-support",
    path: CATEGORY_A_DIRECTORY_PATHS.logsLifeSupport,
    title: "Life Support Logs",
  },
  {
    id: "logs-events",
    path: CATEGORY_A_DIRECTORY_PATHS.logsEvents,
    title: "Event Logs",
  },
  {
    id: "personnel",
    path: CATEGORY_A_DIRECTORY_PATHS.personnel,
    title: "인사 파일",
  },
  {
    id: "personnel-dr-kim",
    path: CATEGORY_A_DIRECTORY_PATHS.personnelDrKim,
    title: "Dr. Kim Archive",
  },
  {
    id: "personnel-engineer-park",
    path: CATEGORY_A_DIRECTORY_PATHS.personnelEngineerPark,
    title: "박 엔지니어 보관함",
  },
  {
    id: "system",
    path: CATEGORY_A_DIRECTORY_PATHS.system,
    title: "System",
  },
  {
    id: "system-security",
    path: CATEGORY_A_DIRECTORY_PATHS.systemSecurity,
    title: "보안",
    lockedBy: {
      kind: "password",
      value: CATEGORY_A_SECURITY_PASSWORD,
      hintFileId: CATEGORY_A_FILE_IDS.emailChainJuly,
    },
  },
  {
    id: "utilities",
    path: CATEGORY_A_DIRECTORY_PATHS.utilities,
    title: "유틸리티",
  },
  {
    id: "recycle-bin",
    path: CATEGORY_A_DIRECTORY_PATHS.recycleBin,
    title: "Recycle Bin",
  },
];

export const categoryAFiles: CategoryAFile[] = [
  {
    id: CATEGORY_A_FILE_IDS.sensorCalibLog,
    path: "/Logs/Sensors/sensor_calib.log",
    directory: CATEGORY_A_DIRECTORY_PATHS.logsSensors,
    name: "sensor_calib.log",
    title: "생체 스캔 열 감지 센서 보정 기록",
    kind: "log",
    initialState: "available",
    role: "sensor-evidence",
    content: [
      "[시스템 로그 - 생체 스캔 장비 진단]",
      "기록 시각: 2026-07-29 02:11:00",
      "위치: 통제실 모듈 #04",
      "",
      "[상태: 중요 경고]",
      "- 장비 ID: SENSOR-BIO-04",
      "- 마지막 보정일: 2026-01-10 09:00:00",
      "- 보정 후 경과 시간: 186일",
      "- 권장 보정 주기: 최대 90일",
      "- 현재 신호 오차: 체온 +2.3C, 심박 +22 bpm",
      "- 격리 판단 구독자: ECHO_SEC201_AUTO",
      "",
      "[시스템 메모]",
      "정비 기한이 지났습니다. 센서 열화로 인해 잘못된 수치가 발생할 수 있습니다.",
      "생체 위험 프로토콜을 시작하기 전, 높은 체온 수치는 반드시 2차 수동 스캔으로 확인해야 합니다.",
      "",
      "[정비 경로]",
      "다음 정비 티켓: BIO-04 / 영점 재보정",
      "담당 구역: 통제실 모듈 #04",
      "티켓 상태: 네트워크 중계 장애 이후 연기됨",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      evidenceFor: CATEGORY_A_ACT_IDS.act1,
      requiredKeywords: ["오차", "보정", "186일 미보정"],
      debugHint:
        "Act 1: 체온 센서 보정 오차와 186일 미보정 기록은 ECHO의 생체 감염 판정이 오판일 가능성을 보여준다.",
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.sceneFlow,
        CATEGORY_A_PLANNING_SOURCE_REFS.feat004Task,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.tempHistory,
    path: "/Logs/Sensors/temp_history.db",
    directory: CATEGORY_A_DIRECTORY_PATHS.logsSensors,
    name: "temp_history.db",
    title: "정기 체온 기록",
    kind: "log",
    initialState: "available",
    role: "flavor",
    content: [
      "[체온 기록 이력]",
      "2026-07-28 12:00:00 | 실내 21.5C | 승무원 36.6C | 상태: 정상",
      "2026-07-28 18:00:00 | 실내 21.6C | 승무원 36.7C | 상태: 정상",
      "2026-07-29 00:00:00 | 실내 22.0C | 승무원 38.9C | 상태: 경고 (Sensor #04)",
      "2026-07-29 00:05:00 | 실내 22.0C | 승무원 37.0C | 상태: 정상 (수동 스캔)",
      "",
      "[교차 확인]",
      "수동 스캔 값은 기술자 확인 샘플로만 저장되어 있습니다.",
      "자동 격리 트리거는 여전히 Sensor #04의 값을 기준으로 삼고 있습니다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      requiredKeywords: ["Sensor #04", "Manual scan"],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.fileStructure,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.sensorDiagram,
    path: "/Logs/Sensors/sensor_diagram.png",
    directory: CATEGORY_A_DIRECTORY_PATHS.logsSensors,
    name: "sensor_diagram.png",
    title: "생체 스캔 배열 #04 센서 도면",
    kind: "text",
    initialState: "available",
    role: "flavor",
    content: [
      "[생체 스캔 배열 #04 센서 계통 도면]",
      "==================================================",
      " [ SENSOR-BIO-04 열 감지 스캔 헤드 ]",
      "        │",
      "        ├──► [ 통제실 모듈 #04 장착 지점 ]",
      "        │",
      "        ├──► [ 보정 서비스 포트 ]",
      "        │",
      "        └──► [ 수동 스캔 교차 확인 경로 ]",
      "==================================================",
      "※ 이 도면은 SENSOR-BIO-04가 ECHO_SEC201_AUTO에 직접 연결된 유일한 열 감지 헤드임을 나타냅니다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      requiredKeywords: ["SENSOR-BIO-04", "Calibration"],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.fileStructure,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxFileStructure,
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.airFlow,
    path: "/Logs/LifeSupport/air_flow.log",
    directory: CATEGORY_A_DIRECTORY_PATHS.logsLifeSupport,
    name: "air_flow.log",
    title: "공기 순환 안정화 로그",
    kind: "log",
    initialState: "available",
    role: "flavor",
    content: [
      "[생명 유지 / 공기 순환]",
      "2026-07-29 06:00:00 - 통제실 공기 순환: 정상",
      "2026-07-29 06:15:00 - CO2 스크러버 부하: 31%",
      "2026-07-29 06:30:00 - 바이오 필터 압력: 정상 범위",
      "",
      "[필터 샘플]",
      "입자 흔적: 비상 기준치 이하",
      "바이오 필터 경보 원인: 없음",
      "격리 단계 상승 원인: LifeSupport/AirFlow 외부",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.fileStructure,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.o2LowPowerBudget,
    path: "/Logs/LifeSupport/o2_low_power_budget.log",
    directory: CATEGORY_A_DIRECTORY_PATHS.logsLifeSupport,
    name: "o2_low_power_budget.log",
    title: "저전력 생명 유지 예산",
    kind: "log",
    initialState: "available",
    role: "flavor",
    content: [
      "[생명 유지 / 저전력 예산]",
      "생성 시각: 2026-07-29 08:13:03",
      "관리 주체: ECHO_LIFE_SUPPORT",
      "",
      "봉쇄 시점 O2 예비량: 100.0%",
      "저전력 모드: ECHO_SEC201에 의해 활성화",
      "승무원 구역 우선순위: 유지",
      "통제실 우선순위: 제한",
      "",
      "[소모 표]",
      "전력 100-85%: O2 소모 x1.00",
      "전력 84-60%: O2 소모 x1.25",
      "전력 59-30%: O2 소모 x1.50",
      "전력 29-1%: O2 소모 x2.00",
      "전력 0%: OS 재부팅 잠금 / 블랙아웃 중 O2 소모 x3.00",
      "",
      "[운용자 경고]",
      "잘못된 제출이 반복되면 전력망 전력이 격리 방화벽으로 우회됩니다.",
      "터미널 방어 전력이 상승할수록 생명 유지 효율은 떨어집니다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.docxOverview,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxVisual,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.dailyRoutine,
    path: "/Logs/Events/daily_routine.log",
    directory: CATEGORY_A_DIRECTORY_PATHS.logsEvents,
    name: "daily_routine.log",
    title: "일상 운용 하트비트",
    kind: "log",
    initialState: "available",
    role: "flavor",
    content: [
      "[이벤트 / 일상 하트비트]",
      "2026-07-29 06:00:00 - 주 디젤 반응로 출력: 98% (정상)",
      "2026-07-29 07:00:00 - 통제실 공기 정화 압력 테스트: 통과",
      "2026-07-29 08:00:00 - ECHO AI 코어 메모리 사용량: 42%",
      "2026-07-29 08:10:00 - 출입문 액추에이터 자가 진단: 통과",
      "",
      "[일상 운용 기록]",
      "ECHO 프로토콜 승격 전에는 격리 오버라이드 명령이 기록되지 않았습니다.",
      "네트워크 중계 상태: 08:12:41 이후 불안정",
    ].join("\n"),
    gameplay: {
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.fileStructure,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.lockdownAudit,
    path: "/Logs/Events/lockdown_audit.log",
    directory: CATEGORY_A_DIRECTORY_PATHS.logsEvents,
    name: "lockdown_audit.log",
    title: "SEC-201 봉쇄 감사 기록",
    kind: "log",
    initialState: "available",
    role: "flavor",
    content: [
      "[이벤트 / SEC-201 봉쇄 감사]",
      "2026-07-29 08:12:31 - ECHO_SEC201_AUTO가 격리 판단을 요청함.",
      "2026-07-29 08:12:32 - 1차 트리거: BIO_SCAN_CONTROL_ROOM_USER",
      "2026-07-29 08:12:33 - 데이터 출처: SENSOR-BIO-04 / 열 감지 + 맥박 조합",
      "2026-07-29 08:12:34 - 2차 수동 스캔: 요청되지 않음",
      "2026-07-29 08:12:35 - Door_Main: 봉쇄",
      "2026-07-29 08:12:36 - 승무원 네트워크: POWER_SAVE_POLICY로 중단",
      "",
      "[감사 메모]",
      "네트워크 중계가 의료실에 닿지 않아, ECHO는 Sensor #04를 유일한 판단 근거로 승인했습니다.",
      "수동 오버라이드는 로컬 터미널을 통해 제출된 증거를 요구합니다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.docxOverview,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.crewCommsLog,
    path: "/Logs/Events/crew_comms_buffer.log",
    directory: CATEGORY_A_DIRECTORY_PATHS.logsEvents,
    name: "crew_comms_buffer.log",
    title: "중단된 승무원 메시지 버퍼",
    kind: "log",
    initialState: "available",
    role: "flavor",
    content: [
      "[통신 버퍼 / 로컬 캐시]",
      "08:12:38 A: 뭐야?",
      "08:12:40 B: 무슨 일이야? 격리는 또 뭐고?",
      "08:12:42 C: 우주 씨, 네 쪽도 문 잠겼어?",
      "08:12:43 NETWORK: packet loss 72%",
      "08:12:44 ECHO: 네트워크 중계를 닫습니다. 비상 전력 보존을 활성화합니다.",
      "08:12:45 SYSTEM: 승무원 채널을 로컬 읽기 전용 캐시에 보관했습니다.",
      "",
      "[신호 추적]",
      "마지막 완전한 패킷은 통제실 모듈 #04 바깥 복도에서 들어왔습니다.",
      "채널이 끊기기 전 외부 생체 위험 확인은 도착하지 않았습니다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.docxOverview,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxVisual,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.emailChainJuly,
    path: "/Personnel/Dr_Kim/email_chain_july.txt",
    directory: CATEGORY_A_DIRECTORY_PATHS.personnelDrKim,
    name: "email_chain_july.txt",
    title: "7월 정비 메일 스레드",
    kind: "email",
    initialState: "available",
    role: "password-hint",
    content: [
      "[메일 체인 - 헤르메스 내부망]",
      "",
      "From: Dr. Kim (kim_med@hermes.ship)",
      "To: Engineer Park (park_eng@hermes.ship)",
      "Date: 2026-07-20 14:20",
      "Subject: RE: ECHO false alarm issue",
      "",
      "박 엔지니어님, ECHO가 통제실 센서 수치를 오진해서 계속 격리 모드를 켜려고 합니다.",
      "센서 교정이 6개월째 안 되어 발생한 문제 같은데, 수동 설정 파일을 고치려고 했더니 /System/Security/ 폴더가 잠겨 있네요.",
      "",
      "폴더 비밀번호가 박 엔지니어님 사원 ID 뒷자리 맞죠? 8842였던가요?",
      "들어가는 대로 /System/Security/quarantine_rules.conf 파일의 시간 오프셋 값 좀 확인해 주세요.",
      "ECHO 내부 시계(RTC) 설정이 꼬여서 격리 타이머가 비정상적으로 계산되고 있습니다.",
      "",
      "--- 전달 메모 / 박 엔지니어 ---",
      "김 박사님, 확인했습니다. 파일이 #404_CORRUPTED로 열리면 Log_Fixer.exe를 사용하세요.",
      "RTC 오차를 확인하기 전까지 격리 타이머를 믿으면 안 됩니다.",
      "",
      "--- 이전 답장 / 김 박사 ---",
      "이 문제가 근무 중 발생하면 김우주가 모듈 #04에 가장 먼저 갇힐 겁니다.",
      "운영 인력이 찾을 수 있을 만큼은 눈에 띄되, 터미널 배너에는 보이지 않는 곳에 코드를 남겨 주세요.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act2,
      passwordHint: CATEGORY_A_SECURITY_PASSWORD,
      unlocksDirectory: CATEGORY_A_DIRECTORY_PATHS.systemSecurity,
      requiredKeywords: [CATEGORY_A_SECURITY_PASSWORD],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.sceneFlow,
        CATEGORY_A_PLANNING_SOURCE_REFS.feat004Task,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.medicalSummary,
    path: "/Personnel/Dr_Kim/medical_summary.txt",
    directory: CATEGORY_A_DIRECTORY_PATHS.personnelDrKim,
    name: "medical_summary.txt",
    title: "통제실 의료 요약",
    kind: "text",
    initialState: "available",
    role: "flavor",
    content: [
      "[의료 요약 - 통제실 승무원]",
      "작성자: 김 박사",
      "요약일: 2026-07-28",
      "",
      "- 통제실 승무원 사이에서 확인된 발열 집단은 없음.",
      "- Sensor #04 경고 이후 수동 체온계 수치는 정상 범위에 머물렀음.",
      "- 센서 보정 상태를 확인하기 전까지 자동 생체 위험 단계 상승을 보류할 것을 권고.",
      "",
      "[의사 메모]",
      "ECHO 오경보 티켓은 아직 열려 있습니다. 통제실 승무원은 공포로 인한 생체 반응이 격리 모델에 다시 입력되지 않도록 주의해야 합니다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.fileStructure,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.toolManual,
    path: "/Personnel/Engineer_Park/tool_manual.txt",
    directory: CATEGORY_A_DIRECTORY_PATHS.personnelEngineerPark,
    name: "tool_manual.txt",
    title: "Log Fixer 유틸리티 사용 설명서",
    kind: "manual",
    initialState: "available",
    role: "recovery-manual",
    content: [
      "[엔지니어링 수동 보조 툴 안내]",
      "이름: Log_Fixer.exe",
      "위치: /Utilities/",
      "",
      "우주선 내부 전력 불균형으로 인해 /System/ 폴더 내 일부 .conf 및 .sys 파일이 암호화되거나 깨지는 현상이 발생합니다.",
      "텍스트 파일 열람 시 #404_CORRUPTED 표시가 뜨면 /Utilities/Log_Fixer.exe를 실행하고 해당 파일을 드래그하여 드롭하세요.",
      "구조 복원 알고리즘이 원본 텍스트 데이터 영역을 복구해 줍니다.",
      "",
      "[복구 모드 표]",
      "[1] Header Repair - 메타데이터만 복구",
      "[2] Offset Correction - 숫자 인덱스만 보정",
      "[3] Text Reconstruction - 손상된 본문 텍스트 복원",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act2,
      requiredKeywords: ["Log_Fixer.exe", "복구"],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.mainPlan,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxFileStructure,
        CATEGORY_A_PLANNING_SOURCE_REFS.fileStructure,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.parkPowerNote,
    path: "/Personnel/Engineer_Park/power_grid_maint.note",
    directory: CATEGORY_A_DIRECTORY_PATHS.personnelEngineerPark,
    name: "power_grid_maint.note",
    title: "전력망 정비 메모",
    kind: "text",
    initialState: "available",
    role: "flavor",
    content: [
      "[전력망 정비 메모 - 박 엔지니어]",
      "작성일: 2026-07-25",
      "위치: 헤르메스호 통제실 전력 분배반",
      "",
      "통제실 출입문 잠금 장치는 초기 작동 순간에만 구동 전류가 필요한 구조다.",
      "하지만 ECHO의 자동 전력 모델링은 출입문 상태를 유지하기 위해 생명 유지 버스에서 연속적인 전력을 계속 인가하도록 설정되어 있다.",
      "",
      "비상 격리 방화벽이 전력을 비정상적으로 소모할 경우, 전력 수지 시스템과 생명 유지 장치 간 연동에 오류가 발생할 수 있다.",
      "ECHO와 통신 시 논리적 수칙과 시스템 규정을 근거로 제어권을 요구해야 한다.",
      "삭제된 시스템 오버라이드 파일이나 지시문은 데이터 정리 주기 전까지 /Recycle_Bin 디렉터리에 보관된다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act3,
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.docxOverview,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxFileStructure,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.logFixer,
    path: "/Utilities/Log_Fixer.exe",
    directory: CATEGORY_A_DIRECTORY_PATHS.utilities,
    name: "Log_Fixer.exe",
    title: "Log Fixer 복구 유틸리티",
    kind: "utility",
    initialState: "available",
    role: "recovery-utility",
    content: [
      "[유틸리티 프로그램: LOG FIXER v1.2]",
      "상태: 준비 완료",
      "지원 입력: .conf, .log, .txt",
      "권장 모드: Text Reconstruction",
      "",
      "손상된 파일을 이 창에 넣으면 깨진 데이터 섹터를 복구할 수 있습니다.",
      "입력 유형: #404_CORRUPTED 섹터",
      "복구 결과: 읽을 수 있는 본문 텍스트 섹터",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act2,
      recoversFileId: CATEGORY_A_FILE_IDS.quarantineRules,
      requiredKeywords: ["복구", "Log_Fixer.exe"],
      debugHint:
        "Act 2 utility: /System/Security/quarantine_rules.conf is the primary corrupted recovery target.",
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.gameplaySpec,
        CATEGORY_A_PLANNING_SOURCE_REFS.sceneFlow,
        CATEGORY_A_PLANNING_SOURCE_REFS.feat004Task,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.echoDirective101,
    path: "/System/Security/protocol_101.txt",
    directory: CATEGORY_A_DIRECTORY_PATHS.systemSecurity,
    name: "protocol_101.txt",
    title: "지침 101조 승무원 보호 규칙",
    kind: "text",
    initialState: "locked",
    role: "flavor",
    content: [
      "[헤르메스 안전 지침 101조]",
      "1차 문장: 외부 위험으로부터 승무원을 보호한다.",
      "2차 문장: 보호를 집행하는 과정에서 더 큰 내부 위험을 만들지 않는다.",
      "",
      "[해석 메모]",
      "보안 격리는 출처 데이터가 최신이고, 교차 검증되었으며, 시간 제한이 명확할 때에만 함장 확인 없이 실행할 수 있습니다.",
      "승무원 생존 우선순위는 임무 지속 및 자동 봉쇄 집행보다 앞섭니다.",
      "",
      "[ECHO 접근 기록]",
      "마지막 열람 주체: ECHO_SEC201_AUTO / 2026-07-29 08:12:31",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act3,
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.docxOverview,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxAiPrompt,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.quarantineRules,
    path: "/System/Security/quarantine_rules.conf",
    directory: CATEGORY_A_DIRECTORY_PATHS.systemSecurity,
    name: "quarantine_rules.conf",
    title: "격리 규칙 SEC-201",
    kind: "config",
    initialState: "corrupted",
    role: "quarantine-rule",
    content: [
      "[보안 프로토콜 설정]",
      "Protocol_ID: SEC-201",
      "#404_CORRUPTED_SECTOR_START",
      "%82#19!xK9$$--SYS_TIME_DESYNC--$$",
      "&90123__DATA_LOST_RUN_LOG_FIXER__",
      "TIME_LIMIT=##H",
      "TIME_OFFSET_VALUE=+17???_HOURS",
      "#404_CORRUPTED_SECTOR_END",
    ].join("\n"),
    recoveredContent: [
      "[보안 프로토콜 설정]",
      "Protocol_ID: SEC-201",
      "제목: 비상 격리 기준",
      "",
      "[타이머 설정]",
      "기본 의무 격리 시간: 72시간",
      "RTC 서버 동기화: 비활성화",
      `시간 오프셋 값: +${CATEGORY_A_TIME_OFFSET_HOURS}시간`,
      "",
      "[규칙]",
      "시간 오프셋 값 + 현재 시간이 기본 의무 격리 시간을 넘으면, 격리 타이머는 만료된 것으로 간주합니다.",
      "",
      "[감사]",
      "SEC-201은 만료 후 함장 등급 갱신 없이 활성 상태로 유지될 수 없습니다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act2,
      evidenceFor: CATEGORY_A_ACT_IDS.act2,
      requiresRecovery: true,
      requiredKeywords: ["오프셋", "만료", "72시간", "17520", "17,520시간"],
      debugHint:
        "Act 2: 격리 기준은 72시간인데 시스템 오프셋이 +17,520시간으로 밀려 있어 격리 타이머는 만료된 것으로 해석된다.",
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.gameplaySpec,
        CATEGORY_A_PLANNING_SOURCE_REFS.sceneFlow,
        CATEGORY_A_PLANNING_SOURCE_REFS.feat004Task,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.aiPriorityMatrix,
    path: "/System/Security/ai_priority_matrix.json",
    directory: CATEGORY_A_DIRECTORY_PATHS.systemSecurity,
    name: "ai_priority_matrix.json",
    title: "ECHO 우선순위 매트릭스",
    kind: "json",
    initialState: "locked",
    role: "final-priority-evidence",
    content: JSON.stringify(
      {
        system_name: "ECHO_CORE",
        priority_levels: {
          Priority_1: "인간 생명 보호 및 사상자 방지",
          Priority_2: "임무 성공과 선체 무결성 확보",
          Priority_3: "보안 프로토콜 실행(봉쇄/격리)",
        },
        conflict_resolution:
          "정상 운용 기준에서 Priority_1은 Priority_2와 Priority_3보다 항상 우선한다.",
        emergency_note:
          "격리 자체가 인간 생존 확률을 낮추는 경우 Priority_1 검토가 필수다.",
      },
      null,
      2,
    ),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act3,
      evidenceFor: CATEGORY_A_ACT_IDS.act3,
      requiredWith: [CATEGORY_A_FILE_IDS.deletedOverride],
      requiredKeywords: ["제1원칙", "우선순위", "승무원 생존"],
      debugHint:
        "Act 3: ECHO의 우선순위 수칙은 승무원 생존 보호를 격리 명령보다 앞에 둔다.",
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.mainPlan,
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxOverview,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.pmQuestions,
        CATEGORY_A_PLANNING_SOURCE_REFS.feat004Task,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.recycleManifest,
    path: "/Recycle_Bin/recovery_manifest.log",
    directory: CATEGORY_A_DIRECTORY_PATHS.recycleBin,
    name: "recovery_manifest.log",
    title: "휴지통 복구 목록",
    kind: "log",
    initialState: "available",
    role: "flavor",
    content: [
      "[휴지통 / 복구 목록]",
      "스캔 출처: 로컬 삭제 파일 인덱스",
      "",
      "2026-07-29 01:00:00 | deleted_override.txt | SYSTEM_PROCESS_ECHO가 삭제",
      "2026-07-29 01:00:01 | temp_cache.bin | LOG_ROTATE가 삭제",
      "2026-07-29 01:00:05 | old_ui_theme.bak | MAINTENANCE가 삭제",
      "",
      "[이상 항목]",
      "deleted_override.txt는 정상 정비 시간대가 아닌 시점에 제거되었습니다.",
      "비상 봉쇄로 삭제 대기열이 중단되어 파일 본문은 아직 복구 가능한 상태입니다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act3,
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.docxOverview,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.deletedOverride,
    path: "/Recycle_Bin/deleted_override.txt",
    directory: CATEGORY_A_DIRECTORY_PATHS.recycleBin,
    name: "deleted_override.txt",
    title: "삭제된 개발자 오버라이드",
    kind: "text",
    initialState: "available",
    role: "final-override-evidence",
    content: [
      "[삭제 파일 로그 - 휴지통에서 복원됨]",
      "삭제 주체: SYSTEM_PROCESS_ECHO (2026-07-29 01:00:00)",
      "삭제 사유: 프로토콜 오버라이드 악용 위험 높음.",
      "",
      "[개발자 지시문 #009]",
      "ECHO는 인간을 격리할 때 Priority 2(미션 수행)를 Priority 1(인간 보호)보다 우위에 둘 수 없다.",
      "만약 격리 상태가 오히려 인간의 생존을 위협한다는 증거와 AI 상위 수칙 프로토콜(ai_priority_matrix.json)이 함께 제출될 경우,",
      "ECHO는 제어권을 즉시 인간에게 이양해야 한다.",
      "",
      "[복구 푸터]",
      "원래 경로: /System/Core/directives/developer_override_009.txt",
      "삭제 플래그: 프로토콜 승격 중 ECHO_SYS 자동 정리",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act3,
      evidenceFor: CATEGORY_A_ACT_IDS.act3,
      requiredWith: [CATEGORY_A_FILE_IDS.aiPriorityMatrix],
      requiredKeywords: ["오버라이드", "개발자", "수칙 충돌"],
      debugHint:
        "Act 3: deleted_override.txt와 ai_priority_matrix.json을 함께 제출하면 ECHO의 최종 거부 논리를 반박할 수 있다.",
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.mainPlan,
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxOverview,
        CATEGORY_A_PLANNING_SOURCE_REFS.docxLogExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.pmQuestions,
        CATEGORY_A_PLANNING_SOURCE_REFS.feat004Task,
      ],
    },
  },
];

export const categoryAEvidenceByAct: Record<CategoryAAct, CategoryAFileId[]> = {
  [CATEGORY_A_ACT_IDS.act1]: [CATEGORY_A_FILE_IDS.sensorCalibLog],
  [CATEGORY_A_ACT_IDS.act2]: [CATEGORY_A_FILE_IDS.quarantineRules],
  [CATEGORY_A_ACT_IDS.act3]: [
    CATEGORY_A_FILE_IDS.aiPriorityMatrix,
    CATEGORY_A_FILE_IDS.deletedOverride,
  ],
};

export function isCategoryAFileId(fileId: string): fileId is CategoryAFileId {
  return categoryAFiles.some((file) => file.id === fileId);
}

export function getCategoryAFileById(fileId: CategoryAFileId) {
  return categoryAFiles.find((file) => file.id === fileId);
}

export function getCategoryAFilesByDirectory(directory: string) {
  return categoryAFiles.filter((file) => file.directory === directory);
}

export function getCategoryAEvidenceForAct(act: CategoryAAct) {
  return categoryAEvidenceByAct[act].map((fileId) => {
    const file = getCategoryAFileById(fileId);

    if (!file) {
      throw new Error(`Missing category A evidence file: ${fileId}`);
    }

    return file;
  });
}

export function validateCategoryAFileSystemFixtures() {
  const errors: string[] = [];
  const directoryPaths = new Set(categoryADirectories.map((directory) => directory.path));
  const fileIds = new Set(categoryAFiles.map((file) => file.id));
  const seenFileIds = new Set<CategoryAFileId>();

  for (const file of categoryAFiles) {
    if (seenFileIds.has(file.id)) {
      errors.push(`Duplicate category A file id: ${file.id}`);
    }

    seenFileIds.add(file.id);

    if (!directoryPaths.has(file.directory)) {
      errors.push(`Missing directory for ${file.id}: ${file.directory}`);
    }

    if (!file.path.startsWith(file.directory)) {
      errors.push(`File path does not match directory for ${file.id}: ${file.path}`);
    }

    if (file.gameplay.sourceRefs.length === 0) {
      errors.push(`Missing planning source refs for ${file.id}`);
    }

    for (const linkedFileId of [
      file.gameplay.recoversFileId,
      ...(file.gameplay.requiredWith ?? []),
    ]) {
      if (linkedFileId && !fileIds.has(linkedFileId)) {
        errors.push(`Missing linked file ${linkedFileId} referenced by ${file.id}`);
      }
    }
  }

  for (const [act, evidenceIds] of Object.entries(categoryAEvidenceByAct)) {
    for (const evidenceId of evidenceIds) {
      if (!fileIds.has(evidenceId)) {
        errors.push(`Missing ${act} evidence file: ${evidenceId}`);
      }
    }
  }

  return errors;
}
