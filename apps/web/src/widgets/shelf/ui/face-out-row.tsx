'use client';

import { CASE_SPECS, CaseCover, type PatchCaseData, type PickHandler } from '@/entities/patch';
import { formatMonthDay } from '@/shared/lib';

/**
 * 화면 폭에 따라 보여 줄 표지 수: 휴대폰 2개, 중간 폭 3개, 넓은 화면 4개.
 * 받은 작품(최대 4개) 중 뒤쪽 것을 좁은 화면에서 숨긴다(index 2는 sm부터, 3은 lg부터 보임).
 */
const VISIBLE_FROM = ['', '', 'hidden sm:block', 'hidden lg:block'] as const;

/**
 * 최근 갱신된 패치를 표지가 보이게 세워 둔 칸(서점 평대처럼). 새로 나온 것도 포함한다.
 * - 가로 스크롤 없이 칸을 나눈 격자(grid)로 놓는다. 칸 하나의 폭은 최대 11rem.
 * - 칸을 컨테이너(@container)로 두고 표지 높이를 칸 폭 비례(cqw, case-spec의 faceHeight)로 정한다.
 *   그래서 칸이 좁아지면 표지도 함께 줄고, 기종 사이의 실물 크기 비율은 그대로다.
 * - 표지 높이가 기종마다 달라 아래를 맞춰 세운다(items-end).
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
      <ul className="grid grid-cols-[repeat(2,minmax(0,11rem))] items-end gap-5 px-1 pt-3 sm:grid-cols-[repeat(3,minmax(0,11rem))] lg:grid-cols-[repeat(4,minmax(0,11rem))]">
        {items.map((item, index) => (
          <li key={item.slug} className={`@container ${VISIBLE_FROM[index] ?? 'hidden'}`}>
            <button
              type="button"
              aria-label={`${item.titleKo} 케이스 꺼내기`}
              onClick={(event) => onPick(item, event.currentTarget)}
              className={`block ${CASE_SPECS[item.platform].aspect} ${CASE_SPECS[item.platform].faceHeight} transition-[translate] duration-200 hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-stamp focus-visible:outline-offset-2`}
            >
              <CaseCover patch={item} />
            </button>
            <p className="mt-2 font-num text-ink-sub text-xs">
              {formatMonthDay(item.latestReleaseDate)} 갱신
            </p>
          </li>
        ))}
      </ul>
      <div aria-hidden="true" className="shelf-ledge mt-1 h-5 rounded-sm" />
    </div>
  );
}
