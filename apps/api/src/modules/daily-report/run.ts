import type { ApiEnv } from '../../platform/env.ts';
import { fetchUmamiDay, type UmamiDay } from '../../platform/umami.ts';
import { notify } from '../notifications/index.ts';
import { collectDownloads } from './downloads.ts';
import { kstDay, kstDayRange } from './kst.ts';
import { buildDailyReport } from './message.ts';

const SITE_URL = 'https://arqhive.vercel.app';

/** Umami 하루치. 공유 링크가 없거나 실패하면 null(정산의 나머지는 그대로 보낸다) */
async function readUmami(env: ApiEnv, now: number): Promise<UmamiDay | null> {
  if (!env.UMAMI_SHARE_URL) {
    return null;
  }
  try {
    return await fetchUmamiDay(env.UMAMI_SHARE_URL, kstDayRange(now));
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: 정산 실패 원인을 운영 로그로 남긴다
    console.warn('daily report: umami failed', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * 일일 정산(ADR 0016): 다운로드 수 저장·비교 + Umami 하루 통계 → 운영자 디스코드.
 * 한국 시간 23시 50분 Cron이 부른다. 보내기에 실패하면 notify가 "못 보낸 알림"에 쌓아 다음 정각에 다시 보낸다.
 */
export async function runDailyReport(env: ApiEnv, now = Date.now()): Promise<void> {
  const [downloads, umami] = await Promise.all([collectDownloads(env, now), readUmami(env, now)]);
  await notify(env, buildDailyReport({ day: kstDay(now), downloads, umami, siteUrl: SITE_URL }));
}
