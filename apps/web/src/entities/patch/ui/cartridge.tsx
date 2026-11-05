import { PLATFORM_LABELS } from '@arqhive/shared';
import type { PatchCaseData } from '../model/case-data.ts';
import { ReleaseLink } from './release-link.tsx';

/**
 * SFC·GB·GBA·N64 카트리지(게임팩). 실물 사진의 생김새(몸통 윤곽, 라벨 자리, 홈, 나사)만 따르고 로고·각인은 그리지 않는다.
 * 윤곽이 네모가 아닌 부분(GB의 잘린 모서리, GBA의 턱)은 clip-path로 자른다. clip-path는 box-shadow도 잘라 내므로
 * 그림자는 바깥 래퍼의 drop-shadow로 준다.
 * 바깥 래퍼를 컨테이너로 두어 라벨 글자 크기를 **카트리지 폭** 기준으로 정한다.
 */

/**
 * 라벨: 제목과 기종. 라벨 자리(position)는 기종마다 다르다.
 * cornerName이 있으면 기종을 줄이지 않은 이름으로 라벨 왼쪽 위에 쓰고(SFC: "Super Famicom"), 제목만 가운데에 둔다.
 * titleOnly면 기종을 라벨에 쓰지 않는다(GB·GBA: 기종 이름은 몸통의 솟은 자리에 양각으로 있다).
 */
function CartLabel({
  patch,
  position,
  cornerName,
  titleOnly = false,
}: {
  readonly patch: PatchCaseData;
  readonly position: string;
  readonly cornerName?: string;
  readonly titleOnly?: boolean;
}) {
  return (
    <div
      className={`cart-label absolute flex flex-col items-center justify-center gap-[2cqw] rounded-[1.5cqw] px-[4cqw] text-center ${position}`}
    >
      {cornerName === undefined ? null : (
        <span className="absolute top-[6%] left-[3%] font-num text-[3.6cqw] leading-none opacity-70">
          {cornerName}
        </span>
      )}
      <span className="break-keep font-bold font-title text-[6.5cqw] leading-tight">
        {patch.titleKo}
      </span>
      {cornerName === undefined && !titleOnly ? (
        <span className="font-num text-[4cqw] opacity-70">{PLATFORM_LABELS[patch.platform]}</span>
      ) : null}
    </div>
  );
}

/** 아래를 가리키는 ▼ 표시(끼우는 방향) */
function InsertArrow({ position }: { readonly position: string }) {
  return (
    <div
      className={`cart-groove absolute aspect-[2/1] -translate-x-1/2 [clip-path:polygon(0_0,100%_0,50%_100%)] ${position}`}
    />
  );
}

/** 미끄럼 방지 줄: 같은 모양을 일정 간격으로 늘어놓는다(위치 목록은 기종별 상수) */
function Grips({ tops, side }: { readonly tops: readonly string[]; readonly side: string }) {
  return (
    <>
      {tops.map((top) => (
        <div key={top} className={`cart-groove absolute h-[1.6%] ${side} ${top}`} />
      ))}
    </>
  );
}

const SFC_GRIP_TOPS = ['top-[15%]', 'top-[19%]', 'top-[23%]', 'top-[27%]', 'top-[31%]'] as const;
const GB_GRIP_TOPS = [
  'top-[8%]',
  'top-[10.5%]',
  'top-[13%]',
  'top-[15.5%]',
  'top-[18%]',
  'top-[20.5%]',
] as const;

/**
 * SFC(정면 사진 기준): 가로로 넓은 회색 팩.
 * 위쪽에 넓은 라벨(폭의 82%, 높이의 43%), 좌우 이음선(라벨 위·아래로 이어짐), 양옆 미끄럼 방지 홈 5개, 아래 가운데 긴 가로 홈, 아래 양쪽 나사.
 */
function SfcCartridge({ patch }: { readonly patch: PatchCaseData }) {
  return (
    <div className="cartridge cart-sfc absolute inset-0 rounded-[2.5cqw]">
      <div className="cart-seam absolute top-0 left-[21%] h-[6%] w-[0.5%]" />
      <div className="cart-seam absolute top-0 right-[21%] h-[6%] w-[0.5%]" />
      <div className="cart-seam absolute top-[49%] bottom-0 left-[21%] w-[0.5%]" />
      <div className="cart-seam absolute top-[49%] right-[21%] bottom-0 w-[0.5%]" />
      <Grips tops={SFC_GRIP_TOPS} side="left-[1.5%] w-[2.5%] rounded-r-full" />
      <Grips tops={SFC_GRIP_TOPS} side="right-[1.5%] w-[2.5%] rounded-l-full" />
      <CartLabel
        patch={patch}
        position="inset-x-[9%] top-[6%] h-[43%]"
        cornerName="Super Famicom"
      />
      <div className="cart-groove absolute top-[60%] left-[26%] h-[6%] w-[48%] rounded-full" />
      <div className="cart-screw absolute bottom-[10%] left-[11%] aspect-square w-[2.5%] rounded-full" />
      <div className="cart-screw absolute right-[11%] bottom-[10%] aspect-square w-[2.5%] rounded-full" />
    </div>
  );
}

/**
 * GB(정면 사진 기준): 세로로 긴 회색 팩. 오른쪽 위 모서리가 비스듬히 잘려 있다.
 * 위쪽에 알약 모양으로 솟은 자리("GAME BOY"를 양각 글자로 새김)와 그 오른쪽 가로줄 6개,
 * 가운데 오목한 라벨 자리, 오른쪽 세로 홈, 아래 ▼.
 */
function GbCartridge({ patch }: { readonly patch: PatchCaseData }) {
  return (
    <div className="cartridge cart-gb absolute inset-0 rounded-[2cqw] rounded-b-[4cqw] [clip-path:polygon(0_0,92%_0,100%_6%,100%_100%,0_100%)]">
      <div className="cart-emboss absolute top-[7%] left-[10%] flex h-[14%] w-[70%] items-center justify-center rounded-full">
        <span className="cart-emboss-text font-bold font-num text-[7cqw] leading-none tracking-wide">
          GAME BOY
        </span>
      </div>
      <Grips tops={GB_GRIP_TOPS} side="right-[2%] w-[13%]" />
      <div className="cart-recess absolute top-[25%] right-[16%] bottom-[16%] left-[12%] rounded-[1.5cqw]">
        <CartLabel patch={patch} position="inset-[5%]" titleOnly={true} />
      </div>
      <div className="cart-groove absolute top-[48%] right-[6%] bottom-[10%] w-[1.6%]" />
      <InsertArrow position="bottom-[5%] left-1/2 w-[10%]" />
    </div>
  );
}

/**
 * GBA(정면 사진 기준, 가로세로 7:4): 짙은 청회색 팩.
 * 맨 위 띠(높이 약 10%)가 몸통보다 양옆으로 조금 넓은 "어깨"이고, 그 아래 몸통은 아래 모서리가 둥글다.
 * 위쪽에 윗변이 아치인 솟은 띠("GAME BOY ADVANCE"를 양각 글자로 새김), 가운데 큰 라벨 자리(흰 라벨이 꽉 참), 아래 가운데 V자 표시.
 */
function GbaCartridge({ patch }: { readonly patch: PatchCaseData }) {
  return (
    <>
      <div className="cartridge cart-gba absolute inset-x-0 top-0 h-[12%] rounded-t-[2cqw] shadow-none" />
      <div className="cartridge cart-gba absolute inset-x-[1.8%] top-[6%] bottom-0 rounded-b-[2.5cqw] shadow-none">
        <div className="cart-emboss absolute top-[0%] left-[13%] flex h-[18%] w-[74%] items-end justify-center rounded-t-[50%_100%] pb-[1.5%]">
          <span className="cart-emboss-text font-bold font-num text-[4.2cqw] leading-none tracking-wide">
            GAME BOY ADVANCE
          </span>
        </div>
        <CartLabel
          patch={patch}
          position="top-[17%] right-[11.8%] bottom-[11.5%] left-[10.8%] rounded-[1cqw]"
          titleOnly={true}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 140 26"
          className="absolute bottom-[2%] left-1/2 w-[17%] -translate-x-1/2 stroke-black/35"
        >
          <polyline points="3,3 70,23 137,3" fill="none" strokeWidth="5" />
        </svg>
      </div>
    </>
  );
}

/** N64 몸통 윤곽(viewBox 117×80): 윗변은 가운데가 솟은 넓은 호, 위 모서리는 둥글고, 옆선은 바닥까지 곧다 */
const N64_OUTLINE = 'M2.5 79 L2.5 20 Q2.5 12 10 11 Q58.5 -9 107 11 Q114.5 12 114.5 20 L114.5 79 Z';
/** 라벨 윤곽: 윗변이 몸통 호를 따라 휘고 위 모서리가 둥글다 */
const N64_LABEL =
  'M29 18 Q29 12 35 11 Q58.5 3 82 11 Q88 12 88 18 L88 70 Q88 73 85 73 L32 73 Q29 73 29 70 Z';
/** 날개 아래 음각선(왼쪽): 옆선에서 비스듬히 꺾여 들어와 바닥까지 내려간다. 오른쪽은 좌우를 뒤집어 쓴다 */
const N64_NOTCH_SHADE = 'M2 60.8 L4.5 60.8 Q5.6 60.8 6.1 61.8 L7.3 64.6 Q7.6 65.4 7.6 66.4 L7.6 80';
const N64_NOTCH_LIGHT = 'M2 61.4 L4.5 61.4 Q6 61.4 6.6 62.6 L7.8 65.2 Q8.1 66 8.1 67 L8.1 80';
/** 클립 경로 id. 케이스 열기 화면은 한 번에 하나만 열리므로 고정 id로 충분하다 */
const N64_CLIP_ID = 'n64-cart-body';

/** 날개 아래 음각선 한 쌍(그늘 선 + 빛 선). flip이면 좌우를 뒤집어 오른쪽 날개에 쓴다 */
function N64Notch({ flip = false }: { readonly flip?: boolean }) {
  return (
    <g transform={flip ? 'matrix(-1 0 0 1 117 0)' : undefined} fill="none">
      <path d={N64_NOTCH_LIGHT} stroke="#eceef0" strokeWidth="0.6" />
      <path d={N64_NOTCH_SHADE} stroke="#7f8185" strokeWidth="0.7" />
    </g>
  );
}

/**
 * N64(정면 사진 기준, 약 117×78mm): 밝은 회색 팩. 곡선 윤곽이라 SVG로 그린다(사용자와 초안 확인 11/05).
 * 가운데 판은 끝이 둥근 세로 홈 두 줄로만 나뉘고(위아래 끝까지 닿아 몸통 윤곽에서 잘림), 가운데에 위가 둥근 라벨,
 * 양옆 날개 아래에 비스듬히 꺾인 음각선이 있다. 라벨에는 게임 이름만 쓴다.
 */
function N64Cartridge({ patch }: { readonly patch: PatchCaseData }) {
  return (
    <div className="absolute inset-0">
      <svg aria-hidden="true" viewBox="0 0 117 80" className="absolute inset-0 size-full">
        <defs>
          <clipPath id={N64_CLIP_ID}>
            <path d={N64_OUTLINE} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${N64_CLIP_ID})`}>
          <rect width="117" height="80" fill="#b8babe" />
          <rect
            x="23.3"
            y="-2"
            width="1.4"
            height="84"
            rx="0.7"
            fill="#7f8185"
            stroke="#e6e8ea"
            strokeWidth="0.35"
          />
          <rect
            x="92.3"
            y="-2"
            width="1.4"
            height="84"
            rx="0.7"
            fill="#7f8185"
            stroke="#e6e8ea"
            strokeWidth="0.35"
          />
          <N64Notch />
          <N64Notch flip={true} />
        </g>
        <path d={N64_OUTLINE} fill="none" stroke="#7d7f83" strokeWidth="0.6" />
        <path d={N64_LABEL} fill="#f6f6f4" stroke="#9a9ca0" strokeWidth="0.4" />
      </svg>
      <div className="absolute inset-x-[26%] top-[16%] bottom-[10%] flex items-center justify-center text-center text-[#1e2a3a]">
        <span className="break-keep font-bold font-title text-[6.5cqw] leading-tight">
          {patch.titleKo}
        </span>
      </div>
    </div>
  );
}

const CARTRIDGES = {
  sfc: SfcCartridge,
  gb: GbCartridge,
  gba: GbaCartridge,
  n64: N64Cartridge,
} as const;

/**
 * 카트리지 전체 그림자(바깥 래퍼의 drop-shadow). GBA는 가로로 넓어 판 밖까지 번져 보여서 아주 얇게 둔다(10/7 사용자 요청).
 */
const CART_SHADOWS: Readonly<Record<string, string>> = {
  gba: 'drop-shadow-[0_1px_1px_rgb(0_0_0/0.3)]',
};
const DEFAULT_CART_SHADOW = 'drop-shadow-[2px_4px_6px_rgb(0_0_0/0.35)]';

/** 상자에서 나온 카트리지. 크기는 상자 폭 대비 비율(mediaClass). 열리면 살짝 떠오른다 */
export function Cartridge({
  patch,
  mediaClass,
  isOpen,
}: {
  readonly patch: PatchCaseData;
  readonly mediaClass: string;
  readonly isOpen: boolean;
}) {
  const Shape =
    patch.platform in CARTRIDGES
      ? CARTRIDGES[patch.platform as keyof typeof CARTRIDGES]
      : SfcCartridge;
  return (
    <div
      className={`@container relative ${CART_SHADOWS[patch.platform] ?? DEFAULT_CART_SHADOW} transition-[translate] delay-[calc(300ms*var(--case-tempo,1))] duration-[calc(700ms*var(--case-tempo,1))] ease-out motion-reduce:transition-none ${mediaClass} ${isOpen ? '-translate-y-[4%]' : 'translate-y-0'}`}
    >
      <Shape patch={patch} />
      <ReleaseLink patch={patch} shape="absolute inset-0 rounded-[2cqw]" />
    </div>
  );
}
