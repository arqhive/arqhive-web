'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

/** 받아 온 데이터를 "새것"으로 보는 시간. 이 안에는 같은 키로 다시 부르지 않는다 */
const STALE_MS = 300_000;

/**
 * TanStack Query 제공자. 브라우저에서 서버 데이터를 불러오는 페이지(진열장·제보)만 감싼다.
 * 사이트 전체(루트 레이아웃)에 두지 않는 이유: 쓰지 않는 페이지 묶음에까지 라이브러리가 실리지 않게.
 * - QueryClient는 컴포넌트 안에서 useState로 한 번만 만든다(서버 렌더 중에 요청끼리 캐시가 섞이지 않게).
 * - 기본값: 5분 동안은 새것으로 보고, 실패하면 한 번만 다시 시도, 창으로 돌아와도 자동으로 다시 받지 않는다.
 */
export function QueryProvider({ children }: { readonly children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: STALE_MS, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
