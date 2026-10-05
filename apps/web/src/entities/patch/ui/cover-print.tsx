import { PLATFORM_FULL_NAMES } from '@arqhive/shared';
import { CASE_SPECS } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';

/**
 * 표지 인쇄물(글자 디자인): 위에 기종(줄이지 않은 이름, 예: GameCube), 가운데 제목, 아래에 버전(작업 중이면 "작업 중"). 박스아트 대신 쓴다(저작권 때문에 실제 박스아트는 쓰지 않음).
 * - onCase: 킵 케이스 앞면에 바로 인쇄 — 바탕 없이 케이스 색 위에, 글자색은 케이스 색 묶음(--p-ink)을 따른다.
 * - 그 밖(종이상자, 기본 케이스)에는 기종 색 바탕을 깐다.
 * - titleOnly: 게임 이름만 가운데에 쓴다. 종이상자를 벗기면 나오는 안쪽 케이스·설명서용(표지 전체는 상자에 있다).
 * 글자는 가운데 정렬. 단추(진열장 표지) 안이든 일반 상자(케이스 열기 화면) 안이든 같게 보이도록 직접 지정한다
 * (단추는 브라우저 기본값이 가운데 정렬이라, 지정하지 않으면 두 곳의 정렬이 달라진다).
 * 글자 크기·여백은 cqw(바깥 컨테이너 폭의 1%)라, 작은 표지와 큰 표지의 줄바꿈이 같다.
 */
export function CoverPrint({
  patch,
  onCase = false,
  titleOnly = false,
}: {
  readonly patch: PatchCaseData;
  readonly onCase?: boolean;
  readonly titleOnly?: boolean;
}) {
  const spec = CASE_SPECS[patch.platform];
  const isReleased = patch.status === 'released';
  const surface = onCase ? 'text-(--p-ink)' : spec.caseClass;

  if (titleOnly) {
    return (
      <div
        className={`flex size-full items-center justify-center p-[10cqw] text-center ${surface}`}
      >
        <span className="break-keep font-bold font-title text-[10cqw] leading-snug">
          {patch.titleKo}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex size-full flex-col items-center p-[8cqw] text-center ${surface}`}>
      <span className="font-num text-[5.5cqw] opacity-70">
        {PLATFORM_FULL_NAMES[patch.platform]}
      </span>
      {/* 제목은 위(기종)와 아래(버전) 사이의 가운데. 사이트 이름 같은 제작 표기는 넣지 않는다(원작 게임을 만든 것처럼 보이므로) */}
      <span className="my-auto break-keep font-bold font-title text-[10cqw] leading-snug">
        {patch.titleKo}
      </span>
      <span className="font-num text-[5.5cqw] opacity-70">
        {isReleased ? patch.latestVersion : '작업 중'}
      </span>
    </div>
  );
}
