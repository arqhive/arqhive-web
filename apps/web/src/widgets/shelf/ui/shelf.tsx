'use client';

import {
  CaseSpine,
  groupOf,
  matchesFilter,
  type PatchCaseData,
  type PickHandler,
  PLATFORM_GROUPS,
  type PlatformFilter,
  SHELF_ROWS,
} from '@/entities/patch';

/**
 * 기종별 선반. 줄마다 기종 칸(라벨 + 등줄기들)을 나란히 놓고, 아래에 선반 판을 깐다.
 *
 * - 필터에 맞지 않는 케이스는 흐리게(opacity) 한다. 자리는 그대로라 선반 모양이 흔들리지 않는다.
 * - 휴대폰처럼 좁으면 줄마다 가로로 넘긴다(overflow-x-auto + scroll-snap).
 */
export function Shelf({
  items,
  filter,
  onPick,
}: {
  readonly items: readonly PatchCaseData[];
  readonly filter: PlatformFilter;
  readonly onPick: PickHandler;
}) {
  return (
    <div className="space-y-8">
      {SHELF_ROWS.map((row) => {
        const groups = PLATFORM_GROUPS.filter(
          (g) => row.includes(g.key) && items.some((item) => groupOf(item.platform) === g.key),
        );
        if (groups.length === 0) {
          return null;
        }
        return (
          <div key={row.join('-')}>
            <div className="flex snap-x items-end gap-6 overflow-x-auto px-1 pt-3">
              {groups.map((group) => (
                <section key={group.key} aria-label={`${group.label} 선반`} className="shrink-0">
                  {/* 기종 이름은 가로로 쓴다(세로쓰기면 로마자가 누워 읽기 어렵다) */}
                  <p className="mb-1.5 font-num text-ink-sub text-xs">{group.label}</p>
                  <div className="flex items-end gap-1">
                    {items
                      .filter((item) => groupOf(item.platform) === group.key)
                      .map((item) => (
                        <button
                          key={item.slug}
                          type="button"
                          aria-label={`${item.titleKo} 케이스 꺼내기`}
                          onClick={(event) => onPick(item, event.currentTarget)}
                          className={`shrink-0 snap-start transition-[translate,opacity] duration-200 hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-stamp focus-visible:outline-offset-2 ${matchesFilter(item, filter) ? 'opacity-100' : 'opacity-20'}`}
                        >
                          <CaseSpine patch={item} />
                        </button>
                      ))}
                  </div>
                </section>
              ))}
            </div>
            <div aria-hidden="true" className="h-3 bg-shelf" />
          </div>
        );
      })}
    </div>
  );
}
