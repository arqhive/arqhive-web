/** 제작자 답변 하나: 이슈에 제작자(저장소 owner 계정)가 단 댓글 */
export interface ReportReply {
  readonly id: number;
  readonly createdAt: string;
  readonly text: string;
}

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
  /** 제작자 답변(오래된 순). 없으면 빈 목록 */
  readonly replies: readonly ReportReply[];
}
