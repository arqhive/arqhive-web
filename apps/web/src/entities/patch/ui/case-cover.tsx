import { PLATFORM_LABELS } from '@arqhive/shared';
import { CASE_SPECS } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';
import { WiiCaseFront } from './wii-keepcase.tsx';

/** 표지 인쇄물(글자 디자인). 기종 색 바탕에 기종·판, 제목, 한글판 표기 */
function CoverPrint({ patch }: { readonly patch: PatchCaseData }) {
  const spec = CASE_SPECS[patch.platform];
  const isReleased = patch.status === 'released';

  return (
    <div className={`flex size-full flex-col justify-between p-[8cqw] ${spec.caseClass}`}>
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

/**
 * 케이스 앞표지. 박스아트 대신 글자로 디자인한 인쇄물이다(저작권 때문에 실제 박스아트는 쓰지 않음).
 * 진열장의 작은 표지와 케이스 열기 연출의 큰 표지가 같은 컴포넌트다.
 *
 * 글자 크기·여백은 픽셀이 아니라 **케이스 폭에 대한 비율**(cqw: 컨테이너 폭의 1%)로 정한다.
 * 그래서 작은 표지와 큰 표지는 크기만 다를 뿐 줄바꿈까지 똑같고, 날아가며 커지는 동안 글자 배치가 바뀌지 않는다.
 * - `@container`: 이 요소를 컨테이너로 지정한다. 안쪽의 cqw는 이 요소의 폭을 기준으로 한다.
 * - `break-keep`(word-break: keep-all): 한글을 음절 사이가 아니라 띄어쓰기에서만 줄바꿈한다.
 * - 실물 케이스 형태(form)가 있는 기종은 그 케이스의 비닐 아래에 인쇄물을 끼워 보여 준다.
 */
export function CaseCover({ patch }: { readonly patch: PatchCaseData }) {
  const spec = CASE_SPECS[patch.platform];

  if (spec.form === 'wii-keepcase') {
    return (
      <div className="@container size-full">
        <WiiCaseFront>
          <CoverPrint patch={patch} />
        </WiiCaseFront>
      </div>
    );
  }

  return (
    <div className="@container size-full border border-black/20">
      <CoverPrint patch={patch} />
    </div>
  );
}
