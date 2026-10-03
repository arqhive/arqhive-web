'use client';

import { CASE_SPECS, CaseCover, type PatchCaseData, type PickHandler } from '@/entities/patch';
import { formatMonthDay } from '@/shared/lib';

/**
 * 최근 갱신된 패치를 표지가 보이게 세워 둔 칸(서점 평대처럼). 새로 나온 것도 포함한다.
 * 휴대폰에서는 가로로 넘긴다.
 */
export function FaceOutRow({
  items,
  onPick,
}: {
  readonly items: readonly PatchCaseData[];
  readonly onPick: PickHandler;
}) {
  return (
    <div>
      <ul className="flex snap-x gap-5 overflow-x-auto px-1 pt-3">
        {items.map((item) => (
          <li key={item.slug} className="shrink-0 snap-start">
            <button
              type="button"
              aria-label={`${item.titleKo} 케이스 꺼내기`}
              onClick={(event) => onPick(item, event.currentTarget)}
              className={`block ${CASE_SPECS[item.platform].aspect} w-36 transition-[translate] duration-200 hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-stamp focus-visible:outline-offset-2 sm:w-44`}
            >
              <CaseCover patch={item} />
            </button>
            <p className="mt-2 font-num text-ink-sub text-xs">
              {formatMonthDay(item.latestReleaseDate)} 갱신 · {item.latestVersion}
            </p>
          </li>
        ))}
      </ul>
      <div aria-hidden="true" className="mt-1 h-3 bg-shelf" />
    </div>
  );
}
