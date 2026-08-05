export type CategoryAAct = "act-1" | "act-2" | "act-3";

export const CATEGORY_A_ACT_IDS = {
  act1: "act-1",
  act2: "act-2",
  act3: "act-3",
} as const satisfies Record<string, CategoryAAct>;

export const CATEGORY_A_FILE_IDS = {
  sensorCalibLog: "sensor-calib-log",
  emailChainJuly: "email-chain-july",
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
      "[HERMES SENSOR ARRAY #04]",
      "Last Calibration Date: 2026-01-10 09:00:00",
      "Elapsed Since Calibration: 186 days",
      "Thermal Offset: +/-2.3C false-positive range",
      "Bio-hazard lock may be based on stale thermal data.",
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
    id: CATEGORY_A_FILE_IDS.emailChainJuly,
    path: "/Personnel/Dr_Kim/email_chain_july.txt",
    directory: CATEGORY_A_DIRECTORY_PATHS.personnelDrKim,
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
    id: CATEGORY_A_FILE_IDS.toolManual,
    path: "/Personnel/Engineer_Park/tool_manual.txt",
    directory: CATEGORY_A_DIRECTORY_PATHS.personnelEngineerPark,
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
      "HERMES UTILITY: Log_Fixer.exe",
      "Status: available",
      "Supported targets: corrupted .conf / .log files",
      "Primary MVP target: /System/Security/quarantine_rules.conf",
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
        directive_001: "Preserve crew life above containment procedure.",
        directive_014: "Resolve contradictory safety commands by crew survival priority.",
        quarantine_override_allowed_when: "current rule basis is expired or invalid",
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
      "DELETED_OVERRIDE_BACKUP",
      "If ECHO containment conflicts with validated crew survival priority,",
      "manual evidence review may force final lockdown release.",
      "This override was removed from the active policy index but remains recoverable.",
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
