import { eventPath } from '@arqhive/shared';

/**
 * 방문 통계(GoatCounter, ADR 0019)로 페이지뷰·이벤트 보내기. 어느 층에서나 부를 수 있게 shared에 둔다.
 *
 * - GoatCounter 스크립트(app/analytics가 운영 주소에서만 불러옴)가 window.goatcounter.count를 만든다.
 *   스크립트가 오기 전에 부른 것은 잠시 모아 두었다가 스크립트가 준비되면 보낸다(flushQueue).
 * - 이벤트는 값(속성)을 따로 못 담는다. 그래서 "이름/값/값" 모양의 경로로 보낸다(예: case-open/star-fox-2).
 *   규칙은 @arqhive/shared의 eventPath이고, 일일 정산(apps/api daily-report)이 같은 규칙으로 나눠 읽는다.
 * - 사용자가 입력한 글(제보 내용 등)은 절대 넣지 않는다. 값은 무엇을 눌렀는지·어느 패치인지·구간 정도만.
 */

/** 이벤트에 붙이는 값. 넣은 순서대로 경로 조각이 된다 */
type TrackData = Readonly<Record<string, string | number | boolean>>;

/** goatcounter.count에 넘기는 값 */
interface CountVars {
  readonly path: string;
  readonly title?: string;
  readonly event?: boolean;
}

interface GoatCounter {
  readonly count?: (vars: CountVars) => void;
}

/** 스크립트가 오기 전에 쌓아 둘 개수(넘치면 버린다) */
const QUEUE_MAX = 50;
const queue: CountVars[] = [];

function send(vars: CountVars): void {
  const count = (globalThis as typeof globalThis & { goatcounter?: GoatCounter }).goatcounter
    ?.count;
  if (count === undefined) {
    if (queue.length < QUEUE_MAX) {
      queue.push(vars);
    }
    return;
  }
  try {
    count(vars);
  } catch {
    // 통계 실패는 무시한다
  }
}

/** 이벤트 하나 보내기. 실패해도 화면에는 영향을 주지 않는다 */
function track(name: string, data?: TrackData): void {
  send({ path: eventPath(name, Object.values(data ?? {})), title: name, event: true });
}

/** 페이지뷰 하나 보내기(주소가 바뀔 때마다 app/analytics가 부른다) */
function countPage(path: string): void {
  send({ path });
}

/** 스크립트가 준비되면 쌓아 둔 것을 보낸다 */
function flushQueue(): void {
  for (const vars of queue.splice(0)) {
    send(vars);
  }
}

export type { TrackData };
export { countPage, flushQueue, track };
