import type { ReactNode } from 'react';
import { CASE_SPECS, hasOuterBox, hasSquareCorners } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';
import { CaseCarton } from './carton.tsx';
import { CaseCover } from './case-cover.tsx';
import { CaseMedia } from './case-media.tsx';
import { CoverPrint } from './cover-print.tsx';
import { KeepCaseFront, KeepCaseInner, KeepCaseTray } from './keepcase.tsx';

/**
 * 케이스 열기 연출에 쓰는 부품들. 기종의 케이스 형태(form)에 맞는 그림을 고른다.
 * 열기 연출(widgets/case-viewer)은 형태를 몰라도 이 컴포넌트들만 배치하면 된다.
 * 카트리지 상자(SFC·GB·GBA·N64)는 앞판을 넘기지 않고 설명서·팩을 꺼내 늘어놓으므로(case-spread.tsx) 아래 앞면·안쪽·트레이를 쓰지 않는다.
 */

/**
 * 넘어가는 표지의 앞면. 종이상자가 있으면 표지 전체는 상자에 있으므로, 안에서 나온 앞면에는 게임 이름만 쓴다(GC 킵 케이스 앞면).
 */
export function CaseFront({ patch }: { readonly patch: PatchCaseData }) {
  const { form, tone } = CASE_SPECS[patch.platform];
  if (form === 'keepcase' && tone !== null) {
    return (
      <div className="@container size-full">
        <KeepCaseFront tone={tone}>
          <CoverPrint patch={patch} onCase={true} />
        </KeepCaseFront>
      </div>
    );
  }
  if (form === 'boxed-keepcase' && tone !== null) {
    return (
      <div className="@container size-full">
        <KeepCaseFront tone={tone} square={true}>
          <CoverPrint patch={patch} onCase={true} titleOnly={true} />
        </KeepCaseFront>
      </div>
    );
  }
  return <CaseCover patch={patch} />;
}

/** 안쪽 왼판(휴대폰에선 위판): 속지(children)를 끼워 둔 면 */
export function CaseInner({
  patch,
  children,
}: {
  readonly patch: PatchCaseData;
  readonly children: ReactNode;
}) {
  const spec = CASE_SPECS[patch.platform];
  if (spec.tone !== null) {
    return (
      <KeepCaseInner tone={spec.tone} square={hasSquareCorners(spec)}>
        {children}
      </KeepCaseInner>
    );
  }
  return children;
}

/** 안쪽 오른판(휴대폰에선 아래판): 매체가 놓인 트레이 */
export function CaseTray({
  patch,
  isOpen,
}: {
  readonly patch: PatchCaseData;
  readonly isOpen: boolean;
}) {
  const { tone, holder } = CASE_SPECS[patch.platform];
  if (tone !== null && holder !== null) {
    return (
      <KeepCaseTray
        tone={tone}
        square={hasSquareCorners(CASE_SPECS[patch.platform])}
        holder={holder}
        patch={patch}
        isOpen={isOpen}
      />
    );
  }
  return (
    <div className="flex size-full items-center justify-center border border-black/20 bg-shelf">
      <CaseMedia patch={patch} isOpen={isOpen} />
    </div>
  );
}

/** 바깥 종이상자(GC, SFC·GB·GBA·N64). 상자가 없는 형태면 아무것도 그리지 않는다 */
export function CaseOuterBox({
  patch,
  lidOpen,
  unboxed,
}: {
  readonly patch: PatchCaseData;
  readonly lidOpen: boolean;
  readonly unboxed: boolean;
}) {
  if (!hasOuterBox(CASE_SPECS[patch.platform])) {
    return null;
  }
  return (
    // 상자는 보기만 하는 층이라 클릭을 통과시킨다(빠진 뒤에도 케이스 위를 덮고 있어, 막으면 매체의 릴리즈 링크가 눌리지 않는다)
    <div className="@container pointer-events-none absolute inset-0 z-10">
      <CaseCarton patch={patch} lidOpen={lidOpen} unboxed={unboxed} />
    </div>
  );
}
