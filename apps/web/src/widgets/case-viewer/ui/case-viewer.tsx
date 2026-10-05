'use client';

import { type CSSProperties, type ReactNode, type RefObject, useState } from 'react';
import {
  CASE_SPECS,
  CaseFront,
  CaseInner,
  CaseOuterBox,
  CaseTray,
  hasOuterBox,
  type PatchCaseData,
} from '@/entities/patch';
import { CLOSE_TEMPO } from '../lib/motion.ts';
import { useCaseDialog } from '../model/use-case-dialog.ts';
import { CaseLiner } from './case-liner.tsx';
import { ChangelogDialog } from './changelog-dialog.tsx';
import { CloseButton } from './close-button.tsx';

/**
 * 케이스 열기 연출(진열장의 대표 장치). 누른 표지가 화면 가운데로 날아와 커진 뒤 열린다.
 *
 * - <dialog>.showModal(): 브라우저 기본 모달. 포커스 가두기, ESC(cancel 이벤트), 배경(::backdrop)을 기본 제공한다.
 * - 케이스(caseRef) = 표지 한 장 크기의 상자. 안에 트레이(매체)와 표지(앞면 표지·뒷면 속지)가 겹쳐 있다.
 * - 열림 축: 데스크톱(md 이상)은 책처럼 왼쪽으로(rotateY), 휴대폰은 폭이 좁아 위로(rotateX) 연다.
 *   열리면 속지가 케이스 바깥(왼쪽·위쪽)으로 나오므로, 케이스를 반 칸만큼 옮겨 펼친 전체가 가운데 오게 한다.
 * - GC: 케이스가 종이상자에 들어 있다. 상자 뚜껑이 열리고(lid) 상자가 아래로 빠진 뒤(unboxed) 케이스가 열린다.
 * - SFC·GB·GBA: 같은 순서로 상자가 빠지면 카트리지와 설명서가 나오고, 설명서가 펼쳐진다.
 * - 크기: Wii 케이스가 데스크톱 한 칸 최대 480×640(펼치면 960×640)이고, 다른 기종은 실물 높이 비율만큼 작다(viewerHeight).
 *   화면이 작으면 높이·폭 안에 맞춰 줄어든다.
 * - 속도: 연출 시간은 모두 `calc(시간 * var(--case-tempo, 1))`로 쓴다. 닫는 동안 dialog에 --case-tempo를
 *   CLOSE_TEMPO로 바꿔 넣으면 안쪽 부품(entities 포함)이 상속받아 한꺼번에 빨라진다.
 */
export function CaseViewer({
  patch,
  changelog,
  originRef,
  onClose,
}: {
  readonly patch: PatchCaseData | null;
  /** 이 작품의 업데이트 내역(서버에서 그려 둔 CHANGELOG). 없으면 속지의 "업데이트 내역 보기" 단추를 숨긴다 */
  readonly changelog?: ReactNode;
  readonly originRef: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
}) {
  const boxed = patch !== null && hasOuterBox(CASE_SPECS[patch.platform]);
  const view = useCaseDialog(patch?.slug ?? null, boxed, originRef, onClose);
  const { phase } = view;
  const isOpen = phase === 'open';
  // 업데이트 내역 모달이 열린 작품. 모달은 케이스 위에 떠서, 케이스를 닫기 전에 늘 먼저 닫힌다
  const [changelogSlug, setChangelogSlug] = useState<string | null>(null);
  const tempo = { '--case-tempo': view.isClosing ? CLOSE_TEMPO : 1 } as CSSProperties;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: 키보드 닫기는 dialog 기본 ESC(onCancel)가 맡는다. 클릭은 배경 닫기 전용이다
    <dialog
      ref={view.dialogRef}
      aria-label={patch ? `${patch.titleKo} 케이스` : undefined}
      // 열 때 dialog 자체가 포커스를 받는다(use-case-dialog). 테두리는 그리지 않는다(outline-none)
      tabIndex={-1}
      onCancel={view.onCancel}
      onClose={view.onNativeClose}
      onClick={view.onBackdropClick}
      style={tempo}
      className={`m-0 size-full max-h-none outline-none max-w-none overflow-hidden bg-transparent p-0 backdrop:transition-colors backdrop:duration-[calc(500ms*var(--case-tempo,1))] ${view.isShown ? 'backdrop:bg-ink/70' : 'backdrop:bg-transparent'}`}
    >
      {patch === null ? null : (
        <>
          {/* 무대: 화면 전체. 원근(perspective)을 주어 표지가 넘어갈 때 입체로 보이게 한다.
              클릭은 통과시키고(pointer-events-none) 케이스만 받게 해서, 빈 곳 클릭은 dialog로 가 배경 닫기가 된다. */}
          <div className="pointer-events-none flex size-full items-center justify-center perspective-[2400px]">
            <div
              ref={view.caseRef}
              className={`pointer-events-auto relative ${CASE_SPECS[patch.platform].aspect} ${CASE_SPECS[patch.platform].viewerHeight} origin-top-left transition-transform duration-[calc(700ms*var(--case-tempo,1))] ease-out motion-reduce:transition-none ${
                isOpen ? 'translate-y-1/2 md:translate-x-1/2 md:translate-y-0' : ''
              }`}
            >
              {/* 트레이: 매체가 놓인 케이스 안쪽 */}
              <div className="absolute inset-0">
                <CaseTray patch={patch} isOpen={isOpen} />
              </div>

              {/* 표지: 위(휴대폰)·왼쪽(데스크톱)으로 넘어간다. 앞면=케이스 앞면, 뒷면=속지(미리 180도 돌려 둠) */}
              <div
                className={`absolute inset-0 origin-top transform-3d transition-transform delay-[calc(150ms*var(--case-tempo,1))] duration-[calc(900ms*var(--case-tempo,1))] ease-out motion-reduce:transition-none md:origin-left ${
                  isOpen ? 'rotate-x-180 md:rotate-x-0 md:-rotate-y-180' : ''
                }`}
              >
                <div className="absolute inset-0 backface-hidden">
                  <CaseFront patch={patch} />
                </div>
                <div className="absolute inset-0 rotate-x-180 backface-hidden md:rotate-x-0 md:rotate-y-180">
                  <CaseInner patch={patch}>
                    <CaseLiner
                      patch={patch}
                      onShowChangelog={
                        changelog === undefined ? undefined : () => setChangelogSlug(patch.slug)
                      }
                    />
                  </CaseInner>
                </div>
              </div>

              {/* 바깥 종이상자(GC만): 케이스 전체를 덮고 있다가 뚜껑이 열리고 아래로 빠진다 */}
              <CaseOuterBox
                patch={patch}
                lidOpen={phase !== 'closed'}
                unboxed={phase === 'unboxed' || isOpen}
              />

              {/* 닫기 단추: 케이스 안에 두어 케이스가 날아오고 펼쳐질 때 함께 따라다닌다 */}
              <CloseButton isVisible={view.isSettled} onClick={view.close} />
            </div>
          </div>
          {/* 업데이트 내역 모달: 3D로 회전하는 무대 바깥에 둔다(최상위 층에 뜨는 dialog라 위치는 화면 기준) */}
          {changelog === undefined ? null : (
            <ChangelogDialog
              open={changelogSlug === patch.slug}
              title={patch.titleKo}
              onClose={() => setChangelogSlug(null)}
            >
              {changelog}
            </ChangelogDialog>
          )}
        </>
      )}
    </dialog>
  );
}
