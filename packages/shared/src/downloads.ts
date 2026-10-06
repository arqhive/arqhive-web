/**
 * GitHub 릴리즈 다운로드 수 세는 법(10/6 사용자 결정). 사이트 화면(web)과 일일 정산(api)이 같은 셈법을 쓴다.
 * 릴리즈마다 첨부 파일 중 **가장 많이 받은 파일 하나**의 횟수를 골라 모두 더한다.
 * 체크섬·README 같은 부가 파일이 섞여도 패치 본체 하나만 세어 "받은 사람 수"에 가깝다.
 * GitHub가 자동으로 붙이는 소스 코드 압축(zip·tar.gz)은 API가 세지 않아 빠진다.
 */

/** GitHub 릴리즈 응답에서 쓰는 부분 */
interface ReleaseAssets {
  readonly assets: readonly {
    // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
    readonly download_count: number;
  }[];
}

/** 한 번에 받을 릴리즈 수(GitHub 최대값). 패치마다 릴리즈가 몇 개라 한 번이면 충분하다 */
const RELEASES_PER_PAGE = 100;

/** 릴리즈마다 가장 많이 받은 첨부 파일의 횟수를 더한다(첨부가 없는 릴리즈는 0) */
function sumLargestDownloads(releases: readonly ReleaseAssets[]): number {
  return releases.reduce(
    (sum, release) =>
      sum + release.assets.reduce((max, asset) => Math.max(max, asset.download_count), 0),
    0,
  );
}

/** 릴리즈 목록 주소(GitHub REST) */
function releasesUrl(repo: { readonly owner: string; readonly name: string }): string {
  return `https://api.github.com/repos/${repo.owner}/${repo.name}/releases?per_page=${RELEASES_PER_PAGE}`;
}

export type { ReleaseAssets };
export { releasesUrl, sumLargestDownloads };
