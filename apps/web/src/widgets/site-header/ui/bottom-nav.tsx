'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '../model/nav.ts';

/**
 * 휴대폰용 하단 메뉴(md 미만). 화면 아래에 고정되어 엄지로 바로 누를 수 있다.
 * - 지금 페이지는 위쪽에 빨간 줄과 진한 글자로 표시한다(aria-current="page").
 * - 아직 없는 페이지는 헤더와 같이 흐린 "준비 중" 표시.
 * - 아이폰 홈 표시줄 자리(safe-area-inset-bottom)만큼 아래 여백을 더 둔다.
 *   본문이 가려지지 않도록 레이아웃(SiteLayout)이 같은 높이만큼 아래 여백을 준다.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-line border-t bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {NAV.map((item) =>
        item.href === null ? (
          <span
            key={item.label}
            title="준비 중"
            aria-disabled="true"
            className="flex h-14 items-center justify-center text-ink-sub text-xs opacity-60"
          >
            {item.label}
          </span>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            aria-current={pathname === item.href ? 'page' : undefined}
            className="flex h-14 items-center justify-center border-transparent border-t-2 text-ink-sub text-xs aria-[current=page]:border-stamp aria-[current=page]:font-bold aria-[current=page]:text-ink"
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}
