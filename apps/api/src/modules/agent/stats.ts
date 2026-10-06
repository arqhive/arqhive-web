import { agentRuns, createDb, type Db } from '@arqhive/db';
import { and, eq, gte, lt, sql } from 'drizzle-orm';

/**
 * 에이전트 지표(ADR 0017). 일일 정산이 하루 한 번 읽어 디스코드에 한 묶음으로 보낸다.
 * - 오늘 만든 처리안: 건수·보류·한도·끊김·평균 시간·토큰(→ 뉴런 어림)
 * - 오늘 운영자 결정: 적용·무시·고쳐서 적용
 * - 누적: 적용률(적용 ÷ 결정)·수정률(고쳐서 적용 ÷ 적용)·승인 대기
 * 시험 제보(dry_run)는 모두 뺀다.
 */

/** 이 시간이 지나도 running이면 waitUntil 시간 제한으로 끊긴 것으로 본다 */
const STALE_MINUTES = 10;
const MS_PER_MINUTE = 60_000;
/** llama-3.3-70b 가격(달러/100만 토큰, Workers AI 문서 2026-10) → 뉴런(1천 뉴런 = 0.011달러). eval/run.mjs와 같은 셈 */
const PRICE_INPUT = 0.29;
const PRICE_OUTPUT = 2.25;
const TOKENS_PER_PRICE = 1_000_000;
const DOLLARS_PER_THOUSAND_NEURONS = 0.011;
const THOUSAND = 1000;
const NEURONS_PER_DOLLAR = THOUSAND / DOLLARS_PER_THOUSAND_NEURONS;

interface AgentDayStats {
  /** 오늘 만든 처리안(승인 대기·결정됨 포함) */
  readonly proposals: number;
  /** 판단 보류·오류 */
  readonly failed: number;
  /** 하루 한도·스위치로 건너뜀 */
  readonly skipped: number;
  /** 정산 직전에 끊긴 것으로 정리한 실행 */
  readonly stale: number;
  readonly avgMs: number | null;
  readonly neurons: number;
  /** 오늘 결정 */
  readonly appliedToday: number;
  readonly ignoredToday: number;
  readonly editedToday: number;
  /** 누적 */
  readonly appliedTotal: number;
  readonly ignoredTotal: number;
  readonly editedTotal: number;
  readonly pending: number;
}

const live = eq(agentRuns.dryRun, false);
const countWhere = (condition: ReturnType<typeof sql>) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
const isEdited = sql`(${agentRuns.decision}->>'edited')::boolean`;

/** 오래 running으로 남은 실행을 failed(시간 초과로 끊김)로 바꾸고 그 수를 돌려준다 */
async function closeStaleRuns(db: Db, now: number): Promise<number> {
  const rows = await db
    .update(agentRuns)
    .set({ status: 'failed', error: '시간 초과로 끊김(waitUntil)' })
    .where(
      and(
        eq(agentRuns.status, 'running'),
        lt(agentRuns.createdAt, new Date(now - STALE_MINUTES * MS_PER_MINUTE)),
      ),
    )
    .returning({ id: agentRuns.id });
  return rows.length;
}

/** 오늘 만든 처리안(건수·보류·한도·평균 시간·토큰) */
async function queryToday(db: Db, start: Date) {
  const [row] = await db
    .select({
      proposals: countWhere(sql`${agentRuns.proposal} is not null`),
      failed: countWhere(sql`${agentRuns.status} = 'failed'`),
      skipped: countWhere(sql`${agentRuns.status} = 'skipped'`),
      avgMs: sql<
        number | null
      >`avg(${agentRuns.ms}) filter (where ${agentRuns.proposal} is not null)`.mapWith((value) =>
        value === null ? null : Math.round(Number(value)),
      ),
      inputTokens: sql<number>`coalesce(sum(${agentRuns.inputTokens}), 0)`.mapWith(Number),
      outputTokens: sql<number>`coalesce(sum(${agentRuns.outputTokens}), 0)`.mapWith(Number),
    })
    .from(agentRuns)
    .where(and(live, gte(agentRuns.createdAt, start)));
  return row;
}

/** 운영자 결정(오늘·누적)과 승인 대기 */
async function queryDecisions(db: Db, start: Date) {
  const [row] = await db
    .select({
      appliedToday: countWhere(
        sql`${agentRuns.status} = 'applied' and ${agentRuns.decidedAt} >= ${start}`,
      ),
      ignoredToday: countWhere(
        sql`${agentRuns.status} = 'ignored' and ${agentRuns.decidedAt} >= ${start}`,
      ),
      editedToday: countWhere(
        sql`${agentRuns.status} = 'applied' and ${agentRuns.decidedAt} >= ${start} and ${isEdited}`,
      ),
      appliedTotal: countWhere(sql`${agentRuns.status} = 'applied'`),
      ignoredTotal: countWhere(sql`${agentRuns.status} = 'ignored'`),
      editedTotal: countWhere(sql`${agentRuns.status} = 'applied' and ${isEdited}`),
      pending: countWhere(sql`${agentRuns.status} = 'pending'`),
    })
    .from(agentRuns)
    .where(live);
  return row;
}

async function loadAgentDayStats(
  databaseUrl: string,
  range: { readonly startAt: number; readonly endAt: number },
): Promise<AgentDayStats> {
  const db = createDb(databaseUrl);
  const stale = await closeStaleRuns(db, range.endAt);
  const start = new Date(range.startAt);
  const [today, decided] = await Promise.all([queryToday(db, start), queryDecisions(db, start)]);
  const dollars =
    ((today?.inputTokens ?? 0) * PRICE_INPUT + (today?.outputTokens ?? 0) * PRICE_OUTPUT) /
    TOKENS_PER_PRICE;
  return {
    proposals: today?.proposals ?? 0,
    failed: today?.failed ?? 0,
    skipped: today?.skipped ?? 0,
    stale,
    avgMs: today?.avgMs ?? null,
    neurons: Math.round(dollars * NEURONS_PER_DOLLAR),
    appliedToday: decided?.appliedToday ?? 0,
    ignoredToday: decided?.ignoredToday ?? 0,
    editedToday: decided?.editedToday ?? 0,
    appliedTotal: decided?.appliedTotal ?? 0,
    ignoredTotal: decided?.ignoredTotal ?? 0,
    editedTotal: decided?.editedTotal ?? 0,
    pending: decided?.pending ?? 0,
  };
}

export type { AgentDayStats };
export { loadAgentDayStats };
