import type { Patch } from '@arqhive/content';

/**
 * 진열장·목록·케이스(표지·속지)를 그리는 데 필요한 작품 정보만 고른 타입.
 *
 * Patch 전체에는 MDX 본문(컴파일된 코드 문자열)까지 들어 있어 크다. 클라이언트 컴포넌트로 넘기는 값은
 * 브라우저로 그대로 전송되므로, 필요한 필드만 골라 보낸다(서버 → 클라이언트 경계에서 데이터 줄이기).
 */
export type PatchCaseData = Pick<
  Patch,
  | 'slug'
  | 'catalogNo'
  | 'titleKo'
  | 'spineLines'
  | 'titleOriginal'
  | 'platform'
  | 'status'
  | 'latestVersion'
  | 'latestReleaseDate'
  | 'baseRegion'
  | 'patchMethodLabel'
  | 'summary'
>;

export function toCaseData(patch: Patch): PatchCaseData {
  return {
    slug: patch.slug,
    catalogNo: patch.catalogNo,
    titleKo: patch.titleKo,
    spineLines: patch.spineLines,
    titleOriginal: patch.titleOriginal,
    platform: patch.platform,
    status: patch.status,
    latestVersion: patch.latestVersion,
    latestReleaseDate: patch.latestReleaseDate,
    baseRegion: patch.baseRegion,
    patchMethodLabel: patch.patchMethodLabel,
    summary: patch.summary,
  };
}
