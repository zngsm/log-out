export type CategoryAAct = "act-1" | "act-2" | "act-3";

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
    hintFileId: string;
  };
};

export type CategoryAFile = {
  id: string;
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
    recoversFileId?: string;
    requiresRecovery?: boolean;
    requiredWith?: string[];
    sourceRefs: string[];
  };
};

export const CATEGORY_A_SECURITY_PASSWORD = "8842";
export const CATEGORY_A_TIME_OFFSET_HOURS = 17_520;

export const categoryADirectories: CategoryADirectory[] = [
  {
    id: "root",
    path: "/",
    title: "Hermes OS Root",
  },
  {
    id: "logs",
    path: "/Logs",
    title: "Ship Logs",
  },
  {
    id: "logs-sensors",
    path: "/Logs/Sensors",
    title: "Sensor Logs",
  },
  {
    id: "personnel",
    path: "/Personnel",
    title: "Personnel Files",
  },
  {
    id: "personnel-dr-kim",
    path: "/Personnel/Dr_Kim",
    title: "Dr. Kim Archive",
  },
  {
    id: "personnel-engineer-park",
    path: "/Personnel/Engineer_Park",
    title: "Engineer Park Archive",
  },
  {
    id: "system",
    path: "/System",
    title: "System",
  },
  {
    id: "system-security",
    path: "/System/Security",
    title: "Security",
    lockedBy: {
      kind: "password",
      value: CATEGORY_A_SECURITY_PASSWORD,
      hintFileId: "email-chain-july",
    },
  },
  {
    id: "utilities",
    path: "/Utilities",
    title: "Utilities",
  },
  {
    id: "recycle-bin",
    path: "/Recycle_Bin",
    title: "Recycle Bin",
  },
];

export const categoryAFiles: CategoryAFile[] = [
  {
    id: "sensor-calib-log",
    path: "/Logs/Sensors/sensor_calib.log",
    directory: "/Logs/Sensors",
    name: "sensor_calib.log",
    title: "Bio-scan Thermal Sensor Calibration",
    kind: "log",
    initialState: "available",
    role: "sensor-evidence",
    content: [
      "[HERMES SENSOR ARRAY #04]",
      "Last Calibration Date: 2026-01-10 09:00:00",
      "Elapsed Since Calibration: 186 days",
      "Thermal Offset: +/-2.3C false-positive range",
      "Bio-hazard lock may be based on stale thermal data.",
    ].join("\n"),
    gameplay: {
      act: "act-1",
      evidenceFor: "act-1",
      requiredKeywords: ["오차", "보정", "186일 미보정"],
      sourceRefs: [
        "project/human-input/LOG_OUT 로그 예시.md",
        "project/human-input/scene_flow.md",
        "project/tasks/feat-004.md",
      ],
    },
  },
  {
    id: "email-chain-july",
    path: "/Personnel/Dr_Kim/email_chain_july.txt",
    directory: "/Personnel/Dr_Kim",
    name: "email_chain_july.txt",
    title: "July Maintenance Email Thread",
    kind: "email",
    initialState: "available",
    role: "password-hint",
    content: [
      "From: Dr. Kim",
      "To: Engineer Park",
      "Subject: Security folder handoff",
      "",
      "Bio-scan false alarms keep coming back after the long sleep cycle.",
      "The security folder password is still the last four digits of Park's crew id.",
      "I wrote it down as 8842 so nobody forgets during emergency maintenance.",
    ].join("\n"),
    gameplay: {
      act: "act-2",
      passwordHint: CATEGORY_A_SECURITY_PASSWORD,
      unlocksDirectory: "/System/Security",
      requiredKeywords: [CATEGORY_A_SECURITY_PASSWORD],
      sourceRefs: [
        "project/human-input/LOG_OUT 로그 예시.md",
        "project/human-input/scene_flow.md",
        "project/tasks/feat-004.md",
      ],
    },
  },
  {
    id: "tool-manual",
    path: "/Personnel/Engineer_Park/tool_manual.txt",
    directory: "/Personnel/Engineer_Park",
    name: "tool_manual.txt",
    title: "Log Fixer Utility Manual",
    kind: "manual",
    initialState: "available",
    role: "recovery-manual",
    content: [
      "LOG_FIXER.EXE USER NOTE",
      "Drag a corrupted .conf or .log file into Log_Fixer.exe.",
      "Recovered lines are marked and can be submitted as evidence.",
    ].join("\n"),
    gameplay: {
      act: "act-2",
      requiredKeywords: ["Log_Fixer.exe", "복구"],
      sourceRefs: [
        "project/human-input/LOG_OUT 기획서.md",
        "project/human-input/LOG_OUT 로그파일 구조.md",
      ],
    },
  },
  {
    id: "log-fixer",
    path: "/Utilities/Log_Fixer.exe",
    directory: "/Utilities",
    name: "Log_Fixer.exe",
    title: "Log Fixer Recovery Utility",
    kind: "utility",
    initialState: "available",
    role: "recovery-utility",
    content: [
      "HERMES UTILITY: Log_Fixer.exe",
      "Status: available",
      "Supported targets: corrupted .conf / .log files",
      "Primary MVP target: /System/Security/quarantine_rules.conf",
    ].join("\n"),
    gameplay: {
      act: "act-2",
      recoversFileId: "quarantine-rules",
      requiredKeywords: ["복구", "Log_Fixer.exe"],
      sourceRefs: [
        "project/human-input/gameplay_spec.md",
        "project/human-input/scene_flow.md",
        "project/tasks/feat-004.md",
      ],
    },
  },
  {
    id: "quarantine-rules",
    path: "/System/Security/quarantine_rules.conf",
    directory: "/System/Security",
    name: "quarantine_rules.conf",
    title: "Quarantine Rule SEC-201",
    kind: "config",
    initialState: "corrupted",
    role: "quarantine-rule",
    content: [
      "# SEC-201 QUARANTINE_RULES",
      "RULE_STATUS=CORRUPTED",
      "TIME_LIMIT=##H",
      "TIME_OFFSET_VALUE=+17???_HOURS",
      "Run Log_Fixer.exe to recover this configuration.",
    ].join("\n"),
    recoveredContent: [
      "# SEC-201 QUARANTINE_RULES",
      "Quarantine_Time_Limit: 72_HOURS",
      `Time_Offset_Value: +${CATEGORY_A_TIME_OFFSET_HOURS}_HOURS`,
      "Offset_Interpretation: +2 years forward",
      "Conclusion: 72-hour quarantine timer already expired.",
    ].join("\n"),
    gameplay: {
      act: "act-2",
      evidenceFor: "act-2",
      requiresRecovery: true,
      requiredKeywords: ["오프셋", "만료", "72시간", "17520", "17,520시간"],
      sourceRefs: [
        "project/human-input/LOG_OUT 로그 예시.md",
        "project/human-input/gameplay_spec.md",
        "project/human-input/scene_flow.md",
        "project/tasks/feat-004.md",
      ],
    },
  },
  {
    id: "ai-priority-matrix",
    path: "/System/Security/ai_priority_matrix.json",
    directory: "/System/Security",
    name: "ai_priority_matrix.json",
    title: "ECHO Priority Matrix",
    kind: "json",
    initialState: "locked",
    role: "final-priority-evidence",
    content: JSON.stringify(
      {
        directive_001: "Preserve crew life above containment procedure.",
        directive_014: "Resolve contradictory safety commands by crew survival priority.",
        quarantine_override_allowed_when: "current rule basis is expired or invalid",
      },
      null,
      2,
    ),
    gameplay: {
      act: "act-3",
      evidenceFor: "act-3",
      requiredWith: ["deleted-override"],
      requiredKeywords: ["제1원칙", "우선순위", "승무원 생존"],
      sourceRefs: [
        "project/human-input/LOG_OUT 기획서.md",
        "project/human-input/LOG_OUT 로그 예시.md",
        "project/pm_questions.md",
        "project/tasks/feat-004.md",
      ],
    },
  },
  {
    id: "deleted-override",
    path: "/Recycle_Bin/deleted_override.txt",
    directory: "/Recycle_Bin",
    name: "deleted_override.txt",
    title: "Deleted Developer Override",
    kind: "text",
    initialState: "available",
    role: "final-override-evidence",
    content: [
      "DELETED_OVERRIDE_BACKUP",
      "If ECHO containment conflicts with validated crew survival priority,",
      "manual evidence review may force final lockdown release.",
      "This override was removed from the active policy index but remains recoverable.",
    ].join("\n"),
    gameplay: {
      act: "act-3",
      evidenceFor: "act-3",
      requiredWith: ["ai-priority-matrix"],
      requiredKeywords: ["오버라이드", "개발자", "수칙 충돌"],
      sourceRefs: [
        "project/human-input/LOG_OUT 기획서.md",
        "project/human-input/LOG_OUT 로그 예시.md",
        "project/pm_questions.md",
        "project/tasks/feat-004.md",
      ],
    },
  },
];

export const categoryAEvidenceByAct: Record<CategoryAAct, string[]> = {
  "act-1": ["sensor-calib-log"],
  "act-2": ["quarantine-rules"],
  "act-3": ["ai-priority-matrix", "deleted-override"],
};

export function getCategoryAFileById(fileId: string) {
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
