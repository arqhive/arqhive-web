import { describe, expect, it } from 'vitest';
import { releaseStorage, reserveStorage, storageUsed } from '../src/platform/storage-budget.ts';

/** 시험용 가짜 KV: get·put만 Map으로 흉내 낸다 */
function fakeKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: (key: string) => Promise.resolve(store.get(key) ?? null),
    put: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
  } as unknown as KVNamespace;
}

describe('저장 용량 예산', () => {
  it('기준 안이면 더해 두고, 넘을 것 같으면 막는다', async () => {
    const kv = fakeKv();
    const limit = 1000;
    expect(await reserveStorage(kv, 600, limit)).toBe(true);
    expect(await reserveStorage(kv, 400, limit)).toBe(true);
    expect(await storageUsed(kv)).toBe(1000);
    expect(await reserveStorage(kv, 1, limit)).toBe(false);
    expect(await storageUsed(kv)).toBe(1000);
  });

  it('지운 만큼 빼면 다시 올릴 수 있다(0 밑으로는 안 내려간다)', async () => {
    const kv = fakeKv();
    await reserveStorage(kv, 900, 1000);
    await releaseStorage(kv, 500);
    expect(await reserveStorage(kv, 500, 1000)).toBe(true);
    await releaseStorage(kv, 99_999);
    expect(await storageUsed(kv)).toBe(0);
  });
});
