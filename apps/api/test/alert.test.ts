import { afterEach, describe, expect, it, vi } from 'vitest';
import { alertError } from '../src/modules/notifications/index.ts';
import type { ApiEnv } from '../src/platform/env.ts';
import { heartbeat } from '../src/platform/heartbeat.ts';

/** 시험용 가짜 KV: get·put·delete만 Map으로 흉내 낸다 */
function fakeKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: (key: string) => Promise.resolve(store.get(key) ?? null),
    put: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    delete: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
  } as unknown as KVNamespace;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('alertError', () => {
  it('같은 곳·같은 오류는 한 번만 보내고, 다른 오류는 따로 보낸다', async () => {
    const sent: string[] = [];
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      sent.push(String(init.body));
      return Promise.resolve(new Response(null, { status: 204 }));
    });
    const env = {
      // biome-ignore lint/style/useNamingConvention: Workers 바인딩·비밀값 이름
      RATE_LIMIT: fakeKv(),
      // biome-ignore lint/style/useNamingConvention: Workers 비밀값 이름
      DISCORD_WEBHOOK_URL: 'https://discord.test/hook',
    } as unknown as ApiEnv;
    await alertError(env, 'POST /api/reports', new Error('GitHub 503'));
    await alertError(env, 'POST /api/reports', new Error('GitHub 503'));
    await alertError(env, 'cron 일일 정산', new Error('Neon 시간 초과'));
    expect(sent).toHaveLength(2);
    expect(sent[0]).toContain('GitHub 503');
  });
});

describe('heartbeat', () => {
  it('성공은 주소 그대로, 실패는 /fail을 붙여 부른다. 주소가 없으면 부르지 않는다', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', (url: string) => {
      urls.push(url);
      return Promise.resolve(new Response('OK'));
    });
    await heartbeat('https://hc.test/abc', true);
    await heartbeat('https://hc.test/abc', false);
    await heartbeat(undefined, true);
    expect(urls).toStrictEqual(['https://hc.test/abc', 'https://hc.test/abc/fail']);
  });
});
