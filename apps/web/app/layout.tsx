import type { Metadata } from 'next';
import type { ReactNode } from 'react';
// 전역 CSS는 루트 레이아웃에서 한 번만 불러온다. 파일은 FSD의 app 층(src/app)에 있다.
import '@/app/styles/globals.css';
import { fontVariables } from '@/app/styles/fonts';
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
 * 이 파일은 서버 컴포넌트다('use client'가 없음). 브라우저로 JS가 내려가지 않는다.
 *
 * - fontVariables: 글꼴 CSS 변수(--font-nanum-myeongjo 등)를 문서 전체에 정의한다.
 * - suppressHydrationWarning: 화면 모드 전환이 <html>에 data-theme을 붙이면서 생기는 경고를 막는다(1단계 헤더에서 추가).
 */
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ko" className={fontVariables} suppressHydrationWarning={true}>
      <body className="min-h-dvh bg-paper text-ink">{children}</body>
    </html>
  );
}
