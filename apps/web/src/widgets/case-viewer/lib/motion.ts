/** 표지가 원래 자리 ↔ 화면 가운데를 오가는 시간(ms) */
const MOVE_MS = 650;
const MOVE_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

/**
 * FLIP의 Invert: target(현재 자리)에 있는 요소를 origin(누른 표지 자리)에 겹쳐 보이게 하는 transform.
 * 요소의 transform-origin이 왼쪽 위(top left)라는 전제로, 이동 거리와 크기 비율만 계산한다.
 */
function flyTransform(origin: HTMLElement | null, box: HTMLElement): string {
  if (origin === null) {
    return 'none';
  }
  const from = origin.getBoundingClientRect();
  const to = box.getBoundingClientRect();
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  return `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`;
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
 * 누른 표지 자리 → 현재 자리(화면 가운데)로 날아오기.
 * Web Animations API(element.animate)는 끝나는 시점을 `finished` Promise로 알려 줘서,
 * "이동이 끝나면 표지를 연다" 같은 순서를 정확히 맞출 수 있다.
 */
export function flyIn(box: HTMLElement, origin: HTMLElement | null): Animation {
  return box.animate([{ transform: flyTransform(origin, box) }, { transform: 'none' }], {
    duration: prefersReducedMotion() ? 0 : MOVE_MS,
    easing: MOVE_EASING,
  });
}

/** 현재 자리 → 누른 표지 자리로 돌아가기. 끝난 뒤에도 그 자리에 머물도록 fill: forwards */
export function flyOut(box: HTMLElement, origin: HTMLElement | null): Promise<Animation> {
  return box.animate([{ transform: 'none' }, { transform: flyTransform(origin, box) }], {
    duration: prefersReducedMotion() ? 0 : MOVE_MS,
    easing: MOVE_EASING,
    fill: 'forwards',
  }).finished;
}
