import { parseReportBody, REPORT_LABEL } from '@arqhive/shared';
import { GITHUB_API, githubHeaders } from '@/shared/api';
import type { Report, ReportReply } from '../model/report.ts';

/**
 * 제보 목록: 계정(owner)의 모든 저장소에서 "제보" 라벨이 붙은 이슈를 최신순으로 한 번에 찾는다(GitHub 검색 API).
 * 저장소마다 부르지 않아서 요청은 한 번이다. 결과는 5분 캐시(제보는 자주 들어오지 않고, 너무 늦게 보이지 않게).
 * 실패하면 빈 목록 — 화면은 "아직 들어온 제보가 없습니다"를 보여 준다.
 * 스팸·잘못된 제보는 GitHub에서 "Close as not planned"(또는 중복)로 닫으면 목록에서 빠진다.
 * 정상으로 닫은(completed) 이슈는 "반영됨"으로 보인다.
 * 댓글이 있는 이슈만 댓글을 따로 읽어, 제작자(owner 계정)가 단 것만 "제작자 답변"으로 붙인다.
 * 이슈는 공개라 아무나 댓글을 달 수 있으므로 다른 계정의 댓글은 사이트에 싣지 않는다.
 */

const CACHE_SECONDS = 300;
const PER_PAGE = 50;
/** 이슈 하나에서 읽는 댓글 수(한 쪽). 제보 하나에 답변이 이보다 많을 일은 없다 */
const COMMENTS_PER_PAGE = 100;

interface SearchItem {
  readonly id: number;
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly html_url: string;
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly repository_url: string;
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly comments_url: string;
  /** 댓글 수 */
  readonly comments: number;
  readonly state: 'open' | 'closed';
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly state_reason: 'completed' | 'not_planned' | 'duplicate' | 'reopened' | null;
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly created_at: string;
  readonly body: string | null;
}

interface CommentItem {
  readonly id: number;
  readonly user: { readonly login: string } | null;
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly created_at: string;
  readonly body: string | null;
}

/** "https://api.github.com/repos/arqhive/star-fox-2-korean-translation" → "arqhive/star-fox-2-korean-translation" */
function repoOf(repositoryUrl: string): string {
  return repositoryUrl.split('/repos/')[1] ?? '';
}

/** 이슈의 제작자 답변(오래된 순). 댓글이 없거나 읽기에 실패하면 빈 목록 — 제보 카드는 그대로 보인다 */
async function fetchReplies(item: SearchItem, owner: string): Promise<readonly ReportReply[]> {
  if (item.comments === 0) {
    return [];
  }
  try {
    const response = await fetch(`${item.comments_url}?per_page=${COMMENTS_PER_PAGE}`, {
      headers: githubHeaders(),
      next: { revalidate: CACHE_SECONDS },
    });
    if (!response.ok) {
      return [];
    }
    const comments = (await response.json()) as readonly CommentItem[];
    return comments
      .filter((comment) => comment.user?.login.toLowerCase() === owner.toLowerCase())
      .map((comment) => ({
        id: comment.id,
        createdAt: comment.created_at,
        text: (comment.body ?? '').trim(),
      }))
      .filter((reply) => reply.text !== '');
  } catch {
    return [];
  }
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
    const shown = items.filter(
      (item) => item.state_reason !== 'not_planned' && item.state_reason !== 'duplicate',
    );
    const replies = await Promise.all(shown.map((item) => fetchReplies(item, owner)));
    return shown.map((item, index) => ({
      id: item.id,
      repo: repoOf(item.repository_url),
      url: item.html_url,
      state: item.state,
      createdAt: item.created_at,
      ...parseReportBody(item.body ?? ''),
      replies: replies[index] ?? [],
    }));
  } catch {
    return [];
  }
}
