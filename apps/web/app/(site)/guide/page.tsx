// "/guide" 주소의 페이지: 패치 버전 가이드·자주 묻는 질문·문의. 화면의 실제 내용은 src/pages/guide에 있다.
import type { Metadata } from 'next';

export { GuidePage as default } from '@/pages/guide';

/** 브라우저 탭 제목: "가이드 · arqhive" */
export const metadata: Metadata = { title: '가이드' };
