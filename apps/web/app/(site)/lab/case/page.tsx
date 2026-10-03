import type { Metadata } from 'next';

// 시제품 확인용 임시 페이지라 검색 엔진에 노출하지 않는다.
export const metadata: Metadata = {
  title: '케이스 열기 시제품',
  robots: { index: false, follow: false },
};

export { CaseLabPage as default } from '@/pages/case-lab';
