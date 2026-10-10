'use client';

import { useEffect } from 'react';
import { track } from '@/shared/analytics';
import { describeClick } from './describe-click.ts';

/**
 * 사이트 전체 자동 측정: 이름 붙인 클릭(data-track)만 이벤트로 보낸다.
 * 페이지뷰·머문 시간은 Umami 스크립트가 스스로 센다(케이스를 열어 주소가 바뀌어도 한 번으로 센다).
 * 체류 시간·스크롤 깊이·웹 바이탈·일반 클릭은 Umami 무료 한도 때문에 2026-10-09에 뺐다(ADR 0015).
 */
export function useAutoTracking() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const click = describeClick(event.target);
      if (click !== null) {
        track(click.name, click.data);
      }
    };
    // capture: 케이스 열기처럼 클릭을 가로채는(preventDefault) 처리보다 먼저 듣는다
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);
}
