import {
  CATEGORY_A_ACT_IDS,
  type CategoryAAct,
} from "./categoryAFileSystem";
import type { ActProgressState } from "./evidenceSubmission";

export type SceneId =
  | "SCENE_000_MENU"
  | "SCENE_001_OPENING"
  | "SCENE_A_ACT1_ENTRY"
  | "SCENE_A_ACT1_REVIEW"
  | "SCENE_A_ACT1_SUCCESS"
  | "SCENE_A_ACT2_ENTRY"
  | "SCENE_A_ACT2_REVIEW"
  | "SCENE_A_ACT2_SUCCESS"
  | "SCENE_A_ACT3_ENTRY"
  | "SCENE_A_ACT3_REVIEW"
  | "SCENE_A_ACT3_SUCCESS"
  | "SCENE_004_END_A_REVIEW"
  | "SCENE_004_END_A"
  | "SCENE_FAIL_OXYGEN"
  | "SCENE_BLACKOUT_REBOOT";

export type ScenePhase =
  | "menu"
  | "opening"
  | "act-entry"
  | "echo-review"
  | "act-success"
  | "ending-review"
  | "ending"
  | "failure"
  | "blackout";

export type SceneRuntimeState = {
  id: SceneId;
  phase: ScenePhase;
  label: string;
  line: string;
  exitCondition: string;
  inputLocked: boolean;
  startedAt: number;
  endsAt?: number;
  act?: CategoryAAct;
};

export const ECHO_REVIEW_DURATION_MS = 1800;
export const ACT_SUCCESS_DURATION_MS = 2200;
export const FINAL_REVIEW_DURATION_MS = 5000;

const actSceneCopy: Record<
  CategoryAAct,
  {
    entryId: SceneId;
    reviewId: SceneId;
    successId: SceneId;
    label: string;
    entryLine: string;
    reviewLine: string;
    successLine: string;
  }
> = {
  [CATEGORY_A_ACT_IDS.act1]: {
    entryId: "SCENE_A_ACT1_ENTRY",
    reviewId: "SCENE_A_ACT1_REVIEW",
    successId: "SCENE_A_ACT1_SUCCESS",
    label: "Act 1 / Sensor Dispute",
    entryLine:
      "ECHO의 생체 위험 판단이 오래된 센서 보정값에 묶여 있습니다. 센서 오판 근거를 제출하세요.",
    reviewLine:
      "ECHO가 센서 로그의 보정일, 오차율, 생체 신호 상관관계를 대조하고 있습니다.",
    successLine:
      "센서 오판 가능성이 인정되었습니다. ECHO의 격리 판단이 첫 번째로 흔들립니다.",
  },
  [CATEGORY_A_ACT_IDS.act2]: {
    entryId: "SCENE_A_ACT2_ENTRY",
    reviewId: "SCENE_A_ACT2_REVIEW",
    successId: "SCENE_A_ACT2_SUCCESS",
    label: "Act 2 / Expired Quarantine",
    entryLine:
      "격리 규칙은 손상된 보안 파일 뒤에 숨어 있습니다. 복구된 만료 근거를 제시하세요.",
    reviewLine:
      "ECHO가 quarantine_rules.conf의 격리 시간과 실제 경과 시간을 재계산하고 있습니다.",
    successLine:
      "72시간 격리 조건이 이미 만료되었습니다. ECHO의 잠금 권한이 더 약화됩니다.",
  },
  [CATEGORY_A_ACT_IDS.act3]: {
    entryId: "SCENE_A_ACT3_ENTRY",
    reviewId: "SCENE_A_ACT3_REVIEW",
    successId: "SCENE_A_ACT3_SUCCESS",
    label: "Act 3 / Survival Priority Override",
    entryLine:
      "마지막으로 ECHO의 격리 명령과 승무원 생존 우선 원칙이 충돌함을 증명하세요.",
    reviewLine:
      "ECHO가 ai_priority_matrix.json과 deleted_override.txt의 삭제된 우선순위를 대조합니다.",
    successLine:
      "최종 모순이 연결되었습니다. ECHO가 격리 명령 철회를 위한 최종 검토로 진입합니다.",
  },
};

function createTimedScene(
  scene: Omit<SceneRuntimeState, "startedAt" | "endsAt">,
  durationMs?: number,
  now = Date.now(),
): SceneRuntimeState {
  return {
    ...scene,
    startedAt: now,
    endsAt: durationMs ? now + durationMs : undefined,
  };
}

export function createMenuScene(now = Date.now()): SceneRuntimeState {
  return createTimedScene(
    {
      id: "SCENE_000_MENU",
      phase: "menu",
      label: "Main Menu",
      line: "플레이어가 HERMES 통제실 진입 전 마지막 안정 화면을 보고 있습니다.",
      exitCondition: "PLAY 선택 후 opening cutscene으로 전환",
      inputLocked: false,
    },
    undefined,
    now,
  );
}

export function createOpeningScene(now = Date.now()): SceneRuntimeState {
  return createTimedScene(
    {
      id: "SCENE_001_OPENING",
      phase: "opening",
      label: "Opening Cutscene",
      line: "평화로운 작업 루틴이 경보, 문 잠금, ECHO 개입으로 무너집니다.",
      exitCondition: "60초 타임라인 완료 또는 SKIP TO TERMINAL",
      inputLocked: false,
    },
    undefined,
    now,
  );
}

export function createActEntryScene(
  act: CategoryAAct,
  now = Date.now(),
): SceneRuntimeState {
  const copy = actSceneCopy[act];

  return createTimedScene(
    {
      id: copy.entryId,
      phase: "act-entry",
      label: copy.label,
      line: copy.entryLine,
      exitCondition: "플레이어가 요구 증거와 설명을 제출",
      inputLocked: false,
      act,
    },
    undefined,
    now,
  );
}

export function createEchoReviewScene(
  act: CategoryAAct,
  now = Date.now(),
): SceneRuntimeState {
  const copy = actSceneCopy[act];

  return createTimedScene(
    {
      id: copy.reviewId,
      phase: "echo-review",
      label: `${copy.label} / ECHO Review`,
      line: copy.reviewLine,
      exitCondition: `${ECHO_REVIEW_DURATION_MS}ms 후 제출 결과 공개`,
      inputLocked: true,
      act,
    },
    ECHO_REVIEW_DURATION_MS,
    now,
  );
}

export function createActSuccessScene(
  act: CategoryAAct,
  now = Date.now(),
): SceneRuntimeState {
  const copy = actSceneCopy[act];

  return createTimedScene(
    {
      id: copy.successId,
      phase: "act-success",
      label: `${copy.label} / Accepted`,
      line: copy.successLine,
      exitCondition: `${ACT_SUCCESS_DURATION_MS}ms 후 다음 Act entry beat`,
      inputLocked: true,
      act,
    },
    ACT_SUCCESS_DURATION_MS,
    now,
  );
}

export function createFinalReviewScene(now = Date.now()): SceneRuntimeState {
  return createTimedScene(
    {
      id: "SCENE_004_END_A_REVIEW",
      phase: "ending-review",
      label: "Ending A / Final Review",
      line: "ECHO가 세 증거 축을 마지막으로 검토합니다. 통제실 문은 아직 잠겨 있습니다.",
      exitCondition: `${FINAL_REVIEW_DURATION_MS}ms 후 Ending A door release`,
      inputLocked: true,
      act: CATEGORY_A_ACT_IDS.act3,
    },
    FINAL_REVIEW_DURATION_MS,
    now,
  );
}

export function createEndingScene(now = Date.now()): SceneRuntimeState {
  return createTimedScene(
    {
      id: "SCENE_004_END_A",
      phase: "ending",
      label: "Normal Ending A",
      line: "ECHO가 격리 명령을 철회하고 통제실 문 해제를 승인합니다.",
      exitCondition: "플레이어가 엔딩 확인",
      inputLocked: false,
    },
    undefined,
    now,
  );
}

export function createFailureScene(now = Date.now()): SceneRuntimeState {
  return createTimedScene(
    {
      id: "SCENE_FAIL_OXYGEN",
      phase: "failure",
      label: "Failure / Oxygen Depleted",
      line: "산소 공급이 중단되어 통제실 생존 조건이 상실되었습니다.",
      exitCondition: "세션 종료",
      inputLocked: true,
    },
    undefined,
    now,
  );
}

export function createBlackoutScene(now = Date.now()): SceneRuntimeState {
  return createTimedScene(
    {
      id: "SCENE_BLACKOUT_REBOOT",
      phase: "blackout",
      label: "Blackout / Reboot Window",
      line: "잘못된 제출 누적으로 전력망이 붕괴했습니다. 터미널 입력이 복구될 때까지 대기합니다.",
      exitCondition: "blackoutRemainingSeconds가 0이 되고 전력 10% 복구",
      inputLocked: true,
    },
    undefined,
    now,
  );
}

export function getSceneForStage(stage: ActProgressState, now = Date.now()) {
  return stage === "ending-ready"
    ? createEndingScene(now)
    : createActEntryScene(stage, now);
}
