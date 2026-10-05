import Link from 'next/link';
import { SITE } from '@/shared/config';
import { HeaderNav } from './header-nav.tsx';
import { ThemeToggle } from './theme-toggle.tsx';

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
        <HeaderNav />
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
