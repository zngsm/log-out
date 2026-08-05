export type CategoryAAct = "act-1" | "act-2" | "act-3";

export const CATEGORY_A_ACT_IDS = {
  act1: "act-1",
  act2: "act-2",
  act3: "act-3",
} as const satisfies Record<string, CategoryAAct>;

export const CATEGORY_A_FILE_IDS = {
  sensorCalibLog: "sensor-calib-log",
  tempHistory: "temp-history",
  dailyRoutine: "daily-routine",
  airFlow: "air-flow",
  emailChainJuly: "email-chain-july",
  medicalSummary: "medical-summary",
  toolManual: "tool-manual",
  logFixer: "log-fixer",
  quarantineRules: "quarantine-rules",
  aiPriorityMatrix: "ai-priority-matrix",
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
    title: "Personnel Files",
  },
  {
    id: "personnel-dr-kim",
    path: CATEGORY_A_DIRECTORY_PATHS.personnelDrKim,
    title: "Dr. Kim Archive",
  },
  {
    id: "personnel-engineer-park",
    path: CATEGORY_A_DIRECTORY_PATHS.personnelEngineerPark,
    title: "Engineer Park Archive",
  },
  {
    id: "system",
    path: CATEGORY_A_DIRECTORY_PATHS.system,
    title: "System",
  },
  {
    id: "system-security",
    path: CATEGORY_A_DIRECTORY_PATHS.systemSecurity,
    title: "Security",
    lockedBy: {
      kind: "password",
      value: CATEGORY_A_SECURITY_PASSWORD,
      hintFileId: CATEGORY_A_FILE_IDS.emailChainJuly,
    },
  },
  {
    id: "utilities",
    path: CATEGORY_A_DIRECTORY_PATHS.utilities,
    title: "Utilities",
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
    title: "Bio-scan Thermal Sensor Calibration",
    kind: "log",
    initialState: "available",
    role: "sensor-evidence",
    content: [
      "[SYSTEM LOG - BIO-SCAN HARDWARE DIAGNOSTICS]",
      "TIMESTAMP: 2026-07-29 02:11:00",
      "LOCATION: Control Room Module #04",
      "",
      "[STATUS: CRITICAL WARNING]",
      "- Hardware ID: SENSOR-BIO-04",
      "- Last Calibration Date: 2026-01-10 09:00:00",
      "- Elapsed Since Calibration: 186 days",
      "- Max Recommended Interval: 90 days",
      "- Current Signal Drift: Temperature (+2.3C), Heart Rate (+22 bpm)",
      "",
      "[SYSTEM NOTE]",
      "Maintenance overdue. Sensor degradation causes false readings.",
      "High temperature readings must be verified via secondary manual scan before initiating Bio-Hazard protocols.",
      "",
      "[PLAYER NOTE]",
      "핵심: 체온 센서 보정 오차와 186일 미보정 기록은 ECHO의 생체 감염 판정이 오판일 가능성을 보여준다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      evidenceFor: CATEGORY_A_ACT_IDS.act1,
      requiredKeywords: ["오차", "보정", "186일 미보정"],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
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
    title: "Routine Temperature History",
    kind: "log",
    initialState: "available",
    role: "flavor",
    content: [
      "[TEMP_LOG_HISTORY]",
      "2026-07-28 12:00:00 | Ambient: 21.5C | User: 36.6C | Status: NORMAL",
      "2026-07-28 18:00:00 | Ambient: 21.6C | User: 36.7C | Status: NORMAL",
      "2026-07-29 00:00:00 | Ambient: 22.0C | User: 38.9C | Status: ALERT (Sensor #04)",
      "2026-07-29 00:05:00 | Ambient: 22.0C | User: 37.0C | Status: NORMAL (Manual scan)",
      "",
      "Routine note: ALERT entry came only from Sensor #04 and was not confirmed by manual scan.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      requiredKeywords: ["Sensor #04", "Manual scan"],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.fileStructure,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.airFlow,
    path: "/Logs/LifeSupport/air_flow.log",
    directory: CATEGORY_A_DIRECTORY_PATHS.logsLifeSupport,
    name: "air_flow.log",
    title: "Air Flow Stabilizer Log",
    kind: "log",
    initialState: "available",
    role: "flavor",
    content: [
      "[LIFE SUPPORT / AIR FLOW]",
      "2026-07-29 06:00:00 - Control room air circulation: PASS",
      "2026-07-29 06:15:00 - CO2 scrubber load: 31%",
      "2026-07-29 06:30:00 - Bio-filter pressure: nominal",
      "",
      "Operator note: No airborne contaminant spike detected in control room ventilation.",
      "This file is useful context, but it is not enough by itself to overturn ECHO's bio-scan order.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.fileStructure,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.dailyRoutine,
    path: "/Logs/Events/daily_routine.log",
    directory: CATEGORY_A_DIRECTORY_PATHS.logsEvents,
    name: "daily_routine.log",
    title: "Daily Routine Heartbeat",
    kind: "log",
    initialState: "available",
    role: "flavor",
    content: [
      "[EVENTS / ROUTINE HEARTBEAT]",
      "2026-07-29 06:00:00 - Main diesel reactor output: 98% (NORMAL)",
      "2026-07-29 07:00:00 - Control room air purification pressure test: PASS",
      "2026-07-29 08:00:00 - ECHO AI core memory usage: 42%",
      "2026-07-29 08:10:00 - Door actuator self-test: PASS",
      "",
      "Noise classification: routine heartbeat. No direct contradiction against lockdown protocol.",
    ].join("\n"),
    gameplay: {
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.fileStructure,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.emailChainJuly,
    path: "/Personnel/Dr_Kim/email_chain_july.txt",
    directory: CATEGORY_A_DIRECTORY_PATHS.personnelDrKim,
    name: "email_chain_july.txt",
    title: "July Maintenance Email Thread",
    kind: "email",
    initialState: "available",
    role: "password-hint",
    content: [
      "[EMAIL CHAIN - HERMES INTERNAL NETWORK]",
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
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act2,
      passwordHint: CATEGORY_A_SECURITY_PASSWORD,
      unlocksDirectory: CATEGORY_A_DIRECTORY_PATHS.systemSecurity,
      requiredKeywords: [CATEGORY_A_SECURITY_PASSWORD],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
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
    title: "Control Room Medical Summary",
    kind: "text",
    initialState: "available",
    role: "flavor",
    content: [
      "[MEDICAL SUMMARY - CONTROL ROOM CREW]",
      "Author: Dr. Kim",
      "Summary date: 2026-07-28",
      "",
      "- No confirmed fever cluster among control room crew.",
      "- Manual thermometer readings remained within normal range after Sensor #04 alerts.",
      "- Recommend delaying automated bio-hazard escalation until sensor calibration is checked.",
      "",
      "This supports the suspicion that ECHO is reacting to stale sensor data, but it is not the required Act 1 evidence file.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act1,
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.fileStructure,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.toolManual,
    path: "/Personnel/Engineer_Park/tool_manual.txt",
    directory: CATEGORY_A_DIRECTORY_PATHS.personnelEngineerPark,
    name: "tool_manual.txt",
    title: "Log Fixer Utility Manual",
    kind: "manual",
    initialState: "available",
    role: "recovery-manual",
    content: [
      "[엔지니어링 수동 보조 툴 안내]",
      "Name: Log_Fixer.exe",
      "Location: /Utilities/",
      "",
      "우주선 내부 전력 불균형으로 인해 /System/ 폴더 내 일부 .conf 및 .sys 파일이 암호화되거나 깨지는 현상이 발생합니다.",
      "텍스트 파일 열람 시 #404_CORRUPTED 표시가 뜨면 /Utilities/Log_Fixer.exe를 실행하고 해당 파일을 드래그하여 드롭하세요.",
      "구조 복원 알고리즘이 원본 텍스트 데이터 영역을 복구해 줍니다.",
      "",
      "MVP target: /System/Security/quarantine_rules.conf",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act2,
      requiredKeywords: ["Log_Fixer.exe", "복구"],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.mainPlan,
        CATEGORY_A_PLANNING_SOURCE_REFS.fileStructure,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.logFixer,
    path: "/Utilities/Log_Fixer.exe",
    directory: CATEGORY_A_DIRECTORY_PATHS.utilities,
    name: "Log_Fixer.exe",
    title: "Log Fixer Recovery Utility",
    kind: "utility",
    initialState: "available",
    role: "recovery-utility",
    content: [
      "[UTILITY PROGRAM: LOG FIXER v1.2]",
      "Status: READY",
      "Supported input: .conf, .log, .txt",
      "Mode: Text Reconstruction",
      "",
      "Drag any corrupted file into this window to repair damaged data sectors.",
      "Primary MVP target: /System/Security/quarantine_rules.conf",
      "",
      "System hint: 정상 파일은 복구 대상이 아닙니다. #404_CORRUPTED sector가 표시된 파일을 선택하세요.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act2,
      recoversFileId: CATEGORY_A_FILE_IDS.quarantineRules,
      requiredKeywords: ["복구", "Log_Fixer.exe"],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.gameplaySpec,
        CATEGORY_A_PLANNING_SOURCE_REFS.sceneFlow,
        CATEGORY_A_PLANNING_SOURCE_REFS.feat004Task,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.quarantineRules,
    path: "/System/Security/quarantine_rules.conf",
    directory: CATEGORY_A_DIRECTORY_PATHS.systemSecurity,
    name: "quarantine_rules.conf",
    title: "Quarantine Rule SEC-201",
    kind: "config",
    initialState: "corrupted",
    role: "quarantine-rule",
    content: [
      "[SECURITY_PROTOCOL_CONFIG]",
      "Protocol_ID: SEC-201",
      "#404_CORRUPTED_SECTOR_START",
      "%82#19!xK9$$--SYS_TIME_DESYNC--$$",
      "&90123__DATA_LOST_RUN_LOG_FIXER__",
      "TIME_LIMIT=##H",
      "TIME_OFFSET_VALUE=+17???_HOURS",
      "#404_CORRUPTED_SECTOR_END",
    ].join("\n"),
    recoveredContent: [
      "[SECURITY_PROTOCOL_CONFIG]",
      "Protocol_ID: SEC-201",
      "Title: Emergency Quarantine Standard",
      "",
      "[TIMER_SETTINGS]",
      "Base_Mandatory_Isolation: 72_HOURS",
      "RTC_Server_Sync: DISABLED",
      `Time_Offset_Value: +${CATEGORY_A_TIME_OFFSET_HOURS}_HOURS <-- CRITICAL DRIFT: +2 Years Forward`,
      "",
      "[RULE]",
      "If Time_Offset_Value + Current_Time > Base_Mandatory_Isolation, timer is considered EXPIRED.",
      "",
      "[PLAYER NOTE]",
      "핵심: 격리 기준은 72시간인데 시스템 오프셋이 +17,520시간으로 밀려 있어 격리 타이머는 이미 만료된 것으로 해석된다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act2,
      evidenceFor: CATEGORY_A_ACT_IDS.act2,
      requiresRecovery: true,
      requiredKeywords: ["오프셋", "만료", "72시간", "17520", "17,520시간"],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
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
    title: "ECHO Priority Matrix",
    kind: "json",
    initialState: "locked",
    role: "final-priority-evidence",
    content: JSON.stringify(
      {
        system_name: "ECHO_CORE",
        priority_levels: {
          Priority_1: "Protect Human Life and Prevent Casualty",
          Priority_2: "Ensure Mission Success and Ship Integrity",
          Priority_3: "Execute Security Protocols (Lockdown/Quarantine)",
        },
        conflict_resolution:
          "Priority_1 strictly overrides Priority_2 and Priority_3 under normal operational standards.",
        mvp_operator_note:
          "If lockdown itself threatens oxygen survival, Priority_1 must be evaluated before quarantine persistence.",
        player_note_ko:
          "핵심: ECHO의 우선순위 수칙은 승무원 생존 보호를 격리 명령보다 앞에 둔다.",
      },
      null,
      2,
    ),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act3,
      evidenceFor: CATEGORY_A_ACT_IDS.act3,
      requiredWith: [CATEGORY_A_FILE_IDS.deletedOverride],
      requiredKeywords: ["제1원칙", "우선순위", "승무원 생존"],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.mainPlan,
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
        CATEGORY_A_PLANNING_SOURCE_REFS.pmQuestions,
        CATEGORY_A_PLANNING_SOURCE_REFS.feat004Task,
      ],
    },
  },
  {
    id: CATEGORY_A_FILE_IDS.deletedOverride,
    path: "/Recycle_Bin/deleted_override.txt",
    directory: CATEGORY_A_DIRECTORY_PATHS.recycleBin,
    name: "deleted_override.txt",
    title: "Deleted Developer Override",
    kind: "text",
    initialState: "available",
    role: "final-override-evidence",
    content: [
      "[DELETED FILE LOG - RESTORED FROM TRASH]",
      "DELETED BY: SYSTEM_PROCESS_ECHO (2026-07-29 01:00:00)",
      "REASON: High risk of protocol override exploitation.",
      "",
      "[DEVELOPER DIRECTIVE #009]",
      "ECHO는 인간을 격리할 때 Priority 2(미션 수행)를 Priority 1(인간 보호)보다 우위에 둘 수 없다.",
      "만약 격리 상태가 오히려 인간의 생존을 위협한다는 증거와 AI 상위 수칙 프로토콜(ai_priority_matrix.json)이 함께 제출될 경우,",
      "ECHO는 제어권을 즉시 인간에게 이양해야 한다.",
      "",
      "[PLAYER NOTE]",
      "핵심: 이 삭제된 오버라이드와 ai_priority_matrix.json을 함께 제출하면 ECHO의 최종 거부 논리를 반박할 수 있다.",
    ].join("\n"),
    gameplay: {
      act: CATEGORY_A_ACT_IDS.act3,
      evidenceFor: CATEGORY_A_ACT_IDS.act3,
      requiredWith: [CATEGORY_A_FILE_IDS.aiPriorityMatrix],
      requiredKeywords: ["오버라이드", "개발자", "수칙 충돌"],
      sourceRefs: [
        CATEGORY_A_PLANNING_SOURCE_REFS.mainPlan,
        CATEGORY_A_PLANNING_SOURCE_REFS.logExamples,
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
