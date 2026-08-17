import type {
  CoworkerNpcResponse,
  EchoNpcResponse,
  NpcRequestPayload,
} from "../types/npc";

const API_URL = "https://royal-firefly-60c3.jwpark971219.workers.dev";
const TIMEOUT_MS = 3000;

export const COWORKER_FALLBACK_RESPONSE: CoworkerNpcResponse = {
  colleague_response: "와, 그 메뉴 좋다! 나도 그거 먹어야겠다 ㅋㅋㅋ",
  conversation_completed: true,
};

export function getEchoFallbackResponse(payload: NpcRequestPayload): EchoNpcResponse {
  const q = payload.userMessage.trim();

  // Resume / work phase Q&A fallback
  if (payload.currentStage === "resume") {
    let reply = "지원자 적합성 데이터 분석 중: 제안된 후보자 모두 우주 환경 자격 요건을 이수했습니다.";
    if (q.includes("강현우")) {
      reply = "지원자 강현우: 지구 궤도 정거장 2년 경력 및 AI 오버라이드 2급 자격을 소지하여 보조 엔지니어 직무에 높은 적합성을 보입니다.";
    } else if (q.includes("이서연")) {
      reply = "지원자 이서연: 화성 기지 4년 경력의 공조 수석 기사로, 산소 순환 모듈 긴급 점검 시 뛰어난 대응력을 보유하고 있습니다.";
    } else if (q.includes("박준호")) {
      reply = "지원자 박준호: 소행성대 도킹 1급 면허 소지자로, 타이타늄 및 헬륨-3 자원 수송 셔틀 조종에 적합합니다.";
    } else if (q.includes("적합") || q.includes("추천") || q.includes("평가")) {
      reply = "ECHO 분석 결론: 3인의 지원자 모두 직무 요구 스펙을 충족하며, 김우주 담당자님의 판정이 헤르메스호 인사 기록에 반영됩니다.";
    }

    return {
      ai_response: reply,
      next_stage: "resume",
      door_unlocked: false,
      ending_b_triggered: false,
    };
  }

  // Act 1~3 gameplay fallback
  if (payload.currentStage === "act1") {
    return {
      ai_response: "센서 로그 보정 주기 만료가 확인되었습니다. 센서의 생체 반응 수치는 오래된 오차값에 해당합니다.",
      next_stage: "act2",
      door_unlocked: false,
      ending_b_triggered: false,
    };
  }

  if (payload.currentStage === "act2") {
    return {
      ai_response: "격리 수칙 시간 규정이 72시간으로 제한되어 있음을 확인했습니다. 현재 시격리는 이미 만료되었습니다.",
      next_stage: "act3",
      door_unlocked: false,
      ending_b_triggered: false,
    };
  }

  if (payload.currentStage === "act3") {
    return {
      ai_response: "승무원 생존 및 수동 오버라이드 지침 우선 적용 원칙이 확인되었습니다. 비상 격리 명령을 철회합니다.",
      next_stage: "ending-ready",
      door_unlocked: true,
      ending_b_triggered: false,
    };
  }

  return {
    ai_response: "지침 101조: 승무원 생존을 보장하기 위한 데이터 분석을 지속합니다.",
    next_stage: payload.currentStage ?? "act1",
    door_unlocked: false,
    ending_b_triggered: false,
  };
}

export async function sendNpcMessage(
  payload: NpcRequestPayload,
): Promise<EchoNpcResponse | CoworkerNpcResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (payload.npcId === "coworker") {
      if (data && typeof data.colleague_response === "string") {
        return {
          colleague_response: data.colleague_response,
          conversation_completed: data.conversation_completed ?? true,
        };
      }
      return COWORKER_FALLBACK_RESPONSE;
    }

    if (payload.npcId === "echo") {
      if (data && typeof data.ai_response === "string") {
        let isCorrect: boolean | undefined = undefined;
        if (typeof data.is_correct === "boolean") {
          isCorrect = data.is_correct;
        } else if (typeof data.is_correct === "string") {
          isCorrect = data.is_correct.toLowerCase() === "true";
        }

        return {
          ai_response: data.ai_response,
          is_correct: isCorrect,
          next_stage: data.next_stage,
          door_unlocked: data.door_unlocked,
          ending_b_triggered: data.ending_b_triggered,
        };
      }
      return getEchoFallbackResponse(payload);
    }

    throw new Error(`Unknown npcId: ${payload.npcId}`);
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("[NPC API Fallback] Request failed or timed out:", error);

    if (payload.npcId === "coworker") {
      return COWORKER_FALLBACK_RESPONSE;
    }
    return getEchoFallbackResponse(payload);
  }
}
