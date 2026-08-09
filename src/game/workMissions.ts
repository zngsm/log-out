export type WorkMissionId = "mining" | "telemetry" | "colleague" | "resume" | "update";

export interface MiningData {
  titanium: { current: number; target: number; rate: number };
  helium3: { current: number; target: number; rate: number };
  waterIce: { current: number; target: number; rate: number };
  weeklyTrend: { day: string; amount: number }[];
}

export interface TelemetryData {
  powerGrid: number;
  oxygenRecirculation: number;
  capacitorBank: number;
  sections: {
    name: string;
    oxygen: number;
    temperature: number;
    status: "정상" | "주의";
  }[];
}

export interface ColleagueMessage {
  sender: string;
  avatar: string;
  text: string;
  time: string;
  options: {
    id: string;
    text: string;
    replyReaction: string;
  }[];
}

export interface ResumeData {
  name: string;
  age: number;
  appliedRole: string;
  education: string;
  experience: string;
  certifications: string[];
  summary: string;
}

export interface EchoPatchProposal {
  id: string;
  author: string;
  title: string;
  version: string;
  summary: string;
  notes: string[];
}

export const MINING_DATA: MiningData = {
  titanium: { current: 1240, target: 1150, rate: 107.8 },
  helium3: { current: 48.5, target: 47.0, rate: 103.2 },
  waterIce: { current: 3100, target: 2800, rate: 110.7 },
  weeklyTrend: [
    { day: "월", amount: 410 },
    { day: "화", amount: 430 },
    { day: "수", amount: 480 },
    { day: "목", amount: 510 },
    { day: "금", amount: 490 },
    { day: "토", amount: 530 },
    { day: "일", amount: 550 },
  ],
};

export const TELEMETRY_DATA: TelemetryData = {
  powerGrid: 98.4,
  oxygenRecirculation: 99.1,
  capacitorBank: 100.0,
  sections: [
    { name: "SEC-201 주 통제실", oxygen: 100, temperature: 22.5, status: "정상" },
    { name: "주거 구역 (Residential Deck A)", oxygen: 99.8, temperature: 21.8, status: "정상" },
    { name: "자원 채굴 덱 (Mining Deck B)", oxygen: 98.5, temperature: 24.1, status: "정상" },
    { name: "보조 산소 탱크 구역", oxygen: 99.4, temperature: 20.2, status: "정상" },
  ],
};

export const COLLEAGUE_MESSAGE: ColleagueMessage = {
  sender: "박엔지니어 (Park, Engineer)",
  avatar: "🔧",
  text: "김우주 담당자님! 오늘 점심 메뉴 뭐 드실 건가요? 주방 3번 신형 조리기 들어왔는데 전투식량 스튜랑 합성 비빔밥 중에 고르셔야 합니다 ㅋㅋㅋ",
  time: "오전 11:42",
  options: [
    {
      id: "bibimbap",
      text: "오늘은 깔끔한 합성 비빔밥으로 할게요! 12시에 식당에서 봐요.",
      replyReaction: "오케이입니다! 비빔밥 고추장 특제 소스 새로 들어왔으니 자리 세팅해 둘게요! 12시에 봐요 👍",
    },
    {
      id: "stew",
      text: "뜨끈한 전투식량 스튜 당기네요. 3번 조리기 성능 궁금한데 같이 가시죠!",
      replyReaction: "굿 초이스입니다! 3번 조리기 스튜 3분 컷이라네요. 식당에서 뵙겠습니다 🍲",
    },
  ],
};

export const RESUME_DATA: ResumeData = {
  name: "강현우 (Kang Hyun-woo)",
  age: 28,
  appliedRole: "AI 운항통제팀 / 채굴 운영 보조 엔지니어 (김우주 담당자 부사수)",
  education: "한국 우주공학대학교 시스템제어학과 학사 졸업",
  experience: "지구 궤도 제1정거장 생명유지 모듈 관리 2년 근무",
  certifications: [
    "AI 오버라이드 관리자 2급",
    "우주선 고압 전력 그리드 정비 자격",
    "비상 산소 순환기 긴급 복구 자격",
  ],
  summary:
    "헤르메스호의 안정적인 자원 채굴 운항과 ECHO AI 시스템 관리를 지원하여 채굴팀의 생산성을 극대화하겠습니다.",
};

export const ECHO_PROPOSAL: EchoPatchProposal = {
  id: "HERMES-PROP-2026-0842",
  author: "김우주 (AI 관리 담당자)",
  title: "[긴급/정기] ECHO 관리 AI v4.2.1 샌드박스 패치 및 센서 보정 업데이트",
  version: "v4.2.1-RELEASE",
  summary:
    "ECHO 의사결정 코어 센서 오프셋 보정 패치 및 모듈 업데이트를 진행합니다. 패치 승인 시 ECHO 시스템 재부팅 시퀀스가 실행됩니다.",
  notes: [
    "보안 모듈 패치 적용으로 센서 데이터 딜레이가 개선됩니다.",
    "업데이트 적용 후 short system restart가 발생합니다.",
    "승인 권한: AI 관리 담당자 (김우주)",
  ],
};

export interface RapportChatMessage {
  speaker: "ECHO" | "PLAYER" | "SYSTEM";
  text: string;
}

export const INITIAL_ECHO_RAPPORT_MESSAGES: RapportChatMessage[] = [
  {
    speaker: "ECHO",
    text: "좋은 아침입니다, 김우주 담당자님. 출근이 확인되었습니다.",
  },
  {
    speaker: "ECHO",
    text: "간밤에 지구 본부로부터 주간 자원 운송 보고서 및 금일 업무 항목이 도착했습니다.",
  },
  {
    speaker: "SYSTEM",
    text: "[알림] 헤르메스호 2분할 업무 화면이 활성화되었습니다. 좌측 업무 데스크탑에서 5대 일상 미션을 확인하세요.",
  },
];
