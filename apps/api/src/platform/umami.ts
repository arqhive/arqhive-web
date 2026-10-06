/**
 * Umami Cloud 통계 읽기(ADR 0016). 일일 정산이 하루치 방문·이벤트를 가져올 때 쓴다.
 *
 * Umami Cloud의 공식 API(API 키)는 유료 플랜이라, 무료로 되는 **공유 링크(Share URL)**가 쓰는 방식으로 읽는다.
 * 1. GET {gateway}/share/{공유 ID} → 웹사이트 ID와 읽기 전용 토큰
 * 2. 그 토큰을 x-umami-share-token, 그리고 x-umami-share-context: 1 헤더로 붙여 통계 주소를 부른다.
 * 공식 문서에 없는 방식이라 Umami가 바꾸면 깨질 수 있다. 그때는 공유 페이지의 네트워크 요청을 보고 맞춘다(2026-10-07 확인).
 * - gateway-us: 계정 지역(공유 페이지 주소의 /analytics/us/)에 따른 주소
 * - 공유 링크에서 켠 화면(개요·이벤트)의 데이터만 읽을 수 있다.
 * - 시간 범위는 밀리초(startAt·endAt). 응답의 숫자가 { value } 객체로 오는 판도 있어 둘 다 받는다.
 */

const UMAMI_GATEWAY = 'https://gateway-us.umami.is/api';
/** 공유 ID 뒤에 붙을 수 있는 경로·쿼리·조각의 시작 글자 */
const SHARE_ID_END = /[/?#]/;

/** 하루치 범위(밀리초) */
interface Range {
  readonly startAt: number;
  readonly endAt: number;
}

/** 이름별 횟수 한 줄(이벤트 이름·유입 경로·속성 값) */
interface Count {
  readonly name: string;
  readonly count: number;
}

/** 하루 요약 */
interface UmamiDay {
  readonly visitors: number;
  readonly pageviews: number;
  readonly visits: number;
  readonly bounces: number;
  /** 모든 방문의 머문 시간 합(초) */
  readonly totalTime: number;
  readonly events: readonly Count[];
  readonly referrers: readonly Count[];
  /** 패치별 케이스 열기·다운로드 클릭(이벤트의 patch 값) */
  readonly caseOpens: readonly Count[];
  readonly downloads: readonly Count[];
}

/** 공유 링크로 받은 읽기 권한 */
interface ShareAccess {
  readonly websiteId: string;
  readonly token: string;
}

/** 공유 주소(https://cloud.umami.is/share/{ID}…)에서 ID를 꺼내 웹사이트 ID·토큰을 받는다 */
async function openShare(shareUrl: string): Promise<ShareAccess> {
  const shareId = shareUrl.split('/share/')[1]?.split(SHARE_ID_END)[0] ?? '';
  const response = await fetch(`${UMAMI_GATEWAY}/share/${shareId}`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Umami 공유 열기 실패: ${response.status}`);
  }
  return (await response.json()) as ShareAccess;
}

async function get(
  access: ShareAccess,
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  const url = `${UMAMI_GATEWAY}/websites/${access.websiteId}${path}?${new URLSearchParams(params).toString()}`;
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'x-umami-share-token': access.token,
      'x-umami-share-context': '1',
    },
  });
  if (!response.ok) {
    throw new Error(`Umami ${path} 실패: ${response.status}`);
  }
  return response.json();
}

/** 숫자 또는 { value: 숫자 } → 숫자 */
function numberOf(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return Number((value as { readonly value: unknown }).value) || 0;
  }
  return 0;
}

/** 지표 목록([{ x, y }]) → 이름별 횟수, 많은 순 */
function toCounts(rows: unknown): Count[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row: { readonly x?: unknown; readonly y?: unknown }) => ({
      name: String(row.x ?? '(없음)'),
      count: Number(row.y) || 0,
    }))
    .toSorted((a, b) => b.count - a.count);
}

/** 이벤트 속성 값별 횟수([{ value, total }]) → 이름별 횟수 */
function toValueCounts(rows: unknown): Count[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row: { readonly value?: unknown; readonly total?: unknown }) => ({
      name: String(row.value ?? ''),
      count: Number(row.total) || 0,
    }))
    .toSorted((a, b) => b.count - a.count);
}

/** 하루치 통계를 한 번에 읽는다(공유 열기 → 여러 주소를 동시에) */
async function fetchUmamiDay(shareUrl: string, range: Range): Promise<UmamiDay> {
  const access = await openShare(shareUrl);
  const time = { startAt: String(range.startAt), endAt: String(range.endAt) };
  const eventValues = (event: string) =>
    get(access, '/event-data/values', { ...time, event, propertyName: 'patch' });
  const [stats, events, referrers, caseOpens, downloads] = await Promise.all([
    get(access, '/stats', time),
    get(access, '/metrics', { ...time, type: 'event', limit: '50' }),
    get(access, '/metrics', { ...time, type: 'referrer', limit: '10' }),
    eventValues('case-open'),
    eventValues('download'),
  ]);
  const summary = (stats ?? {}) as {
    readonly visitors?: unknown;
    readonly pageviews?: unknown;
    readonly visits?: unknown;
    readonly bounces?: unknown;
    readonly totaltime?: unknown;
  };
  return {
    visitors: numberOf(summary.visitors),
    pageviews: numberOf(summary.pageviews),
    visits: numberOf(summary.visits),
    bounces: numberOf(summary.bounces),
    totalTime: numberOf(summary.totaltime),
    events: toCounts(events),
    referrers: toCounts(referrers),
    caseOpens: toValueCounts(caseOpens),
    downloads: toValueCounts(downloads),
  };
}

export type { Count, Range, UmamiDay };
export { fetchUmamiDay };
