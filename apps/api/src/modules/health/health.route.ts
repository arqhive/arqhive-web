import { Hono } from 'hono';

/**
 * 배포 확인용. 서버가 살아 있는지만 알려 준다.
 * 모듈마다 작은 Hono 앱을 만들고 app.ts에서 `.route('/health', healthRoute)`로 붙인다.
 * `as const`는 응답 타입을 `{ status: string }`이 아니라 `{ status: 'ok' }`로 좁혀서, RPC 클라이언트가 정확한 값을 알게 한다.
 */
export const healthRoute = new Hono().get('/', (c) => c.json({ status: 'ok' } as const));
