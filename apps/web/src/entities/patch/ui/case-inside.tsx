import type { ReactNode } from 'react';
import { CASE_SPECS } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';
import { CaseMedia } from './case-media.tsx';
import { WiiCaseInner, WiiCaseTray } from './wii-keepcase.tsx';

/**
 * 케이스를 열었을 때 보이는 안쪽 두 판. 기종의 케이스 형태(form)에 맞는 그림을 고른다.
 * 열기 연출(widgets/case-viewer)은 형태를 몰라도 이 두 컴포넌트만 배치하면 된다.
 */

/** 안쪽 왼판(휴대폰에선 위판): 속지(children)를 끼워 둔 면 */
export function CaseInner({
  patch,
  children,
}: {
  readonly patch: PatchCaseData;
  readonly children: ReactNode;
}) {
  if (CASE_SPECS[patch.platform].form === 'wii-keepcase') {
    return <WiiCaseInner>{children}</WiiCaseInner>;
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
  if (CASE_SPECS[patch.platform].form === 'wii-keepcase') {
    return <WiiCaseTray patch={patch} isOpen={isOpen} />;
  }
  return (
    <div className="flex size-full items-center justify-center border border-black/20 bg-shelf">
      <CaseMedia patch={patch} isOpen={isOpen} />
    </div>
  );
}
