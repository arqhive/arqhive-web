import type { ReactNode } from 'react';
import { CASE_SPECS } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';
import { CoverPrint } from './cover-print.tsx';

/**
 * 바깥 종이상자.
 * - GC: 일본판은 검은 킵 케이스가 종이상자에 한 번 더 들어 있다. 표지는 상자에 인쇄하고 안의 킵 케이스 앞면은 비워 둔다.
 * - SFC·GB·GBA: 상자 안에 카트리지와 설명서가 들어 있다(속 지지대는 그리지 않는다).
 */

/** 상자 앞면: 무광 종이에 표지 인쇄물 */
export function CartonFront({ patch }: { readonly patch: PatchCaseData }) {
  return (
    // 종이상자 모서리는 살짝 둥글다(표지 폭 비례).
    <div className="relative size-full overflow-hidden rounded-[2cqw]">
      <CoverPrint patch={patch} />
      <div className="paper-print pointer-events-none absolute inset-0" />
    </div>
  );
}

/**
 * 케이스 열기 연출에서 케이스를 덮고 있는 상자.
 * - lidOpen: 윗뚜껑이 열린다(위쪽 모서리를 축으로 뒤로 젖혀짐). 닫힌 동안은 옆으로 누워 보이지 않는다.
 * - unboxed: 상자가 아래로 빠지며 흐려진다. 그만큼 안의 케이스가 위로 드러나 "꺼내는" 모습이 된다.
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
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 perspective-[900px] transition-[translate,opacity] duration-[650ms] ease-in motion-reduce:transition-none ${unboxed ? 'translate-y-[75%] opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      {/* 윗뚜껑: 상자 위쪽에 붙어 있다가 열리면 일어서며 뒤로 젖혀진다. 색은 상자 앞면과 같은 기종 색 */}
      <div
        className={`paper-lid ${CASE_SPECS[patch.platform].caseClass} absolute inset-x-0 bottom-full h-[11%] origin-bottom transition-transform duration-[450ms] ease-out motion-reduce:transition-none ${lidOpen ? '-rotate-x-18' : 'rotate-x-90'}`}
      />
      <CartonFront patch={patch} />
    </div>
  );
}

/**
 * 설명서 앞면(카트리지 상자). 상자보다 조금 작은 종이 책자에 게임 이름만 인쇄한다(표지 전체는 상자에 있다).
 * 열기 연출에서 넘어가는 앞면이 되고, 넘기면 뒷면(ManualInner)에 패치 정보가 보인다.
 */
export function ManualFront({ patch }: { readonly patch: PatchCaseData }) {
  return (
    <div className="manual-sheet absolute inset-[5%] overflow-hidden">
      <CoverPrint patch={patch} titleOnly={true} />
      <div className="paper-print pointer-events-none absolute inset-0" />
    </div>
  );
}

/** 설명서를 펼친 안쪽 면: 앞면과 같은 크기의 종이에 속지(children = 패치 정보)를 싣는다 */
export function ManualInner({ children }: { readonly children: ReactNode }) {
  return <div className="manual-sheet absolute inset-[5%]">{children}</div>;
}
