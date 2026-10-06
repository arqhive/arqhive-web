import { patches } from '@arqhive/content';
import type { PatchFacts } from './types.ts';

/**
 * 콘텐츠(MDX frontmatter)에서 getPatch 도구가 돌려줄 사실만 고른다.
 * 운영과 평가가 같은 실제 패치 정보를 쓴다(평가 사례는 비슷한 제보·가이드만 고정값으로 준다).
 */
export function patchFacts(slug: string): PatchFacts | null {
  const patch = patches.find((candidate) => candidate.slug === slug);
  if (patch === undefined) {
    return null;
  }
  return {
    slug: patch.slug,
    title: patch.titleKo,
    platform: patch.platform,
    status: patch.status,
    latestVersion: patch.latestVersion,
    baseRegion: patch.baseRegion,
    patchMethod: patch.patchMethodLabel,
    translationScope: patch.translationScope,
    compatibility: patch.compatibility,
    knownIssues: patch.knownIssues,
  };
}
