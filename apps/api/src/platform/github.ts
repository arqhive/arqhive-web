import {
  latestRelease,
  type ReleaseAssets,
  type ReleaseMeta,
  type ReleaseStamp,
  releaseStamp,
  releasesUrl,
  sumLargestDownloads,
} from '@arqhive/shared';

/**
 * GitHub 이슈 만들기·릴리즈 다운로드 수 읽기. 토큰은 Issues 읽기·쓰기 권한만, 패치 저장소들에만 준다(새면 할 수 있는 일을 줄이기).
 * GitHub API는 User-Agent 헤더가 없는 요청을 거절한다.
 */

const GITHUB_API = 'https://api.github.com';
/** 라벨 색(빨강 계열, 16진수 앞의 # 없이) */
const LABEL_COLOR = 'd73a4a';
/** 이미 있는 라벨을 다시 만들려 하면 GitHub가 돌려주는 상태 코드 */
const ALREADY_EXISTS = 422;
/** 이슈 주소 모양: https://github.com/owner/name/issues/12 */
const ISSUE_URL = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/issues\/(\d+)$/u;

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
async function ensureLabel(
  token: string,
  repo: Repo,
  label: string,
  description = '사이트 제보 양식으로 들어온 제보',
): Promise<void> {
  const response = await fetch(`${GITHUB_API}/repos/${repo.owner}/${repo.name}/labels`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ name: label, color: LABEL_COLOR, description }),
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

/** 이슈 주소(https://github.com/owner/name/issues/12) → 저장소·번호. 모양이 다르면 null */
export function parseIssueUrl(
  url: string,
): { readonly repo: Repo; readonly number: number } | null {
  const match = ISSUE_URL.exec(url);
  if (match === null) {
    return null;
  }
  const [, owner = '', name = '', number = ''] = match;
  return { repo: { owner, name }, number: Number(number) };
}

/** 이슈에 라벨 붙이기(없는 라벨은 먼저 만든다). 에이전트 처리안을 운영자가 승인했을 때 쓴다 */
export async function addIssueLabels(
  token: string,
  issue: { readonly repo: Repo; readonly number: number },
  labels: readonly string[],
): Promise<void> {
  await Promise.all(
    labels.map((label) => ensureLabel(token, issue.repo, label, '제보 처리 에이전트 분류')),
  );
  const { owner, name } = issue.repo;
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${name}/issues/${issue.number}/labels`,
    {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ labels }),
    },
  );
  if (!response.ok) {
    throw new Error(`라벨 붙이기 실패: ${response.status}`);
  }
}

/** 이슈에 댓글 달기 */
export async function addIssueComment(
  token: string,
  issue: { readonly repo: Repo; readonly number: number },
  body: string,
): Promise<void> {
  const { owner, name } = issue.repo;
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${name}/issues/${issue.number}/comments`,
    { method: 'POST', headers: headers(token), body: JSON.stringify({ body }) },
  );
  if (!response.ok) {
    throw new Error(`댓글 달기 실패: ${response.status}`);
  }
}

/**
 * 최신 정식 릴리즈의 버전(태그)·한국 날짜(@arqhive/shared의 releaseStamp, 사이트 화면과 같은 기준).
 * 에이전트가 "옛 버전인지" 판단할 때 콘텐츠 값 대신 쓴다. 실패하면 null(콘텐츠 값으로 판단).
 */
export async function fetchLatestStamp(
  token: string | undefined,
  repo: Repo,
): Promise<ReleaseStamp | null> {
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
    if (!response.ok) {
      return null;
    }
    const latest = latestRelease((await response.json()) as ReleaseMeta[]);
    return latest === undefined ? null : releaseStamp(latest);
  } catch {
    return null;
  }
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
