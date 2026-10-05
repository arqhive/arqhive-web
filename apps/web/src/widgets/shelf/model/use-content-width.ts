'use client';

import { type RefObject, useEffect, useState } from 'react';

/**
 * 요소의 안쪽 폭(padding 제외, rem 단위)을 재고, 크기가 바뀔 때마다 다시 잰다(ResizeObserver).
 * 서버에서는 폭을 알 수 없으므로 처음 값은 null이다(그동안 쓰는 쪽은 대체 배치를 보여 준다).
 */
export function useContentWidthRem(ref: RefObject<HTMLElement | null>): number | null {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el === null) {
      return;
    }
    const measure = () => {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const style = getComputedStyle(el);
      const inner =
        el.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight);
      setWidth(inner / rem);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
