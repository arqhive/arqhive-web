import { describe, expect, it } from 'vitest';
import { latestRelease, releaseStamp } from './release-stamp.ts';

const release = (tag: string, published: string | null, extra = {}) => ({
  draft: false,
  prerelease: false,
  // biome-ignore lint/style/useNamingConvention: GitHub API 필드 이름
  tag_name: tag,
  // biome-ignore lint/style/useNamingConvention: GitHub API 필드 이름
  published_at: published,
  ...extra,
});

describe('latestRelease', () => {
  // biome-ignore lint/security/noSecrets: 한글 테스트 이름을 비밀값으로 잘못 본다
  it('초안·시험판을 건너뛰고 처음 나오는 정식 릴리즈', () => {
    const releases = [
      release('v0.3', null, { draft: true }),
      release('v0.3-rc', '2026-10-06T00:00:00Z', { prerelease: true }),
      release('v0.2', '2026-10-01T00:00:00Z'),
      release('v0.1', '2026-09-01T00:00:00Z'),
    ];
    expect(latestRelease(releases)?.tag_name).toBe('v0.2');
    expect(latestRelease([])).toBeUndefined();
  });
});

describe('releaseStamp', () => {
  it('태그 그대로, 날짜는 한국 날짜', () => {
    expect(releaseStamp(release('v0.4', '2026-09-26T16:11:02Z'))).toStrictEqual({
      version: 'v0.4',
      date: '2026-09-27',
    });
    expect(releaseStamp(release('v1.2f', '2026-10-02T14:09:39Z'))).toStrictEqual({
      version: 'v1.2f',
      date: '2026-10-02',
    });
  });

  it('공개 시각이나 태그가 없으면 null', () => {
    expect(releaseStamp(release('v0.1', null))).toBeNull();
    expect(releaseStamp(release(' ', '2026-10-02T14:09:39Z'))).toBeNull();
  });
});
