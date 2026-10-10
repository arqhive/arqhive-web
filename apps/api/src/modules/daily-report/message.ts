import { parseEventPath, TIME_BUCKET_LABELS, TIME_BUCKETS } from '@arqhive/shared';
import type { DiscordMessage } from '../../platform/discord.ts';
import type { Count, GoatCounterDay } from '../../platform/goatcounter.ts';
import type { AgentDayStats } from '../agent/index.ts';
import type { DownloadRow } from './downloads.ts';
import { shortKstLabel } from './kst.ts';

/** 다운로드 줄 수(늘어난 것 먼저, 그다음 누적 많은 순) */
const DOWNLOAD_ROWS = 8;
/** 순위 목록 길이(많이 연 케이스·유입 경로 등) */
const TOP = 5;
const PERCENT = 100;
/** 웹 바이탈 줄에 보일 지표 순서 */
const VITALS = ['LCP', 'INP', 'CLS'] as const;
const MS_PER_SECOND = 1000;
/** 임베드 띠 색(사이트 남색 잉크 #1e2a3a) */
const COLOR_REPORT = 0x1e_2a_3a;

const number = (value: number) => value.toLocaleString('ko-KR');
const signed = (value: number | null) =>
  value === null ? '—' : `${value > 0 ? '+' : ''}${number(value)}`;

/** "이름 n · 이름 n" 한 줄(없으면 "없음"). 이름은 slug면 게임 이름으로 바꾼다 */
function topLine(counts: readonly Count[], titleOf: (name: string) => string): string {
  const top = counts.filter((item) => item.count > 0).slice(0, TOP);
  return top.length === 0
    ? '없음'
    : top.map((item) => `${titleOf(item.name)} ${number(item.count)}`).join(' · ');
}

/** 비율(분모가 0이면 "—") */
function ratio(part: number, whole: number): string {
  return whole === 0 ? '—' : `${Math.round((part / whole) * PERCENT)}%`;
}

/**
 * 이벤트 경로(이름/값/값, @arqhive/shared eventPath)를 이름이 같은 것끼리 값 조각 하나로 묶어 센다.
 * 예: case-open/star-fox-2, case-open/star-fox-2/address → { star-fox-2: 합 }
 */
function groupEvents(events: readonly Count[], name: string, valueIndex = 0): Count[] {
  const sums = new Map<string, number>();
  for (const event of events) {
    const parsed = parseEventPath(event.name);
    const value = parsed.values[valueIndex];
    if (parsed.name === name && value !== undefined) {
      sums.set(value, (sums.get(value) ?? 0) + event.count);
    }
  }
  return [...sums]
    .map(([key, count]) => ({ name: key, count }))
    .toSorted((a, b) => b.count - a.count);
}

/** 이름이 같은 이벤트 합(값은 가리지 않음) */
function sumEvents(events: readonly Count[], name: string): number {
  return events
    .filter((event) => parseEventPath(event.name).name === name)
    .reduce((sum, event) => sum + event.count, 0);
}

/** 체류 시간 줄: 구간별 횟수(짧은 구간부터, 0인 구간은 뺀다) */
function stayLine(events: readonly Count[]): string {
  const counts = new Map(groupEvents(events, 'page-time').map((item) => [item.name, item.count]));
  const parts = TIME_BUCKETS.map(([, bucket]) => [bucket, counts.get(bucket) ?? 0] as const)
    .filter(([, count]) => count > 0)
    .map(([bucket, count]) => `${TIME_BUCKET_LABELS[bucket] ?? bucket} ${number(count)}`);
  return parts.length === 0 ? '기록 없음' : parts.join(' · ');
}

/** 웹 바이탈 줄: 지표마다 "좋음" 비율(기록이 없는 지표는 뺀다) */
function vitalsLine(events: readonly Count[]): string {
  const parts = VITALS.flatMap((metric) => {
    const ratings = events.filter((event) => {
      const parsed = parseEventPath(event.name);
      return parsed.name === 'web-vitals' && parsed.values[0] === metric;
    });
    const total = ratings.reduce((sum, event) => sum + event.count, 0);
    const good = ratings
      .filter((event) => parseEventPath(event.name).values[1] === 'good')
      .reduce((sum, event) => sum + event.count, 0);
    return total === 0 ? [] : [`${metric} ${ratio(good, total)}`];
  });
  return parts.length === 0 ? '기록 없음' : parts.join(' · ');
}

/** 다운로드 표: 오늘 늘어난 패치 먼저, 그다음 누적 많은 순 */
function downloadLines(rows: readonly DownloadRow[]): string[] {
  const sorted = rows.toSorted((a, b) => (b.today ?? 0) - (a.today ?? 0) || b.total - a.total);
  const todaySum = rows.reduce((sum, row) => sum + (row.today ?? 0), 0);
  const hasHistory = rows.some((row) => row.today !== null);
  return [
    `**📥 다운로드** (누적 · 오늘 · 7일)${hasHistory ? ` — 오늘 합계 ${signed(todaySum)}` : ' — 어제 기록이 없어 증가분은 내일부터'}`,
    ...sorted
      .slice(0, DOWNLOAD_ROWS)
      .map(
        (row) => `${row.title}  ${number(row.total)} · ${signed(row.today)} · ${signed(row.week)}`,
      ),
  ];
}

/**
 * 방문 통계 부분(GoatCounter, ADR 0019). 못 읽었으면 한 줄 안내.
 * 숫자는 모두 "방문"(같은 사람이 8시간 안에 다시 하면 한 번) 기준이다.
 */
function statsLines(stats: GoatCounterDay | null, titleOf: (slug: string) => string): string[] {
  if (stats === null) {
    // biome-ignore lint/security/noSecrets: 한글 안내 문장을 비밀값으로 잘못 본다
    return ['**👀 방문** 통계를 읽지 못했습니다(GOATCOUNTER_API_KEY 또는 GoatCounter 응답 확인)'];
  }
  const { events } = stats;
  const reportFailed = sumEvents(events, 'report-failed');
  return [
    `**👀 방문** ${number(stats.visits)} · 많이 본 페이지 ${topLine(stats.pages, (name) => name)}`,
    `**⏱️ 체류**(페이지별) ${stayLine(events)}`,
    `**📂 많이 연 케이스** ${topLine(groupEvents(events, 'case-open'), titleOf)}`,
    `**⬇️ 다운로드 클릭** ${topLine(groupEvents(events, 'download'), titleOf)}`,
    `**📝 제보** ${number(sumEvents(events, 'report-sent'))}건${reportFailed > 0 ? ` (실패 ${number(reportFailed)})` : ''} · 업데이트 내역 열기 ${number(sumEvents(events, 'changelog-open'))}`,
    `**⚡ 성능**(좋음 비율) ${vitalsLine(events)}`,
    `**🔗 유입** ${topLine(stats.referrers, (name) => name)}`,
  ];
}

/**
 * 제보 처리 에이전트 묶음(ADR 0017): 오늘 만든 처리안 · 오늘 결정 · 누적 적용률·수정률·승인 대기.
 * DB를 못 읽었으면 한 줄 안내. 시험 제보는 집계에서 빠져 있다.
 */
function agentLines(stats: AgentDayStats | null): string[] {
  if (stats === null) {
    // biome-ignore lint/security/noSecrets: 한글 안내 문장을 비밀값으로 잘못 본다
    return ['**🤖 에이전트** 기록을 읽지 못했습니다(DATABASE_URL 또는 Neon 확인)'];
  }
  const extras = [
    stats.failed > 0 ? `보류·오류 ${stats.failed}` : null,
    stats.skipped > 0 ? `한도로 건너뜀 ${stats.skipped}` : null,
    stats.stale > 0 ? `끊긴 실행 정리 ${stats.stale}` : null,
  ].filter((text) => text !== null);
  const speed = stats.avgMs === null ? '' : ` · 평균 ${(stats.avgMs / MS_PER_SECOND).toFixed(1)}초`;
  const decidedTotal = stats.appliedTotal + stats.ignoredTotal;
  return [
    `**🤖 에이전트** 처리안 ${number(stats.proposals)}건${extras.length > 0 ? `(${extras.join(' · ')})` : ''}${speed} · 약 ${number(stats.neurons)}뉴런`,
    `오늘 결정: 적용 ${stats.appliedToday}(고쳐서 ${stats.editedToday}) · 무시 ${stats.ignoredToday} · 승인 대기 ${stats.pending}건`,
    `누적: 적용률 ${ratio(stats.appliedTotal, decidedTotal)}(${stats.appliedTotal}/${decidedTotal}) · 수정률 ${ratio(stats.editedTotal, stats.appliedTotal)}`,
  ];
}

/**
 * 일일 정산 디스코드 메시지. 푸시에는 "📊 일일 정산 · 날짜" 한 줄, 카드에는 방문·다운로드·이벤트 요약.
 * 순수 함수라 시험하기 쉽다(가져오기는 run.ts가 한다).
 */
function buildDailyReport(input: {
  readonly day: string;
  readonly downloads: readonly DownloadRow[];
  readonly stats: GoatCounterDay | null;
  /** 에이전트 지표. undefined면(DB 설정 전) 묶음을 아예 넣지 않는다 */
  readonly agent?: AgentDayStats | null;
  readonly siteUrl: string;
}): DiscordMessage {
  const titles = new Map(input.downloads.map((row) => [row.slug, row.title]));
  const titleOf = (slug: string) => titles.get(slug) ?? slug;
  const label = shortKstLabel(input.day);
  return {
    content: `📊 arqhive 일일 정산 · ${label}`,
    title: `일일 정산 · ${label}`,
    url: input.siteUrl,
    description: [
      ...statsLines(input.stats, titleOf),
      '',
      ...downloadLines(input.downloads),
      ...(input.agent === undefined ? [] : ['', ...agentLines(input.agent)]),
    ].join('\n'),
    color: COLOR_REPORT,
  };
}

export { buildDailyReport };
