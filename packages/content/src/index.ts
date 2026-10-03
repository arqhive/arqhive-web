// 패키지의 공개 창구. Velite가 만든 데이터(.velite/)를 그대로 다시 내보낸다.
// .velite/는 빌드 결과물이라 git에 올리지 않고, `velite build`(이 패키지의 build·typecheck 스크립트)가 만든다.
export type { Guide, Patch } from '../.velite/index.js';
export { guides, patches } from '../.velite/index.js';
