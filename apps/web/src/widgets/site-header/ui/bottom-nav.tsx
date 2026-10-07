'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isCurrent, NAV } from '../model/nav.ts';

/**
 * 메뉴 아이콘(Tabler Icons 3.49 outline 모양을 그대로 옮김, MIT License). 아이콘 라이브러리를 설치하지 않고 경로만 둔다.
 * 홈=집, 한글 패치=퍼즐 조각(게임에 끼워 넣는 패치), 가이드=책, 제보=말풍선. 메뉴 주소(href)로 고른다.
 */
const ICON_PATHS: Readonly<Record<(typeof NAV)[number]['href'], readonly string[]>> = {
  '/': [
    'M5 12l-2 0l9 -9l9 9l-2 0',
    'M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7',
    'M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6',
  ],
  '/korean-translation': [
    'M4 7h3a1 1 0 0 0 1 -1v-1a2 2 0 0 1 4 0v1a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1a2 2 0 0 1 0 4h-1a1 1 0 0 0 -1 1v3a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-1a2 2 0 0 0 -4 0v1a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h1a2 2 0 0 0 0 -4h-1a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1',
  ],
  '/guide': [
    'M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0',
    'M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0',
    'M3 6l0 13',
    'M12 6l0 13',
    'M21 6l0 13',
  ],
  '/report': [
    'M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12',
    'M12 8v3',
    'M12 14v.01',
  ],
};

function NavIcon({ href }: { readonly href: (typeof NAV)[number]['href'] }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-[22px] fill-none stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON_PATHS[href].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

/**
 * 휴대폰용 하단 메뉴(md 미만). 화면 아래에 고정되어 엄지로 바로 누를 수 있다.
 * - 아이콘 + 글자(10/7): 글자만 있으면 안내 문구처럼 보여 누르는 곳인지 알기 어려웠다. 모바일 탭 메뉴의 표준 모양을 따른다.
 * - 지금 페이지는 위쪽 빨간 줄, 진한 글자, 도장 빨강 아이콘으로 표시한다(aria-current="page").
 * - 누르는 동안 칸이 살짝 어두워진다(손가락이 닿았는지 바로 보이게).
 * - 아이폰 홈 표시줄 자리(safe-area-inset-bottom)만큼 아래 여백을 더 둔다.
 *   본문이 가려지지 않도록 레이아웃(SiteLayout)이 같은 높이(h-14)만큼 아래 여백을 준다.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-line border-t bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {NAV.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
          className="group flex h-14 flex-col items-center justify-center gap-0.5 border-transparent border-t-2 text-[0.6875rem] text-ink-sub transition-colors active:bg-ink/5 aria-[current=page]:border-stamp aria-[current=page]:font-bold aria-[current=page]:text-ink"
        >
          <span className="group-aria-[current=page]:text-stamp">
            <NavIcon href={item.href} />
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
