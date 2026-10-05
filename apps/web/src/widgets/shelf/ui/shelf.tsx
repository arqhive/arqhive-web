'use client';

import { useRef } from 'react';
import {
  CaseSpine,
  groupOf,
  matchesFilter,
  type PatchCaseData,
  type PickHandler,
  PLATFORM_GROUPS,
  type PlatformFilter,
  patchPath,
  pickOnPlainClick,
} from '@/entities/patch';
import { packRows, type ShelfRow } from '../lib/pack-rows.ts';
import { useContentWidthRem } from '../model/use-content-width.ts';

/** 칸 하나 높이(pt-8 + 등줄기 h-60 + pb-7). shelf-materials.css의 --row-h와 같다 */
const ROW_HEIGHT = 'h-[18.75rem]';

/** 케이스 한 자리: 등줄기 링크(패치 주소) + (그 칸에서 묶음의 첫 케이스면) 선반 판 앞면의 분류 표찰 */
function ShelfSpine({
  item,
  label,
  dimmed,
  onPick,
}: {
  readonly item: PatchCaseData;
  readonly label: string | null;
  readonly dimmed: boolean;
  readonly onPick: PickHandler;
}) {
  return (
    <div className="relative shrink-0 pt-8 pb-7">
      <a
        href={patchPath(item.slug)}
        aria-label={`${item.titleKo} 한글 패치`}
        // 패치 주소(/korean-translation/<slug>)로 들어왔을 때 이 등줄기를 찾아 꺼낸다
        data-slug={item.slug}
        onClick={(event) => pickOnPlainClick(event, item, onPick)}
        className={`block transition-[translate,opacity] duration-200 hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-stamp focus-visible:outline-offset-2 ${dimmed ? 'opacity-20' : 'opacity-100'}`}
      >
        <CaseSpine patch={item} />
      </a>
      {/* 기종 이름은 가로로 쓴다(세로쓰기면 로마자가 누워 읽기 어렵다) */}
      {label === null ? null : (
        <p className="shelf-label absolute bottom-1 left-0 z-10 whitespace-nowrap rounded-[2px] px-2 py-0.5 font-num text-xs leading-tight">
          {label}
        </p>
      )}
    </div>
  );
}

/** 같은 칸 안에서 두 기종 묶음 사이에 세우는 금속 북엔드 */
function Bookend() {
  return (
    <div
      aria-hidden="true"
      className={`flex w-8 shrink-0 items-end justify-center pb-7 ${ROW_HEIGHT}`}
    >
      <div className="shelf-bookend h-24 w-1.5 rounded-t-sm" />
    </div>
  );
}

/**
 * 기종별 선반(도서관 책장). 책장 틀(bookcase) 안에 케이스를 왼쪽부터 채우고, 한 칸이 차면 다음 칸으로 내린다.
 * 가로 스크롤은 없다.
 *
 * - 칸 나누기는 책장 안쪽 폭을 재서(useContentWidthRem) 계산한다(lib/pack-rows.ts).
 *   북엔드는 같은 칸 안의 두 묶음 사이에만 서고, 묶음이 두 칸에 걸치면 칸마다 표찰을 붙인다.
 * - 폭을 재기 전(서버에서 그린 첫 화면)에는 북엔드 없이 줄바꿈 흐름(flex-wrap)으로 대신 보여 준다.
 * - 뒤판·선반 판은 칸 높이마다 반복되는 배경(shelf-rows)이라, 칸이 몇 개든 칸마다 판이 깔린다.
 * - 필터에 맞지 않는 케이스는 흐리게(opacity) 한다. 자리는 그대로라 책장 모양이 흔들리지 않는다.
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
  const ref = useRef<HTMLDivElement>(null);
  const widthRem = useContentWidthRem(ref);
  const groups = PLATFORM_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    members: items.filter((item) => groupOf(item.platform) === group.key),
  })).filter(({ members }) => members.length > 0);
  // 폭을 모르면 칸을 무한히 넓게 보고 한 줄로 만든 뒤, 아래에서 줄바꿈 흐름으로 펼친다.
  const rows: ShelfRow<PatchCaseData>[] = packRows(
    groups,
    widthRem ?? Number.POSITIVE_INFINITY,
    (item) => item.slug,
  );

  return (
    <div className="bookcase">
      <div ref={ref} className="shelf-rows overflow-hidden px-4">
        {rows.map((row) => (
          <div
            key={row.map((slot) => (slot.kind === 'item' ? slot.item.slug : slot.key)).join()}
            className={`flex gap-x-0.5 ${widthRem === null ? 'flex-wrap' : ROW_HEIGHT}`}
          >
            {row
              // 폭을 재기 전(흐름 배치)에는 줄 끝에 홀로 설 수 있으므로 북엔드를 빼고 보여 준다.
              .filter((slot) => widthRem !== null || slot.kind === 'item')
              .map((slot) =>
                slot.kind === 'bookend' ? (
                  <Bookend key={slot.key} />
                ) : (
                  <ShelfSpine
                    key={slot.item.slug}
                    item={slot.item}
                    label={slot.label}
                    dimmed={!matchesFilter(slot.item, filter)}
                    onPick={onPick}
                  />
                ),
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
