import { GITHUB_API, GITHUB_CACHE_SECONDS, githubHeaders } from '@/shared/api';

/**
 * 저장소의 CHANGELOG.md 원문(마크다운). 서버에서만 부른다(진열장 페이지가 그릴 때, 결과는 1시간 캐시).
 * 파일이 없거나 실패하면 null — 화면은 "업데이트 내역 보기" 단추만 숨긴다.
 */
export async function fetchChangelog(repo: {
  readonly owner: string;
  readonly name: string;
}): Promise<string | null> {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${repo.owner}/${repo.name}/contents/CHANGELOG.md`,
      {
        headers: githubHeaders('application/vnd.github.raw'),
        next: { revalidate: GITHUB_CACHE_SECONDS },
      },
    );
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}
