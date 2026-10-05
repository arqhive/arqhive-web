'use client';

import { type ReactNode, useEffect, useState } from 'react';

/**
 * 업데이트 내역 모달에 넣을 내용. slug가 정해지면(모달을 열면) load로 서버에서 받아 온다.
 * 한 번 받은 패치는 기억해 두어, 같은 패치를 다시 열면 바로 보여 준다(페이지를 떠나면 사라진다).
 * 받는 동안·실패하면 null이다(모달은 "불러오는 중"을 보여 준다).
 */
export function useChangelogContent(
  slug: string | null,
  load: ((slug: string) => Promise<ReactNode>) | undefined,
): ReactNode {
  const [loaded, setLoaded] = useState<ReadonlyMap<string, ReactNode>>(new Map());

  useEffect(() => {
    if (slug === null || load === undefined || loaded.has(slug)) {
      return;
    }
    let cancelled = false;
    load(slug)
      .then((content) => {
        if (!cancelled) {
          setLoaded((previous) => new Map(previous).set(slug, content));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug, load, loaded]);

  return slug === null ? null : (loaded.get(slug) ?? null);
}
