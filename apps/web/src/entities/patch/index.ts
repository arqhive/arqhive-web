// entities/patch: "작품"이라는 업무 개념(명사). 데이터 모양과 그 표시(표지·등줄기·매체)를 맡는다.
// 열기·고르기 같은 사용자 행동은 여기 두지 않는다(widgets·pages의 몫).
export { CASE_SPECS, type CaseSpec } from './lib/case-spec.ts';
export {
  groupOf,
  matchesFilter,
  PLATFORM_GROUPS,
  type PlatformFilter,
  type PlatformGroupKey,
  recentlyUpdated,
  SHELF_ROWS,
  usedGroups,
} from './lib/platform-groups.ts';
export { type PatchCaseData, toCaseData } from './model/case-data.ts';
export type { PickHandler } from './model/pick.ts';
export { CaseCover } from './ui/case-cover.tsx';
export { CaseInner, CaseTray } from './ui/case-inside.tsx';
export { CaseMedia } from './ui/case-media.tsx';
export { CaseSpine } from './ui/case-spine.tsx';
