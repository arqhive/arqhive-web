/**
 * 방문 통계(Umami Cloud)로 이벤트 보내기. 어느 층에서나 부를 수 있게 shared에 둔다.
 *
 * - Umami 스크립트(app/analytics가 불러옴)가 window.umami를 만든다. 스크립트가 오기 전에 부른 이벤트는
 *   잠시 모아 두었다가 스크립트가 준비되면 보낸다(flushQueue). 첫 화면의 성능 측정값이 빠지지 않게 하려는 것이다.
 * - 배포 사이트에서만 수집한다(스크립트의 data-domains). 개발 중에는 스크립트가 보내지 않는다.
 * - 사용자가 입력한 글(제보 내용 등)은 절대 넣지 않는다. 이벤트 값은 무엇을 눌렀는지·어느 패치인지·숫자 정도만.
 */

/** 이벤트에 붙이는 값. Umami는 값 하나에 500자까지 받는다 */
type TrackData = Readonly<Record<string, string | number | boolean>>;

interface Umami {
  readonly track: (name: string, data?: TrackData) => void;
}

/** 스크립트가 오기 전에 쌓아 둘 이벤트 수(넘치면 버린다) */
const QUEUE_MAX = 50;
const queue: [string, TrackData | undefined][] = [];

function umami(): Umami | undefined {
  return (globalThis as typeof globalThis & { umami?: Umami }).umami;
}

/** 이벤트 하나 보내기. 실패해도 화면에는 영향을 주지 않는다 */
function track(name: string, data?: TrackData): void {
  const client = umami();
  if (client === undefined) {
    if (queue.length < QUEUE_MAX) {
      queue.push([name, data]);
    }
    return;
  }
  try {
    client.track(name, data);
  } catch {
    // 통계 실패는 무시한다
  }
}

/** Umami 스크립트가 준비되면 쌓아 둔 이벤트를 보낸다 */
function flushQueue(): void {
  for (const [name, data] of queue.splice(0)) {
    track(name, data);
  }
}

export type { TrackData };
export { flushQueue, track };
