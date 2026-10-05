/**
 * 제보 하나(사이트 목록 카드용). GitHub 이슈에서 읽어 만든다.
 * repo는 "owner/name"이라, 화면(pages)이 콘텐츠의 패치 목록과 맞춰 게임 이름을 붙인다.
 */
export interface Report {
  readonly id: number;
  readonly repo: string;
  readonly url: string;
  /** 이슈가 열려 있으면 open(확인 중), 닫혔으면 closed(반영됨) */
  readonly state: 'open' | 'closed';
  readonly createdAt: string;
  readonly text: string;
  readonly images: readonly string[];
}
