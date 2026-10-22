import {
  fetchReleaseList,
  latestRelease,
  type PatchDownloads,
  pickDownloads,
  type ReleaseAsset,
  type ReleaseAssets,
  type ReleaseMeta,
  type ReleaseStamp,
  releaseStamp,
  releasesUrl,
  sumLargestDownloads,
} from '@arqhive/shared';
import { unstable_cache } from 'next/cache';
import { GITHUB_CACHE_SECONDS, githubHeaders } from '@/shared/api';

/** GitHub 릴리즈 목록 응답에서 쓰는 부분 */
interface Release extends ReleaseAssets, ReleaseMeta {
  readonly assets: readonly (ReleaseAsset & ReleaseAssets['assets'][number])[];
}

/** 패치 하나의 릴리즈 정보: 누적 다운로드 수와, 매체·버튼이 바로 받게 할 파일 */
interface ReleaseInfo {
  readonly downloadCount: number;
  /** 최신 릴리즈에서 고른 파일. 게임 코드가 없거나 규칙에 맞는 파일이 없으면 null(릴리즈 페이지로 보낸다) */
  readonly downloads: PatchDownloads | null;
  /** 최신 정식 릴리즈의 버전(태그)·한국 날짜. 콘텐츠의 latestVersion·latestReleaseDate 대신 쓴다. 없으면 null */
  readonly latest: ReleaseStamp | null;
}

/** GitHub에서 바로 읽는다(캐시 없음). 못 읽으면(빈 목록 포함) 던진다 — 아래 캐시가 직전 값을 지키게 */
async function readReleaseInfo(
  owner: string,
  name: string,
  downloadCode: string | undefined,
): Promise<ReleaseInfo> {
  const releases = await fetchReleaseList<Release>(() =>
    fetch(releasesUrl({ owner, name }), { headers: githubHeaders(), cache: 'no-store' }),
  );
  if (releases === null) {
    throw new Error(`GitHub 릴리즈를 못 읽음: ${owner}/${name}`);
  }
  const latest = latestRelease(releases);
  return {
    downloadCount: sumLargestDownloads(releases),
    downloads:
      latest === undefined || downloadCode === undefined
        ? null
        : pickDownloads(latest.assets, downloadCode),
    latest: latest === undefined ? null : releaseStamp(latest),
  };
}

/**
 * 저장소마다 마지막으로 **제대로 읽은** 릴리즈 정보를 10분 기억한다(Next.js unstable_cache).
 * 다시 읽다가 던지면 Next.js가 옛 값을 그대로 돌려주고 캐시를 덮지 않는다(next/dist/.../unstable-cache.js,
 * 「Return the stale value on error」 10/23 확인). 그래서 GitHub이 잠깐 빈 목록을 줘도 그 저장소만 직전 값으로 남는다.
 */
const cachedReleaseInfo = unstable_cache(readReleaseInfo, ['release-info-v1'], {
  revalidate: GITHUB_CACHE_SECONDS,
});

/**
 * GitHub 릴리즈 정보(FSD api 칸: 바깥 서비스 호출). 서버에서만 부른다(진열장 페이지가 그릴 때).
 * 릴리즈 목록을 **한 번** 읽어 세 가지를 낸다.
 * - 다운로드 수: 일일 정산(api)과 같은 셈법(@arqhive/shared의 sumLargestDownloads: 릴리즈마다 가장 많이 받은 파일 하나)
 * - 직접 다운로드 파일: 정식(시험판·초안 아님) 최신 릴리즈에서 `[게임 코드]_KPatch_[버전]` 파일(pickDownloads)
 * - 최신 버전·날짜: 같은 릴리즈의 태그와 공개 날짜(releaseStamp). 릴리즈만 올려도 화면의 버전 표시가 따라온다
 *
 * - 결과는 저장소마다 10분 기억한다(페이지의 revalidate와 같은 주기). 새 버전을 올리면 늦어도 20분 뒤 바뀐다.
 * - GitHub이 가끔 200과 빈 목록([])을 준다(10/23, 같은 요청이 16개 → 0개 → 0개). 예전에는 그걸 그대로 믿고 캐시해서
 *   버전이 콘텐츠 예비값(옛 버전)으로, 다운로드 수가 0으로 돌아갔다. 이제 빈 목록은 실패로 보고(fetchReleaseList가 다시 받기),
 *   실패하면 직전에 제대로 읽은 값을 쓴다.
 * - 기억한 값도 없는데 못 읽으면(처음 배포 직후 등) null. 화면은 다운로드 수를 빼고, 버전은 콘텐츠 예비값을 쓴다.
 * - GITHUB_TOKEN(읽기 전용)이 있으면 붙인다. 없으면 시간당 60번 한도라 개발할 때만 쓴다.
 */
export async function fetchReleaseInfo(
  repo: { readonly owner: string; readonly name: string },
  downloadCode: string | undefined,
): Promise<ReleaseInfo | null> {
  try {
    return await cachedReleaseInfo(repo.owner, repo.name, downloadCode);
  } catch {
    return null;
  }
}

export type { ReleaseInfo };
