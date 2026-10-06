import { describe, expect, it } from 'vitest';
import { sumLargestDownloads } from './downloads.ts';

describe('sumLargestDownloads', () => {
  it('릴리즈마다 가장 많이 받은 파일 하나만 더한다', () => {
    const releases = [
      // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름
      { assets: [{ download_count: 30 }, { download_count: 5 }] },
      // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름
      { assets: [{ download_count: 12 }] },
      { assets: [] },
    ];
    expect(sumLargestDownloads(releases)).toBe(42);
  });
});
