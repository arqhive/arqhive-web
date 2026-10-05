import { type DiscordMessage, sendDiscord } from '../../platform/discord.ts';
import type { ApiEnv } from '../../platform/env.ts';

/**
 * 운영자 알림(디스코드 웹훅). 새 제보가 이슈로 만들어지면 보낸다(ADR 0014).
 * 못 보낸 알림은 KV(RATE_LIMIT 이름공간, notify: 접두사)에 쌓아 두고 정기 실행(Cron)이 다시 보낸다. DB는 쓰지 않는다(ADR 0012).
 * 알림이 실패해도 제보는 성공이다.
 */

const PENDING_KEY = 'notify:pending';
/** 쌓아 둘 못 보낸 알림 수(넘치면 오래된 것부터 버린다) */
const PENDING_MAX = 20;
/** 디스코드 메시지에 담을 제보 글 길이(나머지는 이슈에서 본다) */
const EXCERPT_MAX = 300;
/** 임베드 띠 색: 사이트 강조색(도장 빨강 #b23a2e), 시험은 회색 */
const COLOR_REPORT = 0xb2_3a_2e;
const COLOR_DRY_RUN = 0x5d_66_73;

async function loadPending(kv: KVNamespace): Promise<DiscordMessage[]> {
  const raw = await kv.get(PENDING_KEY);
  return raw === null ? [] : (JSON.parse(raw) as DiscordMessage[]);
}

function savePending(kv: KVNamespace, pending: readonly DiscordMessage[]): Promise<void> {
  return pending.length === 0
    ? kv.delete(PENDING_KEY)
    : kv.put(PENDING_KEY, JSON.stringify(pending.slice(-PENDING_MAX)));
}

/** 새 제보 알림: 푸시 한 줄 "새 제보 · 게임", 카드에는 이슈 제목 링크와 글 앞부분 */
export function reportNotice(
  report: { readonly game: string; readonly title: string; readonly text: string },
  url: string,
  dryRun: boolean,
): DiscordMessage {
  const text = report.text.trim();
  return {
    content: `${dryRun ? '[시험] ' : ''}새 제보 · ${report.game}`,
    title: report.title,
    url,
    description: text.length > EXCERPT_MAX ? `${text.slice(0, EXCERPT_MAX)}…` : text,
    color: dryRun ? COLOR_DRY_RUN : COLOR_REPORT,
  };
}

/**
 * 알림 보내기. 실패하면 던지지 않고 못 보낸 목록에 쌓는다(제보 응답에 영향을 주지 않게).
 * 웹훅 주소가 없으면(알림을 아직 안 켬) 아무것도 하지 않는다.
 */
export async function notify(env: ApiEnv, message: DiscordMessage): Promise<void> {
  if (!env.DISCORD_WEBHOOK_URL) {
    return;
  }
  try {
    await sendDiscord(env.DISCORD_WEBHOOK_URL, message);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: 알림 실패 원인을 운영 로그로 남긴다
    console.warn('notify failed', error instanceof Error ? error.message : error);
    await savePending(env.RATE_LIMIT, [...(await loadPending(env.RATE_LIMIT)), message]);
  }
}

/** 정기 실행(Cron): 못 보낸 알림을 순서대로 다시 보낸다. 실패하면 남은 것은 다음 실행 때 이어서 */
export async function runNotificationCron(env: ApiEnv): Promise<void> {
  if (!env.DISCORD_WEBHOOK_URL) {
    return;
  }
  const pending = await loadPending(env.RATE_LIMIT);
  let sent = 0;
  for (const message of pending) {
    try {
      // biome-ignore lint/performance/noAwaitInLoops: 순서대로 보내고, 실패한 곳에서 멈춰 나머지를 남긴다
      await sendDiscord(env.DISCORD_WEBHOOK_URL, message);
      sent += 1;
    } catch {
      break;
    }
  }
  if (sent > 0) {
    await savePending(env.RATE_LIMIT, pending.slice(sent));
  }
}
