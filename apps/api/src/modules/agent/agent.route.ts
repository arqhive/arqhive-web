import { type AgentRunRow, createDb } from '@arqhive/db';
import { Hono } from 'hono';
import type { ApiEnv } from '../../platform/env.ts';
import { isAgentModelName, workersAiModel } from '../../platform/workers-ai.ts';
import { type DecideOutcome, decide } from './decide.ts';
import { syncGuideIndex } from './guide-index.ts';
import { runAgent } from './loop.ts';
import { patchFacts } from './patch-facts.ts';
import { PROMPT_VERSION } from './prompt.ts';
import { checkTicket, type ReviewTicket } from './review-link.ts';
import { noticePage, reviewPage } from './review-page.ts';
import { loadRun } from './store.ts';
import type { AgentReport, GuideChunk, SimilarReport } from './types.ts';

/**
 * 에이전트 주소들(ADR 0017).
 *
 * POST /api/agent/eval — 평가 전용. 개발(.dev.vars의 AGENT_EVAL=1)에서만 열린다(배포는 404).
 *   평가 사례 하나(제보 + 고정된 비슷한 제보·가이드)를 받아 에이전트를 실제 모델로 돌리고 실행 기록을 돌려준다.
 *   패치 정보(getPatch)는 실제 콘텐츠를 쓴다. 채점은 eval/run.mjs가 한다.
 *
 * POST /api/agent/sync-guides — 개발용(같은 조건). 가이드 문단 색인을 바로 맞춘다(Neon·임베딩).
 *
 * GET  /api/agent/review?run&exp&sig — 처리안 검토 화면(디스코드의 서명 링크). 보기만 한다.
 * POST /api/agent/review — 검토 화면의 [적용]·[무시]. 서명을 다시 확인하고 반영한다(decide.ts).
 */

interface EvalBody {
  readonly model?: unknown;
  readonly report?: AgentReport;
  readonly similar?: readonly SimilarReport[];
  readonly guides?: readonly GuideChunk[];
}

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_GONE = 410;
const HTTP_BAD_GATEWAY = 502;

type TicketRun =
  | { readonly kind: 'ok'; readonly run: AgentRunRow }
  | {
      readonly kind: 'error';
      readonly title: string;
      readonly message: string;
      readonly status: 400 | 404 | 410;
    };

/** 서명 확인 → 실행 기록 읽기. 서명 키·DB가 없으면(기능을 안 켬) 없는 주소처럼 404 */
async function ticketRun(env: ApiEnv, ticket: Partial<ReviewTicket>): Promise<TicketRun> {
  if (!(env.AGENT_SIGNING_KEY && env.DATABASE_URL)) {
    return {
      kind: 'error',
      title: '없는 주소',
      message: '열 수 없는 주소예요.',
      status: HTTP_NOT_FOUND,
    };
  }
  const check = await checkTicket(env.AGENT_SIGNING_KEY, ticket);
  if (!check.ok) {
    return check.reason === 'expired'
      ? {
          kind: 'error',
          title: '만료된 링크',
          message: '링크가 만료됐어요(72시간). 이슈에서 직접 처리해 주세요.',
          status: HTTP_GONE,
        }
      : {
          kind: 'error',
          title: '잘못된 링크',
          message: '서명이 맞지 않는 링크예요.',
          status: HTTP_BAD_REQUEST,
        };
  }
  const run = await loadRun(createDb(env.DATABASE_URL), check.runId);
  if (run === null || run.proposal === null) {
    return {
      kind: 'error',
      title: '없는 처리안',
      message: '이 처리안을 찾을 수 없어요.',
      status: HTTP_NOT_FOUND,
    };
  }
  return { kind: 'ok', run };
}

function outcomePage(outcome: DecideOutcome, issueUrl: string) {
  switch (outcome.kind) {
    case 'applied':
      return noticePage(
        '적용했어요',
        `라벨(${outcome.labels.join(', ')})을 붙였어요.${outcome.commented ? ' 답변 댓글도 달았어요.' : ''}`,
        issueUrl,
      );
    case 'ignored':
      return noticePage('무시했어요', '이 처리안은 반영하지 않아요.', issueUrl);
    case 'already':
      return noticePage(
        '이미 처리했어요',
        `이 처리안은 이미 ${outcome.status} 상태예요.`,
        issueUrl,
      );
    default:
      return noticePage(
        '반영하지 못했어요',
        `${outcome.message} — 다시 시도하거나 이슈에서 직접 처리해 주세요.`,
        issueUrl,
      );
  }
}

// biome-ignore lint/style/useNamingConvention: Hono가 정한 키 이름(Bindings)이라 바꿀 수 없다
export const agentRoute = new Hono<{ Bindings: ApiEnv }>()
  .post('/eval', async (c) => {
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
  })
  // 가이드 문단 색인만 바로 맞추기(개발용). 운영은 일일 정산 Cron이 한다
  .post('/sync-guides', async (c) => {
    if (c.env.AGENT_EVAL !== '1') {
      return c.notFound();
    }
    return c.json({ result: await syncGuideIndex(c.env) });
  })
  // 처리안 검토 화면(서명 링크로만 열린다). 보기만 하고 아무것도 바꾸지 않는다
  .get('/review', async (c) => {
    const { run = '', exp = '', sig = '' } = c.req.query();
    const found = await ticketRun(c.env, { run, exp, sig });
    if (found.kind === 'error') {
      return c.html(noticePage(found.title, found.message), found.status);
    }
    return c.html(reviewPage(found.run, { run, exp, sig }));
  })
  // 검토 화면의 [적용]·[무시] 버튼. 같은 서명을 다시 확인한 뒤 반영한다
  .post('/review', async (c) => {
    const form = await c.req.parseBody();
    const field = (name: string) => (typeof form[name] === 'string' ? (form[name] as string) : '');
    const found = await ticketRun(c.env, {
      run: field('run'),
      exp: field('exp'),
      sig: field('sig'),
    });
    if (found.kind === 'error') {
      return c.html(noticePage(found.title, found.message), found.status);
    }
    const action = field('action') === 'apply' ? 'apply' : 'ignore';
    const outcome = await decide(c.env, found.run, action, field('reply'));
    return c.html(
      outcomePage(outcome, found.run.issueUrl),
      outcome.kind === 'failed' ? HTTP_BAD_GATEWAY : HTTP_OK,
    );
  });
