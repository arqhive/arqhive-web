import {
  type PatchDownloads,
  pickDownloads,
  type ReleaseAsset,
  type ReleaseAssets,
  releasesUrl,
  sumLargestDownloads,
} from '@arqhive/shared';
import { GITHUB_CACHE_SECONDS, githubHeaders } from '@/shared/api';

/** GitHub 릴리즈 목록 응답에서 쓰는 부분 */
interface Release extends ReleaseAssets {
  readonly draft: boolean;
  readonly prerelease: boolean;
  readonly assets: readonly (ReleaseAsset & ReleaseAssets['assets'][number])[];
}

/** 패치 하나의 릴리즈 정보: 누적 다운로드 수와, 매체·버튼이 바로 받게 할 파일 */
export interface ReleaseInfo {
  readonly downloadCount: number;
  /** 최신 릴리즈에서 고른 파일. 게임 코드가 없거나 규칙에 맞는 파일이 없으면 null(릴리즈 페이지로 보낸다) */
  readonly downloads: PatchDownloads | null;
}

/**
 * GitHub 릴리즈 정보(FSD api 칸: 바깥 서비스 호출). 서버에서만 부른다(진열장 페이지가 그릴 때).
 * 릴리즈 목록을 **한 번** 읽어 두 가지를 낸다.
 * - 다운로드 수: 일일 정산(api)과 같은 셈법(@arqhive/shared의 sumLargestDownloads: 릴리즈마다 가장 많이 받은 파일 하나)
 * - 직접 다운로드 파일: 정식(시험판·초안 아님) 최신 릴리즈에서 `[게임 코드]_KPatch_[버전]` 파일(pickDownloads)
 *
 * - 결과는 Next.js 데이터 캐시에 1시간 둔다(페이지의 revalidate와 같은 주기). 새 버전을 올리면 늦어도 1시간 뒤 바뀐다.
 * - GITHUB_TOKEN(읽기 전용)이 있으면 붙인다. 없으면 시간당 60번 한도라 개발할 때만 쓴다.
 * - 실패하면(한도 초과·네트워크 오류·저장소 없음) null. 화면은 다운로드 수를 빼고, 매체는 릴리즈 페이지로 보낸다.
 */
export async function fetchReleaseInfo(
  repo: { readonly owner: string; readonly name: string },
  downloadCode: string | undefined,
): Promise<ReleaseInfo | null> {
  try {
    const response = await fetch(releasesUrl(repo), {
      headers: githubHeaders(),
      next: { revalidate: GITHUB_CACHE_SECONDS },
    });
    if (!response.ok) {
      return null;
    }
    const releases = (await response.json()) as Release[];
    const latest = releases.find((release) => !(release.draft || release.prerelease));
    return {
      downloadCount: sumLargestDownloads(releases),
      downloads:
        latest === undefined || downloadCode === undefined
          ? null
          : pickDownloads(latest.assets, downloadCode),
    };
  } catch {
    return null;
  }
}
