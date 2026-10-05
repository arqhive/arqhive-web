/**
 * Worker가 받는 값의 타입. 공개 설정(vars)과 바인딩(R2·KV)은 `wrangler types`가 wrangler.jsonc를 읽어 Env에 넣어 준다.
 * 비밀값은 개발 PC의 .dev.vars가 있을 때만 Env에 들어가서(CI에는 없음), 여기서 직접 적어 둔다.
 */
export type ApiEnv = Env & {
  /** Turnstile 비밀 키(서버 확인용) */
  readonly TURNSTILE_SECRET_KEY: string;
  /** 이슈를 만들 GitHub 토큰(Issues 읽기·쓰기). REPORT_DRY_RUN이 "1"이면 없어도 된다 */
  readonly GITHUB_ISSUES_TOKEN?: string;
  /** 운영자 알림을 보낼 디스코드 웹훅 주소. 없으면 알림을 보내지 않는다 */
  readonly DISCORD_WEBHOOK_URL?: string;
};
