import { describe, expect, it } from 'vitest';
import {
  buildReportIssue,
  neutralizeMentions,
  parseReportBody,
  reportInputSchema,
} from './report.ts';

describe('neutralizeMentions', () => {
  it('@아이디와 #번호가 링크가 되지 않게 한다', () => {
    const out = neutralizeMentions('@octocat 님, #12 참고');
    expect(out).not.toContain('@octocat');
    expect(out).not.toContain('#12');
  });
});

describe('buildReportIssue → parseReportBody', () => {
  it('만든 본문을 다시 읽으면 글과 이미지가 그대로 나온다', () => {
    const text = '3장 보스 대사가 잘려요.\n두 번째 줄';
    const urls = ['https://img.example/a.webp', 'https://img.example/b.webp'];
    const { title, body } = buildReportIssue({ text, imageUrls: urls });
    expect(title).toBe('[제보] 3장 보스 대사가 잘려요.');
    expect(parseReportBody(body)).toEqual({ text, images: urls });
  });

  it('형식이 다른 본문은 전체를 글로 본다', () => {
    expect(parseReportBody('그냥 쓴 이슈')).toEqual({ text: '그냥 쓴 이슈', images: [] });
  });
});

describe('reportInputSchema', () => {
  it('글이 너무 짧거나 길면 받지 않는다', () => {
    expect(reportInputSchema.safeParse({ slug: 'a', text: '짧음' }).success).toBe(false);
    expect(reportInputSchema.safeParse({ slug: 'a', text: '가'.repeat(2001) }).success).toBe(false);
    expect(
      reportInputSchema.safeParse({ slug: 'a', text: '대사 한 줄이 화면 밖으로 넘칩니다.' })
        .success,
    ).toBe(true);
  });
});
