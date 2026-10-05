// "/korean-translation" 주소의 페이지: 한글 패치 진열장(기종별 책장·목록·최근 갱신).
// 화면의 실제 내용은 src/pages/korean-translation에 있다.
import type { Metadata } from 'next';

export { TranslationPage as default } from '@/pages/korean-translation';

/** 브라우저 탭 제목: 루트 레이아웃의 template("%s · arqhive")에 넣어 "한글 패치 · arqhive"가 된다 */
export const metadata: Metadata = { title: '한글 패치' };

// 최근 갱신(2주 이내)은 "오늘"에 따라 바뀌므로, 미리 만들어 둔 페이지를 1시간마다 새로 그린다(ISR).
// 이 값은 Next.js가 라우트 파일에서만 읽는다(src/pages 쪽에 두면 적용되지 않는다).
export const revalidate = 3600;
