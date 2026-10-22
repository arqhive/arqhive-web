import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGoatCounterDay } from '../src/platform/goatcounter.ts';

const RANGE = {
  startAt: Date.parse('2026-10-22T15:00:00Z'),
  endAt: Date.parse('2026-10-23T14:50:00Z'),
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fetchGoatCounterDay', () => {
  it('요청을 동시에 보내지 않고 차례로 보낸다(경로 목록 이어 받기 → 유입 경로)', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (input: string) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      const url = new URL(input);
      calls.push(
        `${url.pathname.replace('/api/v0', '')}${url.searchParams.has('exclude_paths') ? '+exclude' : ''}`,
      );
      await Promise.resolve();
      inFlight -= 1;
      if (url.pathname.endsWith('/toprefs')) {
        return json({ stats: [{ name: 'google.com', count: 3 }], more: false });
      }
      const first = !url.searchParams.has('exclude_paths');
      return json({
        hits: [
          {
            // biome-ignore lint/style/useNamingConvention: GoatCounter API 응답 필드 이름 그대로
            path_id: first ? 1 : 2,
            path: first ? '/' : 'case-open/zelda',
            event: !first,
            count: 5,
          },
        ],
        more: first,
      });
    });
    const day = await fetchGoatCounterDay('key', RANGE);
    expect(maxInFlight).toBe(1);
    expect(calls).toStrictEqual(['/stats/hits', '/stats/hits+exclude', '/stats/toprefs']);
    expect(day.visits).toBe(5);
    expect(day.events).toStrictEqual([{ name: 'case-open/zelda', count: 5 }]);
  });
});

describe('fetchGoatCounterDay — 요청 제한(429)', () => {
  it('429면 X-Rate-Limit-Reset만큼 기다렸다 다시 보낸다', async () => {
    vi.useFakeTimers();
    let hitsCalls = 0;
    vi.stubGlobal('fetch', (input: string) => {
      if (new URL(input).pathname.endsWith('/toprefs')) {
        return Promise.resolve(json({ stats: [], more: false }));
      }
      hitsCalls += 1;
      return Promise.resolve(
        hitsCalls === 1
          ? json({ error: 'rate' }, 429, { 'x-rate-limit-reset': '1' })
          : json({ hits: [], more: false }),
      );
    });
    const pending = fetchGoatCounterDay('key', RANGE);
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toMatchObject({ visits: 0 });
    expect(hitsCalls).toBe(2);
  });

  it('계속 429면 경로와 상태 코드를 담아 실패한다(키 값은 담지 않는다)', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', () => Promise.resolve(json({}, 429)));
    const pending = fetchGoatCounterDay('secret-key', RANGE);
    const assertion = expect(pending).rejects.toThrow('GoatCounter /stats/hits 실패: 429');
    await vi.runAllTimersAsync();
    await assertion;
    await expect(pending).rejects.not.toThrow('secret-key');
  });
});
