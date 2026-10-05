// "/report" 주소의 페이지: 제보 양식과 들어온 제보 목록. 화면의 실제 내용은 src/pages/report에 있다.
import type { Metadata } from 'next';

export { ReportPage as default } from '@/pages/report';

/** 브라우저 탭 제목: "제보 · arqhive" */
export const metadata: Metadata = { title: '제보' };

// 제보 목록을 5분마다 새로 그린다(GitHub 이슈 읽기 캐시와 같은 주기). 라우트 파일에서만 읽히는 설정이다.
export const revalidate = 300;
