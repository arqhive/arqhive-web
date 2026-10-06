import { type ReleaseAssets, releasesUrl, sumLargestDownloads } from '@arqhive/shared';

/**
 * GitHub 이슈 만들기·릴리즈 다운로드 수 읽기. 토큰은 Issues 읽기·쓰기 권한만, 패치 저장소들에만 준다(새면 할 수 있는 일을 줄이기).
 * GitHub API는 User-Agent 헤더가 없는 요청을 거절한다.
 */

const GITHUB_API = 'https://api.github.com';
/** 라벨 색(빨강 계열, 16진수 앞의 # 없이) */
const LABEL_COLOR = 'd73a4a';
/** 이미 있는 라벨을 다시 만들려 하면 GitHub가 돌려주는 상태 코드 */
const ALREADY_EXISTS = 422;

interface Repo {
  readonly owner: string;
  readonly name: string;
}

function headers(token: string): Headers {
  return new Headers({
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'user-agent': 'arqhive-api',
    'x-github-api-version': '2022-11-28',
  });
}

/** 저장소에 라벨이 없으면 만든다(이미 있으면 422 → 그대로 둔다) */
async function ensureLabel(token: string, repo: Repo, label: string): Promise<void> {
  const response = await fetch(`${GITHUB_API}/repos/${repo.owner}/${repo.name}/labels`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      name: label,
      color: LABEL_COLOR,
      description: '사이트 제보 양식으로 들어온 제보',
    }),
  });
  if (!response.ok && response.status !== ALREADY_EXISTS) {
    throw new Error(`라벨 만들기 실패: ${response.status}`);
  }
}

/** 라벨을 붙여 이슈를 만들고 이슈 주소·id를 돌려준다 */
export async function createIssue(
  token: string,
  repo: Repo,
  issue: { readonly title: string; readonly body: string; readonly label: string },
): Promise<{ readonly url: string; readonly id: number }> {
  await ensureLabel(token, repo, issue.label);
  const response = await fetch(`${GITHUB_API}/repos/${repo.owner}/${repo.name}/issues`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ title: issue.title, body: issue.body, labels: [issue.label] }),
  });
  if (!response.ok) {
    throw new Error(`이슈 만들기 실패: ${response.status}`);
  }
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  const created = (await response.json()) as { readonly html_url: string; readonly id: number };
  return { url: created.html_url, id: created.id };
}

/**
 * 저장소의 누적 다운로드 수(일일 정산용). 셈법은 사이트 화면과 같다(@arqhive/shared).
 * 공개 저장소라 읽기만 하지만, 토큰이 있으면 붙여 한도(시간당 60번 → 5000번)를 넉넉하게 쓴다. 실패하면 null.
 */
export async function fetchDownloadTotal(
  token: string | undefined,
  repo: Repo,
): Promise<number | null> {
  const requestHeaders = new Headers({
    accept: 'application/vnd.github+json',
    'user-agent': 'arqhive-api',
    'x-github-api-version': '2022-11-28',
  });
  if (token !== undefined) {
    requestHeaders.set('authorization', `Bearer ${token}`);
  }
  try {
    const response = await fetch(releasesUrl(repo), { headers: requestHeaders });
    return response.ok ? sumLargestDownloads((await response.json()) as ReleaseAssets[]) : null;
  } catch {
    return null;
  }
}
