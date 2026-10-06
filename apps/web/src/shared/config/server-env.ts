/**
 * 서버 전용 환경 변수를 읽는 유일한 곳. 비밀값을 여기저기서 읽지 않도록 한곳에 모은다.
 * 클라이언트 컴포넌트에서 부르면 값이 없다(NEXT_PUBLIC_ 이 붙지 않은 변수는 브라우저로 가지 않는다).
 */

// 이 앱이 읽는 환경 변수의 타입을 알려 준다(선언하지 않으면 process.env는 아무 이름이나 받는 색인이라
// TypeScript는 env['이름']으로 쓰라고 하고, Biome은 env.이름으로 쓰라고 해서 서로 부딪친다).
declare global {
  // biome-ignore lint/style/noNamespace: Node.js 타입이 환경 변수를 NodeJS 네임스페이스에 정의해 두어 그 안에 더해야 한다
  namespace NodeJS {
    interface ProcessEnv {
      readonly GITHUB_TOKEN?: string;
      readonly DISCORD_WEBHOOK_URL?: string;
    }
  }
}

/** GitHub 읽기 전용 토큰(릴리즈 다운로드 수 조회용). 없으면 undefined(토큰 없이 시간당 60번 한도로 부른다) */
export function githubToken(): string | undefined {
  // biome-ignore lint/style/noProcessEnv lint/correctness/noProcessGlobal: 서버 비밀값은 이 파일 한 곳에서만 읽는다(웹 앱은 node: 모듈 import 금지라 전역 process를 쓴다)
  return globalThis.process?.env.GITHUB_TOKEN || undefined;
}

/** 운영자 디스코드 웹훅(서버 오류 알림, instrumentation.ts). API와 같은 웹훅을 Vercel 환경 변수에도 넣는다. 없으면 알리지 않는다 */
export function discordWebhookUrl(): string | undefined {
  // biome-ignore lint/style/noProcessEnv lint/correctness/noProcessGlobal: 서버 비밀값은 이 파일 한 곳에서만 읽는다
  return globalThis.process?.env.DISCORD_WEBHOOK_URL || undefined;
}
