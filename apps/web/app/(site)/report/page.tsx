// "/report" 주소의 페이지: 제보 양식과 들어온 제보 목록. 화면의 실제 내용은 src/pages/report에 있다.
import type { Metadata } from 'next';
import { pageMetadata } from '@/shared/lib';

export { ReportPage as default } from '@/pages/report';

/** 탭 제목 "제보 · arqhive", 검색 설명, 대표 주소 */
export const metadata: Metadata = pageMetadata({
  title: '제보',
  description:
    '한글 패치의 오역, 깨진 글자, 실행 문제를 알려 주세요. 제보는 해당 패치의 GitHub 이슈로 등록되고 목록에 공개됩니다.',
  path: '/report',
});

// 제보 목록을 5분마다 새로 그린다(GitHub 이슈 읽기 캐시와 같은 주기). 라우트 파일에서만 읽히는 설정이다.
export const revalidate = 300;
