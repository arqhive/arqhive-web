import type { ApiEnv } from '../../platform/env.ts';
import { fetchGoatCounterDay, type GoatCounterDay } from '../../platform/goatcounter.ts';
import { type AgentDayStats, loadAgentDayStats } from '../agent/index.ts';
import { notify } from '../notifications/index.ts';
import { collectDownloads } from './downloads.ts';
import { kstDay, kstDayRange } from './kst.ts';
import { buildDailyReport } from './message.ts';

const SITE_URL = 'https://arqhive.vercel.app';

/** GoatCounter 하루치. API 키가 없거나 실패하면 null(정산의 나머지는 그대로 보낸다) */
async function readStats(env: ApiEnv, now: number): Promise<GoatCounterDay | null> {
  if (!env.GOATCOUNTER_API_KEY) {
    return null;
  }
  try {
    return await fetchGoatCounterDay(env.GOATCOUNTER_API_KEY, kstDayRange(now));
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: 정산 실패 원인을 운영 로그로 남긴다
    console.warn(
      'daily report: goatcounter failed',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/** 에이전트 지표. DB 설정이 없으면 undefined(묶음을 넣지 않음), 읽다 실패하면 null(안내 한 줄) */
async function readAgent(env: ApiEnv, now: number): Promise<AgentDayStats | null | undefined> {
  if (!env.DATABASE_URL) {
    return undefined;
  }
  try {
    return await loadAgentDayStats(env.DATABASE_URL, kstDayRange(now));
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: 정산 실패 원인을 운영 로그로 남긴다
    console.warn(
      'daily report: agent stats failed',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * 일일 정산(ADR 0016): 다운로드 수 저장·비교 + GoatCounter 하루 통계(ADR 0019) + 에이전트 지표(ADR 0017) → 운영자 디스코드.
 * 한국 시간 23시 50분 Cron이 부른다. 보내기에 실패하면 notify가 "못 보낸 알림"에 쌓아 다음 정각에 다시 보낸다.
 */
export async function runDailyReport(env: ApiEnv, now = Date.now()): Promise<void> {
  const [downloads, stats, agent] = await Promise.all([
    collectDownloads(env, now),
    readStats(env, now),
    readAgent(env, now),
  ]);
  await notify(
    env,
    buildDailyReport({
      day: kstDay(now),
      downloads,
      stats,
      siteUrl: SITE_URL,
      ...(agent === undefined ? {} : { agent }),
    }),
  );
}
