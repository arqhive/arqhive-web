/**
 * 주 메뉴 목록(헤더 메뉴와 휴대폰 하단 메뉴가 함께 쓴다).
 * 아직 만들지 않은 페이지는 href를 null로 두고, 링크 대신 "준비 중" 표시로 보여 준다(없는 주소로 가지 않게).
 */
export const NAV = [
  { label: '한글 패치', href: '/' },
  { label: '가이드', href: null },
  { label: '제보', href: null },
  { label: '소개', href: null },
] as const;
