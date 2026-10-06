// biome-ignore lint/suspicious/noDeprecatedImports: 객체 형태 primaryKey({ columns })를 쓴다. 옛 인자 형태만 deprecated라 오탐이다
import { date, integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';

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
