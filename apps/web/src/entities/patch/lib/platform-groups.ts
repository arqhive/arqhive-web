import type { Platform } from '@arqhive/shared';
import type { PatchCaseData } from '../model/case-data.ts';

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

/** 필터 값: 기종 칸 하나 또는 전체 */
export type PlatformFilter = PlatformGroupKey | 'all';

/** 선반 줄 구성(위에서 아래로). 선반이 너무 길어지지 않게 세 줄로 나눈다. */
export const SHELF_ROWS: readonly (readonly PlatformGroupKey[])[] = [
  ['gc', 'wii', 'wiiu'],
  ['3ds', 'nds'],
  ['n64', 'sfc', 'gb', 'gba'],
];

export function groupOf(platform: Platform): PlatformGroupKey {
  const group = PLATFORM_GROUPS.find((g) =>
    (g.platforms as readonly Platform[]).includes(platform),
  );
  return group?.key ?? 'gc';
}

export function matchesFilter(item: PatchCaseData, filter: PlatformFilter): boolean {
  return filter === 'all' || groupOf(item.platform) === filter;
}

/** 실제로 작품이 있는 필터 칸만(빈 칸은 보여 주지 않음) */
export function usedGroups(items: readonly PatchCaseData[]) {
  return PLATFORM_GROUPS.filter((g) => items.some((item) => groupOf(item.platform) === g.key));
}

/** 최근 갱신된 배포 작품 n개(새로 나온 것 포함). 작업 중은 다운로드가 없어 뺀다. */
export function recentlyUpdated(items: readonly PatchCaseData[], n: number): PatchCaseData[] {
  return items
    .filter((item) => item.status === 'released')
    .toSorted(
      (a, b) =>
        b.latestReleaseDate.localeCompare(a.latestReleaseDate) ||
        a.titleKo.localeCompare(b.titleKo),
    )
    .slice(0, n);
}
