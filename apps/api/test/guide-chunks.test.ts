import { describe, expect, it } from 'vitest';
import { buildGuideChunks, splitSections } from '../src/modules/agent/guide-chunks.ts';

describe('splitSections', () => {
  it('머리말과 "## 절"로 나눈다', () => {
    expect(splitSections('머리말\n\n## 하나\n본문 1\n\n## 둘\n본문 2')).toStrictEqual([
      { heading: null, body: '머리말' },
      { heading: '하나', body: '본문 1' },
      { heading: '둘', body: '본문 2' },
    ]);
  });

  it('머리말이 없고 "###"는 나누지 않는다', () => {
    expect(splitSections('## 하나\n### 작은 제목\n본문')).toStrictEqual([
      { heading: '하나', body: '### 작은 제목\n본문' },
    ]);
  });
});

describe('buildGuideChunks', () => {
  it('실제 콘텐츠에서 id가 겹치지 않고 빈 문단이 없다', () => {
    const chunks = buildGuideChunks();
    expect(chunks.length).toBeGreaterThan(10);
    expect(new Set(chunks.map((chunk) => chunk.id)).size).toBe(chunks.length);
    expect(chunks.every((chunk) => chunk.content.trim() !== '')).toBe(true);
    expect(chunks.every((chunk) => chunk.url.startsWith('https://arqhive.vercel.app/guide'))).toBe(
      true,
    );
  });
});
