/**
 * R2 저장 용량 예산. R2 무료 한도(저장 10GB)를 넘어 요금이 나가지 않게, 지금까지 올린 이미지 크기를 KV에 누적해 두고
 * 기준(9GB)을 넘을 것 같으면 더 올리지 않는다. R2에는 "여기서 멈춤" 같은 사용 한도 설정이 없어서 우리 쪽에서 막는다.
 *
 * - KV는 곳곳의 서버에 천천히 퍼지는 저장소라, 동시에 들어온 요청 몇 건은 기준을 살짝 넘길 수 있다. 그래서 10GB가 아니라 9GB에서 막는다.
 * - 이 숫자는 "올린 양"이다. 나중에 R2에서 이미지를 지우는 정리 기능을 만들면, 지운 만큼 releaseStorage로 빼야 한다.
 */

/** 누적 크기를 적어 두는 KV 키 */
const STORAGE_KEY = 'storage:bytes';

/** 막는 기준: 9GB(9 × 1024³ 바이트). 무료 10GB보다 여유를 둔다 */
export const STORAGE_LIMIT_BYTES = 9_663_676_416;

/** 지금까지 올린 양(바이트) */
export async function storageUsed(kv: KVNamespace): Promise<number> {
  return Number((await kv.get(STORAGE_KEY)) ?? '0');
}

/** bytes만큼 올려도 기준 안이면 미리 더해 두고 true. 넘으면 그대로 두고 false */
export async function reserveStorage(
  kv: KVNamespace,
  bytes: number,
  limit: number,
): Promise<boolean> {
  const used = await storageUsed(kv);
  if (used + bytes > limit) {
    return false;
  }
  await kv.put(STORAGE_KEY, String(used + bytes));
  return true;
}

/** 지운 만큼 빼기(나중의 정리 기능용) */
export async function releaseStorage(kv: KVNamespace, bytes: number): Promise<void> {
  const used = await storageUsed(kv);
  await kv.put(STORAGE_KEY, String(Math.max(0, used - bytes)));
}
