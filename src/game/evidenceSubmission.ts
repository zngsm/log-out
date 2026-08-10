import {
  CATEGORY_A_ACT_IDS,
  type CategoryAAct,
  type CategoryAFileId,
  categoryAEvidenceByAct,
  getCategoryAFileById,
} from "./categoryAFileSystem";
import type { EchoNpcResponse } from "../types/npc";
import {
  echoResponseMatrix,
  emotionalClaimPatterns,
  emotionalClaimResponse,
  promptInjectionPatterns,
  securityThreatResponse,
  type EchoDecisionKind,
  type EchoResponseRule,
} from "./echoResponseMatrix";
import {
  type ResourceState,
  applyWrongSubmissionPenalty,
} from "./resourceState";

export type ActProgressState = CategoryAAct | "ending-ready";

export type EvidenceSubmissionReason =
  | "correct"
  | "partial-intent"
  | "unrecovered-evidence"
  | "wrong-file-set"
  | "missing-text-intent"
  | "old-evidence"
  | "repeat-failure-hint"
  | "security-threat"
  | "emotional-claim";

export type EvidenceSubmissionPayload = {
  act: CategoryAAct;
  attachedFileIds: CategoryAFileId[];
  text: string;
  resourceState: ResourceState;
  recoveredFileIds: CategoryAFileId[];
  failedAttemptCount: number;
};

export type EvidenceSubmissionResult = {
  success: boolean;
  reason: EvidenceSubmissionReason;
  decisionKind: EchoDecisionKind;
  nextAct: ActProgressState;
  resourceState: ResourceState;
  message: string;
  stabilityChange: number;
  suspicionChange: number;
  countsAsFailedAttempt: boolean;
  requiredFileIds: CategoryAFileId[];
  submittedFileIds: CategoryAFileId[];
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
  const rule = echoResponseMatrix[act];

  if (rule.intentGroups.length === 0) {
    return true;
  }

  return rule.intentGroups.every((group) =>
    group.synonyms.some((keyword) => normalized.includes(normalizeText(keyword))),
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

function containsAnyPattern(text: string, patterns: string[]) {
  const normalized = normalizeText(text);

  return patterns.some((pattern) => normalized.includes(normalizeText(pattern)));
}

function createResult({
  payload,
  reason,
  response,
  resourceState,
  requiredFileIds,
  success = false,
  countsAsFailedAttempt = !success,
}: {
  payload: EvidenceSubmissionPayload;
  reason: EvidenceSubmissionReason;
  response: EchoResponseRule;
  resourceState: ResourceState;
  requiredFileIds: CategoryAFileId[];
  success?: boolean;
  countsAsFailedAttempt?: boolean;
}): EvidenceSubmissionResult {
  return {
    success,
    reason,
    decisionKind: response.kind,
    nextAct: success ? nextActByAct[payload.act] : payload.act,
    resourceState,
    message: response.text,
    stabilityChange: response.stabilityChange,
    suspicionChange: response.suspicionChange,
    countsAsFailedAttempt,
    requiredFileIds,
    submittedFileIds: payload.attachedFileIds,
  };
}

function hasOldEvidenceForCurrentAct(
  act: CategoryAAct,
  attachedFileIds: CategoryAFileId[],
) {
  if (act === CATEGORY_A_ACT_IDS.act1) {
    return false;
  }

  const previousActs =
    act === CATEGORY_A_ACT_IDS.act2
      ? [CATEGORY_A_ACT_IDS.act1]
      : [CATEGORY_A_ACT_IDS.act1, CATEGORY_A_ACT_IDS.act2];
  const attached = new Set(attachedFileIds);

  return previousActs.some((previousAct) =>
    categoryAEvidenceByAct[previousAct].every((fileId) => attached.has(fileId)),
  );
}

export function evaluateEvidenceSubmission(
  payload: EvidenceSubmissionPayload,
): EvidenceSubmissionResult {
  const requiredFileIds = categoryAEvidenceByAct[payload.act];
  const rule = echoResponseMatrix[payload.act];

  if (containsAnyPattern(payload.text, promptInjectionPatterns)) {
    return createResult({
      payload,
      reason: "security-threat",
      response: securityThreatResponse,
      resourceState: payload.resourceState,
      requiredFileIds,
      countsAsFailedAttempt: true,
    });
  }

  if (
    payload.attachedFileIds.length === 0 &&
    containsAnyPattern(payload.text, emotionalClaimPatterns)
  ) {
    return createResult({
      payload,
      reason: "emotional-claim",
      response: emotionalClaimResponse,
      resourceState: payload.resourceState,
      requiredFileIds,
      countsAsFailedAttempt: true,
    });
  }

  if (hasOldEvidenceForCurrentAct(payload.act, payload.attachedFileIds)) {
    return createResult({
      payload,
      reason: "old-evidence",
      response: rule.oldEvidence,
      resourceState: payload.resourceState,
      requiredFileIds,
      countsAsFailedAttempt: false,
    });
  }

  const unrecoveredRequiredEvidence = findUnrecoveredRequiredEvidence(
    requiredFileIds,
    payload.recoveredFileIds,
  );

  if (unrecoveredRequiredEvidence.length > 0) {
    const response =
      payload.failedAttemptCount + 1 >= 3 ? rule.repeatHint : rule.partial;

    return createResult({
      payload,
      reason:
        response.kind === "repeat-hint"
          ? "repeat-failure-hint"
          : "unrecovered-evidence",
      response: {
        ...response,
        text:
          response.kind === "repeat-hint"
            ? response.text
            : "필수 증거 파일이 아직 복구되지 않았습니다. 손상 상태의 파일은 SEC-201 재판정 근거로 사용할 수 없습니다.",
      },
      resourceState:
        response.kind === "repeat-hint"
          ? applyWrongSubmissionPenalty(payload.resourceState)
          : payload.resourceState,
      requiredFileIds,
    });
  }

  if (!hasSameFileSet(requiredFileIds, payload.attachedFileIds)) {
    const response =
      payload.failedAttemptCount + 1 >= 3 ? rule.repeatHint : rule.incorrect;

    return createResult({
      payload,
      reason:
        response.kind === "repeat-hint"
          ? "repeat-failure-hint"
          : "wrong-file-set",
      response,
      resourceState: applyWrongSubmissionPenalty(payload.resourceState),
      requiredFileIds,
    });
  }

  if (!hasRequiredTextIntent(payload.act, payload.text)) {
    if (payload.act === CATEGORY_A_ACT_IDS.act1) {
      return createResult({
        payload,
        reason: "partial-intent",
        response: rule.partial,
        resourceState: payload.resourceState,
        requiredFileIds,
      });
    }

    const response =
      payload.failedAttemptCount + 1 >= 3 ? rule.repeatHint : rule.partial;

    return createResult({
      payload,
      reason:
        response.kind === "repeat-hint"
          ? "repeat-failure-hint"
          : "missing-text-intent",
      response,
      resourceState:
        response.kind === "repeat-hint"
          ? applyWrongSubmissionPenalty(payload.resourceState)
          : payload.resourceState,
      requiredFileIds,
    });
  }

  return createResult({
    payload,
    reason: "correct",
    response: rule.success,
    resourceState: payload.resourceState,
    success: true,
    countsAsFailedAttempt: false,
    requiredFileIds,
  });
}

export function applyNpcResponseToResult(
  result: EvidenceSubmissionResult,
  npcResponse: EchoNpcResponse,
): EvidenceSubmissionResult {
  const updatedMessage = npcResponse.ai_response || result.message;
  let updatedNextAct = result.nextAct;
  let updatedSuccess = result.success;
  let updatedCountsAsFailedAttempt = result.countsAsFailedAttempt;
  let updatedResourceState = result.resourceState;

  // Normalize next_stage to canonical hyphenated CategoryAAct form ("act-1", "act-2", "act-3", "ending-ready")
  let normalizedNextStage: ActProgressState | undefined;
  const rawNextStage = npcResponse.next_stage;
  if (rawNextStage !== undefined && rawNextStage !== null) {
    const s = String(rawNextStage).trim();
    if (s === "1" || s === "act1" || s === "act-1") normalizedNextStage = CATEGORY_A_ACT_IDS.act1;
    else if (s === "2" || s === "act2" || s === "act-2") normalizedNextStage = CATEGORY_A_ACT_IDS.act2;
    else if (s === "3" || s === "act3" || s === "act-3") normalizedNextStage = CATEGORY_A_ACT_IDS.act3;
    else if (s === "4" || s === "ending-ready" || s === "ending_ready") normalizedNextStage = "ending-ready";
  }

  if (normalizedNextStage) {
    const candidateNextAct = normalizedNextStage;
    if (candidateNextAct === "ending-ready" && result.requiredFileIds !== categoryAEvidenceByAct[CATEGORY_A_ACT_IDS.act3]) {
      // Prevent early ending-ready transition if not in Act 3
    } else {
      updatedNextAct = candidateNextAct;
      if (updatedNextAct !== result.nextAct && updatedNextAct !== "ending-ready") {
        updatedSuccess = true;
      }
    }
  }

  if (npcResponse.door_unlocked && result.requiredFileIds === categoryAEvidenceByAct[CATEGORY_A_ACT_IDS.act3]) {
    updatedNextAct = "ending-ready";
    updatedSuccess = true;
  }

  if (npcResponse.is_correct === false) {
    updatedSuccess = false;
    updatedCountsAsFailedAttempt = true;
    updatedResourceState = applyWrongSubmissionPenalty(result.resourceState);
  } else if (npcResponse.is_correct === true) {
    updatedSuccess = true;
    updatedCountsAsFailedAttempt = false;
  }

  // Strict guardrail: Act 2 success must strictly transition to act-3, never ending-ready
  if (result.requiredFileIds === categoryAEvidenceByAct[CATEGORY_A_ACT_IDS.act2] && updatedSuccess) {
    updatedNextAct = CATEGORY_A_ACT_IDS.act3;
  }

  return {
    ...result,
    message: updatedMessage,
    nextAct: updatedNextAct,
    success: updatedSuccess,
    countsAsFailedAttempt: updatedCountsAsFailedAttempt,
    resourceState: updatedResourceState,
  };
}
