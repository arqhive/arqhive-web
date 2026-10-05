/**
 * 날짜 표시(FSD shared 층, lib 칸). 콘텐츠의 날짜는 Velite가 ISO 문자열("2026-10-02T00:00:00.000Z")로 내보낸다.
 * 문자열을 잘라 쓰지 않고 Intl.DateTimeFormat으로 **한국 시간 기준** 날짜를 만든다.
 * (서버(UTC)와 브라우저(KST)가 다른 날짜를 그리면 hydration 오류가 나므로, 시간대를 명시해 둘을 같게 한다)
 */
/** 하루(ms)와 한국 시간의 UTC 차이(ms). kstDayNumber에서 쓴다 */
const DAY_MS = 86_400_000;
const KST_OFFSET_MS = 32_400_000; // 9시간

const parts = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * formatToParts는 [{type:'year', value:'2026'}, …] 배열을 돌려준다. 객체로 바꿔 obj['year']처럼 꺼내면
 * TS 엄격 설정(인덱스 접근은 대괄호)과 Biome(문자열 키는 점)이 서로 반대를 요구하므로, 배열에서 바로 찾는다.
 */
function ymd(iso: string) {
  const found = parts.formatToParts(new Date(iso));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    found.find((part) => part.type === type)?.value ?? '';
  return { year: pick('year'), month: pick('month'), day: pick('day') };
}

/** 2026.10.02 */
export function formatDate(iso: string): string {
  const { year, month, day } = ymd(iso);
  return `${year}.${month}.${day}`;
}

/** 10.02 */
export function formatMonthDay(iso: string): string {
  const { month, day } = ymd(iso);
  return `${month}.${day}`;
}

/**
 * 한국 시간 기준 "몇 번째 날"(1970-01-01부터 센 날 수). 두 날짜가 며칠 떨어졌는지 셀 때 쓴다.
 * 콘텐츠 날짜("2026-10-05T00:00:00.000Z")도, 지금 시각(new Date())도 같은 기준으로 바꾼다.
 */
export function kstDayNumber(date: string | Date): number {
  const ms = typeof date === 'string' ? Date.parse(date) : date.getTime();
  return Math.floor((ms + KST_OFFSET_MS) / DAY_MS);
}
