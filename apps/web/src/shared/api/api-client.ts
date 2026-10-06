import type { AppType } from '@arqhive/api/app-type';
import { hc } from 'hono/client';

/**
 * 우리 API(Cloudflare Workers, Hono)를 부르는 클라이언트(Hono RPC). 브라우저에서 쓴다.
 * - AppType은 API 코드에서 뽑은 타입이라, 주소(api.reports.$post)와 응답 모양이 API와 자동으로 맞는다.
 *   API 응답을 바꾸면 이 클라이언트를 쓰는 곳에서 타입 오류가 나서 놓치지 않는다.
 * - 타입은 api 패키지가 만든 .d.ts(apps/api/types)에서 온다. 실행 코드는 오지 않는다(import type).
 * - 안에서는 그냥 fetch를 쓴다(작은 감싸개).
 * apiUrl은 NEXT_PUBLIC_API_URL("…/api"). AppType이 이미 /api 경로를 갖고 있어 출처(origin)만 넘긴다.
 */
export function apiClient(apiUrl: string) {
  return hc<AppType>(new URL(apiUrl).origin);
}
