import type { ChatMessage, ModelFn, ModelTurn, ToolSpec } from '../modules/agent/types.ts';

/**
 * Workers AI 모델 부르기(ADR 0017). 에이전트 루프는 이 감싸개(ModelFn)만 알아서, 모델을 바꿔 끼우기 쉽다.
 * - 무료 한도: 하루 1만 뉴런(UTC 0시 초기화). 개발(wrangler dev)에서도 실제 모델을 불러 한도를 쓴다.
 * - 도구 호출 지원 모델만 후보로 둔다. 어느 모델을 쓸지는 평가(eval) 점수로 정한다.
 */

/** 후보 모델(이름 → Workers AI 모델 ID) */
const AGENT_MODELS = {
  llama70b: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  mistral24b: '@cf/mistralai/mistral-small-3.1-24b-instruct',
  qwen30b: '@cf/qwen/qwen3-30b-a3b-fp8',
} as const;
type AgentModelName = keyof typeof AGENT_MODELS;

/** 임베딩 모델(다국어, 1024차원) */
const EMBEDDING_MODEL = '@cf/baai/bge-m3';
/** 답 길이 상한(토큰). 처리안 한 번에 충분하고 비용을 묶는다 */
const MAX_OUTPUT_TOKENS = 1024;

/** Workers AI 응답에서 쓰는 부분(모델마다 조금씩 달라 넓게 받는다) */
interface RawOutput {
  readonly response?: unknown;
  // biome-ignore lint/style/useNamingConvention: Workers AI 응답 필드 이름
  readonly tool_calls?: readonly { readonly name?: string; readonly arguments?: unknown }[];
  // biome-ignore lint/style/useNamingConvention: Workers AI 응답 필드 이름
  readonly usage?: { readonly prompt_tokens?: number; readonly completion_tokens?: number };
}

/** 도구 인자가 문자열(JSON)로 오는 모델도 있어 객체로 맞춘다 */
function parseArgs(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

/**
 * 도구 호출을 tool_calls 대신 글(JSON)로 써 버리는 경우가 있다(Llama 계열: {"name": …, "parameters": {…}}).
 * 글 전체가 그 모양일 때만 도구 호출로 살린다. 알 수 없는 도구 이름은 루프가 오류로 돌려준다.
 */
function toolCallFromText(text: string): ModelTurn['toolCalls'] {
  const trimmed = text.trim();
  if (!(trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    return [];
  }
  const parsed: {
    readonly name?: unknown;
    readonly parameters?: unknown;
    readonly arguments?: unknown;
  } = parseArgs(trimmed);
  const name = typeof parsed.name === 'string' ? parsed.name : '';
  if (name === '') {
    return [];
  }
  return [{ name, args: parseArgs(parsed.parameters ?? parsed.arguments) }];
}

function workersAiModel(ai: Ai, name: AgentModelName): ModelFn {
  return async (messages: readonly ChatMessage[], tools: readonly ToolSpec[]) => {
    const output = (await ai.run(
      AGENT_MODELS[name] as keyof AiModels,
      {
        messages: messages.map((message) => ({ ...message })),
        tools: tools.map((tool) => ({ type: 'function', function: tool })),
        // biome-ignore lint/style/useNamingConvention: Workers AI 입력 필드 이름
        max_tokens: MAX_OUTPUT_TOKENS,
      } as never,
    )) as RawOutput | string;
    const raw: RawOutput = typeof output === 'string' ? { response: output } : output;
    const text = typeof raw.response === 'string' ? raw.response : '';
    const toolCalls = (raw.tool_calls ?? []).flatMap((call) =>
      call.name ? [{ name: call.name, args: parseArgs(call.arguments) }] : [],
    );
    return {
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : toolCallFromText(text),
      inputTokens: raw.usage?.prompt_tokens ?? 0,
      outputTokens: raw.usage?.completion_tokens ?? 0,
    };
  };
}

/** 글 여러 개를 임베딩(1024차원 벡터)으로 */
async function embed(ai: Ai, texts: readonly string[]): Promise<number[][]> {
  const output = (await ai.run(EMBEDDING_MODEL, { text: [...texts] })) as {
    readonly data?: number[][];
  };
  return output.data ?? [];
}

function isAgentModelName(value: unknown): value is AgentModelName {
  return typeof value === 'string' && value in AGENT_MODELS;
}

export type { AgentModelName };
export { AGENT_MODELS, embed, isAgentModelName, toolCallFromText, workersAiModel };
