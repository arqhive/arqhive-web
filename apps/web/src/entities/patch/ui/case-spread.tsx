import type { Platform } from '@arqhive/shared';
import type { ReactNode } from 'react';
import type { PatchCaseData } from '../model/case-data.ts';
import { Cartridge } from './cartridge.tsx';
import { ExtraDownloads, ReleaseHint } from './release-link.tsx';

/**
 * 상자에서 꺼내 늘어놓는 열기(카트리지 상자 SFC·GB·GBA·N64, 사용자 요청 11/05).
 * 앞판을 넘겨 속지로 쓰면 상자 비율에 따라 속지가 너무 낮거나(가로가 긴 N64) 좁다. 그래서 상자가 빠지면 설명서와 팩이 상자에서 나와
 * 데스크톱은 설명서 왼쪽·팩 오른쪽, 휴대폰은 설명서 위·팩 아래로 놓인다.
 * 상자(케이스 자리)의 가운데를 기준으로 겹쳐 그리므로, 펼친 크기는 상자 크기와 상관없다.
 */

/**
 * 설명서 크기: 모든 기종이 케이스 열기 화면의 Wii 케이스와 같은 높이·비율(case-spec의 wii viewerHeight).
 * 휴대폰은 폭을 화면의 92%까지 넓힌다(case-viewer의 MOBILE_MIN_WIDTH와 같은 값).
 */
const SHEET_SIZE =
  'aspect-[135/190] h-[min(44svh,122vw)] max-md:min-w-[min(92vw,44svh)] md:h-[min(40rem,86dvh,61vw)]';

/**
 * 팩 크기(폭과 가로세로비): 닫힌 상자 안에 있을 때와 같다. 상자 폭(case-spec의 가로세로비 × viewerHeight) × 팩 비율(mediaClass).
 * - 휴대폰 상자 폭은 MOBILE_MIN_WIDTH 때문에 대개 min(92vw,44svh)이다(가로가 긴 N64만 높이 × 177/127).
 * - N64: 상자 폭 min(37.3rem,79.5dvh,57.2vw)·휴대폰 min(61.3svh,85vw)의 66%
 * - SFC: 상자 폭 min(29.05rem,61.5dvh,42.9vw)의 80%
 * - GB: 상자 폭 min(27.19rem,58dvh,41vw)의 66% / GBA: min(27.38rem,58dvh,41vw)의 90%
 * 팩 칸을 @container로 두어 아래 안내 글의 글자 크기(cqw) 기준으로 쓴다.
 */
const CART_SIZES = {
  n64: {
    width: 'w-[min(40.5svh,56.1vw)] md:w-[min(24.6rem,52.5dvh,37.7vw)]',
    aspect: 'aspect-[117/80]',
  },
  sfc: {
    width: 'w-[min(35.2svh,73.6vw)] md:w-[min(23.24rem,49.2dvh,34.3vw)]',
    aspect: 'aspect-[7/5]',
  },
  gb: {
    width: 'w-[min(29svh,60.7vw)] md:w-[min(17.94rem,38.3dvh,27.1vw)]',
    aspect: 'aspect-[57/65]',
  },
  gba: {
    width: 'w-[min(39.6svh,82.8vw)] md:w-[min(24.64rem,52.2dvh,36.9vw)]',
    aspect: 'aspect-[7/4]',
  },
} as const satisfies Partial<Record<Platform, { readonly width: string; readonly aspect: string }>>;

/** 표에 없는 기종(카트리지 상자가 아닌 기종)에는 쓰이지 않지만, 타입상 기본값으로 N64 크기를 둔다 */
function cartSize(platform: Platform): { readonly width: string; readonly aspect: string } {
  return platform in CART_SIZES ? CART_SIZES[platform as keyof typeof CART_SIZES] : CART_SIZES.n64;
}

/** 나오기 연출: 닫힌 동안은 상자 쪽(데스크톱 오른쪽·휴대폰 아래)에 겹쳐 흐리게 있다가 제자리로 나온다 */
const SHOWN = 'pointer-events-auto translate-0 opacity-100';
const HIDDEN_SHEET = 'translate-y-[20%] opacity-0 md:translate-x-[40%] md:translate-y-0';
const HIDDEN_CART = '-translate-y-[20%] opacity-0 md:-translate-x-[30%] md:translate-y-0';
const MOVE =
  'transition-[translate,opacity] duration-[calc(700ms*var(--case-tempo,1))] ease-out motion-reduce:transition-none';

export function CaseSpread({
  patch,
  isOpen,
  closeButton,
  children,
}: {
  readonly patch: PatchCaseData;
  readonly isOpen: boolean;
  /** 닫기 단추. 펼친 전체의 오른쪽 위에 붙도록 이 묶음 안에 둔다 */
  readonly closeButton: ReactNode;
  /** 설명서에 실을 속지(패치 정보) */
  readonly children: ReactNode;
}) {
  const cart = cartSize(patch.platform);
  return (
    // 묶음 자체는 클릭을 통과시킨다(사이 빈 곳을 누르면 배경 닫기). 펼친 설명서·팩만 클릭을 받는다(SHOWN)
    <div className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-1/2 flex-col items-center gap-[2svh] md:flex-row md:gap-[3vw]">
      <div className={`relative shrink-0 ${SHEET_SIZE} ${MOVE} ${isOpen ? SHOWN : HIDDEN_SHEET}`}>
        <div className="manual-sheet absolute inset-0">{children}</div>
      </div>
      <div
        className={`@container flex shrink-0 flex-col items-center gap-2 ${cart.width} ${MOVE} ${isOpen ? SHOWN : HIDDEN_CART}`}
      >
        <Cartridge patch={patch} mediaClass={`w-full ${cart.aspect}`} isOpen={isOpen} />
        {/* 안내 글: 바탕이 모달 배경이라 반투명 검은 띠에 흰 글자(카트리지 상자 트레이와 같다) */}
        <ReleaseHint
          patch={patch}
          className="w-fit max-w-[84%] rounded-[0.4em] bg-black/60 px-[0.8em] py-[0.3em] text-white"
        />
        <ExtraDownloads patch={patch} className="text-white" />
      </div>
      {closeButton}
    </div>
  );
}
