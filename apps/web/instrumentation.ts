import type { Instrumentation } from 'next';
import { discordWebhookUrl } from '@/shared/config';

/**
 * Next.js 서버에서 난 오류를 운영자 디스코드로 알린다(모니터링 3겹 중 "오류 바로 알림", 웹 쪽).
 * Next.js가 서버 렌더링·서버 함수·라우트에서 오류를 잡으면 onRequestError를 부른다(브라우저 오류는 아님).
 *
 * - 같은 경로·같은 메시지는 1시간에 한 번만 보낸다. 서버 인스턴스마다 따로 기억하는 간단한 방식이라
 *   인스턴스가 여럿이면 몇 번 더 올 수 있다(API처럼 KV가 없어서 감수한다).
 * - React가 감싼 오류는 원래 메시지 대신 digest(식별자)만 있을 수 있다. 그 값으로 Vercel 로그를 찾는다.
 * - 알림 실패는 무시한다(오류 자체는 Vercel 로그에 남는다).
 */

const HOUR_MS = 3_600_000;
const MESSAGE_MAX = 300;
/** 임베드 띠 색: 경고 빨강(API 알림과 같다) */
const COLOR_ALERT = 0xe0_3e_3e;
const recent = new Map<string, number>();

/** 디스코드 임베드 설명: 메시지·digest·종류 */
function describe(
  message: string,
  digest: string,
  context: Parameters<Instrumentation.onRequestError>[2],
): string {
  return [
    `**${message}**`,
    digest === '' ? '' : `digest: \`${digest}\``,
    `종류: ${context.routeType} · ${context.renderSource ?? ''}`,
    '같은 오류는 1시간 동안 다시 알리지 않습니다.',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const webhook = discordWebhookUrl();
  if (webhook === undefined) {
    return;
  }
  const message = (error instanceof Error ? error.message : String(error)).slice(0, MESSAGE_MAX);
  const digest =
    typeof error === 'object' && error !== null && 'digest' in error ? String(error.digest) : '';
  const key = `${context.routePath}\n${message}`;
  const now = Date.now();
  if ((recent.get(key) ?? 0) > now - HOUR_MS) {
    return;
  }
  recent.set(key, now);
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: `🚨 웹 오류 · ${request.method} ${request.path.split('?')[0] ?? ''}`,
        embeds: [
          {
            title: `웹 오류 · ${context.routePath}`,
            url: 'https://vercel.com/dashboard',
            description: describe(message, digest, context),
            color: COLOR_ALERT,
          },
        ],
        // biome-ignore lint/style/useNamingConvention: 디스코드 API의 필드 이름
        allowed_mentions: { parse: [] },
      }),
    });
  } catch {
    // 알림 실패는 무시한다
  }
};
