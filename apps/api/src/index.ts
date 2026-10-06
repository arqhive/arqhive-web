import { app } from './app.ts';
import { syncGuideIndex } from './modules/agent/index.ts';
import { runDailyReport } from './modules/daily-report/index.ts';
import { alertError, runNotificationCron } from './modules/notifications/index.ts';
import type { ApiEnv } from './platform/env.ts';
import { heartbeat } from './platform/heartbeat.ts';

/** 일일 정산 일정(UTC 14:50 = 한국 23:50). wrangler.jsonc의 triggers.crons와 글자까지 같아야 한다 */
const DAILY_REPORT_CRON = '50 14 * * *';

/**
 * 정기 작업 하나 실행: 끝나면 healthchecks에 "다녀감" 신호, 실패하면 /fail 신호 + 디스코드 오류 알림.
 * (신호가 아예 안 오면 healthchecks가 알린다 — Worker가 통째로 멈춘 경우까지 잡는다.)
 */
async function runJob(
  env: ApiEnv,
  where: string,
  heartbeatUrl: string | undefined,
  job: () => Promise<void>,
): Promise<void> {
  try {
    await job();
    await heartbeat(heartbeatUrl, true);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: 정기 작업 실패를 운영 로그로 남긴다
    console.error(where, error);
    await Promise.all([heartbeat(heartbeatUrl, false), alertError(env, where, error)]);
  }
}

/** 하루 한 번: 일일 정산 → 가이드 문단 색인 맞추기(에이전트 검색용, 바뀐 문단만 임베딩) */
async function runDailyJobs(env: ApiEnv): Promise<void> {
  await runDailyReport(env);
  await syncGuideIndex(env);
}

/**
 * Workers 진입점. Cloudflare는 이 파일의 기본 내보내기에서 이벤트별 처리 함수를 찾는다.
 *
 * - `fetch`: HTTP 요청이 들어올 때
 * - `scheduled`: Cron 시각이 됐을 때(wrangler.jsonc의 triggers). 매시 정각은 못 보낸 운영자 알림 재전송,
 *   한국 시간 23시 50분은 일일 정산과 가이드 색인(controller.cron으로 어느 일정인지 가른다)
 * - `queue`: 큐에 메시지가 쌓였을 때 (아직 안 씀)
 *
 * 한 Worker가 세 가지를 모두 맡고, 각각 해당 모듈로 나눠 보내기만 한다.
 * `satisfies ExportedHandler<Env>`는 모양이 Workers 규격에 맞는지 검사한다(오타나 잘못된 인자를 잡아 준다).
 */
export default {
  fetch: app.fetch,
  // waitUntil: 응답(여기서는 없음)과 상관없이 이 작업이 끝날 때까지 Worker를 살려 둔다
  scheduled: (controller, env, ctx) => {
    const apiEnv = env as ApiEnv;
    const daily = controller.cron === DAILY_REPORT_CRON;
    ctx.waitUntil(
      runJob(
        apiEnv,
        daily ? 'cron 일일 정산' : 'cron 알림 재전송',
        daily ? apiEnv.HEALTHCHECK_DAILY_URL : apiEnv.HEALTHCHECK_HOURLY_URL,
        () => (daily ? runDailyJobs(apiEnv) : runNotificationCron(apiEnv)),
      ),
    );
  },
} satisfies ExportedHandler<Env>;
