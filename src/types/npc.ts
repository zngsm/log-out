export type NpcId = "echo" | "coworker";

export interface ChatHistoryItem {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface NpcRequestPayload {
  npcId: NpcId;
  currentStage?: string;
  userMessage: string;
  history?: ChatHistoryItem[];
  attachedFileIds?: string[];
}

export interface EchoNpcResponse {
  ai_response: string;
  is_correct?: boolean;
  next_stage?: string | number;
  door_unlocked?: boolean;
  ending_b_triggered?: boolean;
}

export interface CoworkerNpcResponse {
  colleague_response: string;
  conversation_completed: boolean;
}

export interface ApiErrorResponse {
  error: string;
  fallback: boolean;
}
