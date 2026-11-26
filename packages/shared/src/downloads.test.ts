import { describe, expect, it } from 'vitest';
import { sumLargestDownloads } from './downloads.ts';

describe('sumLargestDownloads', () => {
  it('공유 저장소에서는 게임 코드별로 합산한다', () => {
    // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름
    const asset = (name: string, count: number) => ({ name, download_count: count });
    const releases = [
      {
        assets: [
          asset('GKME_KPatch_v0.9.zip', 7),
          asset('RPPE_KPatch_v0.9.zip', 4),
          asset('SHA256SUMS_v0.9.txt', 8),
        ],
      },
    ];
    expect(sumLargestDownloads(releases, 'GKME')).toBe(7);
    expect(sumLargestDownloads(releases, 'RPPE')).toBe(4);
  });

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
