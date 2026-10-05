/** Turnstile 토큰 확인 주소(Cloudflare) */
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * 양식이 보낸 Turnstile 토큰이 진짜인지 Cloudflare에 묻는다. 토큰은 한 번만 쓸 수 있고 몇 분 뒤 만료된다.
 * 브라우저 쪽 위젯만으로는 봇을 못 막는다(서버에서 이 확인을 해야 의미가 있다).
 */
export async function verifyTurnstile(
  secret: string,
  token: string | null,
  ip: string | null,
): Promise<boolean> {
  if (token === null || token === '') {
    return false;
  }
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip !== null) {
    body.append('remoteip', ip);
  }
  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body });
    const result = (await response.json()) as { readonly success?: boolean };
    return response.ok && result.success === true;
  } catch {
    return false;
  }
}
