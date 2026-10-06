/**
 * HMAC-SHA256 서명(링크 위조 막기). 서버만 아는 비밀 키로 "이 링크는 내가 만들었다"를 증명한다.
 * 확인은 crypto.subtle.verify로 한다(문자열 ===로 비교하면 걸린 시간으로 값을 알아낼 수 있다 — 타이밍 공격).
 * 서명은 주소에 넣기 좋게 base64url(+/= 대신 -_, 끝 = 없음)로 쓴다.
 */

const encoder = new TextEncoder();
/** base64 끝의 채움 문자(=) */
const TRAILING_PADDING = /[=]+$/u;

function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(TRAILING_PADDING, '');
}

function fromBase64Url(text: string): Uint8Array | null {
  try {
    const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

async function sign(secret: string, message: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await importKey(secret),
    encoder.encode(message),
  );
  return toBase64Url(signature);
}

async function verify(secret: string, message: string, signature: string): Promise<boolean> {
  const bytes = fromBase64Url(signature);
  if (bytes === null) {
    return false;
  }
  return crypto.subtle.verify('HMAC', await importKey(secret), bytes, encoder.encode(message));
}

export { sign, verify };
