/**
 * KV로 세는 간단한 횟수 제한. 키마다 지금까지 횟수를 적고, 정해 둔 시간이 지나면 KV가 저절로 지운다(expirationTtl).
 * KV는 곳곳의 서버에 천천히 퍼지는 저장소라 몇 건 정도는 더 통과할 수 있다(정밀한 제한이 아니라 도배를 막는 정도).
 */

/** KV가 허용하는 가장 짧은 유지 시간(초) */
const MIN_TTL_SECONDS = 60;
/** 바이트 하나를 16진수 두 글자로 */
const HEX_RADIX = 16;
const HEX_DIGITS = 2;

/** 이번 요청을 세고 한도 안이면 true. 한도를 넘었으면 세지 않고 false */
export async function takeToken(
  kv: KVNamespace,
  key: string,
  limit: number,
  ttlSeconds: number,
): Promise<boolean> {
  const current = Number((await kv.get(key)) ?? '0');
  if (current >= limit) {
    return false;
  }
  await kv.put(key, String(current + 1), {
    expirationTtl: Math.max(MIN_TTL_SECONDS, ttlSeconds),
  });
  return true;
}

/** 이미 있으면 false, 없으면 적고 true(같은 내용 다시 보내기 막기) */
export async function markOnce(kv: KVNamespace, key: string, ttlSeconds: number): Promise<boolean> {
  if ((await kv.get(key)) !== null) {
    return false;
  }
  await kv.put(key, '1', { expirationTtl: Math.max(MIN_TTL_SECONDS, ttlSeconds) });
  return true;
}

/** 문자열의 SHA-256(16진수). IP·내용을 그대로 저장하지 않고 이 값으로만 센다 */
export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(HEX_RADIX).padStart(HEX_DIGITS, '0'))
    .join('');
}
