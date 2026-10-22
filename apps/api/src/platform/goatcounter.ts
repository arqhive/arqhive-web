/**
 * GoatCounter 통계 읽기(ADR 0019). 일일 정산이 하루치 방문·이벤트·유입 경로를 가져올 때 쓴다.
 *
 * - 공식 API(무료): Authorization: Bearer <API 키>. 키는 "Read statistics" 권한만, arqhive 사이트만 열어 둔다.
 * - count 값은 페이지뷰가 아니라 방문(같은 사람이 8시간 안에 다시 오면 한 번)이다. 이벤트도 같다.
 * - 시간 범위는 RFC 3339(초 단위). 시작은 한국 자정, 끝은 정산 시각이다(정시가 아니어도 받는다, 10/23 확인).
 * - 경로·이벤트 목록은 한 번에 100개까지라, more가 true면 받은 path_id를 빼고(exclude_paths) 이어 받는다.
 * - 요청은 1초에 4번까지(5번째는 429). 이벤트 측정을 되살린 뒤 하루 경로가 200개를 넘어 이어 받기가 늘었고,
 *   유입 경로 요청까지 한꺼번에 보내다 Worker에서 429로 막혀 정산이 며칠 비었다(10/23).
 *   그래서 요청을 하나씩 차례로 보내고, 429면 X-Rate-Limit-Reset(초)만큼 기다렸다 다시 보낸다.
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
/** 429(요청 너무 많음)일 때 다시 보내는 최대 횟수 */
const MAX_RETRIES = 3;
/** X-Rate-Limit-Reset이 없을 때 기다릴 시간(밀리초), 기다린 뒤 덧붙이는 여유 */
const DEFAULT_WAIT_MS = 1000;
const WAIT_MARGIN_MS = 200;
const MS_PER_SECOND = 1000;
const TOO_MANY_REQUESTS = 429;

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

function isoSeconds(ms: number): string {
  return `${new Date(ms).toISOString().slice(0, ISO_SECONDS)}Z`;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 429면 다시 열릴 때까지 기다릴 시간(밀리초). 헤더가 없거나 이상하면 1초 */
function retryDelay(response: Response): number {
  const seconds = Number(response.headers.get('x-rate-limit-reset'));
  return (
    (Number.isFinite(seconds) && seconds > 0 ? seconds * MS_PER_SECOND : DEFAULT_WAIT_MS) +
    WAIT_MARGIN_MS
  );
}

async function get(apiKey: string, path: string, params: URLSearchParams): Promise<unknown> {
  const request = () =>
    fetch(`${GOATCOUNTER_API}${path}?${params.toString()}`, {
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
    });
  let response = await request();
  for (let retry = 0; response.status === TOO_MANY_REQUESTS && retry < MAX_RETRIES; retry += 1) {
    // biome-ignore lint/performance/noAwaitInLoops: 제한이 풀릴 때까지 기다렸다 같은 요청을 다시 보낸다
    await wait(retryDelay(response));
    response = await request();
  }
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
      start: isoSeconds(range.startAt),
      end: isoSeconds(range.endAt),
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

/** 하루치 통계를 읽는다. 요청 제한 때문에 동시에 보내지 않고 경로·이벤트 목록 → 유입 경로 순서로 */
async function fetchGoatCounterDay(apiKey: string, range: Range): Promise<GoatCounterDay> {
  const refParams = new URLSearchParams({
    start: isoSeconds(range.startAt),
    end: isoSeconds(range.endAt),
    limit: String(REF_LIMIT),
  });
  const hits = await allHits(apiKey, range);
  const refs = (await get(apiKey, '/stats/toprefs', refParams)) as {
    readonly stats?: readonly { readonly name?: string; readonly count?: number }[];
  };
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
