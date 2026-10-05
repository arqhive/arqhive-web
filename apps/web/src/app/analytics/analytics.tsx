'use client';

import Script from 'next/script';
import { flushQueue } from '@/shared/analytics';
import { UMAMI } from './config.ts';
import { useAutoTracking } from './use-auto-tracking.ts';

/**
 * 방문 통계(Umami Cloud). 루트 레이아웃이 한 번 넣는다.
 * - 쿠키를 쓰지 않고 개인을 식별하지 않아 동의 배너가 필요 없다.
 * - data-domains: 이 주소에서만 수집한다(로컬 개발·미리보기 배포는 세지 않는다).
 * - 스크립트는 화면이 뜬 뒤에 받는다(afterInteractive). 그 전에 생긴 이벤트는 shared/analytics가 모아 두었다가 onLoad 때 보낸다.
 * 이 컴포넌트는 화면에 아무것도 그리지 않는다.
 */
export function Analytics() {
  useAutoTracking();
  return (
    <Script
      src={UMAMI.scriptSrc}
      data-website-id={UMAMI.websiteId}
      data-domains={UMAMI.domains}
      strategy="afterInteractive"
      onLoad={flushQueue}
    />
  );
}
