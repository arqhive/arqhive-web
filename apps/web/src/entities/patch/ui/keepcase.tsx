import { PLATFORM_LABELS } from '@arqhive/shared';
import type { ReactNode } from 'react';
import { HoloText } from '@/shared/ui';
import { type CaseTone, DISC_PRINTS, type DiscPrint, TONE_CLASSES } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';
import { ReleaseHint, ReleaseLink } from './release-link.tsx';

/**
 * 킵 케이스(135×191mm)를 CSS로 그린 부품들. Wii는 흰색, Wii U는 반투명 파란색, GC는 검은색.
 * 실제 케이스 구조를 따르되 로고·마크는 그리지 않는다. 구조는 같고 색 묶음(tone)과 디스크 받침(holder)만 다르다.
 * 재질은 case-materials.css의 @utility(plastic-body, plastic-recess …)를 쓰고, 색은 바깥에 붙인 색 묶음 변수(--p-*)를 따른다.
 * 모든 크기·위치는 판 폭·높이에 대한 비율(%·cqw)이라, 작은 표지와 열린 큰 케이스가 같은 모양이다.
 */

/** 기종의 디스크 라벨 인쇄. 킵 케이스 기종이 아니면(일어나지 않지만) Wii 라벨로 그린다 */
function discPrint(patch: PatchCaseData): DiscPrint {
  return patch.platform in DISC_PRINTS
    ? DISC_PRINTS[patch.platform as keyof typeof DISC_PRINTS]
    : DISC_PRINTS.wii;
}

/** 기종 이름 글자 크기·위치: 나뉜 라벨(GC)은 아래 검은 띠의 가운데, 긴 이름이라 조금 작게 */
const NAME_POSITIONS = {
  plain: 'top-[81%] text-[10.6cqw]',
  split: 'top-[82%] text-[8.6cqw]',
} as const satisfies Record<DiscPrint['layout'], string>;

/**
 * 디스크: 인쇄면(라벨)이 거의 전체를 덮고, 가운데 구멍 둘레는 인쇄되지 않은 투명한 띠다.
 * 구멍 위에 게임 제목, 아래에 기종(홀로그램). 바깥 래퍼를 컨테이너로 두어 글자 크기를 **디스크 폭** 기준으로 정한다
 * (Wii 12cm 디스크와 GC 8cm 디스크가 같은 비율로 보인다).
 * 라벨 모양·기종 이름·홀로그램 색은 기종별 DISC_PRINTS를 따른다(GC: 위아래 두 칸, GameCube, 차가운 색).
 * isOpen이면 한 바퀴 돈다. 한 바퀴라서 멈추면 라벨 글자가 바로 선다.
 * art(그림 주소)가 있고 나뉜 라벨(GC)이면 위 칸(그림 칸)에 그 그림을 깐다. 그림 속 타이틀 로고가 제목 역할을 하므로 글자 제목은 쓰지 않는다.
 */
function Disc({
  print,
  title,
  art,
  isOpen,
}: {
  readonly print: DiscPrint;
  readonly title: string;
  readonly art?: string | undefined;
  readonly isOpen: boolean;
}) {
  const isSplit = print.layout === 'split';
  const showArt = isSplit && art !== undefined;
  return (
    <div className="@container absolute inset-0">
      <div
        className={`disc-surface absolute inset-0 rounded-full transition-[rotate] delay-[calc(500ms*var(--case-tempo,1))] duration-[calc(1400ms*var(--case-tempo,1))] ease-out motion-reduce:transition-none ${isOpen ? 'rotate-[360deg]' : 'rotate-0'}`}
      >
        <div
          className={`absolute inset-[2.5%] overflow-hidden rounded-full ${isSplit ? 'disc-label-split' : 'disc-label'}`}
        >
          {/* 그림 칸: 라벨 위쪽 66.8%(나뉘는 선까지). 둥근 라벨 밖은 overflow-hidden이 자른다 */}
          {showArt ? (
            <div
              className="absolute inset-x-0 top-0 h-[66.8%] bg-center bg-cover"
              style={{ backgroundImage: `url(${art})` }}
            />
          ) : null}
        </div>
        <div
          className={`disc-clear absolute top-1/2 left-1/2 aspect-square w-[24%] -translate-1/2 rounded-full ${isSplit ? 'disc-clear-solid' : ''}`}
        />
        {/* 글자 중심은 구멍 둘레(반지름 12%)와 디스크 가장자리(50%) 사이. 제목은 그 가운데보다 조금 아래 */}
        {showArt ? null : (
          <span
            className={`absolute inset-x-[20%] top-[23%] -translate-y-1/2 break-keep text-center font-bold font-title text-[5.3cqw] leading-tight ${isSplit ? 'disc-ink-light' : ''}`}
          >
            {title}
          </span>
        )}
        <span
          className={`absolute inset-x-0 -translate-y-1/2 text-center font-bold leading-none ${NAME_POSITIONS[print.layout]}`}
        >
          <HoloText tone={print.holo}>{print.name}</HoloText>
        </span>
      </div>
    </div>
  );
}

/** Wii 계열 받침: 둥근 턱 + 손가락 홈 두 개 + 12cm 디스크 + 꽃잎 허브 */
function RingHolder({
  patch,
  isOpen,
}: {
  readonly patch: PatchCaseData;
  readonly isOpen: boolean;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center md:pl-[3%]">
      <div className="relative aspect-square w-[92%]">
        <div className="plastic-ring absolute inset-0 rounded-full" />
        <div className="plastic-notch absolute top-[6%] right-[6%] aspect-square w-[16%] rounded-full" />
        <div className="plastic-notch absolute bottom-[6%] left-[6%] aspect-square w-[16%] rounded-full" />
        <div className="absolute inset-[4%]">
          <Disc
            print={discPrint(patch)}
            title={patch.titleKo}
            art={patch.discArt?.src}
            isOpen={isOpen}
          />
        </div>
        {/* 허브: 디스크 구멍을 지나 위로 나온 꽃잎 고정 돌기 */}
        <div className="plastic-hub absolute top-1/2 left-1/2 aspect-square w-[16%] -translate-1/2 rounded-full" />
        <ReleaseLink patch={patch} shape="absolute inset-[4%] rounded-full" />
      </div>
    </div>
  );
}

/** GC 받침: 육각형으로 솟은 받침 + 8cm 작은 디스크 + 허브, 그 아래 작은 메모리카드가 꽂힌 홈 */
function HexHolder({ patch, isOpen }: { readonly patch: PatchCaseData; readonly isOpen: boolean }) {
  return (
    <>
      <div className="absolute top-[10%] left-1/2 aspect-[1.12] w-[74%] -translate-x-1/2 md:left-[54%]">
        <div className="plastic-hex absolute inset-0 drop-shadow-[0_2px_3px_rgb(0_0_0/0.5)]" />
        <div className="absolute top-1/2 left-1/2 aspect-square w-[80%] -translate-1/2">
          <Disc
            print={discPrint(patch)}
            title={patch.titleKo}
            art={patch.discArt?.src}
            isOpen={isOpen}
          />
          <div className="plastic-hub absolute top-1/2 left-1/2 aspect-square w-[22%] -translate-1/2 rounded-full" />
          <ReleaseLink patch={patch} shape="absolute inset-0 rounded-full" />
        </div>
      </div>
      {/* 메모리카드 홈과 꽂힌 카드: 오목한 면(plastic-recess)의 왼쪽 아래 모서리에서 0.75rem(기본 배율에서 12px)씩 떨어진 자리.
          오목한 면은 판 가장자리에서 3.5%(데스크톱 왼쪽은 경첩 때문에 7%) 안쪽이다. */}
      <div className="memcard-slot absolute bottom-[calc(3.5%+0.75rem)] left-[calc(3.5%+0.75rem)] aspect-[1/1.05] w-[25.5%] rounded-[0.9cqw] md:left-[calc(7%+0.75rem)]">
        <div className="memcard absolute inset-[7%] rounded-[0.6cqw]" />
      </div>
    </>
  );
}

/**
 * 카드 라벨(3DS·NDS 공통, 실물 라벨 구성): 윗부분(라벨 높이의 약 19%)을 선 하나로 나눠 기종 칸(원래 로고 자리)으로 쓰고,
 * 아래 칸에 제목을 쓴다. 기종은 인쇄 글자처럼 홀로그램 없이 쓴다. 라벨 자리(position)는 기종마다 다르다.
 */
function CardLabel({
  patch,
  position,
}: {
  readonly patch: PatchCaseData;
  readonly position: string;
}) {
  return (
    <div
      className={`card-label absolute flex flex-col rounded-[1.5cqw] text-center shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] ${position}`}
    >
      <div className="flex h-[19%] shrink-0 items-center justify-center border-black/25 border-b font-bold font-num text-[9cqw] leading-none">
        {PLATFORM_LABELS[patch.platform]}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-[6cqw]">
        <span className="line-clamp-3 break-keep font-bold font-title text-[9cqw] leading-tight">
          {patch.titleKo}
        </span>
      </div>
    </div>
  );
}

/**
 * 3DS 카드 윤곽(선 도면 249×243에서 잰 좌표). 오른쪽 위 약 23%가 오른쪽으로 튀어나온 어깨(걸림 방지 걸쇠)이고,
 * 그 아래 몸통은 폭의 약 9%만큼 들어가 있다. 왼쪽 아래 모서리는 크게 둥글다.
 */
const THREE_DS_OUTLINE =
  'M7 0 H244 Q249 0 249 5 V55 Q249 63 241 63 H231 Q228 63 228 66 V238 Q228 243 223 243 H42 A42 38 0 0 1 0 205 V7 Q0 0 7 0 Z';

/**
 * 3DS 카드(선 도면 기준): 회백색. 윤곽은 SVG 도형 하나로 그려 걸쇠·둥근 모서리를 도면 그대로 옮긴다.
 * SVG는 viewBox 비율 그대로 늘어나므로(preserveAspectRatio none), 감싸는 상자의 가로세로비를 도면(249:243)에 맞춘다.
 * 라벨은 도면의 안쪽 틀 자리(왼쪽 10.4%, 오른쪽 18.5%, 위 9.9%, 아래 10.3%)이고 왼쪽 아래가 살짝 잘려 있다.
 */
function ThreeDsCard({ patch }: { readonly patch: PatchCaseData }) {
  return (
    <div className="card-3ds absolute inset-x-0 top-1/2 aspect-[249/243] -translate-y-1/2">
      <svg
        aria-hidden="true"
        viewBox="0 0 249 243"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full fill-(--g-hi) stroke-black/30"
      >
        <path d={THREE_DS_OUTLINE} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <CardLabel
        patch={patch}
        position="top-[9.9%] right-[18.5%] bottom-[10.3%] left-[10.4%] [clip-path:polygon(0_0,100%_0,100%_100%,7%_100%,0_92%)]"
      />
    </div>
  );
}

/** NDS 카드 윤곽과 ▼ 표시(공개 SVG 도면 376.657×398.629의 바깥선 좌표). 왼쪽 아래 모서리만 크게 둥글다 */
const DS_OUTLINE =
  'M18.32 0 H358.33 C368.44 0 376.66 8.23 376.66 18.32 V380.3 C376.66 390.4 368.45 398.63 358.36 398.63 H73.16 C32.82 398.63 0 365.8 0 325.46 V18.32 C0 8.2 8.2 0 18.32 0 Z';
const DS_ARROW = '155.43,357.06 221.25,357.06 188.34,379';

/**
 * NDS 카드(도면 기준): 짙은 회색. 윤곽·▼ 표시는 도면 좌표 그대로의 SVG.
 * 라벨은 도면의 오목한 라벨 자리(왼쪽 11.8%, 오른쪽 11.6%, 위 7.9%, 아래 13.7%)이고 왼쪽 아래가 비스듬히 잘려 있다.
 */
function DsCard({ patch }: { readonly patch: PatchCaseData }) {
  return (
    <div className="card-ds absolute inset-x-0 top-1/2 aspect-[376.657/398.629] -translate-y-1/2">
      <svg
        aria-hidden="true"
        viewBox="0 0 376.657 398.629"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full fill-(--g-hi) stroke-black/40"
      >
        <path d={DS_OUTLINE} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <polygon points={DS_ARROW} className="fill-black/40 stroke-none" />
      </svg>
      <CardLabel
        patch={patch}
        position="top-[7.9%] right-[11.6%] bottom-[13.7%] left-[11.8%] [clip-path:polygon(0_0,100%_0,100%_100%,8%_100%,0_93%)]"
      />
    </div>
  );
}

/**
 * 게임 카드. 윤곽은 clip-path로 자르고 그림자는 바깥 drop-shadow로 준다(clip-path가 box-shadow를 잘라 내므로).
 */
function GameCard({ patch }: { readonly patch: PatchCaseData }) {
  return (
    <div className="absolute inset-0 drop-shadow-[1px_2px_2px_rgb(0_0_0/0.35)]">
      {patch.platform === '3ds' ? <ThreeDsCard patch={patch} /> : <DsCard patch={patch} />}
    </div>
  );
}

/** 경첩의 T자 표시(3DS·NDS 케이스): 데스크톱은 세로 경첩, 휴대폰은 가로 경첩 위에 놓인다 */
const HINGE_MARK_POSITIONS = [
  'top-[1.75%] left-[36%] -rotate-90 md:top-[36%] md:left-[2.5%] md:rotate-0',
  'top-[1.75%] left-[64%] -rotate-90 md:top-[64%] md:left-[2.5%] md:rotate-0',
] as const;

/**
 * 3DS·NDS 받침(실물 사진 기준): 테두리만 솟은 네모 틀 안에 게임 카드(약 33×35mm, 판 폭의 약 25%)가 꽂힌다.
 * - 틀 왼쪽 위·아래의 고정 탭이 카드 가장자리를 누르고, 오른쪽에는 카드를 빼는 손가락 홈이 있다.
 * - 경첩에는 T자 표시 두 개, 판 바깥쪽 가장자리에는 긴 닫힘 걸쇠가 있다.
 * 카드 라벨에 제목과 기종을 쓴다. 카드 래퍼를 컨테이너로 두어 라벨 글자 크기를 **카드 폭** 기준으로 정한다.
 * 받침은 오목한 면(plastic-recess)의 정중앙에 둔다: 휴대폰은 위 6%·아래 3.5%라 세로 51.25%,
 * 데스크톱은 왼쪽 7%·오른쪽 3.5%라 가로 51.75%. 카드는 홈 안에 위아래·좌우 같은 여백(12%·15%)으로 놓는다.
 * 닫힌 동안 살짝 아래에 있다가 열리면 올라와 정중앙에 멈춘다.
 */
function CartHolder({
  patch,
  isOpen,
}: {
  readonly patch: PatchCaseData;
  readonly isOpen: boolean;
}) {
  return (
    <>
      {HINGE_MARK_POSITIONS.map((position) => (
        <div
          key={position}
          className={`absolute aspect-square w-[2.6%] -translate-1/2 ${position}`}
        >
          <div className="hinge-mark absolute inset-x-0 top-0 h-[30%]" />
          <div className="hinge-mark absolute inset-y-0 left-[35%] w-[30%]" />
        </div>
      ))}
      <div className="absolute top-[51.25%] left-1/2 aspect-[50/52] w-[38%] -translate-1/2 md:top-1/2 md:left-[51.75%]">
        {/* 틀: 바깥 테두리만 솟고 안쪽 바닥은 판과 같은 높이 */}
        <div className="plastic-plate absolute inset-0 rounded-[1cqw]" />
        <div className="card-slot absolute inset-[9%] rounded-[0.6cqw]" />
        <div
          className={`@container absolute inset-x-[15%] inset-y-[12%] transition-[translate] delay-[calc(500ms*var(--case-tempo,1))] duration-[calc(700ms*var(--case-tempo,1))] ease-out motion-reduce:transition-none ${isOpen ? 'translate-y-0' : 'translate-y-[6%]'}`}
        >
          <GameCard patch={patch} />
          <ReleaseLink patch={patch} shape="absolute inset-0 rounded-[3cqw]" />
        </div>
        {/* 고정 탭(왼쪽 위·아래)과 손가락 홈(오른쪽 가운데) */}
        <div className="plastic-clip absolute top-[18%] left-[5%] h-[14%] w-[16%] rounded-[0.4cqw]" />
        <div className="plastic-clip absolute bottom-[18%] left-[5%] h-[14%] w-[16%] rounded-[0.4cqw]" />
        <div className="card-slot absolute top-1/2 right-[3%] h-[28%] w-[9%] -translate-y-1/2 rounded-[0.6cqw]" />
      </div>
      {/* 닫힘 걸쇠: 데스크톱은 오른쪽 가장자리, 휴대폰(위로 열림)은 아래 가장자리. 판 길이의 대부분을 덮는 긴 레일 */}
      <div className="plastic-clip absolute bottom-[1.2%] left-1/2 h-[2.4%] w-[76%] -translate-x-1/2 rounded-[0.5cqw] md:top-1/2 md:right-[1.2%] md:bottom-auto md:left-auto md:h-[76%] md:w-[2.4%] md:translate-x-0 md:-translate-y-1/2" />
    </>
  );
}

/**
 * 앞면: 케이스와 표지를 나누지 않고 한 면으로 보이게 한다. 플라스틱 위에 글자(children)를 바로 놓고,
 * 투명 비닐 반사를 앞면 전체에 겹친다. 경첩에 붙은 왼쪽 모서리는 각지다.
 * GC는 표지 전체가 바깥 종이상자에 있어서 게임 이름만 인쇄한다(children이 없으면 빈 앞면).
 */
export function KeepCaseFront({
  tone,
  square = false,
  children,
}: {
  readonly tone: CaseTone;
  /** true면 모서리를 둥글리지 않는다(GC) */
  readonly square?: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <div
      className={`plastic-body relative size-full overflow-hidden ${square ? '' : 'rounded-r-[1.5cqw]'} ${TONE_CLASSES[tone]}`}
    >
      {children}
      <div className="clear-sleeve pointer-events-none absolute inset-0" />
    </div>
  );
}

/** 안쪽 왼판: 오목한 면 + 위·아래 고정 탭에 끼운 설명서(children = 속지) */
export function KeepCaseInner({
  tone,
  square = false,
  children,
}: {
  readonly tone: CaseTone;
  readonly square?: boolean;
  readonly children: ReactNode;
}) {
  return (
    // 판 크기의 컨테이너로 감싼다. 안쪽의 cqw(모서리·탭 크기)가 판 폭을 기준으로 계산되어,
    // 앞면·오른판과 둥글기가 같아진다(cqw는 자기 자신이 아닌 바깥 컨테이너를 기준으로 한다).
    <div className={`@container size-full ${TONE_CLASSES[tone]}`}>
      {/* 경첩에 붙은 쪽 모서리는 각지고 바깥쪽만 둥글다.
          휴대폰(위로 열림)은 아래쪽이, 데스크톱(옆으로 열림)은 오른쪽이 경첩이다. */}
      <div
        className={`plastic-body relative size-full ${square ? '' : 'rounded-tl-[1.5cqw] rounded-tr-[1.5cqw] md:rounded-tr-none md:rounded-bl-[1.5cqw]'}`}
      >
        <div className={`plastic-recess absolute inset-[3.5%] ${square ? '' : 'rounded-[1cqw]'}`} />
        <div className="absolute top-[6%] right-[7%] bottom-[6%] left-[9%] shadow-[1px_2px_4px_rgb(0_0_0/0.15)]">
          {children}
        </div>
        {/* 고정 탭: 설명서 가장자리를 위에서 누른다 */}
        <div className="plastic-clip absolute top-[11%] left-[3.5%] h-[11%] w-[9%] rounded-r-[1cqw]" />
        <div className="plastic-clip absolute bottom-[11%] left-[3.5%] h-[11%] w-[9%] rounded-r-[1cqw]" />
      </div>
    </div>
  );
}

/**
 * 안쪽 오른판(트레이): 경첩 + 오목한 면 + 매체 받침(holder: Wii 계열 둥근 턱 / GC 육각 받침 / 3DS 카드 받침).
 */
export function KeepCaseTray({
  tone,
  square = false,
  holder,
  patch,
  isOpen,
}: {
  readonly tone: CaseTone;
  readonly square?: boolean;
  readonly holder: 'ring' | 'hex' | 'cart';
  readonly patch: PatchCaseData;
  readonly isOpen: boolean;
}) {
  return (
    // 왼판과 같은 이유로 판 크기의 컨테이너로 감싼다.
    <div className={`@container size-full ${TONE_CLASSES[tone]}`}>
      {/* 경첩에 붙은 쪽 모서리는 각지다. 휴대폰은 위쪽이, 데스크톱은 왼쪽이 경첩이다. */}
      <div
        className={`plastic-body relative size-full ${square ? '' : 'rounded-br-[1.5cqw] rounded-bl-[1.5cqw] md:rounded-tr-[1.5cqw] md:rounded-bl-none'}`}
      >
        {/* 경첩: 데스크톱은 왼쪽(책처럼), 휴대폰은 위쪽(위로 열림) */}
        <div className="plastic-hinge absolute inset-x-0 top-0 h-[3.5%] md:inset-x-auto md:inset-y-0 md:left-0 md:h-full md:w-[5%]" />
        <div
          className={`plastic-recess absolute inset-[3.5%] top-[6%] md:top-[3.5%] md:left-[7%] ${square ? '' : 'rounded-[1cqw]'}`}
        />
        {holder === 'ring' ? <RingHolder patch={patch} isOpen={isOpen} /> : null}
        {holder === 'hex' ? <HexHolder patch={patch} isOpen={isOpen} /> : null}
        {holder === 'cart' ? <CartHolder patch={patch} isOpen={isOpen} /> : null}
        {/* 판 아래쪽 안내: 매체를 누르면 최신 릴리즈 페이지로(케이스 색 묶음의 인쇄 잉크색).
            오목한 면(plastic-recess, 판 가장자리에서 3.5%·데스크톱 왼쪽 7%) 안쪽에 들어오도록 여백을 둔다.
            GC(육각 받침)는 왼쪽 아래에 메모리카드 홈이 있어 그 오른쪽(40%부터)에 둔다(두 줄이 될 수 있다). */}
        <ReleaseHint
          patch={patch}
          className={`absolute right-[9%] bottom-[6%] text-(--p-ink) opacity-75 ${holder === 'hex' ? 'left-[40%]' : 'left-[9%] md:left-[12%]'}`}
        />
      </div>
    </div>
  );
}
