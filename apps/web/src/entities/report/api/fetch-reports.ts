import { parseReportBody, REPORT_LABEL } from '@arqhive/shared';
import { GITHUB_API, githubHeaders } from '@/shared/api';
import type { Report } from '../model/report.ts';

/**
 * 제보 목록: 계정(owner)의 모든 저장소에서 "제보" 라벨이 붙은 이슈를 최신순으로 한 번에 찾는다(GitHub 검색 API).
 * 저장소마다 부르지 않아서 요청은 한 번이다. 결과는 5분 캐시(제보는 자주 들어오지 않고, 너무 늦게 보이지 않게).
 * 실패하면 빈 목록 — 화면은 "아직 들어온 제보가 없습니다"를 보여 준다.
 * 스팸·잘못된 제보는 GitHub에서 "Close as not planned"(또는 중복)로 닫으면 목록에서 빠진다.
 * 정상으로 닫은(completed) 이슈는 "반영됨"으로 보인다.
 */

const CACHE_SECONDS = 300;
const PER_PAGE = 50;

interface SearchItem {
  readonly id: number;
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly html_url: string;
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly repository_url: string;
  readonly state: 'open' | 'closed';
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly state_reason: 'completed' | 'not_planned' | 'duplicate' | 'reopened' | null;
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly created_at: string;
  readonly body: string | null;
}

/** "https://api.github.com/repos/arqhive/star-fox-2-korean-translation" → "arqhive/star-fox-2-korean-translation" */
function repoOf(repositoryUrl: string): string {
  return repositoryUrl.split('/repos/')[1] ?? '';
}

export async function fetchReports(owner: string): Promise<readonly Report[]> {
  const query = encodeURIComponent(`user:${owner} is:issue label:"${REPORT_LABEL}"`);
  try {
    const response = await fetch(
      `${GITHUB_API}/search/issues?q=${query}&sort=created&order=desc&per_page=${PER_PAGE}`,
      { headers: githubHeaders(), next: { revalidate: CACHE_SECONDS } },
    );
    if (!response.ok) {
      return [];
    }
    const { items } = (await response.json()) as { readonly items: readonly SearchItem[] };
    return items
      .filter((item) => item.state_reason !== 'not_planned' && item.state_reason !== 'duplicate')
      .map((item) => ({
        id: item.id,
        repo: repoOf(item.repository_url),
        url: item.html_url,
        state: item.state,
        createdAt: item.created_at,
        ...parseReportBody(item.body ?? ''),
      }));
  } catch {
    return [];
  }
}
