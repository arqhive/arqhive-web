import { type ReleaseAssets, releasesUrl, sumLargestDownloads } from '@arqhive/shared';
import { GITHUB_CACHE_SECONDS, githubHeaders } from '@/shared/api';

/**
 * GitHub 릴리즈 다운로드 수(FSD api 칸: 바깥 서비스 호출). 서버에서만 부른다(진열장 페이지가 그릴 때).
 * 세는 법은 일일 정산(api)과 함께 쓰는 @arqhive/shared의 sumLargestDownloads(릴리즈마다 가장 많이 받은 파일 하나를 더함).
 *
 * - 결과는 Next.js 데이터 캐시에 1시간 둔다(페이지의 revalidate와 같은 주기). 패치 수만큼(지금 22번) 시간당 한 번씩 부른다.
 * - GITHUB_TOKEN(읽기 전용)이 있으면 붙인다. 없으면 시간당 60번 한도라 개발할 때만 쓴다.
 * - 실패하면(한도 초과·네트워크 오류·저장소 없음) null. 화면은 다운로드 수만 빼고 정상으로 그린다.
 */
export async function fetchDownloadCount(repo: {
  readonly owner: string;
  readonly name: string;
}): Promise<number | null> {
  try {
    const response = await fetch(releasesUrl(repo), {
      headers: githubHeaders(),
      next: { revalidate: GITHUB_CACHE_SECONDS },
    });
    if (!response.ok) {
      return null;
    }
    return sumLargestDownloads((await response.json()) as ReleaseAssets[]);
  } catch {
    return null;
  }
}
