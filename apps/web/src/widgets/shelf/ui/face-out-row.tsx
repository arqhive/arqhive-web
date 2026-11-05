'use client';

import { useRef } from 'react';
import {
  CASE_SPECS,
  CaseCover,
  type PatchCaseData,
  type PickHandler,
  patchPath,
  pickOnPlainClick,
} from '@/entities/patch';
import { formatMonthDay } from '@/shared/lib';
import { useContentWidthRem } from '../model/use-content-width.ts';

/** 칸 하나의 최대 폭과 칸 사이 간격(rem). grid의 11rem·gap-5와 같다 */
const CELL_REM = 11;
const GAP_REM = 1.25;

/** 받침 선 폭 안에 칸 최대 폭으로 들어가는 표지 수. 아주 좁아도 2개는 두고 칸을 줄인다 */
function fitCount(widthRem: number): number {
  return Math.max(2, Math.floor((widthRem + GAP_REM) / (CELL_REM + GAP_REM)));
}

/**
 * 폭을 재기 전(서버에서 그린 첫 화면)에 쓰는 표지 수: 휴대폰 2개, 중간 폭 3개, 넓은 화면 4개.
 * 뒤쪽 것을 좁은 화면에서 숨긴다(index 2는 sm부터, 3은 lg부터 보임). 폭을 재면 fitCount로 바꾼다.
 */
const VISIBLE_FROM = ['', '', 'hidden sm:block', 'hidden lg:block'] as const;

/**
 * 최근 갱신된 패치를 표지가 보이게 세워 둔 칸(서점 평대처럼). 새로 나온 것도 포함한다.
 * - 가로 스크롤 없이 칸을 나눈 격자(grid)로 놓는다. 칸 하나의 폭은 최대 11rem.
 * - 칸을 컨테이너(@container)로 두고 표지 높이를 칸 폭 비례(cqw, case-spec의 faceHeight)로 정한다.
 *   그래서 칸이 좁아지면 표지도 함께 줄고, 기종 사이의 실물 크기 비율은 그대로다.
 * - 표지 높이가 기종마다 달라 아래를 맞춰 세운다(items-end).
 * - 표지 수는 받침 선 길이에 들어가는 만큼이다(폭을 재서 fitCount). 받은 것보다 많이 보여 주지는 않는다.
 */
export function FaceOutRow({
  items,
  onPick,
}: {
  readonly items: readonly PatchCaseData[];
  readonly onPick: PickHandler;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const widthRem = useContentWidthRem(ref);
  const count = widthRem === null ? null : fitCount(widthRem);
  const shown = count === null ? items : items.slice(0, count);

  return (
    <div>
      <ul
        ref={ref}
        className={`grid items-end gap-5 px-1 pt-3 ${count === null ? 'grid-cols-[repeat(2,minmax(0,11rem))] sm:grid-cols-[repeat(3,minmax(0,11rem))] lg:grid-cols-[repeat(4,minmax(0,11rem))]' : ''}`}
        style={
          count === null ? undefined : { gridTemplateColumns: `repeat(${count}, minmax(0, 11rem))` }
        }
      >
        {shown.map((item, index) => (
          <li
            key={item.slug}
            className={`@container ${count === null ? (VISIBLE_FROM[index] ?? 'hidden') : ''}`}
          >
            <a
              href={patchPath(item.slug)}
              aria-label={`${item.titleKo} 한글 패치`}
              data-track="case-open"
              data-track-patch={item.slug}
              onClick={(event) => pickOnPlainClick(event, item, onPick)}
              className={`block ${CASE_SPECS[item.platform].aspect} ${CASE_SPECS[item.platform].faceHeight} transition-[translate] duration-200 hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-stamp focus-visible:outline-offset-2`}
            >
              <CaseCover patch={item} />
            </a>
            <p className="mt-2 font-num text-ink-sub text-xs">
              {formatMonthDay(item.latestReleaseDate)} 갱신
            </p>
          </li>
        ))}
      </ul>
      {/* 받침 선: 목록 보기 위쪽 선과 같은 잉크색 굵은 선(사이트 기본 톤) */}
      <div aria-hidden="true" className="mt-2 border-ink border-t-2" />
    </div>
  );
}
