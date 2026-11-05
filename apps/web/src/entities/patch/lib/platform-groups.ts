import type { Platform } from '@arqhive/shared';
import { kstDayNumber } from '@/shared/lib';
import type { PatchCaseData } from '../model/case-data.ts';

/** "최근 갱신"으로 칠 기간(일). 오늘을 포함해 이만큼의 날 안에 갱신된 작품만 보여 준다 */
const RECENT_DAYS = 14;

/**
 * 기종 필터 칸. NDS와 DSiWare만 한 칸으로 묶고 나머지는 기종마다 따로 둔다(기획 문서 10장).
 * 선반 줄·필터 단추·목록 보기도 이 순서를 따른다: 거치형(새 기종부터) → 휴대용(새 기종부터).
 */
export const PLATFORM_GROUPS = [
  { key: 'wiiu', label: 'Wii U', platforms: ['wiiu'] },
  { key: 'wii', label: 'Wii', platforms: ['wii'] },
  { key: 'gc', label: 'GC', platforms: ['gc'] },
  { key: 'n64', label: 'N64', platforms: ['n64'] },
  { key: 'sfc', label: 'SFC', platforms: ['sfc'] },
  { key: '3ds', label: '3DS', platforms: ['3ds'] },
  { key: 'nds', label: 'NDS·DSi', platforms: ['nds', 'dsiware'] },
  { key: 'gba', label: 'GBA', platforms: ['gba'] },
  { key: 'gb', label: 'GB', platforms: ['gb'] },
] as const satisfies readonly { key: string; label: string; platforms: readonly Platform[] }[];

export type PlatformGroupKey = (typeof PLATFORM_GROUPS)[number]['key'];

/** 필터 값: 고른 기종 칸들(여러 개). 빈 목록이면 "전체"다 */
export type PlatformFilter = readonly PlatformGroupKey[];

/** 필터 단추 하나를 누른 결과. "전체"는 모두 해제하고, 기종은 켜고 끈다(마지막 하나를 끄면 다시 전체) */
export function toggleFilter(
  filter: PlatformFilter,
  key: PlatformGroupKey | 'all',
): PlatformFilter {
  if (key === 'all') {
    return [];
  }
  return filter.includes(key) ? filter.filter((k) => k !== key) : [...filter, key];
}

export function groupOf(platform: Platform): PlatformGroupKey {
  const group = PLATFORM_GROUPS.find((g) =>
    (g.platforms as readonly Platform[]).includes(platform),
  );
  return group?.key ?? 'gc';
}

/**
 * 기종 순서. PLATFORM_GROUPS 순서대로 늘어놓은 기종 목록 안의 자리라, 한 칸 안에서도 적힌 순서(NDS → DSiWare)를 따른다.
 * 목록 보기 정렬에 쓴다.
 */
export function platformRank(platform: Platform): number {
  return PLATFORM_GROUPS.flatMap((g): readonly Platform[] => g.platforms).indexOf(platform);
}

export function matchesFilter(item: PatchCaseData, filter: PlatformFilter): boolean {
  return filter.length === 0 || filter.includes(groupOf(item.platform));
}

/** 실제로 작품이 있는 필터 칸만(빈 칸은 보여 주지 않음) */
export function usedGroups(items: readonly PatchCaseData[]) {
  return PLATFORM_GROUPS.filter((g) => items.some((item) => groupOf(item.platform) === g.key));
}

/**
 * 최근 갱신된 배포 작품(최대 n개, 새로 나온 것 포함). 작업 중은 다운로드가 없어 뺀다.
 * 오늘(한국 시간)을 포함한 최근 2주(RECENT_DAYS일) 안에 갱신된 것만 고른다. 없으면 빈 목록.
 * 순서는 날짜 → 같은 날이면 릴리즈 공개 시각(늦게 올린 것이 왼쪽) → 제목. 공개 시각은 GitHub를 못 읽으면 없다.
 * today는 바깥에서 넘긴다(계산을 순수하게 두어 테스트·서버 렌더링 시점과 무관하게 만든다).
 */
export function recentlyUpdated(
  items: readonly PatchCaseData[],
  n: number,
  today: number,
): PatchCaseData[] {
  return items
    .filter(
      (item) =>
        item.status === 'released' && today - kstDayNumber(item.latestReleaseDate) < RECENT_DAYS,
    )
    .toSorted(
      (a, b) =>
        b.latestReleaseDate.localeCompare(a.latestReleaseDate) ||
        (b.latestPublishedAt ?? '').localeCompare(a.latestPublishedAt ?? '') ||
        a.titleKo.localeCompare(b.titleKo),
    )
    .slice(0, n);
}
