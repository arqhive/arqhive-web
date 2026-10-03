import { describe, expect, it } from 'vitest';
import { app } from '../src/app.ts';

describe('GET /api/health', () => {
  it('서버가 살아 있으면 ok를 돌려준다', async () => {
    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ status: 'ok' });
  });
});
