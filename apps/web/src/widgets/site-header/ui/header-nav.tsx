'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isCurrent, NAV } from '../model/nav.ts';

/**
 * 데스크톱 헤더 메뉴(md 이상). 지금 주소에 해당하는 메뉴만 빨간 밑줄과 진한 글자로 칠한다(aria-current="page").
 * 지금 주소를 알려면 브라우저 쪽 훅(usePathname)이 필요해서, 헤더 전체가 아니라 이 부분만 클라이언트 컴포넌트로 둔다.
 * 아직 없는 페이지는 링크 대신 흐린 "준비 중" 표시.
 */
export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="주 메뉴" className="hidden flex-1 items-center gap-5 text-sm md:flex">
      {NAV.map((item) =>
        item.href === null ? (
          <span
            key={item.label}
            title="준비 중"
            aria-disabled="true"
            className="text-ink-sub opacity-60"
          >
            {item.label}
          </span>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
            className="border-transparent border-b-2 text-ink-sub hover:text-ink aria-[current=page]:border-stamp aria-[current=page]:text-ink"
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}
