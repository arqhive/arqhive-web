import { PLATFORM_LABELS } from '@arqhive/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CASE_SPECS, type PatchCaseData, releaseStage, TitleLines } from '@/entities/patch';

/** 이 비율보다 작은 케이스(3DS·NDS·GB·GBA)는 속지가 좁아서 글자를 줄인다 */
const COMPACT_SCALE = 0.7;

/**
 * 데스크톱(md 이상) 크기. 속지의 기준 글자 크기를 속지 폭의 4%(4cqw)로 두고, 나머지는 모두 em(기준 글자의 배수)으로 쓴다.
 * 그래서 케이스가 화면에 맞춰 커지고 작아져도 속지 안의 배치가 인쇄물처럼 같은 비율로 유지된다.
 */
const DESKTOP = {
  normal: {
    box: 'md:p-[2.5em]',
    title: 'md:text-[2.25em]',
    list: 'md:mt-[1.5em] md:space-y-[0.5em] md:pt-[1.5em]',
  },
  compact: {
    box: 'md:p-[1.5em]',
    title: 'md:text-[1.5em]',
    list: 'md:mt-[1em] md:space-y-[0.375em] md:pt-[1em]',
  },
} as const;

/** 상태 칸 문구: 작업 중 / v1.0 미만 공개 테스트 배포 / v1.0 이상 검수판 배포 (판정은 entities/patch의 releaseStage) */
function StageText({ patch }: { readonly patch: PatchCaseData }) {
  const stage = releaseStage(patch);
  if (stage === 'in-progress') {
    return <>작업 중</>;
  }
  return stage === 'reviewed' ? <>검수판 배포</> : <>공개 테스트 배포</>;
}

/**
 * 버전 번호가 무슨 뜻인지 설명하는 가이드(/guide의 버전 가이드 절)로 가는 링크.
 */
function VersionGuideLink() {
  return (
    <Link
      href="/guide#version"
      className="text-ink-sub underline underline-offset-2 hover:text-stamp"
    >
      버전 가이드
    </Link>
  );
}

/**
 * 원본 판 이름: 콘텐츠의 지역 코드(JP·US·EU, 둘이면 "US/EU")를 일본판·북미판·유럽판으로 읽는다.
 * 모르는 코드는 코드 뒤에 "판"만 붙인다.
 */
function RegionText({ region }: { readonly region: string }) {
  return region
    .split('/')
    .map((code) => {
      if (code === 'JP') {
        return '일본';
      }
      if (code === 'US') {
        return '북미';
      }
      return code === 'EU' ? '유럽' : code;
    })
    .map((name) => `${name}판`)
    .join('·');
}

/** 정보 칸 한 줄(이름 + 값) */
function Fact({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex gap-[0.75em]">
      {/* 칸 이름이 길면(알려진 문제) 낱말 단위로 줄을 바꾼다: "알려진 / 문제" */}
      <dt className="w-[4.5em] shrink-0 break-keep text-ink-sub">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

/**
 * 속지 정보 목록: 상태 · 버전 · 원본 · 방식 · 구동 확인 · 번역 범위 · 알려진 문제.
 * 번역 범위·알려진 문제·구동 확인은 각 저장소 README에서 옮겨 둔 콘텐츠 값(translationScope·knownIssues·compatibility)이다.
 * 구동 확인에는 README 「실행 환경」의 "확인함" 환경(status works)만 쓴다. 안 됨·미확인 환경은 넣지 않는다.
 * 작업 중(공개 전)인 작품은 상태 말고는 모두 "-"로 둔다(10/6). 값이 없을 때도 "-".
 */
function LinerFacts({
  patch,
  listClass,
}: {
  readonly patch: PatchCaseData;
  readonly listClass: string;
}) {
  const open = releaseStage(patch) !== 'in-progress';
  const issues = open ? patch.knownIssues : [];
  const verified = open
    ? patch.compatibility.filter((item) => item.status === 'works').map((item) => item.environment)
    : [];
  return (
    <dl
      className={`mt-2 space-y-0.5 border-line border-t border-dashed pt-2 text-xs md:text-[1em] ${listClass}`}
    >
      <Fact label="상태">
        <StageText patch={patch} />
      </Fact>
      <Fact label="버전">
        {open ? (
          <span className="flex flex-wrap items-baseline gap-x-[0.75em]">
            <span className="font-num">{patch.latestVersion}</span>
            <VersionGuideLink />
          </span>
        ) : (
          '-'
        )}
      </Fact>
      <Fact label="원본">{open ? <RegionText region={patch.baseRegion} /> : '-'}</Fact>
      <Fact label="방식">{open ? patch.patchMethodLabel : '-'}</Fact>
      <Fact label="구동 확인">
        <span className="break-keep">{verified.length === 0 ? '-' : verified.join(', ')}</span>
      </Fact>
      <Fact label="번역 범위">
        <span className="break-keep">{open ? (patch.translationScope ?? '-') : '-'}</span>
      </Fact>
      <Fact label="알려진 문제">
        {issues.length === 0 ? (
          '-'
        ) : (
          <ul className="list-disc space-y-[0.25em] break-keep pl-[1em]">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}
      </Fact>
    </dl>
  );
}

/**
 * 속지: 케이스 표지의 뒷면. 열리면 보이는 패치 정보 카드다.
 * 실제 게임 케이스를 열면 왼쪽(휴대폰에선 위쪽)에 설명서가 끼워져 있는 것에서 가져온 발상이다.
 *
 * - 데스크톱: 글자 크기가 속지 폭에 비례한다(위 DESKTOP 설명).
 * - 설명문(summary)은 넣지 않는다(10/6 사용자 결정).
 * - 휴대폰: 케이스가 작아 속지 폭 비례로는 글자가 너무 작아지므로, 사이트 글자 크기(rem) 기준의 줄인 배치를 쓴다.
 *   작은 케이스는 제목을 한 단계 줄이고 맨 아래 안내 문구도 뺀다.
 * 전체 내용은 상세 페이지에서 본다.
 */
export function CaseLiner({
  patch,
  onShowChangelog,
}: {
  readonly patch: PatchCaseData;
  /** 있으면 원제 아래에 "업데이트 내역 보기" 단추를 두고, 누르면 부른다(업데이트 내역을 읽어 온 공개 작품만) */
  readonly onShowChangelog?: (() => void) | undefined;
}) {
  const isReleased = patch.status === 'released';
  const compact = CASE_SPECS[patch.platform].scale < COMPACT_SCALE;
  const desk = DESKTOP[compact ? 'compact' : 'normal'];

  return (
    <div className="@container size-full">
      <div
        className={`flex size-full flex-col overflow-y-auto border border-line bg-card p-3 text-ink md:text-[4cqw] ${desk.box}`}
      >
        {/* 맨 위 줄: 왼쪽 기종, 오른쪽 다운로드 수(공개 작품이고 읽어 온 값이 있을 때만) */}
        <div className="flex items-baseline justify-between gap-2 font-num text-ink-sub text-xs md:text-[0.875em]">
          <span>{PLATFORM_LABELS[patch.platform]}</span>
          {isReleased && patch.downloadCount !== null ? (
            <span>{patch.downloadCount.toLocaleString('ko-KR')}회 다운로드</span>
          ) : null}
        </div>
        {/* 한글 제목이 먼저, 게임 원제는 그 아래 작게(10/6). 위 여백 em은 제목 자신의 큰 글자 기준이라 작게 둔다 */}
        <h2
          className={`mt-1 shrink-0 break-keep font-bold font-title leading-snug ${compact ? 'text-base' : 'text-lg'} md:mt-[0.15em] ${desk.title}`}
        >
          <TitleLines patch={patch} />
        </h2>
        <span className="mt-1 line-clamp-2 shrink-0 text-ink-sub text-xs md:text-[1em]">
          {patch.titleOriginal}
        </span>
        {onShowChangelog === undefined ? null : (
          <button
            type="button"
            onClick={onShowChangelog}
            className="mt-2 self-start text-ink text-xs underline underline-offset-2 hover:text-stamp focus-visible:outline-2 focus-visible:outline-stamp md:text-[0.875em]"
          >
            업데이트 내역 보기
          </button>
        )}
        <LinerFacts patch={patch} listClass={desk.list} />
        {/* 맨 아래 안내는 작업 중(공개 전)인 작품에만 둔다 */}
        {isReleased ? null : (
          <span
            className={`mt-auto pt-2 font-num text-ink-sub text-xs md:block md:pt-[1em] md:text-[0.875em] ${compact ? 'hidden' : ''}`}
          >
            완성되면 다운로드가 열립니다
          </span>
        )}
      </div>
    </div>
  );
}
