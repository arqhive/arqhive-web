'use client';

import { type ReactNode, useEffect, useRef } from 'react';

/** 마우스가 글자에서 화면 크기만큼 떨어졌을 때 그라데이션이 움직이는 정도(%) */
const TRAVEL = 160;
/** 마우스 좌우 위치에 따라 무지개 띠가 기우는 각도 범위(deg) */
const TILT = 90;
const BASE_ANGLE = 115;
const CENTER = 50;

/**
 * 마우스 움직임에 따라 무지개 반사가 따라 움직이는 홀로그램 글자(FSD shared 층, ui 칸).
 *
 * - 마우스 위치를 글자 중심 기준 비율로 바꿔 CSS 변수(--holo-x, --holo-y, --holo-angle)에 넣는다.
 *   React 상태가 아니라 요소의 style을 직접 바꿔서, 마우스를 움직일 때마다 다시 렌더링하지 않는다.
 * - requestAnimationFrame으로 화면 갱신 한 번에 한 번만 계산한다(마우스 이벤트는 그보다 훨씬 자주 온다).
 * - 마우스가 없으면(휴대폰) CSS 애니메이션이 반사를 저절로 흘려 보낸다. 동작 줄이기 설정이면 멈춘다.
 * - tone: rainbow(무지개) · cool(차가운 푸른빛)
 */
export function HoloText({
  children,
  className = '',
  tone = 'rainbow',
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly tone?: 'rainbow' | 'cool';
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el === null || globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = el.getBoundingClientRect();
        const dx = (event.clientX - (box.left + box.width / 2)) / globalThis.innerWidth;
        const dy = (event.clientY - (box.top + box.height / 2)) / globalThis.innerHeight;
        el.style.setProperty('--holo-x', `${CENTER + dx * TRAVEL}%`);
        el.style.setProperty('--holo-y', `${CENTER + dy * TRAVEL}%`);
        el.style.setProperty('--holo-angle', `${BASE_ANGLE + dx * TILT}deg`);
        el.classList.add('holo-tracking');
      });
    };
    globalThis.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      globalThis.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <span ref={ref} className={`holo-text ${tone === 'cool' ? 'holo-cool' : ''} ${className}`}>
      {children}
    </span>
  );
}
