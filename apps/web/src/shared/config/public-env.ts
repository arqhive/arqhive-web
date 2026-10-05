/**
 * 브라우저에서도 읽는 공개 환경 변수(NEXT_PUBLIC_*). 비밀값이 아니다(화면 코드에 그대로 박힌다).
 * Next.js는 빌드할 때 `process.env.NEXT_PUBLIC_…`라는 **글자 그대로**를 찾아 값으로 바꾸므로, 다른 모양으로 읽으면 안 된다.
 */

declare global {
  // biome-ignore lint/style/noNamespace: Node.js 타입이 환경 변수를 NodeJS 네임스페이스에 정의해 두어 그 안에 더해야 한다
  namespace NodeJS {
    interface ProcessEnv {
      /** 제보 API 주소(예: https://arqhive-api.<계정>.workers.dev). 없으면 양식의 보내기를 막는다 */
      readonly NEXT_PUBLIC_API_URL?: string;
      /** Cloudflare Turnstile 사이트 키(공개용). 없으면 위젯을 그리지 않는다 */
      readonly NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
    }
  }
}

/** 제보 API 주소(끝의 / 없이). 설정되지 않았으면 undefined */
export function reportApiUrl(): string | undefined {
  // biome-ignore lint/style/noProcessEnv lint/correctness/noProcessGlobal: 빌드 때 글자 그대로 바뀌는 공개 값이라 이 모양으로 읽어야 한다
  return process.env.NEXT_PUBLIC_API_URL || undefined;
}

/** Turnstile 사이트 키. 설정되지 않았으면 undefined */
export function turnstileSiteKey(): string | undefined {
  // biome-ignore lint/style/noProcessEnv lint/correctness/noProcessGlobal: 빌드 때 글자 그대로 바뀌는 공개 값이라 이 모양으로 읽어야 한다
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined;
}
