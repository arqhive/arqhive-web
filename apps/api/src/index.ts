import { app } from './app.ts';

/**
 * Workers 진입점. 지금은 HTTP 요청(`fetch`)만 받는다.
 * 큐 처리(`queue`)와 정기 실행(`scheduled`)은 해당 기능을 만들 때 여기에 추가하고, 각 모듈로 나눠 보낸다.
 */
export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
