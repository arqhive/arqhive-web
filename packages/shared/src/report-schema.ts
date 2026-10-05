import { z } from 'zod';
import { REPORT_LIMITS } from './report.ts';

/**
 * 제보 양식 입력(글 부분)의 검사 스키마. 이미지·봇 검사 값은 api가 따로 본다.
 * zod를 쓰는 검사는 서버(api)에서만 필요해서 report.ts와 파일을 나눈다(브라우저 묶음에 zod가 딸려 가지 않게).
 */

/** 패치 slug 최대 길이(콘텐츠 slug보다 넉넉하게) */
const SLUG_MAX = 100;

export const reportInputSchema = z.object({
  slug: z.string().min(1).max(SLUG_MAX),
  text: z.string().trim().min(REPORT_LIMITS.textMin).max(REPORT_LIMITS.textMax),
});

export type ReportInput = z.infer<typeof reportInputSchema>;
