/** Turnstile 토큰 확인 주소(Cloudflare) */
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * 양식이 보낸 Turnstile 토큰이 진짜인지 Cloudflare에 묻는다. 토큰은 한 번만 쓸 수 있고 몇 분 뒤 만료된다.
 * 브라우저 쪽 위젯만으로는 봇을 못 막는다(서버에서 이 확인을 해야 의미가 있다).
 * 실패하면 이유(reason)를 함께 돌려줘 로그로 원인을 찾을 수 있게 한다.
 */
export async function verifyTurnstile(
  secret: string,
  token: string | null,
  ip: string | null,
): Promise<{ readonly ok: boolean; readonly reason: string }> {
  if (token === null || token === '') {
    return { ok: false, reason: 'no-token' };
  }
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip !== null) {
    body.append('remoteip', ip);
  }
  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body });
    const result = (await response.json()) as {
      readonly success?: boolean;
      readonly 'error-codes'?: readonly string[];
    };
    // 실패 이유(예: invalid-input-secret = 비밀 키가 틀림, timeout-or-duplicate = 토큰 만료·재사용)를 함께 돌려준다
    const ok = response.ok && result.success === true;
    return {
      ok,
      reason: ok ? 'ok' : (result['error-codes'] ?? []).join(',') || `http-${response.status}`,
    };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
