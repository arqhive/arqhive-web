import { PLATFORM_LABELS } from '@arqhive/shared';
import { CASE_SPECS, type CaseSpec, hasSquareCorners, TONE_CLASSES } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';

/**
 * 선반에 꽂힌 케이스의 등줄기. 크기는 모든 기종이 같고, 겉면(색·재질)만 기종을 따른다.
 * 제목은 세로로 한 글자씩 쌓는다. 로마자·숫자·기호도 한글처럼 바로 세운다. 줄(열)은 왼쪽에서 오른쪽으로 넘어간다.
 *
 * 세로쓰기(writing-mode)를 쓰지 않고 **글자마다 같은 높이의 칸을 세로로 쌓는다**(10/7). 세로쓰기는 띄어쓰기 높이를
 * 브라우저·글꼴마다 다르게 그려서, 낱말 간격을 줄이려 넣은 음수 word-spacing이 iOS Safari에서 음수 간격이 되어
 * 띄어쓰기 자리의 글자가 겹쳤다. 칸 높이·낱말 사이 빈칸을 em으로 고정하면 어느 브라우저에서나 같은 모양이 된다.
 * - 줄 나누기: 콘텐츠에 spineLines가 있으면 그 줄대로, 없으면 낱말 단위로 한 열 높이(COLUMN_EM)에 맞춰 나눈다.
 * - 두 열까지 쓰고, 넘치면 잘라 낸다. 전체 제목은 케이스를 열면 보인다.
 * - 글자 칸들은 화면 낭독기에서 숨긴다(한 글자씩 읽히지 않게). 제목은 감싸는 링크의 aria-label이 읽힌다(widgets/shelf).
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
 * 글자 한 칸의 높이(em)와 낱말 사이 빈칸의 높이(em, 글자 칸의 약 1/3). 아래 SpineTitle의 h-[1.15em]·h-[0.35em]과 같은 값이어야 한다
 * (Tailwind는 클래스 이름을 소스에서 그대로 찾으므로 숫자를 끼워 만든 클래스는 쓸 수 없다).
 */
const CELL_EM = 1.15;
const GAP_EM = 0.35;
/**
 * 한 열에 쓸 수 있는 높이(em). 등줄기(h-60 = 15rem)에서 위 기종 띠·아래 버전 띠·위아래 여백을 빼면 약 12.8em(글자 text-sm 기준).
 * 등줄기 크기와 글자 크기가 모두 rem이라 기기·확대 설정과 상관없이 같은 값이다.
 */
const COLUMN_EM = 12.5;
/** 열 수 상한(등줄기 폭에 두 열까지) */
const MAX_COLUMNS = 2;

/** 그릴 글자 한 칸. key는 제목 안의 위치(같은 글자가 되풀이돼도 겹치지 않게) */
interface SpineChar {
  readonly key: string;
  readonly char: string;
}

/** 낱말 하나의 높이(em) */
function wordEm(word: string): number {
  return Array.from(word).length * CELL_EM;
}

/**
 * 제목 → 열(낱말 묶음) 목록. spineLines가 있으면 줄마다 한 열, 없으면 앞에서부터 한 열 높이에 들어가는 만큼 낱말을 담는다.
 */
function spineColumns(patch: PatchCaseData): string[][] {
  if (patch.spineLines !== undefined) {
    return patch.spineLines.map((line) => line.split(' ').filter((word) => word !== ''));
  }
  const columns: string[][] = [];
  let current: string[] = [];
  let used = 0;
  for (const word of patch.titleKo.split(' ').filter((item) => item !== '')) {
    if (current.length > 0 && used + GAP_EM + wordEm(word) > COLUMN_EM) {
      columns.push(current);
      current = [];
      used = 0;
    }
    used += (current.length > 0 ? GAP_EM : 0) + wordEm(word);
    current.push(word);
  }
  if (current.length > 0) {
    columns.push(current);
  }
  return columns;
}

/** 열 → 그릴 낱말·글자 칸(키는 "열.낱말.글자" 위치로 미리 만든다) */
function spineLayout(patch: PatchCaseData) {
  return spineColumns(patch)
    .slice(0, MAX_COLUMNS)
    .map((words, column) => ({
      key: `c${column}`,
      words: words.map((word, index) => ({
        key: `c${column}w${index}`,
        gapBefore: index > 0,
        chars: Array.from(word).map(
          (char, position): SpineChar => ({ key: `c${column}w${index}p${position}`, char }),
        ),
      })),
    }));
}

/** 등줄기 제목: 열마다 글자 칸을 세로로 쌓고, 낱말 사이에는 고정 높이 빈칸을 둔다 */
function SpineTitle({ patch }: { readonly patch: PatchCaseData }) {
  return spineLayout(patch).map((column) => (
    <span key={column.key} className="flex w-[1.4em] shrink-0 flex-col items-center">
      {column.words.map((word) => (
        <span key={word.key} className="flex flex-col items-center">
          {word.gapBefore ? <span className="block h-[0.35em] w-px shrink-0" /> : null}
          {word.chars.map((cell) => (
            <span key={cell.key} className="flex h-[1.15em] shrink-0 items-center justify-center">
              {cell.char}
            </span>
          ))}
        </span>
      ))}
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
      <span
        aria-hidden="true"
        className="flex min-h-0 flex-1 justify-center overflow-hidden pt-2 pb-2 font-bold font-title text-sm leading-none"
      >
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
