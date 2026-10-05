import type { ReactNode } from 'react';
import { SiteFooter } from '@/widgets/site-footer';
import { BottomNav, SiteHeader } from '@/widgets/site-header';

/**
 * 공개 페이지 공통 틀(FSD app 층). 헤더·본문·푸터와 휴대폰 하단 메뉴를 배치한다.
 * 휴대폰에서는 하단 메뉴(h-14 + 홈 표시줄 자리)가 페이지 끝을 가리지 않게 같은 높이만큼 아래 여백을 둔다.
 * Next.js의 app/(site)/layout.tsx가 이 컴포넌트를 불러와 (site) 그룹의 모든 페이지에 씌운다.
 * app 층은 맨 위 층이라 widgets를 가져다 쓸 수 있다.
 */
export function SiteLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">{children}</main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
