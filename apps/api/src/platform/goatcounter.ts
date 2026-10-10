/**
 * GoatCounter 통계 읽기(ADR 0019). 일일 정산이 하루치 방문·이벤트·유입 경로를 가져올 때 쓴다.
 *
 * - 공식 API(무료): Authorization: Bearer <API 키>. 키는 "Read statistics" 권한만, arqhive 사이트만 열어 둔다.
 * - count 값은 페이지뷰가 아니라 방문(같은 사람이 8시간 안에 다시 오면 한 번)이다. 이벤트도 같다.
 * - 시간 범위는 정시로 맞춘 RFC 3339(한국 하루 = UTC 15시부터 24시간이라 그대로 정시다).
 * - 경로·이벤트 목록은 한 번에 100개까지라, more가 true면 받은 path_id를 빼고(exclude_paths) 이어 받는다.
 * - 요청은 초당 4회까지. 하루 한 번 몇 번 부르는 정산에는 넉넉하다.
 */

const GOATCOUNTER_API = 'https://arqhive.goatcounter.com/api/v0';
/** 한 번에 받는 줄 수(API 최대) */
const PAGE_LIMIT = 100;
/** 이어 받기 최대 횟수(이벤트 경로가 아주 많아져도 정산이 끝없이 돌지 않게) */
const MAX_PAGES = 10;
/** 유입 경로 순위 길이 */
const REF_LIMIT = 10;
/** 밀리초 → "2026-10-09T15:00:00Z"(소수 초 없이) */
const ISO_SECONDS = 19;

/** 하루치 범위(밀리초) */
interface Range {
  readonly startAt: number;
  readonly endAt: number;
}

/** 이름별 횟수 한 줄(경로·이벤트 경로·유입 경로) */
interface Count {
  readonly name: string;
  readonly count: number;
}

/** 하루 요약 */
interface GoatCounterDay {
  /** 페이지 방문 합(이벤트 제외) */
  readonly visits: number;
  /** 페이지 경로별 방문, 많은 순 */
  readonly pages: readonly Count[];
  /** 이벤트 경로별 횟수(case-open/star-fox-2 …), 많은 순 */
  readonly events: readonly Count[];
  readonly referrers: readonly Count[];
}

interface HitList {
  // biome-ignore lint/style/useNamingConvention: GoatCounter API 응답 필드 이름 그대로
  readonly path_id: number;
  readonly path: string;
  readonly event: boolean;
  readonly count: number;
}

function isoHour(ms: number): string {
  return `${new Date(ms).toISOString().slice(0, ISO_SECONDS)}Z`;
}

async function get(apiKey: string, path: string, params: URLSearchParams): Promise<unknown> {
  const response = await fetch(`${GOATCOUNTER_API}${path}?${params.toString()}`, {
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
  });
  if (!response.ok) {
    // 응답 본문은 남기지 않는다(키를 보낸 요청이라 혹시 모를 노출을 피한다). 상태 코드만
    throw new Error(`GoatCounter ${path} 실패: ${response.status}`);
  }
  return response.json();
}

/** 경로·이벤트 목록 전체(100개씩 이어 받기) */
async function allHits(apiKey: string, range: Range): Promise<HitList[]> {
  const hits: HitList[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({
      start: isoHour(range.startAt),
      end: isoHour(range.endAt),
      limit: String(PAGE_LIMIT),
    });
    if (hits.length > 0) {
      params.set('exclude_paths', hits.map((hit) => hit.path_id).join(','));
    }
    // biome-ignore lint/performance/noAwaitInLoops: 앞 응답의 path_id로 다음 요청을 만들어서 차례로 받아야 한다
    const body = (await get(apiKey, '/stats/hits', params)) as {
      readonly hits?: readonly HitList[];
      readonly more?: boolean;
    };
    hits.push(...(body.hits ?? []));
    if (body.more !== true || (body.hits ?? []).length === 0) {
      break;
    }
  }
  return hits;
}

const byCount = (a: Count, b: Count) => b.count - a.count;

/** 하루치 통계를 읽는다(경로·이벤트 목록과 유입 경로를 동시에) */
async function fetchGoatCounterDay(apiKey: string, range: Range): Promise<GoatCounterDay> {
  const refParams = new URLSearchParams({
    start: isoHour(range.startAt),
    end: isoHour(range.endAt),
    limit: String(REF_LIMIT),
  });
  const [hits, refs] = await Promise.all([
    allHits(apiKey, range),
    get(apiKey, '/stats/toprefs', refParams) as Promise<{
      readonly stats?: readonly { readonly name?: string; readonly count?: number }[];
    }>,
  ]);
  const pages = hits
    .filter((hit) => !hit.event)
    .map((hit) => ({ name: hit.path, count: hit.count }))
    .toSorted(byCount);
  const events = hits
    .filter((hit) => hit.event)
    .map((hit) => ({ name: hit.path, count: hit.count }))
    .toSorted(byCount);
  return {
    visits: pages.reduce((sum, page) => sum + page.count, 0),
    pages,
    events,
    referrers: (refs.stats ?? [])
      .map((ref) => ({ name: ref.name || '(직접 방문)', count: Number(ref.count) || 0 }))
      .toSorted(byCount),
  };
}

export type { Count, GoatCounterDay, Range };
export { fetchGoatCounterDay };
