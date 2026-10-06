'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * 업데이트 내역 모달에 넣을 내용(TanStack Query의 useQuery: 서버 데이터를 "읽는" 요청).
 * - 모달을 열면(slug) 그 패치 것을 받아 온다. 쿼리 키 ['changelog', slug]가 같으면 한 번 받은 것을 다시 쓴다
 *   (CHANGELOG는 페이지를 보는 동안 바뀌지 않으니 staleTime 무한).
 * - enabled: 모달을 열기 전·내역이 없는 패치는 요청하지 않는다.
 * - 받는 동안·실패하면 undefined라 모달이 스켈레톤을 보여 준다.
 */
export function useChangelog(
  slug: string | null,
  load: ((slug: string) => Promise<ReactNode>) | undefined,
): ReactNode {
  const { data } = useQuery({
    queryKey: ['changelog', slug],
    queryFn: () => (slug === null || load === undefined ? null : load(slug)),
    enabled: slug !== null && load !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
  });
  return data;
}
