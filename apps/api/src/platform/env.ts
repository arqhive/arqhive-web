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
  /** Neon 연결 문자열(다운로드 기록, ADR 0016). 없으면 정산에서 저장·증가분을 건너뛴다 */
  readonly DATABASE_URL?: string;
  /** GoatCounter API 키(일일 정산의 방문 통계를 읽는다, ADR 0019). 통계 읽기 권한만, arqhive 사이트만 */
  readonly GOATCOUNTER_API_KEY?: string;
  /** healthchecks.io 신호 주소(정기 작업 감시). 매시 재전송·일일 정산이 끝날 때 부른다. 없으면 신호를 보내지 않는다 */
  readonly HEALTHCHECK_HOURLY_URL?: string;
  readonly HEALTHCHECK_DAILY_URL?: string;
  /** "1"이면 에이전트 평가 주소(/api/agent/eval)를 연다. 개발(.dev.vars)에서만 넣는다 */
  readonly AGENT_EVAL?: string;
  /** 처리안 검토 링크 서명 키(HMAC, 아무 긴 임의 문자열). 없으면 디스코드 처리안에 검토 링크를 달지 않는다 */
  readonly AGENT_SIGNING_KEY?: string;
};
