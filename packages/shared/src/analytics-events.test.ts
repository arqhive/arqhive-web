import { describe, expect, it } from 'vitest';
import { eventPath, parseEventPath, TIME_BUCKET_LABELS, timeBucket } from './analytics-events.ts';

describe('eventPath', () => {
  it('이름 뒤에 값을 빗금으로 잇고, 경로 값 앞의 빗금은 뗀다', () => {
    expect(eventPath('case-open', ['star-fox-2'])).toBe('case-open/star-fox-2');
    expect(eventPath('page-time', ['1-3m', '/guide/faq'])).toBe('page-time/1-3m/guide/faq');
  });

  // biome-ignore lint/security/noSecrets: 한글 시험 이름을 비밀값으로 잘못 본다
  it('빈 값은 빼고, 숫자·참거짓은 글자로', () => {
    expect(eventPath('scroll-depth', [25, '/'])).toBe('scroll-depth/25');
    expect(eventPath('report-sent', ['zelda', 0, ''])).toBe('report-sent/zelda/0');
  });
});

describe('parseEventPath', () => {
  it('이름과 값 조각으로 나눈다', () => {
    expect(parseEventPath('download/zelda/KQ9E_KPatch_v1.2f.zip')).toStrictEqual({
      name: 'download',
      values: ['zelda', 'KQ9E_KPatch_v1.2f.zip'],
    });
    expect(parseEventPath('report-failed')).toStrictEqual({ name: 'report-failed', values: [] });
  });
});

describe('timeBucket', () => {
  it('구간 경계는 "미만"', () => {
    expect(timeBucket(0)).toBe('0-10s');
    expect(timeBucket(9)).toBe('0-10s');
    expect(timeBucket(10)).toBe('10-30s');
    expect(timeBucket(179)).toBe('1-3m');
    expect(timeBucket(3600)).toBe('10m+');
  });

  it('모든 구간에 정산용 이름이 있다', () => {
    for (const seconds of [0, 10, 30, 60, 180, 600]) {
      expect(TIME_BUCKET_LABELS[timeBucket(seconds)]).toBeDefined();
    }
  });
});
