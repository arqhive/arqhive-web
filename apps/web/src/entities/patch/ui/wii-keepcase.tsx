import { PLATFORM_LABELS } from '@arqhive/shared';
import type { ReactNode } from 'react';
import { HoloText } from '@/shared/ui';
import type { PatchCaseData } from '../model/case-data.ts';

/**
 * Wii 킵 케이스(흰 플라스틱, 135×191mm)를 CSS로 그린 부품들. 실제 케이스 구조를 따르되 로고·마크는 그리지 않는다.
 * 재질은 case-materials.css의 @utility(plastic-white, plastic-recess …)를 쓴다.
 * 모든 크기·위치는 케이스 폭·높이에 대한 비율(%)이라, 진열장의 작은 표지와 열린 큰 케이스가 같은 모양이다.
 */

/** 앞면: 경첩 쪽 등줄기 + 투명 비닐 아래 끼운 표지(children) + 비닐 반사 */
export function WiiCaseFront({ children }: { readonly children: ReactNode }) {
  return (
    <div className="plastic-white relative size-full rounded-r-[1.5cqw]">
      {/* 경첩 쪽 등줄기(앞에서 보면 왼쪽 가장자리). 경첩에 붙은 쪽이라 모서리가 각지다 */}
      <div className="absolute inset-y-0 left-0 w-[7%] border-black/10 border-r bg-black/[0.03]" />
      {/* 비닐 아래 표지 */}
      <div className="absolute top-[2.5%] right-[2.5%] bottom-[2.5%] left-[8.5%] overflow-hidden">
        {children}
        <div className="clear-sleeve pointer-events-none absolute inset-0" />
      </div>
    </div>
  );
}

/** 안쪽 왼판: 오목한 면 + 위·아래 고정 탭에 끼운 설명서(children = 속지) */
export function WiiCaseInner({ children }: { readonly children: ReactNode }) {
  return (
    // 판 크기의 컨테이너로 감싼다. 안쪽의 cqw(모서리·탭 크기)가 판 폭을 기준으로 계산되어,
    // 앞면·오른판과 둥글기가 같아진다(cqw는 자기 자신이 아닌 바깥 컨테이너를 기준으로 한다).
    <div className="@container size-full">
      {/* 경첩에 붙은 쪽 모서리는 각지고 바깥쪽만 둥글다.
          휴대폰(위로 열림)은 아래쪽이, 데스크톱(옆으로 열림)은 오른쪽이 경첩이다. */}
      <div className="plastic-white relative size-full rounded-tl-[1.5cqw] rounded-tr-[1.5cqw] md:rounded-tr-none md:rounded-bl-[1.5cqw]">
        <div className="plastic-recess absolute inset-[3.5%] rounded-[1cqw]" />
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
 * 안쪽 오른판(트레이): 경첩 + 오목한 면 + 디스크 받침 턱 + 손가락 홈 두 개 + 디스크 + 가운데 허브.
 * isOpen이면 디스크가 한 바퀴 돈다(열리는 순간의 생동감). 한 바퀴라서 멈추면 라벨 글자가 바로 선다.
 * 디스크 라벨: 구멍 위에 게임 제목, 구멍 아래에 기종(홀로그램). 실제 디스크처럼 인쇄면이 거의 전체를 덮는다.
 * 허브는 디스크 구멍을 통과해 위로 나와 있으므로 디스크 위에 그린다.
 */
export function WiiCaseTray({
  patch,
  isOpen,
}: {
  readonly patch: PatchCaseData;
  readonly isOpen: boolean;
}) {
  return (
    // 왼판과 같은 이유로 판 크기의 컨테이너로 감싼다.
    <div className="@container size-full">
      {/* 경첩에 붙은 쪽 모서리는 각지다. 휴대폰은 위쪽이, 데스크톱은 왼쪽이 경첩이다. */}
      <div className="plastic-white relative size-full rounded-br-[1.5cqw] rounded-bl-[1.5cqw] md:rounded-tr-[1.5cqw] md:rounded-bl-none">
        {/* 경첩: 데스크톱은 왼쪽(책처럼), 휴대폰은 위쪽(위로 열림) */}
        <div className="plastic-hinge absolute inset-x-0 top-0 h-[3.5%] md:inset-x-auto md:inset-y-0 md:left-0 md:h-full md:w-[5%]" />
        <div className="plastic-recess absolute inset-[3.5%] top-[6%] rounded-[1cqw] md:top-[3.5%] md:left-[7%]" />
        <div className="absolute inset-0 flex items-center justify-center md:pl-[3%]">
          <div className="relative aspect-square w-[92%]">
            <div className="plastic-ring absolute inset-0 rounded-full" />
            {/* 손가락 홈: 받침 턱의 오른쪽 위·왼쪽 아래 */}
            <div className="plastic-notch absolute top-[6%] right-[6%] aspect-square w-[16%] rounded-full" />
            <div className="plastic-notch absolute bottom-[6%] left-[6%] aspect-square w-[16%] rounded-full" />
            {/* 디스크: 인쇄면(라벨)이 거의 전체를 덮고, 가운데 구멍 둘레는 인쇄되지 않은 투명한 띠다 */}
            <div
              className={`disc-surface absolute inset-[4%] rounded-full transition-[rotate] delay-500 duration-[1400ms] ease-out motion-reduce:transition-none ${isOpen ? 'rotate-[360deg]' : 'rotate-0'}`}
            >
              <div className="disc-label absolute inset-[2.5%] rounded-full" />
              <div className="disc-clear absolute top-1/2 left-1/2 aspect-square w-[24%] -translate-1/2 rounded-full" />
              {/* 글자 중심은 구멍 둘레(반지름 12%)와 디스크 가장자리(50%)의 가운데, 즉 중심에서 31% 떨어진 곳에 둔다 */}
              {/* 게임 제목: 위쪽 띠의 가운데보다 조금 아래(위에서 23%) */}
              <span className="absolute inset-x-[20%] top-[23%] -translate-y-1/2 break-keep text-center font-bold font-title text-[4.5cqw] leading-tight">
                {patch.titleKo}
              </span>
              {/* 기종: 아래쪽 띠의 가운데(위에서 81%). 마우스를 따라 반사가 움직이는 홀로그램 글자 */}
              <span className="absolute inset-x-0 top-[81%] -translate-y-1/2 text-center font-bold text-[9cqw] leading-none">
                <HoloText>{PLATFORM_LABELS[patch.platform]}</HoloText>
              </span>
            </div>
            {/* 허브: 디스크 구멍을 지나 위로 나온 꽃잎 고정 돌기 */}
            <div className="plastic-hub absolute top-1/2 left-1/2 aspect-square w-[16%] -translate-1/2 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
