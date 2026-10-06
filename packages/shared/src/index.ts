// 패키지의 공개 창구. package.json의 "exports"가 이 파일을 가리킨다.
// 바깥에서는 '@arqhive/shared'로만 가져다 쓰고, 안쪽 파일 경로에 직접 기대지 않는다.
// 빌드 없는 내부 패키지라 TS 원본을 그대로 내보내고, 쓰는 쪽(Next.js, wrangler)이 함께 컴파일한다.
// zod 스키마는 *-schema.ts에 따로 둔다. package.json의 "sideEffects": false 덕분에, 화면 코드처럼 스키마를 쓰지 않는 쪽의
// 묶음에는 그 파일(과 zod)이 들어가지 않는다.
export {
  type DownloadFile,
  type PatchDownloads,
  pickDownloads,
  type ReleaseAsset,
} from './download-files.ts';
export { type ReleaseAssets, releasesUrl, sumLargestDownloads } from './downloads.ts';
export type { Platform } from './platform.ts';
export { PLATFORM_FULL_NAMES, PLATFORM_LABELS, PLATFORMS } from './platform.ts';
export { platformSchema } from './platform-schema.ts';
export type { SubmittedReport } from './report.ts';
export {
  buildReportIssue,
  neutralizeMentions,
  parseReportBody,
  REPORT_LABEL,
  REPORT_LIMITS,
} from './report.ts';
export { type ReportInput, reportInputSchema } from './report-schema.ts';
