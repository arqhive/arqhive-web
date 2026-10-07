// "/guide" 주소의 페이지: 패치 버전 가이드·자주 묻는 질문·문의. 화면의 실제 내용은 src/pages/guide에 있다.
import type { Metadata } from 'next';
import { pageMetadata } from '@/shared/lib';

export { GuidePage as default } from '@/pages/guide';

/** 탭 제목 "가이드 · arqhive", 검색 설명, 대표 주소 */
export const metadata: Metadata = pageMetadata({
  title: '가이드',
  description:
    '한글 패치 버전 표기(v0.x 시험판·v1.0f 완성판)와 적용 방법, 구동 환경, 자주 묻는 질문을 정리했습니다.',
  path: '/guide',
});
