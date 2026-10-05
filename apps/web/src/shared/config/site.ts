/**
 * 사이트 기본 정보(FSD shared 층, config 칸).
 * shared 층에는 특정 업무(작품, 제보 등)를 모르는 범용 코드만 둔다. 어느 층에서나 가져다 쓸 수 있다.
 * `as const`로 값을 읽기 전용 리터럴 타입으로 고정한다.
 */
export const SITE = {
  name: 'arqhive',
  reading: '아카이브',
  description: '한글 패치 아카이브',
  /** 사이트 주소(끝의 / 없이). 검색엔진용 절대 주소(canonical·sitemap·OG)의 기준. 도메인을 사면 여기만 바꾼다 */
  url: 'https://arqhive.vercel.app',
  /** 검색 결과·미리보기 카드에 쓰는 사이트 소개(홈의 description) */
  summary:
    '게임 한글 패치를 모아 둔 아카이브입니다. 패치마다 지원 버전·적용 방법·구동 확인 환경을 정리하고, 오역·실행 문제 제보를 받습니다.',
} as const;
