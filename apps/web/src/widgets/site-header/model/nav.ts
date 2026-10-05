/**
 * 주 메뉴 목록(헤더 메뉴와 휴대폰 하단 메뉴가 함께 쓴다). 홈이 사이트 소개 역할을 한다.
 */
export const NAV = [
  { label: '홈', href: '/' },
  { label: '한글 패치', href: '/korean-translation' },
  { label: '가이드', href: '/guide' },
  { label: '제보', href: '/report' },
] as const;

/**
 * 지금 주소가 이 메뉴에 속하는지. 홈("/")은 정확히 같을 때만, 나머지는 그 아래 주소도 포함한다
 * (예: 나중의 /korean-translation/star-fox-zero도 "한글 패치" 메뉴).
 */
export function isCurrent(pathname: string | null, href: string): boolean {
  // usePathname()은 주소를 알 수 없는 드문 경우 null을 돌려준다. 그때는 어느 메뉴도 칠하지 않는다.
  if (pathname === null) {
    return false;
  }
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
