import { patches } from '@arqhive/content';
import type { ReleaseStamp } from '@arqhive/shared';
import type { PatchFacts } from './types.ts';

/**
 * 콘텐츠(MDX frontmatter)에서 getPatch 도구가 돌려줄 사실만 고른다.
 * 운영과 평가가 같은 실제 패치 정보를 쓴다(평가 사례는 비슷한 제보·가이드만 고정값으로 준다).
 * 운영에서는 GitHub 최신 릴리즈의 버전(latest)을 넘겨 콘텐츠 값보다 먼저 쓴다(릴리즈만 올리고 콘텐츠를 안 고쳐도 맞게).
 */
export function patchFacts(slug: string, latest: ReleaseStamp | null = null): PatchFacts | null {
  const patch = patches.find((candidate) => candidate.slug === slug);
  if (patch === undefined) {
    return null;
  }
  return {
    slug: patch.slug,
    title: patch.titleKo,
    platform: patch.platform,
    status: patch.status,
    latestVersion: latest?.version ?? patch.latestVersion,
    baseRegion: patch.baseRegion,
    patchMethod: patch.patchMethodLabel,
    translationScope: patch.translationScope,
    compatibility: patch.compatibility,
    knownIssues: patch.knownIssues,
  };
}

/** 패치 저장소(최신 릴리즈를 읽으려고). 없는 slug면 null */
export function patchRepo(slug: string): { readonly owner: string; readonly name: string } | null {
  return patches.find((candidate) => candidate.slug === slug)?.repo ?? null;
}
