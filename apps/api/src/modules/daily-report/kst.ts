/**
 * 한국 시간(UTC+9) 날짜 계산. Workers는 UTC로 돌아서, "오늘"을 한국 날짜로 맞춰야 정산 날짜가 어긋나지 않는다.
 */

const KST_OFFSET_MS = 32_400_000;
const DAY_MS = 86_400_000;
/** ISO 문자열에서 "YYYY-MM-DD" 글자 수 */
const DATE_LENGTH = 10;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** now 기준 한국 날짜 "YYYY-MM-DD". daysAgo만큼 앞 날짜도 구한다 */
function kstDay(now: number, daysAgo = 0): string {
  return new Date(now + KST_OFFSET_MS - daysAgo * DAY_MS).toISOString().slice(0, DATE_LENGTH);
}

/** 한국 날짜 하루의 시작(00:00 KST)부터 now까지의 범위(밀리초) */
function kstDayRange(now: number): { readonly startAt: number; readonly endAt: number } {
  const startAt = Date.parse(`${kstDay(now)}T00:00:00+09:00`);
  return { startAt, endAt: now };
}

/** "10/7(화)" 같은 짧은 표기 */
function shortKstLabel(day: string): string {
  const [year, month, dayOfMonth] = day.split('-').map(Number);
  // 날짜만 UTC 자정으로 만들어 요일을 센다(한국 자정으로 만들면 UTC로는 전날이라 요일이 하루 밀린다)
  const weekday = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, dayOfMonth ?? 1)).getUTCDay();
  return `${month}/${dayOfMonth}(${WEEKDAYS[weekday] ?? ''})`;
}

export { kstDay, kstDayRange, shortKstLabel };
