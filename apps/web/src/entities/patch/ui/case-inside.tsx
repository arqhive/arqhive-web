import type { ReactNode } from 'react';
import { CASE_SPECS, hasOuterBox } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';
import { CaseCarton, ManualFront, ManualInner } from './carton.tsx';
import { Cartridge } from './cartridge.tsx';
import { CaseCover } from './case-cover.tsx';
import { CaseMedia } from './case-media.tsx';
import { CoverPrint } from './cover-print.tsx';
import { KeepCaseFront, KeepCaseInner, KeepCaseTray } from './keepcase.tsx';

/**
 * 케이스 열기 연출에 쓰는 부품들. 기종의 케이스 형태(form)에 맞는 그림을 고른다.
 * 열기 연출(widgets/case-viewer)은 형태를 몰라도 이 컴포넌트들만 배치하면 된다.
 */

/**
 * 넘어가는 표지의 앞면. 종이상자가 있으면 표지 전체는 상자에 있으므로, 안에서 나온 앞면에는 게임 이름만 쓴다.
 * GC는 킵 케이스 앞면, 카트리지 상자(SFC·GB·GBA)는 설명서 앞면이다.
 */
export function CaseFront({ patch }: { readonly patch: PatchCaseData }) {
  const { form, tone } = CASE_SPECS[patch.platform];
  if (form === 'carton') {
    return (
      <div className="@container relative size-full">
        <ManualFront patch={patch} />
      </div>
    );
  }
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
        <KeepCaseFront tone={tone}>
          <CoverPrint patch={patch} onCase={true} titleOnly={true} />
        </KeepCaseFront>
      </div>
    );
  }
  return <CaseCover patch={patch} />;
}

/** 안쪽 왼판(휴대폰에선 위판): 속지(children)를 끼워 둔 면. 카트리지 상자는 펼친 설명서 */
export function CaseInner({
  patch,
  children,
}: {
  readonly patch: PatchCaseData;
  readonly children: ReactNode;
}) {
  const { form, tone } = CASE_SPECS[patch.platform];
  if (form === 'carton') {
    return <ManualInner>{children}</ManualInner>;
  }
  if (form !== 'generic' && tone !== null) {
    return <KeepCaseInner tone={tone}>{children}</KeepCaseInner>;
  }
  return children;
}

/** 안쪽 오른판(휴대폰에선 아래판): 매체가 놓인 트레이. 카트리지 상자는 받침 없이 카트리지만 놓인다 */
export function CaseTray({
  patch,
  isOpen,
}: {
  readonly patch: PatchCaseData;
  readonly isOpen: boolean;
}) {
  const { form, tone, holder, mediaClass } = CASE_SPECS[patch.platform];
  if (form === 'carton') {
    return (
      <div className="flex size-full items-center justify-center">
        <Cartridge patch={patch} mediaClass={mediaClass} isOpen={isOpen} />
      </div>
    );
  }
  if (form !== 'generic' && tone !== null && holder !== null) {
    return <KeepCaseTray tone={tone} holder={holder} patch={patch} isOpen={isOpen} />;
  }
  return (
    <div className="flex size-full items-center justify-center border border-black/20 bg-shelf">
      <CaseMedia patch={patch} isOpen={isOpen} />
    </div>
  );
}

/** 바깥 종이상자(GC, SFC·GB·GBA). 상자가 없는 형태면 아무것도 그리지 않는다 */
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
    <div className="@container absolute inset-0 z-10">
      <CaseCarton patch={patch} lidOpen={lidOpen} unboxed={unboxed} />
    </div>
  );
}
