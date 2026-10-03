'use client';

import type { RefObject } from 'react';
import { CaseCover, CaseMedia, type PatchCaseData } from '@/entities/patch';
import { useCaseDialog } from '../model/use-case-dialog.ts';
import { CaseLiner } from './case-liner.tsx';

/**
 * 케이스 열기 연출(진열장의 대표 장치). 누른 표지가 화면 가운데로 날아와 커진 뒤 열린다.
 *
 * - <dialog>.showModal(): 브라우저 기본 모달. 포커스 가두기, ESC(cancel 이벤트), 배경(::backdrop)을 기본 제공한다.
 * - 케이스(caseRef) = 표지 한 장 크기의 상자. 안에 트레이(매체)와 표지(앞면 표지·뒷면 속지)가 겹쳐 있다.
 * - 열림 축: 데스크톱(md 이상)은 책처럼 왼쪽으로(rotateY), 휴대폰은 폭이 좁아 위로(rotateX) 연다.
 *   열리면 속지가 케이스 바깥(왼쪽·위쪽)으로 나오므로, 케이스를 반 칸만큼 옮겨 펼친 전체가 가운데 오게 한다.
 * - 크기: 데스크톱은 케이스 한 칸 최대 480×640(펼치면 960×640), 화면이 작으면 높이·폭 안에 맞춰 줄어든다.
 */
export function CaseViewer({
  patch,
  originRef,
  onClose,
}: {
  readonly patch: PatchCaseData | null;
  readonly originRef: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
}) {
  const { dialogRef, caseRef, isShown, isOpen, close, onCancel, onBackdropClick } = useCaseDialog(
    patch?.slug ?? null,
    originRef,
    onClose,
  );

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: 키보드 닫기는 dialog 기본 ESC(onCancel)가 맡는다. 클릭은 배경 닫기 전용이다
    <dialog
      ref={dialogRef}
      aria-label={patch ? `${patch.titleKo} 케이스` : undefined}
      onCancel={onCancel}
      onClick={onBackdropClick}
      className={`m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-0 backdrop:transition-colors backdrop:duration-500 ${isShown ? 'backdrop:bg-ink/70' : 'backdrop:bg-transparent'}`}
    >
      {patch === null ? null : (
        <>
          {/* 무대: 화면 전체. 원근(perspective)을 주어 표지가 넘어갈 때 입체로 보이게 한다.
              클릭은 통과시키고(pointer-events-none) 케이스만 받게 해서, 빈 곳 클릭은 dialog로 가 배경 닫기가 된다. */}
          <div className="pointer-events-none flex size-full items-center justify-center perspective-[2400px]">
            <div
              ref={caseRef}
              className={`pointer-events-auto relative aspect-[3/4] h-[min(44dvh,122vw)] origin-top-left transition-transform duration-700 ease-out motion-reduce:transition-none md:h-[min(640px,86dvh,61vw)] ${
                isOpen ? 'translate-y-1/2 md:translate-x-1/2 md:translate-y-0' : ''
              }`}
            >
              {/* 트레이: 매체가 놓인 케이스 안쪽 */}
              <div className="absolute inset-0 flex items-center justify-center border border-black/20 bg-shelf">
                <CaseMedia patch={patch} isOpen={isOpen} />
              </div>

              {/* 표지: 위(휴대폰)·왼쪽(데스크톱)으로 넘어간다. 앞면=표지, 뒷면=속지(미리 180도 돌려 둠) */}
              <div
                className={`absolute inset-0 origin-top transform-3d transition-transform delay-150 duration-[900ms] ease-out motion-reduce:transition-none md:origin-left ${
                  isOpen ? 'rotate-x-180 md:rotate-x-0 md:-rotate-y-180' : ''
                }`}
              >
                <div className="absolute inset-0 backface-hidden">
                  <CaseCover patch={patch} />
                </div>
                <div className="absolute inset-0 rotate-x-180 backface-hidden md:rotate-x-0 md:rotate-y-180">
                  <CaseLiner patch={patch} />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            className={`fixed top-4 right-4 border border-line bg-paper px-3 py-1.5 text-ink text-sm transition-opacity duration-300 hover:bg-card ${isShown ? 'opacity-100' : 'opacity-0'}`}
          >
            닫기
          </button>
        </>
      )}
    </dialog>
  );
}
