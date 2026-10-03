import { PLATFORM_LABELS } from '@arqhive/shared';
import { CASE_SPECS } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';

/**
 * 표지 인쇄물(글자 디자인): 기종·판, 제목, 한글판 표기. 박스아트 대신 쓴다(저작권 때문에 실제 박스아트는 쓰지 않음).
 * - onCase: 킵 케이스 앞면에 바로 인쇄 — 바탕 없이 케이스 색 위에, 글자색은 케이스 색 묶음(--p-ink)을 따른다.
 * - 그 밖(종이상자, 기본 케이스)에는 기종 색 바탕을 깐다.
 * - titleOnly: 게임 이름만 가운데에 쓴다. 종이상자를 벗기면 나오는 안쪽 케이스·설명서용(표지 전체는 상자에 있다).
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
    <div className={`flex size-full flex-col justify-between p-[8cqw] ${surface}`}>
      <span className="font-num text-[5.5cqw] opacity-70">
        {PLATFORM_LABELS[patch.platform]} · {isReleased ? patch.latestVersion : '작업 중'}
      </span>
      <span className="break-keep font-bold font-title text-[10cqw] leading-snug">
        {patch.titleKo}
      </span>
      <span className="font-num text-[5.5cqw] opacity-70">arqhive 한글판</span>
    </div>
  );
}
