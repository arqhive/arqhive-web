import { Hono } from 'hono';
import type { ApiEnv } from '../../platform/env.ts';
import { isAgentModelName, workersAiModel } from '../../platform/workers-ai.ts';
import { runAgent } from './loop.ts';
import { patchFacts } from './patch-facts.ts';
import { PROMPT_VERSION } from './prompt.ts';
import type { AgentReport, GuideChunk, SimilarReport } from './types.ts';

/**
 * 에이전트 주소들(ADR 0017).
 *
 * POST /api/agent/eval — 평가 전용. 개발(.dev.vars의 AGENT_EVAL=1)에서만 열린다(배포는 404).
 *   평가 사례 하나(제보 + 고정된 비슷한 제보·가이드)를 받아 에이전트를 실제 모델로 돌리고 실행 기록을 돌려준다.
 *   패치 정보(getPatch)는 실제 콘텐츠를 쓴다. 채점은 eval/run.mjs가 한다.
 */

interface EvalBody {
  readonly model?: unknown;
  readonly report?: AgentReport;
  readonly similar?: readonly SimilarReport[];
  readonly guides?: readonly GuideChunk[];
}

const HTTP_BAD_REQUEST = 400;

// biome-ignore lint/style/useNamingConvention: Hono가 정한 키 이름(Bindings)이라 바꿀 수 없다
export const agentRoute = new Hono<{ Bindings: ApiEnv }>().post('/eval', async (c) => {
  if (c.env.AGENT_EVAL !== '1') {
    return c.notFound();
  }
  const body = await c.req.json<EvalBody>();
  if (body.report === undefined || !isAgentModelName(body.model)) {
    return c.json(
      { error: 'report와 model(llama70b·mistral24b·qwen30b)이 필요합니다' },
      HTTP_BAD_REQUEST,
    );
  }
  const similar = body.similar ?? [];
  const guides = body.guides ?? [];
  const started = Date.now();
  const run = await runAgent(
    body.report,
    {
      getPatch: patchFacts,
      searchSimilarReports: () => Promise.resolve(similar),
      searchGuides: () => Promise.resolve(guides),
    },
    workersAiModel(c.env.AI, body.model),
  );
  return c.json({ run, ms: Date.now() - started, promptVersion: PROMPT_VERSION });
});
