/** 케이스가 원래 자리 ↔ 화면 가운데를 오가는 시간(ms) */
const MOVE_MS = 650;
const MOVE_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

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

/** 현재 자리 → 누른 요소 자리로 돌아가기. 끝난 뒤에도 그 자리에 머물도록 fill: forwards */
export function flyOut(box: HTMLElement, origin: HTMLElement | null): Promise<Animation> {
  return box.animate([{ transform: 'none' }, { transform: flyTransform(origin, box) }], {
    duration: prefersReducedMotion() ? 0 : MOVE_MS,
    easing: MOVE_EASING,
    fill: 'forwards',
  }).finished;
}
