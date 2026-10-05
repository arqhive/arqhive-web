import Link from 'next/link';
import { SITE } from '@/shared/config';
import { HeaderNav } from './header-nav.tsx';
import { ThemeToggle } from './theme-toggle.tsx';

/**
 * 사이트 헤더. 데스크톱(md 이상)은 메뉴를 한 줄로 보여 준다.
 * 휴대폰은 헤더에 메뉴를 두지 않고 화면 아래 고정 메뉴(BottomNav)를 쓴다.
 * 데스크톱은 스크롤해도 화면 위에 붙어 있다(sticky). 아래 내용이 비치지 않게 바탕색을 칠하고,
 * 진열장 케이스(hover로 떠오름)보다 위에 오게 z-index를 준다. 케이스 열기 화면(dialog)은 최상위 층이라 그 위에 뜬다.
 */
export function SiteHeader() {
  return (
    <header className="border-ink border-b-[3px] border-double bg-paper md:sticky md:top-0 md:z-20">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-6">
        <Link href="/" className="font-bold font-title text-2xl">
          {SITE.name}
        </Link>
        <HeaderNav />
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
