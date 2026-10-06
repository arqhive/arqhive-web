import type { ApiEnv } from '../../platform/env.ts';
import { sha256 } from '../../platform/rate-limit.ts';
import { notify } from './notify.ts';

/**
 * 장애 알림: 예상하지 못한 오류가 나면 운영자 디스코드로 보낸다(모니터링 3겹 중 "오류 바로 알림").
 * - 같은 곳·같은 메시지의 오류는 1시간에 한 번만 보낸다(KV alert: 키). 봇이 같은 오류를 계속 일으켜도 채널이 도배되지 않는다.
 * - 오류 내용에 사용자 글·비밀값이 들어가지 않게, 메시지와 스택 몇 줄만 보낸다.
 * - 보내기 실패는 notify가 "못 보낸 알림"에 쌓아 다시 보낸다.
 */

const SECONDS_PER_HOUR = 3600;
/** 스택에서 보낼 줄 수(어디서 났는지만 알면 된다) */
const STACK_LINES = 4;
/** 오류 메시지 최대 길이 */
const MESSAGE_MAX = 300;
/** 임베드 띠 색: 경고 빨강 */
const COLOR_ALERT = 0xe0_3e_3e;

/** 오류 → 사람이 읽을 메시지·스택 몇 줄 */
function describe(error: unknown): { readonly message: string; readonly stack: string } {
  if (error instanceof Error) {
    return {
      message: error.message.slice(0, MESSAGE_MAX),
      stack: (error.stack ?? '')
        .split('\n')
        .slice(1, 1 + STACK_LINES)
        .join('\n'),
    };
  }
  return { message: String(error).slice(0, MESSAGE_MAX), stack: '' };
}

/**
 * 오류 알림 보내기. where는 어디서 났는지(예: "POST /api/reports", "cron 일일 정산").
 * 이 함수 자체는 던지지 않는다(알림 실패가 원래 처리를 망치지 않게).
 */
export async function alertError(env: ApiEnv, where: string, error: unknown): Promise<void> {
  const { message, stack } = describe(error);
  try {
    const key = `alert:${await sha256(`${where}\n${message}`)}`;
    if ((await env.RATE_LIMIT.get(key)) !== null) {
      return;
    }
    await env.RATE_LIMIT.put(key, '1', { expirationTtl: SECONDS_PER_HOUR });
    await notify(env, {
      content: `🚨 오류 · ${where}`,
      title: `오류 · ${where}`,
      url: 'https://dash.cloudflare.com/?to=/:account/workers/services/view/arqhive-api/production/observability/logs',
      description: [
        `**${message}**`,
        stack === '' ? '' : `\`\`\`\n${stack}\n\`\`\``,
        '같은 오류는 1시간 동안 다시 알리지 않습니다.',
      ]
        .filter((line) => line !== '')
        .join('\n'),
      color: COLOR_ALERT,
    });
  } catch {
    // 알림 실패는 무시한다(원래 오류는 Workers 로그에 남는다)
  }
}
