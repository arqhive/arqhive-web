import { describe, expect, it } from 'vitest';
import { app } from '../src/app.ts';

describe('GET /api/health', () => {
  it('서버가 살아 있으면 ok를 돌려준다', async () => {
    // app.request()는 실제 서버를 띄우지 않고 Hono 앱에 가짜 요청을 보낸다.
    // 바인딩(DB, 큐 등)을 쓰는 라우트가 생기면 @cloudflare/vitest-pool-workers로 Workers 환경에서 테스트한다.
    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ status: 'ok' });
  });
});
