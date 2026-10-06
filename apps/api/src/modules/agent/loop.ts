import { reportMessage, SYSTEM_PROMPT } from './prompt.ts';
import { checkProposal, fallbackProposal } from './proposal.ts';
import { runTool, SUBMIT_TOOL, TOOL_SPECS } from './tools.ts';
import type {
  AgentData,
  AgentReport,
  AgentRun,
  AgentStep,
  ChatMessage,
  ModelFn,
  ModelTurn,
} from './types.ts';

/**
 * 에이전트 루프(ADR 0017). 프레임워크 없이 직접 돈다.
 *
 * 1. 시스템 지시 + 제보(데이터로 감쌈)로 시작한다.
 * 2. 모델이 도구 호출을 고르면 실행하고, 결과를 대화에 붙여 다시 모델을 부른다.
 * 3. submitProposal이 오면 코드가 검증한다. 고칠 것이 있으면 한 번 다시 쓰게 한다.
 *    두 번째에도 쓸 수 없는 처리안이면 보류하고, 기준에만 못 미치면 받되 남은 문제를 기록한다.
 * 4. 도구도 처리안도 없이 말만 하면 "도구를 써서 제출하라"고 한 번 일러 준다.
 * 5. 최대 단계를 넘으면 "판단 보류" 처리안을 낸다.
 */

/** 모델 호출 최대 횟수(무한 루프·비용 폭주 막기) */
const MAX_TURNS = 6;
/** 기록에 남길 말의 길이 */
const SUMMARY_MAX = 160;

/** 한 번 실행하는 동안 쌓이는 상태 */
interface LoopState {
  readonly messages: ChatMessage[];
  readonly steps: AgentStep[];
  readonly similarUrls: Set<string>;
  readonly likelyDuplicates: Set<string>;
  readonly knownIssues: string[];
  latestVersion: string | null;
  inputTokens: number;
  outputTokens: number;
  retriedProposal: boolean;
  nudged: boolean;
}

/** 이번 턴의 결과: 끝났으면 실행 결과, 아니면 null(다음 턴으로) */
type TurnOutcome = Omit<AgentRun, 'steps' | 'inputTokens' | 'outputTokens'> | null;

/** 도구 결과에서 근거를 모은다(처리안 검증: 중복 후보·알려진 문제는 실제로 본 것만) */
function collectEvidence(tool: string, content: string, state: LoopState): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return;
  }
  if (tool === 'searchSimilarReports' && Array.isArray(parsed)) {
    for (const item of parsed as {
      readonly issueUrl?: string;
      readonly likelyDuplicate?: boolean;
    }[]) {
      if (item.issueUrl) {
        state.similarUrls.add(item.issueUrl);
        if (item.likelyDuplicate === true) {
          state.likelyDuplicates.add(item.issueUrl);
        }
      }
    }
  }
  if (
    tool === 'getPatch' &&
    typeof parsed === 'object' &&
    parsed !== null &&
    'knownIssues' in parsed
  ) {
    const facts = parsed as { readonly knownIssues: string[]; readonly latestVersion?: string };
    state.knownIssues.push(...facts.knownIssues);
    state.latestVersion = facts.latestVersion ?? null;
  }
}

/**
 * submitProposal 처리. 오류·고칠 점이 없으면 끝, 있으면 한 번 다시 쓰게 한다.
 * 두 번째에도 오류면 보류, 고칠 점만 남았으면 받고 기록에 남긴다(운영자가 승인 화면에서 본다).
 */
function handleSubmit(args: Readonly<Record<string, unknown>>, state: LoopState): TurnOutcome {
  const check = checkProposal(args, {
    similarUrls: state.similarUrls,
    knownIssues: state.knownIssues,
    latestVersion: state.latestVersion,
    likelyDuplicates: state.likelyDuplicates,
  });
  const problems = [...check.errors, ...check.revisions];
  state.steps.push({ tool: SUBMIT_TOOL, args, summary: problems.join(' / ') || '제출' });
  if (check.proposal !== null && (problems.length === 0 || state.retriedProposal)) {
    return {
      proposal: check.proposal,
      corrections: [...check.corrections, ...check.revisions.map((text) => `남은 문제: ${text}`)],
      gaveUp: false,
    };
  }
  if (state.retriedProposal) {
    return {
      proposal: fallbackProposal(check.errors.join(', ')),
      corrections: check.corrections,
      gaveUp: true,
    };
  }
  state.retriedProposal = true;
  state.messages.push({
    role: 'tool',
    name: SUBMIT_TOOL,
    content: JSON.stringify({ error: '처리안을 고쳐 다시 제출하세요', problems }),
  });
  return null;
}

/** 모델이 도구 없이 말만 했을 때: 한 번은 일러 주고, 두 번째면 보류 */
function handleNoTool(reply: ModelTurn, state: LoopState): TurnOutcome {
  if (state.nudged) {
    return { proposal: fallbackProposal('도구를 쓰지 않음'), corrections: [], gaveUp: true };
  }
  state.nudged = true;
  // 무엇을 말했는지 기록에 남긴다(평가에서 보류 원인을 보려고)
  state.steps.push({ tool: '(말만 함)', args: {}, summary: reply.text.slice(0, SUMMARY_MAX) });
  state.messages.push({ role: 'assistant', content: reply.text || '(빈 응답)' });
  state.messages.push({
    role: 'user',
    content: `도구로 확인한 뒤 ${SUBMIT_TOOL} 도구를 불러 처리안을 제출하세요.`,
  });
  return null;
}

/** 한 턴: 모델 응답의 도구 호출을 차례로 실행한다 */
async function handleTurn(
  reply: ModelTurn,
  data: AgentData,
  state: LoopState,
): Promise<TurnOutcome> {
  if (reply.toolCalls.length === 0) {
    return handleNoTool(reply, state);
  }
  for (const call of reply.toolCalls) {
    state.messages.push({
      role: 'assistant',
      content: JSON.stringify({ name: call.name, arguments: call.args }),
    });
    if (call.name === SUBMIT_TOOL) {
      const outcome = handleSubmit(call.args, state);
      if (outcome !== null) {
        return outcome;
      }
    } else {
      // biome-ignore lint/performance/noAwaitInLoops: 같은 턴의 도구 결과도 차례로 대화에 붙인다
      const { content, step } = await runTool(call.name, call.args, data);
      state.steps.push(step);
      collectEvidence(call.name, content, state);
      state.messages.push({ role: 'tool', name: call.name, content });
    }
  }
  return null;
}

async function runAgent(
  report: AgentReport,
  data: AgentData,
  model: ModelFn,
  maxTurns = MAX_TURNS,
): Promise<AgentRun> {
  const state: LoopState = {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: reportMessage(report) },
    ],
    steps: [],
    similarUrls: new Set(),
    likelyDuplicates: new Set(),
    knownIssues: [],
    latestVersion: null,
    inputTokens: 0,
    outputTokens: 0,
    retriedProposal: false,
    nudged: false,
  };
  let outcome: TurnOutcome = null;
  for (let turn = 0; turn < maxTurns && outcome === null; turn += 1) {
    // biome-ignore lint/performance/noAwaitInLoops: 루프는 앞 단계 결과를 보고 다음을 정하므로 차례로 돈다
    const reply = await model(state.messages, TOOL_SPECS);
    state.inputTokens += reply.inputTokens;
    state.outputTokens += reply.outputTokens;
    outcome = await handleTurn(reply, data, state);
  }
  return {
    ...(outcome ?? { proposal: fallbackProposal('단계 한도 초과'), corrections: [], gaveUp: true }),
    steps: state.steps,
    inputTokens: state.inputTokens,
    outputTokens: state.outputTokens,
  };
}

export { MAX_TURNS, runAgent };
