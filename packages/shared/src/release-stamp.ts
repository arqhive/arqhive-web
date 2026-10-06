/**
 * 최신 릴리즈의 버전·날짜(10/7 사용자 결정). 패치 저장소에 릴리즈만 올려도 사이트의 버전 표시가 따라오게 한다.
 * - 최신 = 릴리즈 목록(GitHub는 최신순)에서 처음 나오는 **정식** 릴리즈(초안·시험판 제외). 직접 다운로드 파일도 이 릴리즈에서 고른다.
 * - 버전 = 태그 이름 그대로(저장소들이 "v1.2f"처럼 사이트 표기와 같은 태그를 쓴다).
 * - 날짜 = 공개 시각을 **한국 날짜**로(콘텐츠의 latestReleaseDate와 같은 기준. UTC 9/26 16:11 → 9/27).
 * 사이트(web)와 에이전트(api)가 같은 셈법을 쓴다. 콘텐츠 값은 GitHub를 못 읽을 때의 예비값이다.
 */

/** GitHub 릴리즈 응답에서 쓰는 부분 */
interface ReleaseMeta {
  readonly draft: boolean;
  readonly prerelease: boolean;
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly tag_name: string;
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly published_at: string | null;
}

interface ReleaseStamp {
  readonly version: string;
  /** 한국 날짜 "YYYY-MM-DD" */
  readonly date: string;
}

/** 한국 시간 = UTC + 9시간 */
const KST_OFFSET_HOURS = 9;
const MS_PER_HOUR = 3_600_000;
const KST_OFFSET_MS = KST_OFFSET_HOURS * MS_PER_HOUR;
/** ISO 시각에서 "YYYY-MM-DD" 글자 수 */
const DATE_LENGTH = 10;

function latestRelease<T extends Pick<ReleaseMeta, 'draft' | 'prerelease'>>(
  releases: readonly T[],
): T | undefined {
  return releases.find((release) => !(release.draft || release.prerelease));
}

/** 릴리즈 → 버전·한국 날짜. 태그나 공개 시각이 없으면(아직 공개 전) null */
function releaseStamp(
  release: Pick<ReleaseMeta, 'tag_name' | 'published_at'>,
): ReleaseStamp | null {
  const published = release.published_at === null ? Number.NaN : Date.parse(release.published_at);
  if (release.tag_name.trim() === '' || Number.isNaN(published)) {
    return null;
  }
  return {
    version: release.tag_name.trim(),
    date: new Date(published + KST_OFFSET_MS).toISOString().slice(0, DATE_LENGTH),
  };
}

export type { ReleaseMeta, ReleaseStamp };
export { latestRelease, releaseStamp };
