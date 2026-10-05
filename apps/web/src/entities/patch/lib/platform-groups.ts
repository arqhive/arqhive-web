import type { Platform } from '@arqhive/shared';
import { kstDayNumber } from '@/shared/lib';
import type { PatchCaseData } from '../model/case-data.ts';

/** "최근 갱신"으로 칠 기간(일). 오늘을 포함해 이만큼의 날 안에 갱신된 작품만 보여 준다 */
const RECENT_DAYS = 14;

/**
 * 기종 필터 칸. NDS와 DSiWare만 한 칸으로 묶고 나머지는 기종마다 따로 둔다(기획 문서 10장).
 * 선반 줄도 이 칸을 단위로 구성한다.
 */
export const PLATFORM_GROUPS = [
  { key: 'gc', label: 'GC', platforms: ['gc'] },
  { key: 'wii', label: 'Wii', platforms: ['wii'] },
  { key: 'wiiu', label: 'Wii U', platforms: ['wiiu'] },
  { key: '3ds', label: '3DS', platforms: ['3ds'] },
  { key: 'nds', label: 'NDS·DSi', platforms: ['nds', 'dsiware'] },
  { key: 'n64', label: 'N64', platforms: ['n64'] },
  { key: 'sfc', label: 'SFC', platforms: ['sfc'] },
  { key: 'gb', label: 'GB', platforms: ['gb'] },
  { key: 'gba', label: 'GBA', platforms: ['gba'] },
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
        a.titleKo.localeCompare(b.titleKo),
    )
    .slice(0, n);
}
