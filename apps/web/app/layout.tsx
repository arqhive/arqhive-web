import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/app/styles/globals.css';
import { SITE } from '@/shared/config';

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} · ${SITE.description}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
};

/** Next.js 라우팅 전용 루트 레이아웃. 화면 구성은 FSD 층(src/)에서 한다. */
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
