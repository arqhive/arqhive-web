import Link from 'next/link';
import { SITE } from '@/shared/config';
import { NAV } from '../model/nav.ts';
import { ThemeToggle } from './theme-toggle.tsx';

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
 * 사이트 헤더. 데스크톱(md 이상)은 메뉴를 한 줄로 보여 준다.
 * 휴대폰은 헤더에 메뉴를 두지 않고 화면 아래 고정 메뉴(BottomNav)를 쓴다.
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
        </div>
      </div>
    </header>
  );
}
