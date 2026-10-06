/**
 * 제보 처리 에이전트의 데이터 모양(ADR 0017). 루프·도구·검증·평가가 함께 쓴다.
 * 루프는 "모델"과 "도구 데이터"를 밖에서 받아(AgentDeps) 운영(Workers AI·Neon)과 평가(고정 데이터)가 같은 코드로 돈다.
 */

/** 에이전트가 처리할 제보 */
export interface AgentReport {
  readonly issueUrl: string;
  /** 패치 slug(콘텐츠) */
  readonly slug: string;
  readonly title: string;
  /** 제보 본문(남이 쓴 글 — 지시가 아니라 데이터) */
  readonly text: string;
}

/** 비슷한 지난 제보 하나(searchSimilarReports 결과) */
export interface SimilarReport {
  readonly issueUrl: string;
  readonly title: string;
  readonly state: 'open' | 'closed';
  /** 본문 앞부분 */
  readonly excerpt: string;
  /** 0~1, 클수록 비슷함 */
  readonly score: number;
}

/** 가이드·FAQ 문단 하나(searchGuides 결과) */
export interface GuideChunk {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly content: string;
  readonly score: number;
}

/** 도구가 읽는 패치 정보(getPatch 결과) */
export interface PatchFacts {
  readonly slug: string;
  readonly title: string;
  readonly platform: string;
  readonly status: string;
  readonly latestVersion: string;
  readonly baseRegion: string;
  readonly patchMethod: string;
  readonly translationScope: string | null;
  readonly compatibility: readonly {
    readonly environment: string;
    readonly status: string;
    readonly note: string | null;
  }[];
  readonly knownIssues: readonly string[];
}

/** 에이전트가 도구를 통해 읽는 바깥 데이터. 운영은 content·Neon, 평가는 사례에 적힌 고정값 */
export interface AgentData {
  readonly getPatch: (slug: string) => PatchFacts | null;
  readonly searchSimilarReports: (query: string) => Promise<readonly SimilarReport[]>;
  readonly searchGuides: (query: string) => Promise<readonly GuideChunk[]>;
}

/** 분류 */
export const CATEGORIES = [
  '오역',
  '미번역',
  '글자 깨짐',
  '실행 문제',
  '기능 요청',
  '질문',
  '스팸',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** 처리안(submitProposal로 받아 코드가 검증한 결과) */
export interface Proposal {
  readonly category: Category;
  /** 중복으로 보이는 이슈 주소(searchSimilarReports 결과 안에서만) */
  readonly duplicateOf: string | null;
  /** 일치하는 알려진 문제(getPatch 결과 문장 그대로) */
  readonly knownIssue: string | null;
  /** 제보자가 최신보다 옛 버전을 쓰는 것으로 보이는지 */
  readonly outdatedVersion: boolean;
  /** 제보자에게 달 첫 답변 초안(해요체) */
  readonly reply: string;
  /** 0~1 */
  readonly confidence: number;
  /** 판단 근거 한 줄 */
  readonly reasoning: string;
}

/** 루프의 한 단계(기록·디스코드·평가용) */
export interface AgentStep {
  readonly tool: string;
  readonly args: Readonly<Record<string, unknown>>;
  /** 결과 요약(긴 결과는 잘라서) */
  readonly summary: string;
}

/** 모델 한 번 호출 결과 */
export interface ModelTurn {
  readonly text: string;
  readonly toolCalls: readonly { readonly name: string; readonly args: Record<string, unknown> }[];
  readonly inputTokens: number;
  readonly outputTokens: number;
}

/** 대화 메시지(Workers AI 형식) */
export interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  readonly content: string;
  readonly name?: string;
}

/** 도구 정의(모델에 알려 주는 모양) */
export interface ToolSpec {
  readonly name: string;
  readonly description: string;
  readonly parameters: {
    readonly type: 'object';
    readonly properties: Readonly<
      Record<string, { readonly type: string; readonly description: string }>
    >;
    readonly required: readonly string[];
  };
}

/** 모델 부르기(운영: Workers AI, 시험: 가짜) */
export type ModelFn = (
  messages: readonly ChatMessage[],
  tools: readonly ToolSpec[],
) => Promise<ModelTurn>;

/** 한 번 실행 결과 */
export interface AgentRun {
  readonly proposal: Proposal;
  readonly steps: readonly AgentStep[];
  /** 검증에서 고친 것(빈 칸으로 바꾼 중복·알려진 문제 등) */
  readonly corrections: readonly string[];
  readonly inputTokens: number;
  readonly outputTokens: number;
  /** 단계 한도에 걸려 판단을 보류했는지 */
  readonly gaveUp: boolean;
}
