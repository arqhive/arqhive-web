import { describe, expect, it } from 'vitest';
import { kstDay, shortKstLabel } from '../src/modules/daily-report/kst.ts';
import { buildDailyReport } from '../src/modules/daily-report/message.ts';

describe('한국 날짜', () => {
  it('UTC 15시(한국 자정) 넘으면 다음 날', () => {
    expect(kstDay(Date.parse('2026-10-07T14:59:00Z'))).toBe('2026-10-07');
    expect(kstDay(Date.parse('2026-10-07T15:00:00Z'))).toBe('2026-10-08');
    expect(kstDay(Date.parse('2026-10-07T14:50:00Z'), 1)).toBe('2026-10-06');
  });

  it('요일 표기', () => {
    expect(shortKstLabel('2026-10-07')).toBe('10/7(수)');
  });
});

describe('buildDailyReport', () => {
  const downloads = [
    { slug: 'a', title: '스타폭스 2', total: 100, today: 0, week: 3 },
    { slug: 'b', title: '스타폭스 제로', total: 1240, today: 12, week: 40 },
  ];

  it('오늘 늘어난 패치가 먼저, 증가분은 부호와 함께', () => {
    const message = buildDailyReport({
      day: '2026-10-07',
      downloads,
      umami: null,
      siteUrl: 'https://x',
    });
    expect(message.content).toContain('10/7(수)');
    const lines = message.description.split('\n');
    const first = lines.findIndex((line) => line.startsWith('스타폭스 제로'));
    const second = lines.findIndex((line) => line.startsWith('스타폭스 2'));
    expect(first).toBeLessThan(second);
    expect(lines[first]).toContain('+12');
    expect(message.description).toContain('통계를 읽지 못했습니다');
  });

  it('어제 기록이 없으면 증가분 대신 안내', () => {
    const message = buildDailyReport({
      day: '2026-10-07',
      downloads: [{ slug: 'a', title: '스타폭스 2', total: 100, today: null, week: null }],
      umami: null,
      siteUrl: 'https://x',
    });
    expect(message.description).toContain('증가분은 내일부터');
  });

  it('Umami 이벤트의 패치 slug는 게임 이름으로 바꾼다', () => {
    const message = buildDailyReport({
      day: '2026-10-07',
      downloads,
      umami: {
        visitors: 38,
        pageviews: 121,
        visits: 40,
        bounces: 10,
        totalTime: 4080,
        events: [{ name: 'report-sent', count: 2 }],
        referrers: [{ name: 'google.com', count: 14 }],
        caseOpens: [{ name: 'b', count: 9 }],
        downloads: [],
      },
      siteUrl: 'https://x',
    });
    expect(message.description).toContain('스타폭스 제로 9');
    expect(message.description).toContain('평균 체류 1분 42초');
    expect(message.description).toContain('이탈 25%');
  });
});

describe('buildDailyReport — 에이전트 묶음', () => {
  const base = { day: '2026-10-07', downloads: [], umami: null, siteUrl: 'https://x' };
  const stats = {
    proposals: 3,
    failed: 1,
    skipped: 0,
    stale: 0,
    avgMs: 9800,
    neurons: 640,
    appliedToday: 2,
    ignoredToday: 1,
    editedToday: 1,
    appliedTotal: 6,
    ignoredTotal: 2,
    editedTotal: 3,
    pending: 4,
  };

  // biome-ignore lint/security/noSecrets: 한글 테스트 이름을 비밀값으로 잘못 본다
  it('처리안·결정·누적 비율을 한 묶음으로', () => {
    const text = buildDailyReport({ ...base, agent: stats }).description;
    // biome-ignore lint/security/noSecrets: 한글 기대 문장을 비밀값으로 잘못 본다
    expect(text).toContain('처리안 3건(보류·오류 1) · 평균 9.8초 · 약 640뉴런');
    expect(text).toContain('적용 2(고쳐서 1) · 무시 1 · 승인 대기 4건');
    expect(text).toContain('적용률 75%(6/8) · 수정률 50%');
  });

  it('결정이 없으면 비율은 —, DB 설정 전이면 묶음이 없다', () => {
    const empty = { ...stats, appliedTotal: 0, ignoredTotal: 0, editedTotal: 0 };
    expect(buildDailyReport({ ...base, agent: empty }).description).toContain(
      '적용률 —(0/0) · 수정률 —',
    );
    expect(buildDailyReport(base).description).not.toContain('에이전트');
    expect(buildDailyReport({ ...base, agent: null }).description).toContain(
      '기록을 읽지 못했습니다',
    );
  });
});
