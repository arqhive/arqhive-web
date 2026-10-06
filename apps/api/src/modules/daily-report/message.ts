import type { DiscordMessage } from '../../platform/discord.ts';
import type { Count, UmamiDay } from '../../platform/umami.ts';
import type { DownloadRow } from './downloads.ts';
import { shortKstLabel } from './kst.ts';

/** 다운로드 줄 수(늘어난 것 먼저, 그다음 누적 많은 순) */
const DOWNLOAD_ROWS = 8;
/** 순위 목록 길이(많이 연 케이스·유입 경로 등) */
const TOP = 5;
const SECONDS_PER_MINUTE = 60;
const PERCENT = 100;
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

function countOf(events: readonly Count[], name: string): number {
  return events.find((event) => event.name === name)?.count ?? 0;
}

/** 방문 요약 한 줄: 방문자·페이지뷰·평균 체류·이탈률 */
function visitLine(umami: UmamiDay): string {
  const average = umami.visits === 0 ? 0 : Math.round(umami.totalTime / umami.visits);
  const minutes = Math.floor(average / SECONDS_PER_MINUTE);
  const bounce = umami.visits === 0 ? 0 : Math.round((umami.bounces / umami.visits) * PERCENT);
  return `방문자 ${number(umami.visitors)} · 페이지뷰 ${number(umami.pageviews)} · 평균 체류 ${minutes}분 ${average % SECONDS_PER_MINUTE}초 · 이탈 ${bounce}%`;
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

/** 방문 통계 부분. Umami를 못 읽었으면 한 줄 안내 */
function umamiLines(umami: UmamiDay | null, titleOf: (slug: string) => string): string[] {
  if (umami === null) {
    // biome-ignore lint/security/noSecrets: 한글 안내 문장을 비밀값으로 잘못 본다
    return ['**👀 방문** 통계를 읽지 못했습니다(UMAMI_SHARE_URL 또는 Umami 응답 확인)'];
  }
  const reportFailed = countOf(umami.events, 'report-failed');
  return [
    `**👀 방문** ${visitLine(umami)}`,
    `**📂 많이 연 케이스** ${topLine(umami.caseOpens, titleOf)}`,
    `**⬇️ 다운로드 클릭** ${topLine(umami.downloads, titleOf)}`,
    `**📝 제보** ${number(countOf(umami.events, 'report-sent'))}건${reportFailed > 0 ? ` (실패 ${number(reportFailed)})` : ''} · 업데이트 내역 열기 ${number(countOf(umami.events, 'changelog-open'))}`,
    `**🔗 유입** ${topLine(umami.referrers, (name) => name)}`,
  ];
}

/**
 * 일일 정산 디스코드 메시지. 푸시에는 "📊 일일 정산 · 날짜" 한 줄, 카드에는 방문·다운로드·이벤트 요약.
 * 순수 함수라 시험하기 쉽다(가져오기는 run.ts가 한다).
 */
function buildDailyReport(input: {
  readonly day: string;
  readonly downloads: readonly DownloadRow[];
  readonly umami: UmamiDay | null;
  readonly siteUrl: string;
}): DiscordMessage {
  const titles = new Map(input.downloads.map((row) => [row.slug, row.title]));
  const titleOf = (slug: string) => titles.get(slug) ?? slug;
  const label = shortKstLabel(input.day);
  return {
    content: `📊 arqhive 일일 정산 · ${label}`,
    title: `일일 정산 · ${label}`,
    url: input.siteUrl,
    description: [...umamiLines(input.umami, titleOf), '', ...downloadLines(input.downloads)].join(
      '\n',
    ),
    color: COLOR_REPORT,
  };
}

export { buildDailyReport };
