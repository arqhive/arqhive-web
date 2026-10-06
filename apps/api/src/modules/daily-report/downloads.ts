import { createDb, downloadSnapshots } from '@arqhive/db';
import { and, inArray, sql } from 'drizzle-orm';
import type { ApiEnv } from '../../platform/env.ts';
import { fetchDownloadTotal } from '../../platform/github.ts';
import { RELEASED_REPOS } from '../reports/index.ts';
import { kstDay } from './kst.ts';

/** 한 주(증가분 비교 날짜) */
const WEEK_DAYS = 7;

/** 패치 하나의 다운로드 정산 줄 */
interface DownloadRow {
  readonly slug: string;
  readonly title: string;
  readonly total: number;
  /** 어제 기록과의 차이. 어제 기록이 없으면 null */
  readonly today: number | null;
  /** 7일 전 기록과의 차이. 기록이 없으면 null */
  readonly week: number | null;
}

/**
 * 공개 패치마다 오늘 누적 다운로드 수를 읽어 Neon에 저장(같은 날이면 덮어쓰기)하고,
 * 어제·7일 전 기록과 비교한 줄을 돌려준다. GitHub를 못 읽은 패치는 저장하지 않고 빠진다.
 * DATABASE_URL이 없으면(개발 중 아직 설정 전) 저장·비교 없이 누적만 돌려준다.
 */
async function collectDownloads(env: ApiEnv, now: number): Promise<readonly DownloadRow[]> {
  const today = kstDay(now);
  const yesterday = kstDay(now, 1);
  const weekAgo = kstDay(now, WEEK_DAYS);
  const patches = [...RELEASED_REPOS.entries()];
  const totals = await Promise.all(
    patches.map(([, repo]) => fetchDownloadTotal(env.GITHUB_ISSUES_TOKEN, repo)),
  );
  const measured = patches.flatMap(([slug, repo], index) => {
    const total = totals[index];
    return total === null || total === undefined ? [] : [{ slug, title: repo.title, total }];
  });

  if (!env.DATABASE_URL || measured.length === 0) {
    return measured.map((row) => ({ ...row, today: null, week: null }));
  }
  const db = createDb(env.DATABASE_URL);
  // 같은 (slug, day)가 있으면 total만 새 값으로(하루에 여러 번 돌려도 한 줄)
  await db
    .insert(downloadSnapshots)
    .values(measured.map(({ slug, total }) => ({ slug, day: today, total })))
    .onConflictDoUpdate({
      target: [downloadSnapshots.slug, downloadSnapshots.day],
      set: { total: sql`excluded.total` },
    });
  const past = await db
    .select()
    .from(downloadSnapshots)
    .where(
      and(
        inArray(downloadSnapshots.day, [yesterday, weekAgo]),
        inArray(
          downloadSnapshots.slug,
          measured.map((row) => row.slug),
        ),
      ),
    );
  const totalOn = (slug: string, day: string) =>
    past.find((row) => row.slug === slug && row.day === day)?.total;
  return measured.map((row) => {
    const before = totalOn(row.slug, yesterday);
    const weekBefore = totalOn(row.slug, weekAgo);
    return {
      ...row,
      today: before === undefined ? null : row.total - before,
      week: weekBefore === undefined ? null : row.total - weekBefore,
    };
  });
}

export type { DownloadRow };
export { collectDownloads };
