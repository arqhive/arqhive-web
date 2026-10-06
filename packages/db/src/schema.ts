import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  // biome-ignore lint/suspicious/noDeprecatedImports: 객체 형태 primaryKey({ columns })를 쓴다. 옛 인자 형태만 deprecated라 오탐이다
  primaryKey,
  serial,
  text,
  timestamp,
  vector,
} from 'drizzle-orm/pg-core';

/** 임베딩 차원(Workers AI bge-m3, 다국어) */
const EMBEDDING_DIMENSIONS = 1024;

/**
 * 패치별 하루 다운로드 기록(ADR 0016). 일일 정산 Cron이 한국 시간 하루 끝에 한 줄씩 쌓는다.
 * - total은 그날 잰 **누적** 다운로드 수다. 하루 증가분은 전날 줄과의 차이로 구한다.
 *   셈법은 사이트 화면과 같다(릴리즈마다 가장 많이 받은 파일 하나를 더함, @arqhive/shared의 sumLargestDownloads).
 * - 기본 키 (slug, day): 같은 날 다시 재면 새 줄 대신 덮어쓴다(upsert).
 * - day는 date 타입이라 시간대 없이 "2026-10-07" 같은 한국 날짜 문자열로 다룬다(mode: 'string').
 */
export const downloadSnapshots = pgTable(
  'download_snapshots',
  {
    slug: text('slug').notNull(),
    day: date('day', { mode: 'string' }).notNull(),
    total: integer('total').notNull(),
  },
  (table) => [primaryKey({ columns: [table.slug, table.day] })],
);

/** 한 줄의 모양(읽을 때) */
export type DownloadSnapshot = typeof downloadSnapshots.$inferSelect;

/**
 * 가이드·FAQ 문단과 임베딩(ADR 0017, pgvector). 에이전트의 searchGuides가 코사인 유사도로 찾는다.
 * - 가이드는 "## 절" 단위로, FAQ·가이드 페이지 절은 한 파일을 한 문단으로 자른다. id는 "guide:wiiu-sdcafiine#2" 같은 꼴.
 * - 일일 정산 Cron이 콘텐츠와 비교해 내용 해시(hash)가 바뀐 문단만 다시 임베딩하고, 없어진 문단은 지운다.
 * - 문단이 수십 개뿐이라 인덱스 없이 전부 비교(정확한 검색)한다. 수천 개가 넘으면 HNSW 인덱스를 단다.
 */
export const guideChunks = pgTable('guide_chunks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  content: text('content').notNull(),
  hash: text('hash').notNull(),
  embedding: vector('embedding', { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
});

/**
 * 들어온 제보와 임베딩. 에이전트의 searchSimilarReports가 같은 패치 안에서 찾는다.
 * - 에이전트가 처리안을 낸 **뒤에** 넣는다(자기 자신을 중복으로 찾지 않게).
 * - dry_run: 개발(REPORT_DRY_RUN)에서 넣은 시험 제보. 검색은 같은 쪽끼리만 한다(시험과 운영이 섞이지 않게).
 * - state(열림·닫힘)는 넣을 때 값이다. 이슈를 닫아도 여기는 바뀌지 않는다(필요해지면 동기화).
 */
export const reportEmbeddings = pgTable('report_embeddings', {
  issueUrl: text('issue_url').primaryKey(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull(),
  state: text('state', { enum: ['open', 'closed'] })
    .notNull()
    .default('open'),
  dryRun: boolean('dry_run').notNull().default(false),
  embedding: vector('embedding', { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 에이전트 실행 기록. 처리안·단계·비용을 남기고, 운영자의 승인(적용·무시)을 여기에 적는다.
 * - status: running(도는 중 — 끝나지 않고 남았으면 시간 초과로 끊긴 것) → pending(승인 대기) → applied·ignored,
 *   failed(오류·보류), skipped(하루 한도·스위치 꺼짐으로 안 돌림). applied·ignored는 승인 화면(서명 링크)에서만 바뀐다
 */
export const agentRuns = pgTable('agent_runs', {
  id: serial('id').primaryKey(),
  issueUrl: text('issue_url').notNull(),
  slug: text('slug').notNull(),
  model: text('model').notNull(),
  promptVersion: text('prompt_version').notNull(),
  status: text('status', {
    enum: ['running', 'pending', 'applied', 'ignored', 'failed', 'skipped'],
  }).notNull(),
  dryRun: boolean('dry_run').notNull().default(false),
  proposal: jsonb('proposal'),
  steps: jsonb('steps'),
  corrections: jsonb('corrections'),
  error: text('error'),
  /** 운영자 결정 내용: 실제로 올린 답변·붙인 라벨·초안을 고쳤는지(승인율·수정률을 보려고) */
  decision: jsonb('decision'),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  ms: integer('ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
});

export type GuideChunkRow = typeof guideChunks.$inferSelect;
export type ReportEmbeddingRow = typeof reportEmbeddings.$inferSelect;
export type AgentRunRow = typeof agentRuns.$inferSelect;
