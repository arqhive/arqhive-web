import { describe, expect, it } from 'vitest';
import { fetchReleaseList } from './release-list.ts';

/** fetch 응답 흉내(ok·json만) */
const reply = (body: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) });

describe('fetchReleaseList', () => {
  it('목록이 있으면 첫 요청 그대로 쓴다', async () => {
    const attempts: number[] = [];
    const list = await fetchReleaseList<{ tag: string }>((attempt) => {
      attempts.push(attempt);
      return reply([{ tag: 'v1.0f' }]);
    });
    expect(list).toStrictEqual([{ tag: 'v1.0f' }]);
    expect(attempts).toStrictEqual([0]);
  });

  // biome-ignore lint/security/noSecrets: 한글 시험 이름을 비밀값으로 잘못 본다
  it('200인데 빈 목록이면 믿지 않고 다시 받는다(GitHub이 가끔 []를 준다)', async () => {
    const attempts: number[] = [];
    const list = await fetchReleaseList<{ tag: string }>((attempt) => {
      attempts.push(attempt);
      return reply(attempt === 0 ? [] : [{ tag: 'v1.0f' }]);
    });
    expect(list).toStrictEqual([{ tag: 'v1.0f' }]);
    expect(attempts).toStrictEqual([0, 1]);
  });

  it('끝까지 비면 null(빈 목록을 「릴리즈 없음」으로 쓰지 않는다)', async () => {
    let calls = 0;
    const list = await fetchReleaseList(() => {
      calls += 1;
      return reply([]);
    });
    expect(list).toBeNull();
    expect(calls).toBe(3);
  });

  it('응답 오류나 네트워크 오류면 다시 받지 않고 null', async () => {
    let calls = 0;
    await expect(
      fetchReleaseList(() => {
        calls += 1;
        return reply({ message: 'rate' }, false);
      }),
    ).resolves.toBeNull();
    await expect(fetchReleaseList(() => Promise.reject(new Error('net')))).resolves.toBeNull();
    expect(calls).toBe(1);
  });
});
