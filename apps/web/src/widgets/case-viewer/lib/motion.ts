/** 케이스가 원래 자리 ↔ 화면 가운데를 오가는 시간(ms) */
const MOVE_MS = 650;
const MOVE_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

/** 닫기 연출이 여는 연출보다 몇 배 빠른지(사용자 요청 10/6: 지금보다 0.5배 더 빠르게 = 1.5배) */
const CLOSE_SPEEDUP = 1.5;
/**
 * 닫을 때의 시간 배율(걸리는 시간 2/3).
 * JS가 기다리는 시간(단계·flyOut)과 CSS transition 시간(--case-tempo 변수)에 같은 값을 쓴다.
 */
const CLOSE_TEMPO = 1 / CLOSE_SPEEDUP;

/**
 * FLIP의 Invert: 현재 자리(box)에 있는 케이스를 누른 요소(origin) 자리에 겹쳐 보이게 하는 transform.
 * 요소의 transform-origin이 왼쪽 위(top left)라는 전제다.
 *
 * 누른 요소는 표지(케이스와 같은 3:4)일 수도, 가늘고 긴 등줄기일 수도 있다. 가로·세로를 따로 늘리면
 * 등줄기에서 출발할 때 케이스가 찌그러져 보이므로, **높이 비율 하나로 똑같이** 줄이고
 * 누른 요소의 가운데에 맞춘다(등줄기 자리에서 케이스가 빠져나오는 모습).
 */
function flyTransform(origin: HTMLElement | null, box: HTMLElement): string {
  if (origin === null) {
    return 'none';
  }
  const from = origin.getBoundingClientRect();
  const to = box.getBoundingClientRect();
  // 크기를 잴 수 없으면(화면이 접혀 있거나 아직 배치 전) 0으로 나누게 되므로 이동 연출을 건너뛴다.
  if (from.height === 0 || to.height === 0) {
    return 'none';
  }
  const scale = from.height / to.height;
  const dx = from.left + from.width / 2 - (to.left + (to.width * scale) / 2);
  const dy = from.top - to.top;
  return `translate(${dx}px, ${dy}px) scale(${scale})`;
}

/** 운영체제의 "동작 줄이기"를 켠 사용자인지. 켰으면 이동·열기 연출 없이 바로 보여 준다. */
export function prefersReducedMotion(): boolean {
  return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** ms만큼 기다리는 Promise */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

/**
 * 상자 안에서 지금 진행 중인 CSS transition이 모두 끝날 때까지 기다린다(열기 마지막 단계의 표지 넘김·디스크 회전 등).
 * 단계를 바꾼 직후에는 아직 transition이 만들어지기 전이라, 화면을 두 번 그린 뒤(requestAnimationFrame 두 번) 모은다.
 * 무한 반복 애니메이션(CSS animation)은 끝나지 않으므로 transition만 고른다. 취소된 transition은 기다리지 않는다.
 */
export async function transitionsSettled(box: HTMLElement): Promise<void> {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const running = box
    .getAnimations({ subtree: true })
    .filter((animation) => animation instanceof CSSTransition);
  await Promise.allSettled(running.map((animation) => animation.finished));
}

/**
 * 누른 요소 자리 → 현재 자리(화면 가운데)로 날아오기.
 * Web Animations API(element.animate)는 끝나는 시점을 `finished` Promise로 알려 줘서,
 * "이동이 끝나면 표지를 연다" 같은 순서를 정확히 맞출 수 있다.
 */
export function flyIn(box: HTMLElement, origin: HTMLElement | null): Animation {
  return box.animate([{ transform: flyTransform(origin, box) }, { transform: 'none' }], {
    duration: prefersReducedMotion() ? 0 : MOVE_MS,
    easing: MOVE_EASING,
  });
}

/** 현재 자리 → 누른 요소 자리로 돌아가기(닫기 배율만큼 빠르게). 끝난 뒤에도 그 자리에 머물도록 fill: forwards */
export function flyOut(box: HTMLElement, origin: HTMLElement | null): Promise<Animation> {
  return box.animate([{ transform: 'none' }, { transform: flyTransform(origin, box) }], {
    duration: prefersReducedMotion() ? 0 : MOVE_MS * CLOSE_TEMPO,
    easing: MOVE_EASING,
    fill: 'forwards',
  }).finished;
}

export { CLOSE_TEMPO };
