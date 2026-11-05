import { CASE_SPECS, hasSideFlap, hasSquareCorners } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';
import { CoverPrint } from './cover-print.tsx';

/**
 * 바깥 종이상자.
 * - GC: 일본판은 검은 킵 케이스가 종이상자에 한 번 더 들어 있다. 표지는 상자에 인쇄하고 안의 킵 케이스 앞면은 비워 둔다.
 * - SFC·GB·GBA·N64: 상자 안에 카트리지와 설명서가 들어 있다(속 지지대는 그리지 않는다).
 */

/**
 * 상자가 열리는 쪽. 보통은 윗뚜껑이 위쪽 모서리를 축으로 젖혀지고 상자가 아래로 빠진다.
 * N64는 오른쪽 옆 날개가 왼쪽 모서리를 축으로 젖혀지고 상자가 오른쪽으로 빠진다(가로가 긴 상자, 옆에서 꺼낸다).
 * 닫힌 동안 뚜껑·날개는 90도 누워 보이지 않는다. 날개 폭은 상자 깊이(32mm) ÷ 폭(177mm).
 */
const TOP_OPENING = {
  lid: 'inset-x-0 bottom-full h-[11%] origin-bottom',
  lidOpen: '-rotate-x-18',
  lidClosed: 'rotate-x-90',
  unboxed: 'translate-y-[75%]',
} as const;
const SIDE_OPENING = {
  lid: 'inset-y-0 left-full w-[18%] origin-left',
  lidOpen: '-rotate-y-18',
  lidClosed: 'rotate-y-90',
  unboxed: 'translate-x-[75%]',
} as const;

/** 상자 앞면: 무광 종이에 표지 인쇄물 */
export function CartonFront({ patch }: { readonly patch: PatchCaseData }) {
  return (
    // 종이상자 모서리는 살짝 둥글다(표지 폭 비례). GC 상자는 각지다.
    <div
      className={`relative size-full overflow-hidden ${hasSquareCorners(CASE_SPECS[patch.platform]) ? '' : 'rounded-[2cqw]'}`}
    >
      <CoverPrint patch={patch} />
      <div className="paper-print pointer-events-none absolute inset-0" />
    </div>
  );
}

/**
 * 케이스 열기 연출에서 케이스를 덮고 있는 상자.
 * - lidOpen: 뚜껑(N64는 옆 날개)이 열린다.
 * - unboxed: 상자가 아래(N64는 오른쪽)로 빠지며 흐려진다. 그만큼 안의 케이스가 드러나 "꺼내는" 모습이 된다.
 * 뚜껑의 3D 회전 원근은 부모에 준다(perspective 속성은 바로 아래 자식의 3D 회전에 적용된다).
 */
export function CaseCarton({
  patch,
  lidOpen,
  unboxed,
}: {
  readonly patch: PatchCaseData;
  readonly lidOpen: boolean;
  readonly unboxed: boolean;
}) {
  const opening = hasSideFlap(patch.platform) ? SIDE_OPENING : TOP_OPENING;
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 perspective-[900px] transition-[translate,opacity] duration-[calc(650ms*var(--case-tempo,1))] ease-in motion-reduce:transition-none ${unboxed ? `${opening.unboxed} opacity-0` : 'translate-0 opacity-100'}`}
    >
      {/* 뚜껑(날개): 상자 가장자리에 붙어 있다가 열리면 일어서며 젖혀진다. 색은 상자 앞면과 같은 기종 색 */}
      <div
        className={`paper-lid ${CASE_SPECS[patch.platform].caseClass} absolute ${opening.lid} transition-transform duration-[calc(450ms*var(--case-tempo,1))] ease-out motion-reduce:transition-none ${lidOpen ? opening.lidOpen : opening.lidClosed}`}
      />
      <CartonFront patch={patch} />
    </div>
  );
}
