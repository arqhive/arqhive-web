import type { Patch } from '@arqhive/content';
import type { PatchDownloads } from '@arqhive/shared';

/**
 * 진열장·목록·케이스(표지·속지)를 그리는 데 필요한 작품 정보만 고른 타입.
 *
 * Patch 전체에는 MDX 본문(컴파일된 코드 문자열)까지 들어 있어 크다. 클라이언트 컴포넌트로 넘기는 값은
 * 브라우저로 그대로 전송되므로, 필요한 필드만 골라 보낸다(서버 → 클라이언트 경계에서 데이터 줄이기).
 */
type CaseContentData = Pick<
  Patch,
  | 'slug'
  | 'catalogNo'
  | 'downloadCode'
  | 'titleKo'
  | 'spineLines'
  | 'titleOriginal'
  | 'platform'
  | 'status'
  | 'repo'
  | 'latestVersion'
  | 'latestReleaseDate'
  | 'baseRegion'
  | 'patchMethodLabel'
  | 'translationScope'
  | 'knownIssues'
  | 'compatibility'
  | 'discArt'
  | 'extraDownloads'
>;

export type PatchCaseData = CaseContentData & {
  /** 릴리즈 다운로드 수(릴리즈마다 가장 많이 받은 파일의 합). 콘텐츠가 아니라 서버가 GitHub에서 읽어 붙인다. 모르면 null */
  readonly downloadCount: number | null;
  /** 매체·버튼이 바로 받게 할 파일(최신 릴리즈, 서버가 붙인다). 모르면 null — 그때는 릴리즈 페이지로 보낸다 */
  readonly downloads: PatchDownloads | null;
};

export function toCaseData(patch: Patch): PatchCaseData {
  return {
    slug: patch.slug,
    catalogNo: patch.catalogNo,
    downloadCode: patch.downloadCode,
    titleKo: patch.titleKo,
    spineLines: patch.spineLines,
    titleOriginal: patch.titleOriginal,
    platform: patch.platform,
    status: patch.status,
    repo: patch.repo,
    latestVersion: patch.latestVersion,
    latestReleaseDate: patch.latestReleaseDate,
    baseRegion: patch.baseRegion,
    patchMethodLabel: patch.patchMethodLabel,
    translationScope: patch.translationScope,
    knownIssues: patch.knownIssues,
    compatibility: patch.compatibility,
    discArt: patch.discArt,
    extraDownloads: patch.extraDownloads,
    downloadCount: null,
    downloads: null,
  };
}
