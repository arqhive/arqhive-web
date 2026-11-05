'use client';

import { useEffect } from 'react';

/**
 * 모달이 떠 있는 동안 뒤 페이지 스크롤을 막는다.
 * 데스크톱은 globals.css의 `html:has(dialog[open]) { overflow-y: hidden }`으로 충분하지만,
 * iOS Safari는 손가락 스크롤에 이 규칙을 따르지 않는다. 그래서 body를 지금 스크롤 자리 그대로 고정(position: fixed)해 두고,
 * 풀 때 원래 스크롤 위치로 되돌린다. 화면에 보이는 위치는 그대로라 케이스가 돌아갈 "누른 표지 자리"도 어긋나지 않는다.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) {
      return;
    }
    const { body } = document;
    const y = globalThis.scrollY;
    const saved = body.getAttribute('style');
    Object.assign(body.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0' });
    return () => {
      if (saved === null) {
        body.removeAttribute('style');
      } else {
        body.setAttribute('style', saved);
      }
      globalThis.scrollTo({ top: y, behavior: 'instant' });
    };
  }, [locked]);
}
