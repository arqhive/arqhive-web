import Link from 'next/link';
import { SITE } from '@/shared/config';
import { ThemeToggle } from './theme-toggle.tsx';

/** 메뉴. 아직 만들지 않은 페이지는 링크 대신 "준비 중" 표시로 둔다(없는 주소로 가지 않게). */
const NAV = [
  { label: '진열장', href: '/' },
  { label: '가이드', href: null },
  { label: '제보', href: null },
  { label: '소개', href: null },
] as const;

function NavItems() {
  return NAV.map((item) =>
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
      <Link key={item.label} href={item.href} className="border-stamp border-b-2 text-ink">
        {item.label}
      </Link>
    ),
  );
}

/**
 * 사이트 헤더. 데스크톱은 메뉴를 한 줄로, 휴대폰은 접는 메뉴(<details>)로 보여 준다.
 * <details>는 JS 없이 열고 닫히는 브라우저 기본 요소라 서버 컴포넌트로 둘 수 있다.
 */
export function SiteHeader() {
  return (
    <header className="border-ink border-b-[3px] border-double">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-6">
        <Link href="/" className="font-bold font-title text-2xl">
          {SITE.name}
        </Link>
        <nav aria-label="주 메뉴" className="hidden flex-1 items-center gap-5 text-sm md:flex">
          <NavItems />
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none border border-line px-2 py-1 text-xs">
              메뉴
            </summary>
            <nav
              aria-label="주 메뉴"
              className="absolute right-0 z-10 mt-2 flex w-36 flex-col gap-3 border border-line bg-card p-4 text-sm"
            >
              <NavItems />
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
