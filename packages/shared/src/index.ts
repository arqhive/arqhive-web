// 패키지의 공개 창구. package.json의 "exports"가 이 파일을 가리킨다.
// 바깥에서는 '@arqhive/shared'로만 가져다 쓰고, 안쪽 파일 경로에 직접 기대지 않는다.
// 빌드 없는 내부 패키지라 TS 원본을 그대로 내보내고, 쓰는 쪽(Next.js, wrangler)이 함께 컴파일한다.
export type { Platform } from './platform.ts';
export { PLATFORM_LABELS, PLATFORMS, platformSchema } from './platform.ts';
