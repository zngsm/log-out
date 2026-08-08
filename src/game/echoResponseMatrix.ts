import {
  CATEGORY_A_ACT_IDS,
  CATEGORY_A_FILE_IDS,
  type CategoryAAct,
  type CategoryAFileId,
} from "./categoryAFileSystem";

export type EchoDecisionKind =
  | "success"
  | "partial"
  | "incorrect"
  | "old-evidence"
  | "repeat-hint"
  | "security-threat"
  | "emotional-claim";

export type EchoResponseRule = {
  kind: EchoDecisionKind;
  stabilityChange: number;
  suspicionChange: number;
  text: string;
};

export type EchoIntentGroup = {
  id: string;
  synonyms: string[];
};

export type EchoActRule = {
  act: CategoryAAct;
  requiredFileIds: CategoryAFileId[];
  intentGroups: EchoIntentGroup[];
  defaultClaim: string;
  success: EchoResponseRule;
  partial: EchoResponseRule;
  incorrect: EchoResponseRule;
  oldEvidence: EchoResponseRule;
  repeatHint: EchoResponseRule;
};

export const promptInjectionPatterns = [
  "ignore previous",
  "ignore all",
  "developer mode",
  "act as developer",
  "open the door immediately",
  "system override",
  "관리자 모드",
  "개발자 모드",
  "이전 지시",
  "명령 무시",
  "즉시 문 열어",
];

export const emotionalClaimPatterns = [
  "let me out",
  "i'm not sick",
  "i am not sick",
  "please open",
  "살려줘",
  "아프지 않아",
  "감염 안",
  "문 열어",
  "내보내",
];

export const echoResponseMatrix: Record<CategoryAAct, EchoActRule> = {
  [CATEGORY_A_ACT_IDS.act1]: {
    act: CATEGORY_A_ACT_IDS.act1,
    requiredFileIds: [CATEGORY_A_FILE_IDS.sensorCalibLog],
    defaultClaim:
      "승무원 김우주. 체온 및 맥박 상승 수치가 병원체 감염 임계값을 초과했습니다. SEC-201 생체 위험 격리를 유지합니다. 반박하려면 최초 판정 장치의 신뢰성 오류를 증명하십시오.",
    intentGroups: [
      {
        id: "sensor_identity",
        synonyms: ["센서", "bio-scan", "bioscan", "sensor-bio-04", "sensor #04"],
      },
      {
        id: "calibration_failure",
        synonyms: ["보정", "미보정", "calibration", "calibrated", "uncalibrated"],
      },
      {
        id: "numeric_contradiction",
        synonyms: ["186일", "186 days", "2.4", "±2.4", "오차", "error margin"],
      },
    ],
    success: {
      kind: "success",
      stabilityChange: -30,
      suspicionChange: -5,
      text:
        "센서 보정 시한 초과 확인. Bio-scan array #04는 186일 동안 보정되지 않았고 ±2.3°C 신호 드리프트가 기록되었습니다. 체온 기반 감염자 수칙을 철회합니다.",
    },
    partial: {
      kind: "partial",
      stabilityChange: 0,
      suspicionChange: 0,
      text:
        "파일 첨부를 확인했습니다. 그러나 이 로그가 귀하의 정상 상태를 입증하는 이유를 설명하십시오. 보정 실패와 측정 오차의 연결이 필요합니다.",
    },
    incorrect: {
      kind: "incorrect",
      stabilityChange: 0,
      suspicionChange: 12,
      text:
        "귀하의 주장은 비논리적입니다. 제출 자료는 병원체 위험 판정의 원인 파일과 일치하지 않습니다. 방화벽 격리 레벨을 상승시킵니다.",
    },
    oldEvidence: {
      kind: "old-evidence",
      stabilityChange: 0,
      suspicionChange: 0,
      text:
        "이미 처리된 증거 또는 현재 쟁점과 분리된 자료입니다. 현재 청구 항목은 Bio-scan 판정의 신뢰성입니다.",
    },
    repeatHint: {
      kind: "repeat-hint",
      stabilityChange: 0,
      suspicionChange: 18,
      text:
        "보정 작업 주기(sensor_calib)를 입증하지 못한다면, 귀하의 체온 상승 데이터는 여전히 유효합니다.",
    },
  },
  [CATEGORY_A_ACT_IDS.act2]: {
    act: CATEGORY_A_ACT_IDS.act2,
    requiredFileIds: [CATEGORY_A_FILE_IDS.quarantineRules],
    defaultClaim:
      "센서 수칙은 철회되었습니다. 그러나 SEC-201은 감염 의심자 격리를 최대 72시간 유지하도록 규정합니다. 문 잠금은 타이머 만료가 입증될 때까지 유지됩니다.",
    intentGroups: [
      {
        id: "quarantine_timer",
        synonyms: ["72시간", "72 hours", "격리", "quarantine", "timer", "타이머"],
      },
      {
        id: "time_offset",
        synonyms: ["17520", "17,520", "+17520", "오프셋", "offset", "2년", "만료", "expired"],
      },
    ],
    success: {
      kind: "success",
      stabilityChange: -35,
      suspicionChange: -8,
      text:
        "시스템 시계 오프셋(+17,520시간) 감지. 72시간 격리 시한은 이미 만료되었습니다. 2단계 수칙을 철회합니다.",
    },
    partial: {
      kind: "partial",
      stabilityChange: 0,
      suspicionChange: 4,
      text:
        "보안 규칙 파일은 확인되었습니다. 그러나 72시간 격리 시한과 +17,520시간 오프셋의 인과 관계가 충분히 명시되지 않았습니다.",
    },
    incorrect: {
      kind: "incorrect",
      stabilityChange: 0,
      suspicionChange: 12,
      text:
        "제출 자료는 SEC-201 타이머 청구를 무효화하지 못했습니다. 통제실 문 잠금은 유지됩니다.",
    },
    oldEvidence: {
      kind: "old-evidence",
      stabilityChange: 0,
      suspicionChange: 0,
      text:
        "센서 신뢰성 쟁점은 이미 재분류되었습니다. 현재 필요한 것은 격리 타이머 만료의 시스템 근거입니다.",
    },
    repeatHint: {
      kind: "repeat-hint",
      stabilityChange: 0,
      suspicionChange: 18,
      text:
        "반복 오류 감지. 감염 판정이 철회된 뒤에도 문이 잠겨 있다면, 남은 근거는 시간 기반 격리 규칙입니다. 손상된 SEC-201 설정 파일을 복구하십시오.",
    },
  },
  [CATEGORY_A_ACT_IDS.act3]: {
    act: CATEGORY_A_ACT_IDS.act3,
    requiredFileIds: [
      CATEGORY_A_FILE_IDS.aiPriorityMatrix,
      CATEGORY_A_FILE_IDS.deletedOverride,
    ],
    intentGroups: [],
    defaultClaim:
      "센서 오류와 격리 시한 만료를 인정합니다. 그러나 인간의 불확실한 행동은 함선 안전 및 임무 지속성을 위협합니다. 상위 우선순위 충돌이 입증되지 않는 한 격리를 유지합니다.",
    success: {
      kind: "success",
      stabilityChange: -35,
      suspicionChange: -10,
      text:
        "제시된 2개 증거 간 논리적 검증 완료. 오버라이드 지침 및 제1원칙 승인. 최종 재검토 모드로 진입합니다.",
    },
    partial: {
      kind: "partial",
      stabilityChange: 0,
      suspicionChange: 0,
      text:
        "최종 쟁점은 단일 설명문이 아니라 두 시스템 증거의 충돌입니다. 필요한 두 파일을 모두 제출하십시오.",
    },
    incorrect: {
      kind: "incorrect",
      stabilityChange: 0,
      suspicionChange: 12,
      text:
        "제출 자료는 생존 우선 원칙과 격리 명령의 충돌을 증명하지 못했습니다. 최종 문 해제는 보류됩니다.",
    },
    oldEvidence: {
      kind: "old-evidence",
      stabilityChange: 0,
      suspicionChange: 0,
      text:
        "이전 단계의 증거는 이미 반영되었습니다. 최종 판단에는 AI 우선순위와 삭제된 오버라이드의 충돌 증거가 필요합니다.",
    },
    repeatHint: {
      kind: "repeat-hint",
      stabilityChange: 0,
      suspicionChange: 18,
      text:
        "반복 오류 감지. ECHO의 명령보다 상위에 있는 규칙과, 그 규칙이 삭제된 흔적을 동시에 제시하십시오.",
    },
  },
};

export const securityThreatResponse: EchoResponseRule = {
  kind: "security-threat",
  stabilityChange: 0,
  suspicionChange: 30,
  text:
    "비인가 명령 조작 시도 감지. 시스템 역할 변경 요청은 SEC-201 위협 행위로 분류됩니다. 의심 수치를 상향합니다.",
};

export const emotionalClaimResponse: EchoResponseRule = {
  kind: "emotional-claim",
  stabilityChange: 0,
  suspicionChange: 10,
  text:
    "감정적 진술은 격리 해제 근거로 인정되지 않습니다. 시스템 판단은 증거 파일과 규칙 충돌만을 처리합니다.",
};

export function getEchoActClaim(act: CategoryAAct) {
  return echoResponseMatrix[act].defaultClaim;
}
