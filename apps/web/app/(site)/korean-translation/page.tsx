// "/korean-translation" 주소의 페이지: 한글 패치 진열장(기종별 책장·목록·최근 갱신).
// 화면의 실제 내용은 src/pages/korean-translation에 있다.
import type { Metadata } from 'next';
import { pageMetadata } from '@/shared/lib';

export { TranslationPage as default } from '@/pages/korean-translation';

/** 탭 제목: 루트 레이아웃의 template("%s · arqhive")에 넣어 "한글 패치 · arqhive"가 된다. 검색 설명, 대표 주소 */
export const metadata: Metadata = pageMetadata({
  title: '한글 패치',
  description:
    // biome-ignore lint/security/noSecrets: 한글 문장을 비밀값으로 잘못 본다
    '게임큐브·Wii·Wii U·3DS·NDS·슈퍼 패미컴·게임보이 게임의 한글 패치 목록입니다. 패치마다 최신 버전, 번역 범위, 적용 방법, 구동 확인 환경을 볼 수 있습니다.',
  path: '/korean-translation',
});

// 릴리즈(버전·다운로드 수)와 최근 갱신(2주 이내, "오늘"에 따라 바뀜)을 따라가도록 미리 만들어 둔 페이지를 10분마다 새로 그린다(ISR).
// 데이터 캐시(GITHUB_CACHE_SECONDS)와 같은 값으로 둔다.
// 이 값은 Next.js가 라우트 파일에서만 읽는다(src/pages 쪽에 두면 적용되지 않는다).
export const revalidate = 600;
