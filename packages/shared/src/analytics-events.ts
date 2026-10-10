/**
 * 방문 통계 이벤트 이름 규칙(GoatCounter, ADR 0019). web이 만들고 api(일일 정산)가 읽는다.
 *
 * GoatCounter 이벤트는 이름 하나만 받고 값(속성)을 따로 담지 못한다. 그래서 값을 이름 뒤에 빗금으로 잇는다.
 *   case-open/star-fox-2 · download/star-fox-2/SF2_KPatch_v1.2f.zip · page-time/1-3m/guide
 * 숫자(체류 초)는 담을 수 없어 구간 이름으로 바꿔 보낸다(TIME_BUCKETS).
 */

/** 경로 조각 앞의 빗금(경로 값 "/guide" → "guide") */
const LEADING_SLASHES = /^\/+/;

const TEN_SECONDS = 10;
const HALF_MINUTE = 30;
const MINUTE = 60;
const THREE_MINUTES = 180;
const TEN_MINUTES = 600;

/** 체류 시간 구간: [이 초 미만, 이름]. 이름이 이벤트에 들어가므로 바꾸면 지난 기록과 갈라진다 */
const TIME_BUCKETS: readonly (readonly [number, string])[] = [
  [TEN_SECONDS, '0-10s'],
  [HALF_MINUTE, '10-30s'],
  [MINUTE, '30-60s'],
  [THREE_MINUTES, '1-3m'],
  [TEN_MINUTES, '3-10m'],
  [Number.POSITIVE_INFINITY, '10m+'],
];

/** 정산에 보일 구간 이름 */
const TIME_BUCKET_LABELS: Readonly<Record<string, string>> = {
  '0-10s': '10초 미만',
  '10-30s': '10~30초',
  '30-60s': '30초~1분',
  '1-3m': '1~3분',
  '3-10m': '3~10분',
  '10m+': '10분 이상',
};

/** 체류 초 → 구간 이름 */
function timeBucket(seconds: number): string {
  return TIME_BUCKETS.find(([limit]) => seconds < limit)?.[1] ?? '10m+';
}

/** 이벤트 경로: 이름/값1/값2 … (값 앞의 빗금은 떼고, 빈 값은 뺀다) */
function eventPath(name: string, values: readonly (string | number | boolean)[]): string {
  const parts = values
    .map((value) => String(value).replace(LEADING_SLASHES, ''))
    .filter((part) => part !== '');
  return [name, ...parts].join('/');
}

/** 이벤트 경로 → 이름과 값들. 값 안에 빗금이 있으면(경로 값) 나뉘어 나오니, 쓰는 쪽은 앞 조각만 믿는다 */
function parseEventPath(path: string): { readonly name: string; readonly values: string[] } {
  const [name = '', ...values] = path.split('/');
  return { name, values };
}

export { eventPath, parseEventPath, TIME_BUCKET_LABELS, TIME_BUCKETS, timeBucket };
