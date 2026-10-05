import { afterEach, describe, expect, it, vi } from 'vitest';
import { notify, reportNotice, runNotificationCron } from '../src/modules/notifications/index.ts';
import type { ApiEnv } from '../src/platform/env.ts';

/** 시험용 가짜 KV: get·put·delete만 Map으로 흉내 낸다 */
function fakeKv(): KVNamespace & { readonly store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    get: (key: string) => Promise.resolve(store.get(key) ?? null),
    put: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    delete: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
  } as unknown as KVNamespace & { readonly store: Map<string, string> };
}

function envWith(kv: KVNamespace, webhook?: string): ApiEnv {
  // biome-ignore lint/style/useNamingConvention: Workers 바인딩·비밀값 이름
  return { RATE_LIMIT: kv, DISCORD_WEBHOOK_URL: webhook } as unknown as ApiEnv;
}

const pendingCount = (kv: { readonly store: Map<string, string> }) =>
  (JSON.parse(kv.store.get('notify:pending') ?? '[]') as unknown[]).length;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('reportNotice', () => {
  const report = { game: '스타폭스 2', title: '[제보] 오타', text: '가'.repeat(500) };

  // biome-ignore lint/security/noSecrets: 한글 문장을 비밀값으로 잘못 본다
  it('푸시 한 줄에 게임 이름, 카드 설명은 300자까지만', () => {
    const message = reportNotice(report, 'https://x', false);
    expect(message.content).toBe('새 제보 · 스타폭스 2');
    expect(message.description).toHaveLength(301);
  });

  it('시험(dry run)이면 [시험]을 붙인다', () => {
    expect(reportNotice(report, 'https://x', true).content.startsWith('[시험] ')).toBe(true);
  });
});

describe('notify', () => {
  const message = reportNotice({ game: '게임', title: '제목', text: '내용' }, 'https://x', false);

  it('웹훅 주소가 없으면 아무것도 하지 않는다', async () => {
    const kv = fakeKv();
    await notify(envWith(kv), message);
    expect(kv.store.size).toBe(0);
  });

  it('실패하면 던지지 않고 쌓아 두고, 정기 실행이 다시 보내면 비운다', async () => {
    const kv = fakeKv();
    const env = envWith(kv, 'https://discord.test/hook');
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 429 })));
    await notify(env, message);
    await notify(env, message);
    expect(pendingCount(kv)).toBe(2);

    const sent: string[] = [];
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      sent.push(String(init.body));
      return Promise.resolve(new Response(null, { status: 204 }));
    });
    await runNotificationCron(env);
    expect(sent).toHaveLength(2);
    expect(kv.store.has('notify:pending')).toBe(false);
  });

  it('사용자 글의 멘션(@everyone 등)이 울리지 않게 막는다', async () => {
    let body = '';
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      body = String(init.body);
      return Promise.resolve(new Response(null, { status: 204 }));
    });
    await notify(envWith(fakeKv(), 'https://discord.test/hook'), message);
    // biome-ignore lint/style/useNamingConvention: 디스코드 API의 필드 이름
    expect(JSON.parse(body)).toMatchObject({ allowed_mentions: { parse: [] } });
  });
});
