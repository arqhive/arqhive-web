/**
 * 사이트 기본 정보(FSD shared 층, config 칸).
 * shared 층에는 특정 업무(작품, 제보 등)를 모르는 범용 코드만 둔다. 어느 층에서나 가져다 쓸 수 있다.
 * `as const`로 값을 읽기 전용 리터럴 타입으로 고정한다.
 */
export const SITE = {
  name: 'arqhive',
  reading: '아카이브',
  description: '한글 패치 아카이브',
} as const;
