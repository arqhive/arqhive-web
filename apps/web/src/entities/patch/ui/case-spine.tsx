import { PLATFORM_LABELS } from '@arqhive/shared';
import { CASE_SPECS, type CaseSpec, hasSquareCorners, TONE_CLASSES } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';

/**
 * 선반에 꽂힌 케이스의 등줄기. 크기는 모든 기종이 같고, 겉면(색·재질)만 기종을 따른다.
 * 글자는 세로쓰기이고, 로마자·숫자·기호도 한글처럼 한 글자씩 바로 세운다(text-orientation: upright).
 * 이때 띄어쓰기도 글자 한 자 높이로 세워져 너무 벌어지므로, 낱말 사이 간격(word-spacing)을 줄여 글자의 약 1/3로 맞춘다. 줄은 왼쪽에서 오른쪽으로 넘어간다(vertical-lr, 일본식 vertical-rl의 반대).
 * 제목은 두 줄(세로쓰기라 두 열)까지 쓴다. 폭을 줄 간격 두 배(2lh)로 묶고 넘치는 셋째 열(오른쪽)은 잘라 낸다.
 * 줄 간격(1.4)을 글자 폭보다 넉넉히 두어, 둘째 열 글자 가장자리가 잘리지 않게 한다.
 * 위아래 여백은 pt·pb(물리 방향)로 준다. py는 글 흐름 기준(padding-block)이라 세로쓰기에서는 좌우 여백이 되어 열을 밀어낸다.
 * (세로쓰기에서는 줄 수 말줄임 line-clamp가 듣지 않는다.) 전체 제목은 케이스를 열면 보인다.
 * 클릭 등 상호작용은 감싸는 쪽(widgets/shelf)이 맡는다.
 */
/**
 * 등줄기 크기: 기종과 상관없이 모두 같다. 실물 높이·두께 비율은 쓰지 않고, 선반에서 제목을 고르게 읽게 하는 데 맞춘다.
 * 폭은 제목 두 줄(두 열)이 넉넉히 들어가는 크기다.
 */
const SPINE_SIZE = 'h-60 w-16';

/** 등줄기 겉면: 킵 케이스는 같은 플라스틱 색 묶음, 종이상자는 흰 종이 옆면, 그 밖에는 기종 색 바탕 */
function spineSurface(spec: CaseSpec): string {
  if (spec.form === 'boxed-keepcase') {
    return 'paper-spine';
  }
  if (spec.form === 'keepcase' && spec.tone !== null) {
    return `plastic-spine ${TONE_CLASSES[spec.tone]}`;
  }
  return `border border-black/25 ${spec.caseClass}`;
}

/** 등줄기 윗부분의 기종 띠: 종이상자는 흰 바탕에 검은 띠로 인쇄, 그 밖에는 가는 선으로만 나눈다 */
function bandSurface(spec: CaseSpec): string {
  if (spec.form === 'boxed-keepcase') {
    return 'paper-band py-2';
  }
  return 'border-black/15 border-b py-1';
}

/**
 * 등줄기 제목. 작품 정보에 spineLines(고정 줄)가 있으면 그 줄대로 나눠 쓰고(줄 안에서는 바꾸지 않음),
 * 없으면 titleKo를 낱말 단위로 자동 줄바꿈한다. 세로쓰기에서는 블록(block) 하나가 한 열이 되어, 줄마다 다음 열(오른쪽)로 넘어간다.
 */
function SpineTitle({ patch }: { readonly patch: PatchCaseData }) {
  if (patch.spineLines === undefined) {
    return patch.titleKo;
  }
  return patch.spineLines.map((line) => (
    <span key={line} className="block whitespace-nowrap">
      {line}
    </span>
  ));
}

export function CaseSpine({ patch }: { readonly patch: PatchCaseData }) {
  const spec = CASE_SPECS[patch.platform];
  const isReleased = patch.status === 'released';
  // GC는 종이상자에 들어 있으므로 등줄기는 상자 옆면(흰 종이, 윗부분만 검은 띠)이다.
  const surface = spineSurface(spec);
  const band = bandSurface(spec);

  return (
    // 실물 케이스·상자처럼 모서리를 아주 살짝 둥글린다(GC는 각지게). 띠(위 기종·아래 버전)가 모서리 밖으로 나오지 않게 overflow-hidden.
    <div
      className={`flex flex-col items-center overflow-hidden ${hasSquareCorners(spec) ? '' : 'rounded-[5px]'} ${SPINE_SIZE} ${surface}`}
    >
      <span className={`w-full text-center font-num text-[0.625rem] ${band}`}>
        {PLATFORM_LABELS[patch.platform]}
      </span>
      <span className="min-h-0 max-w-[2lh] flex-1 overflow-hidden break-keep pt-2 pb-2 font-bold font-title text-sm leading-[1.4] [text-orientation:upright] [word-spacing:-0.8em] [writing-mode:vertical-lr]">
        <SpineTitle patch={patch} />
      </span>
      {/* 아랫부분: 공개된 작품은 최신 버전, 작업 중이면 빨간 "작업 중" 띠. 같은 높이라 등줄기 제목 자리가 흔들리지 않는다 */}
      {isReleased ? (
        <span className="w-full border-black/15 border-t py-0.5 text-center font-num text-[0.625rem]">
          {patch.latestVersion}
        </span>
      ) : (
        <span className="w-full bg-stamp py-0.5 text-center text-[0.625rem] text-on-stamp">
          작업 중
        </span>
      )}
    </div>
  );
}
