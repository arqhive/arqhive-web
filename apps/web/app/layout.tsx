import type { Metadata } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
// 전역 CSS는 루트 레이아웃에서 한 번만 불러온다. 파일은 FSD의 app 층(src/app)에 있다.
import '@/app/styles/globals.css';
// 제목·본문 글꼴 Pretendard(SIL OFL, npm 패키지)는 CSS import가 아니라 화면을 막지 않는 스크립트로 붙인다(fonts.ts).
// 글자 범위별로 나뉜 파일(동적 부분집합)이라 화면에 쓰인 범위만 내려간다. 글꼴 이름은 "Pretendard Variable".
import { Analytics } from '@/app/analytics';
import { fontVariables, PRETENDARD_CSS, PRETENDARD_LOAD_SCRIPT } from '@/app/styles/fonts';
import { THEME_INIT_SCRIPT } from '@/app/theme/init-script';
import { SITE } from '@/shared/config';

/**
 * 모든 페이지의 <head> 기본값. Next.js가 이 내보내기 이름(metadata)을 찾아 읽는다.
 * - title.template의 %s에는 하위 페이지가 정한 제목이 들어간다(예: "스타폭스 어설트 한글 패치 · arqhive").
 * - metadataBase: 페이지가 적은 상대 주소(canonical "/guide", OG 이미지 등)를 이 주소 기준의 절대 주소로 바꾼다.
 * - openGraph: 카카오톡·디스코드 등에 주소를 붙였을 때 뜨는 미리보기 카드. 하위 페이지가 제목·설명을 덮어쓴다.
 * 하위 페이지의 metadata는 위 단계의 값과 "얕게" 합쳐진다. openGraph를 적은 페이지는 openGraph 전체를 새로 적어야
 * 사이트 이름·언어가 빠지지 않는다(shared/config의 SITE를 함께 쓴다).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.description}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.summary,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: 'ko_KR',
    title: `${SITE.name} · ${SITE.description}`,
    description: SITE.summary,
  },
  // 검색엔진 사이트 소유 확인(<meta>). vercel.app 도메인은 DNS 레코드를 넣을 수 없어 HTML 태그 방식을 쓴다. 비밀값이 아니다
  verification: {
    // biome-ignore lint/security/noSecrets: 공개되는 소유 확인 코드다(페이지 HTML에 그대로 나간다)
    google: 'CNEBKBL8tSBnWjtIiLwfB9yuwxrHg_XvDdNkRubkUBI',
    // 네이버 서치어드바이저(Next.js에 정해진 칸이 없어 other로 넣는다)
    // biome-ignore lint/security/noSecrets: 공개되는 소유 확인 코드다
    other: { 'naver-site-verification': '17f3c5efdf4b07bc8f58e2ab2cb8b620fab6ce5b' },
  },
};

/**
 * Next.js 라우팅 전용 루트 레이아웃. 모든 페이지를 감싸며, 페이지를 이동해도 다시 그려지지 않는다.
 * 화면 구성은 FSD 층(src/)에서 하고, 여기서는 <html>·<body> 뼈대와 전역 설정만 둔다.
 *
 * - fontVariables: 번호 글꼴 CSS 변수(--font-ibm-plex-mono)를 문서 전체에 정의한다.
 * - 화면 모드 초기화: strategy="beforeInteractive"는 페이지가 그려지기 전에 실행된다(루트 레이아웃에서만 쓸 수 있음).
 * - suppressHydrationWarning: 초기화 스크립트가 <html>에 data-theme을 붙여 서버 HTML과 달라지는 것을 허용한다.
 */
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  // 글꼴 CSS를 HTML과 함께 바로 받기 시작하게 한다(<head>에 preload). 적용은 아래 스크립트가 한다
  preload(PRETENDARD_CSS, { as: 'style' });
  return (
    <html lang="ko" className={fontVariables} suppressHydrationWarning={true}>
      <body className="min-h-dvh bg-paper text-ink">
        {/* biome-ignore lint/correctness/useUniqueElementIds: Next.js가 인라인 스크립트에 고정 id를 요구한다(문서 전체에 하나뿐) */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {/* biome-ignore lint/correctness/useUniqueElementIds: Next.js가 인라인 스크립트에 고정 id를 요구한다(문서 전체에 하나뿐) */}
        <Script id="font-load" strategy="beforeInteractive">
          {PRETENDARD_LOAD_SCRIPT}
        </Script>
        {children}
        {/* 방문 통계(GoatCounter). 화면에는 아무것도 그리지 않는다 */}
        <Analytics />
      </body>
    </html>
  );
}
