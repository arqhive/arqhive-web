import { createDb, type Db } from '@arqhive/db';
import type { ApiEnv } from '../../platform/env.ts';
import { takeToken } from '../../platform/rate-limit.ts';
import { embed, workersAiModel } from '../../platform/workers-ai.ts';
import { alertError, notify } from '../notifications/index.ts';
import { runAgent } from './loop.ts';
import { proposalNotice } from './message.ts';
import { patchFacts } from './patch-facts.ts';
import { PROMPT_VERSION } from './prompt.ts';
import { reviewLink } from './review-link.ts';
import {
  failRun,
  finishRun,
  saveReportEmbedding,
  searchGuideChunks,
  searchSimilarReports,
  startRun,
} from './store.ts';
import type { AgentData, AgentReport } from './types.ts';

/**
 * 새 제보 하나에 에이전트를 돌린다(ADR 0017). 제보 받기(POST /api/reports)가 응답한 뒤 waitUntil로 부른다.
 *
 * 1. 스위치(AGENT_ENABLED)·DB가 없으면 아무것도 안 한다.
 * 2. 하루 한도(UTC 날짜별 20회)를 넘으면 skipped로 기록만 한다. 제보는 하루 50건까지 받지만,
 *    70B 모델은 한 번에 약 300뉴런이라 50번이면 무료 한도(하루 1만 뉴런)를 넘는다.
 * 3. 실행 기록(agent_runs)을 running으로 만들고 → 에이전트 실행 → pending(승인 대기)·failed로 마무리.
 * 4. 처리안을 디스코드로 보낸다. 서명한 검토 링크를 달아, 운영자가 화면에서 적용·무시를 고른다(agent.route의 /review).
 * 5. 마지막에 이 제보의 임베딩을 넣는다(검색보다 먼저 넣으면 자기 자신을 중복으로 찾는다).
 *
 * 실패해도 제보는 이미 성공했다. 오류는 운영자에게 알리고 기록에 남긴다.
 */

/** 운영에서 쓰는 모델(평가 점수로 고른다, eval/results) */
const AGENT_MODEL = 'llama70b';
const AGENTS_PER_DAY = 20;
const DAY_SECONDS = 86_400;
/** ISO 날짜에서 "년-월-일" 글자 수 */
const DATE_LENGTH = 10;

interface ReportForAgent extends AgentReport {
  /** 디스코드에 보일 게임 이름 */
  readonly game: string;
}

interface AgentContext {
  /** 시험 제보(REPORT_DRY_RUN)인지 */
  readonly dryRun: boolean;
  /** 이 API의 주소(검토 링크를 만들 때 쓴다. 개발은 localhost:8787) */
  readonly apiOrigin: string;
}

/** 도구가 읽는 데이터: 패치 정보는 콘텐츠, 비슷한 제보·가이드는 Neon(pgvector) */
function liveData(env: ApiEnv, db: Db, slug: string, dryRun: boolean): AgentData {
  const vectorOf = async (query: string) => (await embed(env.AI, [query]))[0] ?? [];
  return {
    getPatch: patchFacts,
    searchSimilarReports: async (query) =>
      searchSimilarReports(db, slug, await vectorOf(query), dryRun),
    searchGuides: async (query) => searchGuideChunks(db, await vectorOf(query)),
  };
}

async function indexReport(
  env: ApiEnv,
  db: Db,
  report: ReportForAgent,
  dryRun: boolean,
): Promise<void> {
  const [vector] = await embed(env.AI, [`${report.title}\n${report.text}`]);
  if (vector !== undefined) {
    await saveReportEmbedding(db, { ...report, dryRun }, vector);
  }
}

async function runReportAgent(
  env: ApiEnv,
  report: ReportForAgent,
  { dryRun, apiOrigin }: AgentContext,
): Promise<void> {
  if (env.AGENT_ENABLED !== '1' || !env.DATABASE_URL) {
    return;
  }
  const db = createDb(env.DATABASE_URL);
  const base = {
    issueUrl: report.issueUrl,
    slug: report.slug,
    model: AGENT_MODEL,
    promptVersion: PROMPT_VERSION,
    dryRun,
  };
  const day = new Date().toISOString().slice(0, DATE_LENGTH);
  if (!(await takeToken(env.RATE_LIMIT, `agent:${day}`, AGENTS_PER_DAY, DAY_SECONDS))) {
    // 처리안은 건너뛰어도 임베딩은 넣는다(뉴런이 아주 적게 들고, 다음 제보의 중복 검색에 필요하다)
    await startRun(db, { ...base, status: 'skipped' });
    await indexReport(env, db, report, dryRun);
    return;
  }
  const runId = await startRun(db, { ...base, status: 'running' });
  const started = Date.now();
  try {
    const run = await runAgent(
      report,
      liveData(env, db, report.slug, dryRun),
      workersAiModel(env.AI, AGENT_MODEL),
    );
    const ms = Date.now() - started;
    await finishRun(db, runId, run, ms);
    const reviewUrl = env.AGENT_SIGNING_KEY
      ? await reviewLink(env.AGENT_SIGNING_KEY, apiOrigin, runId)
      : null;
    await notify(env, proposalNotice(report, run, { ms, dryRun, runId, reviewUrl }));
  } catch (error) {
    await failRun(
      db,
      runId,
      error instanceof Error ? error.message : String(error),
      Date.now() - started,
    );
    await alertError(env, '제보 처리 에이전트', error);
  } finally {
    await indexReport(env, db, report, dryRun).catch((error: unknown) =>
      alertError(env, '제보 임베딩 저장', error),
    );
  }
}

export type { ReportForAgent };
export { runReportAgent };
