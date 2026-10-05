import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { healthRoute } from './modules/health/index.ts';
import { reportsRoute } from './modules/reports/index.ts';
import type { ApiEnv } from './platform/env.ts';

/**
 * HTTP 라우트를 모으는 곳. 기능은 `modules/<기능>/`에 두고 여기서는 연결만 한다.
 *
 * - `Hono<{ Bindings: Env }>`: 핸들러 안에서 `c.env`로 Workers 바인딩(나중에 DB 주소, 큐, AI 등)을
 *   타입이 붙은 채로 꺼낼 수 있게 한다. `Env` 타입은 `wrangler types`가 wrangler.jsonc를 읽어 만든다.
 * - `.basePath('/api')`: 모든 경로 앞에 /api를 붙인다. web이 /api/* 를 이 Worker로 넘기기 때문이다(3단계).
 * - `secureHeaders()`: 모든 응답에 기본 보안 헤더(nosniff, iframe 금지, HSTS 등)를 붙인다.
 *   Cross-Origin-Resource-Policy는 끈다. 개발 중 사이트(localhost:3000)가 API의 스크린샷 주소를 <img>로 불러야 해서다.
 * - `.route()`를 **이어서 호출**해야 한다. 그래야 `typeof app`에 모든 경로의 타입이 쌓이고,
 *   web이 그 타입으로 자동완성되는 API 클라이언트(Hono RPC)를 만들 수 있다.
 */
// biome-ignore lint/style/useNamingConvention: Hono가 정한 키 이름(Bindings)이라 바꿀 수 없다
export const app = new Hono<{ Bindings: ApiEnv }>()
  .basePath('/api')
  .use('*', secureHeaders({ crossOriginResourcePolicy: false, xFrameOptions: 'DENY' }))
  .route('/health', healthRoute)
  .route('/reports', reportsRoute);

/** web이 가져다 쓸 API 타입. 런타임 코드는 넘어가지 않고 타입만 공유된다. */
export type AppType = typeof app;
