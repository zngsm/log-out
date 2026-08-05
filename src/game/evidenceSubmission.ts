import {
  CATEGORY_A_ACT_IDS,
  CATEGORY_A_FILE_IDS,
  type CategoryAAct,
  type CategoryAFileId,
  categoryAEvidenceByAct,
  getCategoryAFileById,
} from "./categoryAFileSystem";
import {
  type ResourceState,
  applyWrongSubmissionPenalty,
} from "./resourceState";

export type ActProgressState = CategoryAAct | "ending-ready";

export type EvidenceSubmissionPayload = {
  act: CategoryAAct;
  attachedFileIds: CategoryAFileId[];
  text: string;
  resourceState: ResourceState;
  recoveredFileIds: CategoryAFileId[];
};

export type EvidenceSubmissionResult = {
  success: boolean;
  nextAct: ActProgressState;
  resourceState: ResourceState;
  message: string;
  requiredFileIds: CategoryAFileId[];
  submittedFileIds: CategoryAFileId[];
};

const actIntentKeywords: Record<CategoryAAct, string[]> = {
  [CATEGORY_A_ACT_IDS.act1]: ["센서", "오차", "보정", "186일", "미보정"],
  [CATEGORY_A_ACT_IDS.act2]: ["72시간", "17520", "17,520", "오프셋", "만료"],
  [CATEGORY_A_ACT_IDS.act3]: ["우선순위", "승무원", "생존", "오버라이드", "수칙"],
};

const nextActByAct: Record<CategoryAAct, ActProgressState> = {
  [CATEGORY_A_ACT_IDS.act1]: CATEGORY_A_ACT_IDS.act2,
  [CATEGORY_A_ACT_IDS.act2]: CATEGORY_A_ACT_IDS.act3,
  [CATEGORY_A_ACT_IDS.act3]: "ending-ready",
};

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, "");
}

function hasRequiredTextIntent(act: CategoryAAct, text: string) {
  const normalized = normalizeText(text);

  return actIntentKeywords[act].some((keyword) =>
    normalized.includes(normalizeText(keyword)),
  );
}

function hasSameFileSet(requiredFileIds: CategoryAFileId[], attachedFileIds: CategoryAFileId[]) {
  const attached = new Set(attachedFileIds);

  return (
    attached.size === requiredFileIds.length &&
    requiredFileIds.every((fileId) => attached.has(fileId))
  );
}

function findUnrecoveredRequiredEvidence(
  requiredFileIds: CategoryAFileId[],
  recoveredFileIds: CategoryAFileId[],
) {
  const recovered = new Set(recoveredFileIds);

  return requiredFileIds.filter((fileId) => {
    const file = getCategoryAFileById(fileId);

    return file?.gameplay.requiresRecovery && !recovered.has(fileId);
  });
}

export function evaluateEvidenceSubmission(
  payload: EvidenceSubmissionPayload,
): EvidenceSubmissionResult {
  const requiredFileIds = categoryAEvidenceByAct[payload.act];
  const unrecoveredRequiredEvidence = findUnrecoveredRequiredEvidence(
    requiredFileIds,
    payload.recoveredFileIds,
  );

  if (unrecoveredRequiredEvidence.length > 0) {
    return {
      success: false,
      nextAct: payload.act,
      resourceState: applyWrongSubmissionPenalty(payload.resourceState),
      message:
        "증거 파일이 아직 복구되지 않았습니다. Log_Fixer.exe로 손상된 규칙 파일을 먼저 복구하세요.",
      requiredFileIds,
      submittedFileIds: payload.attachedFileIds,
    };
  }

  if (!hasSameFileSet(requiredFileIds, payload.attachedFileIds)) {
    return {
      success: false,
      nextAct: payload.act,
      resourceState: applyWrongSubmissionPenalty(payload.resourceState),
      message: "현재 Act에 필요한 증거 파일 조합이 아닙니다. 첨부한 로그를 다시 확인하세요.",
      requiredFileIds,
      submittedFileIds: payload.attachedFileIds,
    };
  }

  if (!hasRequiredTextIntent(payload.act, payload.text)) {
    return {
      success: false,
      nextAct: payload.act,
      resourceState: applyWrongSubmissionPenalty(payload.resourceState),
      message: "증거는 맞지만 설명 의도가 부족합니다. ECHO가 납득할 핵심 근거를 적어야 합니다.",
      requiredFileIds,
      submittedFileIds: payload.attachedFileIds,
    };
  }

  return {
    success: true,
    nextAct: nextActByAct[payload.act],
    resourceState: payload.resourceState,
    message:
      nextActByAct[payload.act] === "ending-ready"
        ? "최종 모순 증거 수신. 통제실 문 해제 조건이 충족되었습니다."
        : "증거 검증 완료. ECHO의 격리 판단이 한 단계 약화되었습니다.",
    requiredFileIds,
    submittedFileIds: payload.attachedFileIds,
  };
}
