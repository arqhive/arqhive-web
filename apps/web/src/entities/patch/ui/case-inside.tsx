import type { ReactNode } from 'react';
import { CASE_SPECS, hasOuterBox, hasSquareCorners } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';
import { CaseCarton, ManualFront, ManualInner } from './carton.tsx';
import { Cartridge } from './cartridge.tsx';
import { CaseCover } from './case-cover.tsx';
import { CaseMedia } from './case-media.tsx';
import { CoverPrint } from './cover-print.tsx';
import { KeepCaseFront, KeepCaseInner, KeepCaseTray } from './keepcase.tsx';
import { ReleaseHint } from './release-link.tsx';

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
        <KeepCaseFront tone={tone} square={true}>
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
  const spec = CASE_SPECS[patch.platform];
  if (spec.form === 'carton') {
    return <ManualInner>{children}</ManualInner>;
  }
  if (spec.form !== 'generic' && spec.tone !== null) {
    return (
      <KeepCaseInner tone={spec.tone} square={hasSquareCorners(spec)}>
        {children}
      </KeepCaseInner>
    );
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
      <div className="@container flex size-full flex-col items-center justify-center gap-2">
        <Cartridge patch={patch} mediaClass={mediaClass} isOpen={isOpen} />
        {/* 카트리지 바로 아래 안내(판 맨 아래에 두면 세로로 긴 SFC 상자에서 카트리지와 너무 멀어진다).
            바탕이 모달 배경(뒤 페이지 글자가 비침)이라, 자막처럼 글자 폭에 맞춘 반투명 검은 띠를 깔고 흰 글자로 쓴다(10/7) */}
        <ReleaseHint
          patch={patch}
          className="w-fit max-w-[84%] rounded-[0.4em] bg-black/60 px-[0.8em] py-[0.3em] text-white"
        />
      </div>
    );
  }
  if (form !== 'generic' && tone !== null && holder !== null) {
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
    // 상자는 보기만 하는 층이라 클릭을 통과시킨다(빠진 뒤에도 케이스 위를 덮고 있어, 막으면 매체의 릴리즈 링크가 눌리지 않는다)
    <div className="@container pointer-events-none absolute inset-0 z-10">
      <CaseCarton patch={patch} lidOpen={lidOpen} unboxed={unboxed} />
    </div>
  );
}
