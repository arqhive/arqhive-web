import type { Metadata } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';
// 전역 CSS는 루트 레이아웃에서 한 번만 불러온다. 파일은 FSD의 app 층(src/app)에 있다.
// 제목·본문 글꼴 Pretendard(SIL OFL, npm 패키지). 글자 범위별로 나뉜 파일(동적 부분집합)이라 화면에 쓰인 범위만 내려간다.
// 글꼴 파일은 빌드할 때 사이트에 함께 올라간다(다른 서버에 요청하지 않음). 글꼴 이름은 "Pretendard Variable".
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import '@/app/styles/globals.css';
import { fontVariables } from '@/app/styles/fonts';
import { THEME_INIT_SCRIPT } from '@/app/theme/init-script';
import { SITE } from '@/shared/config';

/**
 * 모든 페이지의 <head> 기본값. Next.js가 이 내보내기 이름(metadata)을 찾아 읽는다.
 * title.template의 %s에는 하위 페이지가 정한 제목이 들어간다(예: "스타폭스 어설트 · arqhive").
 */
export const metadata: Metadata = {
  title: {
    default: `${SITE.name} · ${SITE.description}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
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
  return (
    <html lang="ko" className={fontVariables} suppressHydrationWarning={true}>
      <body className="min-h-dvh bg-paper text-ink">
        {/* biome-ignore lint/correctness/useUniqueElementIds: Next.js가 인라인 스크립트에 고정 id를 요구한다(문서 전체에 하나뿐) */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
