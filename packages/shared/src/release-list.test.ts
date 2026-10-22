import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchReleaseList } from './release-list.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

afterEach(() => {
  vi.useRealTimers();
});

describe('fetchReleaseList', () => {
  it('목록이 있으면 첫 요청 그대로 쓴다', async () => {
    const attempts: number[] = [];
    const list = await fetchReleaseList<{ tag: string }>((attempt) => {
      attempts.push(attempt);
      return Promise.resolve(json([{ tag: 'v1.0f' }]));
    });
    expect(list).toStrictEqual([{ tag: 'v1.0f' }]);
    expect(attempts).toStrictEqual([0]);
  });

  // biome-ignore lint/security/noSecrets: 한글 시험 이름을 비밀값으로 잘못 본다
  it('200인데 빈 목록이면 믿지 않고 다시 받는다(GitHub이 가끔 []를 준다)', async () => {
    vi.useFakeTimers();
    const attempts: number[] = [];
    const pending = fetchReleaseList<{ tag: string }>((attempt) => {
      attempts.push(attempt);
      return Promise.resolve(json(attempt === 0 ? [] : [{ tag: 'v1.0f' }]));
    });
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toStrictEqual([{ tag: 'v1.0f' }]);
    expect(attempts).toStrictEqual([0, 1]);
  });

  it('끝까지 비면 null(빈 목록을 「릴리즈 없음」으로 쓰지 않는다)', async () => {
    vi.useFakeTimers();
    const pending = fetchReleaseList(() => Promise.resolve(json([])));
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toBeNull();
  });

  it('응답 오류나 네트워크 오류면 다시 받지 않고 null', async () => {
    let calls = 0;
    await expect(
      fetchReleaseList(() => {
        calls += 1;
        return Promise.resolve(json({ message: 'rate' }, 403));
      }),
    ).resolves.toBeNull();
    await expect(fetchReleaseList(() => Promise.reject(new Error('net')))).resolves.toBeNull();
    expect(calls).toBe(1);
  });
});
