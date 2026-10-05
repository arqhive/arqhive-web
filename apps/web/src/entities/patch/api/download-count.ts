/**
 * GitHub 릴리즈 다운로드 수(FSD api 칸: 바깥 서비스 호출). 서버에서만 부른다(진열장 페이지가 그릴 때).
 *
 * 세는 법(10/6 사용자 결정): 릴리즈마다 첨부 파일 중 **가장 많이 받은 파일 하나**의 횟수를 골라 모두 더한다.
 * 체크섬·README 같은 부가 파일이 섞여도 패치 본체 하나만 세어 "받은 사람 수"에 가깝다.
 * GitHub가 자동으로 붙이는 소스 코드 압축(zip·tar.gz)은 API가 세지 않아 빠진다.
 *
 * - 결과는 Next.js 데이터 캐시에 1시간 둔다(페이지의 revalidate와 같은 주기). 작품 수만큼(지금 22번) 시간당 한 번씩 부른다.
 * - GITHUB_TOKEN(읽기 전용)이 있으면 붙인다. 없으면 시간당 60번 한도라 개발할 때만 쓴다.
 * - 실패하면(한도 초과·네트워크 오류·저장소 없음) null. 화면은 다운로드 수만 빼고 정상으로 그린다.
 */

import { githubToken } from '@/shared/config';

const GITHUB_API = 'https://api.github.com';
/** 데이터 캐시 유지 시간(초): 진열장 페이지의 revalidate와 같게 */
const CACHE_SECONDS = 3600;
/** 한 번에 받을 릴리즈 수(GitHub 최대값). 작품마다 릴리즈가 몇 개라 한 번이면 충분하다 */
const PER_PAGE = 100;

interface ReleaseAsset {
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly download_count: number;
}

interface Release {
  readonly assets: readonly ReleaseAsset[];
}

/** 요청 헤더(이름은 대소문자를 가리지 않는다). 토큰이 있으면 붙여 한도를 시간당 5,000번으로 늘린다 */
function githubHeaders(): Headers {
  const headers = new Headers({
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  });
  const token = githubToken();
  if (token !== undefined) {
    headers.set('authorization', `Bearer ${token}`);
  }
  return headers;
}

/** 릴리즈마다 가장 많이 받은 첨부 파일의 횟수를 더한다(첨부가 없는 릴리즈는 0) */
function sumOfLargest(releases: readonly Release[]): number {
  return releases.reduce(
    (sum, release) =>
      sum + release.assets.reduce((max, asset) => Math.max(max, asset.download_count), 0),
    0,
  );
}

export async function fetchDownloadCount(repo: {
  readonly owner: string;
  readonly name: string;
}): Promise<number | null> {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${repo.owner}/${repo.name}/releases?per_page=${PER_PAGE}`,
      { headers: githubHeaders(), next: { revalidate: CACHE_SECONDS } },
    );
    if (!response.ok) {
      return null;
    }
    return sumOfLargest((await response.json()) as Release[]);
  } catch {
    return null;
  }
}
