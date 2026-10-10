'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { flushQueue } from '@/shared/analytics';
import { GOATCOUNTER } from './config.ts';
import { useAutoTracking } from './use-auto-tracking.ts';

/**
 * 방문 통계(GoatCounter, ADR 0019). 루트 레이아웃이 한 번 넣는다.
 * - 쿠키를 쓰지 않고 개인을 식별하지 않아 동의 배너가 필요 없다.
 * - 운영 주소(GOATCOUNTER.host)에서만 스크립트를 불러온다. 로컬 개발·미리보기 배포는 세지 않는다
 *   (그동안의 이벤트는 shared/analytics 큐에 쌓였다가 버려진다).
 * - 스크립트는 화면이 뜬 뒤에 받는다(afterInteractive). 그 전에 생긴 페이지뷰·이벤트는 onLoad 때 보낸다.
 * 이 컴포넌트는 화면에 아무것도 그리지 않는다.
 */
export function Analytics() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(location.hostname === GOATCOUNTER.host);
  }, []);
  useAutoTracking();
  if (!enabled) {
    return null;
  }
  return (
    <Script
      src={GOATCOUNTER.scriptSrc}
      data-goatcounter={GOATCOUNTER.endpoint}
      data-goatcounter-settings={GOATCOUNTER.settings}
      strategy="afterInteractive"
      onLoad={flushQueue}
    />
  );
}
