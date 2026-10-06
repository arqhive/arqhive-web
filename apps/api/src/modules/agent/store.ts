import { type AgentRunRow, agentRuns, type Db, guideChunks, reportEmbeddings } from '@arqhive/db';
import { and, cosineDistance, desc, eq, inArray, sql } from 'drizzle-orm';
import type { ChunkSource } from './guide-chunks.ts';
import type { AgentRun, GuideChunk, SimilarReport } from './types.ts';

/**
 * 에이전트가 쓰는 Neon 읽기·쓰기(ADR 0017, pgvector).
 * 유사도는 코사인 유사도(1 − 코사인 거리, 1에 가까울수록 비슷함)로 계산해 높은 순으로 고른다.
 */

/** 검색 결과 개수 */
const TOP_K = 3;
/** 제보 임베딩에 남길 글 앞부분 길이(검색 결과로 모델에 보여 줄 만큼만) */
const EXCERPT_MAX = 300;

/** 같은 패치의 지난 제보 중 비슷한 것. 시험(dry run) 제보는 시험끼리만 찾는다 */
async function searchSimilarReports(
  db: Db,
  slug: string,
  vector: readonly number[],
  dryRun: boolean,
): Promise<SimilarReport[]> {
  const score = sql<number>`1 - (${cosineDistance(reportEmbeddings.embedding, [...vector])})`;
  const rows = await db
    .select({
      issueUrl: reportEmbeddings.issueUrl,
      title: reportEmbeddings.title,
      state: reportEmbeddings.state,
      excerpt: reportEmbeddings.excerpt,
      score,
    })
    .from(reportEmbeddings)
    .where(and(eq(reportEmbeddings.slug, slug), eq(reportEmbeddings.dryRun, dryRun)))
    .orderBy(desc(score))
    .limit(TOP_K);
  return rows.map((row) => ({ ...row, score: Number(row.score) }));
}

async function searchGuideChunks(db: Db, vector: readonly number[]): Promise<GuideChunk[]> {
  const score = sql<number>`1 - (${cosineDistance(guideChunks.embedding, [...vector])})`;
  const rows = await db
    .select({
      id: guideChunks.id,
      title: guideChunks.title,
      url: guideChunks.url,
      content: guideChunks.content,
      score,
    })
    .from(guideChunks)
    .orderBy(desc(score))
    .limit(TOP_K);
  return rows.map((row) => ({ ...row, score: Number(row.score) }));
}

/** 처리한 제보를 다음 검색 대상으로 넣는다(같은 주소가 있으면 그대로 둔다) */
async function saveReportEmbedding(
  db: Db,
  report: {
    readonly issueUrl: string;
    readonly slug: string;
    readonly title: string;
    readonly text: string;
    readonly dryRun: boolean;
  },
  vector: readonly number[],
): Promise<void> {
  await db
    .insert(reportEmbeddings)
    .values({
      issueUrl: report.issueUrl,
      slug: report.slug,
      title: report.title,
      excerpt: report.text.trim().slice(0, EXCERPT_MAX),
      dryRun: report.dryRun,
      embedding: [...vector],
    })
    .onConflictDoNothing();
}

/** 가이드 문단 색인의 현재 상태(id → 내용 해시) */
async function loadGuideHashes(db: Db): Promise<Map<string, string>> {
  const rows = await db.select({ id: guideChunks.id, hash: guideChunks.hash }).from(guideChunks);
  return new Map(rows.map((row) => [row.id, row.hash]));
}

/** 바뀐 문단을 넣거나 덮어쓰고, 콘텐츠에서 없어진 문단을 지운다 */
async function writeGuideChunks(
  db: Db,
  changed: readonly (ChunkSource & { readonly hash: string; readonly embedding: number[] })[],
  removedIds: readonly string[],
): Promise<void> {
  for (const chunk of changed) {
    // biome-ignore lint/performance/noAwaitInLoops: Neon HTTP는 쿼리 하나씩 보낸다. 문단이 수십 개라 차례로 넣는다
    await db
      .insert(guideChunks)
      .values(chunk)
      .onConflictDoUpdate({
        target: guideChunks.id,
        set: {
          title: chunk.title,
          url: chunk.url,
          content: chunk.content,
          hash: chunk.hash,
          embedding: chunk.embedding,
        },
      });
  }
  if (removedIds.length > 0) {
    await db.delete(guideChunks).where(inArray(guideChunks.id, [...removedIds]));
  }
}

/** 실행 시작을 기록하고 id를 돌려준다(끝나지 않고 running으로 남으면 시간 초과로 끊긴 것) */
async function startRun(
  db: Db,
  run: {
    readonly issueUrl: string;
    readonly slug: string;
    readonly model: string;
    readonly promptVersion: string;
    readonly dryRun: boolean;
    readonly status: 'running' | 'skipped';
  },
): Promise<number> {
  const [row] = await db.insert(agentRuns).values(run).returning({ id: agentRuns.id });
  return row?.id ?? 0;
}

async function finishRun(db: Db, id: number, run: AgentRun, ms: number): Promise<void> {
  await db
    .update(agentRuns)
    .set({
      status: run.gaveUp ? 'failed' : 'pending',
      proposal: run.proposal,
      steps: run.steps,
      corrections: run.corrections,
      inputTokens: run.inputTokens,
      outputTokens: run.outputTokens,
      ms,
    })
    .where(eq(agentRuns.id, id));
}

async function failRun(db: Db, id: number, message: string, ms: number): Promise<void> {
  await db
    .update(agentRuns)
    .set({ status: 'failed', error: message, ms })
    .where(eq(agentRuns.id, id));
}

async function loadRun(db: Db, id: number): Promise<AgentRunRow | null> {
  const [row] = await db.select().from(agentRuns).where(eq(agentRuns.id, id));
  return row ?? null;
}

/**
 * 승인 대기(pending)인 실행만 결정 상태로 바꾼다. 바꿨으면 true.
 * 조건부 UPDATE 한 번이라, 버튼을 두 번 누르거나 두 곳에서 동시에 눌러도 한 번만 통과한다.
 */
async function claimDecision(
  db: Db,
  id: number,
  status: 'applied' | 'ignored',
  decision: unknown,
): Promise<boolean> {
  const rows = await db
    .update(agentRuns)
    .set({ status, decision, decidedAt: new Date() })
    .where(and(eq(agentRuns.id, id), eq(agentRuns.status, 'pending')))
    .returning({ id: agentRuns.id });
  return rows.length > 0;
}

/** 적용 중 GitHub가 실패하면 다시 승인 대기로 되돌린다(오류는 남긴다) */
async function releaseDecision(db: Db, id: number, message: string): Promise<void> {
  await db
    .update(agentRuns)
    .set({ status: 'pending', decision: null, decidedAt: null, error: message })
    .where(eq(agentRuns.id, id));
}

export {
  claimDecision,
  failRun,
  finishRun,
  loadGuideHashes,
  loadRun,
  releaseDecision,
  saveReportEmbedding,
  searchGuideChunks,
  searchSimilarReports,
  startRun,
  writeGuideChunks,
};
