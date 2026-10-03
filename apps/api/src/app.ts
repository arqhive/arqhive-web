import { Hono } from 'hono';
import { healthRoute } from './modules/health/index.ts';

/**
 * HTTP 라우트를 모으는 곳. 기능은 `modules/<기능>/`에 두고 여기서는 연결만 한다.
 * web은 이 앱의 타입(`AppType`)으로 타입이 붙은 API 클라이언트를 만든다.
 */
// biome-ignore lint/style/useNamingConvention: Hono가 정한 키 이름(Bindings)이라 바꿀 수 없다
export const app = new Hono<{ Bindings: Env }>().basePath('/api').route('/health', healthRoute);

export type AppType = typeof app;
