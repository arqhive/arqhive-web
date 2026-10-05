'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { useEffect } from 'react';
import { track } from '@/shared/analytics';
import { describeClick } from './describe-click.ts';
import { onPathChange } from './location-change.ts';

const MS_PER_SECOND = 1000;
/** 체류 시간 상한(초). 탭을 열어 두고 자리를 비운 경우가 평균을 망치지 않게 1시간에서 자른다 */
const MAX_SECONDS = 3600;
/** 스크롤 깊이를 보낼 지점(%): 4분의 1씩 */
const PERCENT = 100;
const SCROLL_STEP = 25;
const SCROLL_MARKS = Array.from(
  { length: PERCENT / SCROLL_STEP },
  (_unused, index) => (index + 1) * SCROLL_STEP,
);
/** CLS(화면 출렁임 점수)는 0.1 같은 작은 소수라 소수 셋째 자리까지 */
const CLS_DIGITS = 3;
/** 실제 사용자 성능 중 보낼 지표: 가장 큰 내용이 뜬 시간, 화면 출렁임, 누른 뒤 반응까지 */
const VITALS = new Set(['LCP', 'CLS', 'INP']);

/** 모든 클릭: 링크·단추 등을 누르면 "click"(또는 data-track 이름) 이벤트 */
function useClickTracking() {
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

/**
 * 페이지별 체류 시간: 화면에 보이는 동안만 센다. 다른 탭으로 가거나 닫을 때(visibilitychange hidden),
 * 또는 주소가 바뀔 때(다른 페이지·케이스 열고 닫기) 그때까지의 초를 "page-time"으로 보낸다.
 */
function usePageTime() {
  useEffect(() => {
    let path = location.pathname;
    let visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
    let total = 0;

    const pause = () => {
      if (visibleSince !== null) {
        total += Date.now() - visibleSince;
        visibleSince = null;
      }
    };
    const flush = () => {
      pause();
      const seconds = Math.min(MAX_SECONDS, Math.round(total / MS_PER_SECOND));
      if (seconds > 0) {
        track('page-time', { path, seconds });
      }
      total = 0;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      } else {
        visibleSince = Date.now();
      }
    };
    const stopPath = onPathChange((_previous, next) => {
      flush();
      path = next;
      visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
    });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopPath();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}

/** 스크롤 깊이: 페이지마다 25·50·75·100%에 처음 닿을 때 한 번씩 "scroll-depth". 스크롤할 게 없는 페이지는 보내지 않는다 */
function useScrollDepth() {
  useEffect(() => {
    let sent = new Set<number>();
    const onScroll = () => {
      const { scrollHeight, clientHeight } = document.documentElement;
      const scrollable = scrollHeight - clientHeight;
      if (scrollable <= 0) {
        return;
      }
      const percent = ((globalThis.scrollY + 1) / scrollable) * PERCENT;
      for (const mark of SCROLL_MARKS) {
        if (percent >= mark && !sent.has(mark)) {
          sent.add(mark);
          track('scroll-depth', { path: location.pathname, percent: mark });
        }
      }
    };
    const stopPath = onPathChange(() => {
      sent = new Set();
    });
    globalThis.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      stopPath();
      globalThis.removeEventListener('scroll', onScroll);
    };
  }, []);
}

/**
 * 사이트 전체 자동 측정: 클릭, 페이지별 체류 시간, 스크롤 깊이, 실제 방문자 기기에서 잰 성능(웹 바이탈).
 * 페이지뷰는 Umami 스크립트가 스스로 센다(케이스를 열어 주소가 바뀌어도 한 번으로 센다).
 */
export function useAutoTracking() {
  useClickTracking();
  usePageTime();
  useScrollDepth();
  // Next.js가 측정값이 정해질 때마다 부른다. CLS는 소수, 나머지는 ms(반올림)
  useReportWebVitals((metric) => {
    if (VITALS.has(metric.name)) {
      track('web-vitals', {
        metric: metric.name,
        value:
          metric.name === 'CLS'
            ? Number(metric.value.toFixed(CLS_DIGITS))
            : Math.round(metric.value),
        rating: metric.rating,
        path: location.pathname,
      });
    }
  });
}
