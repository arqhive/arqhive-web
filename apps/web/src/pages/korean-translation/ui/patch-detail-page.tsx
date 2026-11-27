import type { Patch } from '@arqhive/content';
import { PLATFORM_LABELS } from '@arqhive/shared';
import Link from 'next/link';
import {
  fetchChangelog,
  fetchReleaseInfo,
  PatchDownloadLinks,
  regionLabel,
  toCaseData,
} from '@/entities/patch';
import { formatDate } from '@/shared/lib';
import { MarkdownBody } from '@/shared/markdown';
import { PatchCasePreview } from './patch-case-preview.tsx';

const COMPATIBILITY_LABELS = {
  works: '구동 확인',
  issues: '문제 있음',
  broken: '구동 불가',
  untested: '미확인',
} as const;

const HEADING = 'font-bold font-title text-xl';
const TEXT_LINK =
  'underline underline-offset-4 hover:text-stamp focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp';

/** 상세 주소에서는 해당 패치의 데이터만 읽어서 본문과 다운로드를 그린다. */
export async function PatchDetailPage({ patch }: { readonly patch: Patch }) {
  const released = patch.status === 'released';
  const [release, changelog] = released
    ? await Promise.all([
        fetchReleaseInfo(patch.repo, patch.downloadCode),
        fetchChangelog(patch.repo),
      ])
    : [null, null];
  const caseData = toCaseData(patch, release);

  return (
    <article className="mx-auto max-w-5xl space-y-8 pb-8">
      <Link href="/korean-translation" className={`inline-block text-sm ${TEXT_LINK}`}>
        <span aria-hidden="true">← </span>한글 패치 진열장
      </Link>

      <header className="grid gap-5 border-line border-y py-6 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center sm:gap-8 sm:py-8">
        <div className="min-w-0 space-y-3">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-num text-ink-sub text-xs">
            <span>{PLATFORM_LABELS[patch.platform]}</span>
            <span aria-hidden="true">·</span>
            {released ? (
              <>
                <span className="font-bold text-ink">{caseData.latestVersion}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={caseData.latestReleaseDate}>
                  {formatDate(caseData.latestReleaseDate)}
                </time>
              </>
            ) : (
              <span>작업 중</span>
            )}
          </p>
          <h1 className="break-keep font-bold font-title text-3xl leading-tight wrap-anywhere sm:text-4xl lg:text-5xl">
            {patch.titleKo} <span className="whitespace-nowrap">한글 패치</span>
          </h1>
          <p className="break-keep text-ink-sub text-sm">{patch.titleOriginal}</p>
          <p className="max-w-prose break-keep text-ink/85 leading-relaxed">{patch.summary}</p>
        </div>

        <PatchCasePreview patch={caseData} hasChangelog={Boolean(changelog)} />
      </header>

      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(13rem,0.52fr)] md:gap-10">
        <aside className="min-w-0 space-y-5 border border-line bg-card p-4 sm:p-5 md:col-start-2 md:row-start-1">
          <div className="space-y-3">
            <h2 className={HEADING}>다운로드</h2>
            {released ? (
              <PatchDownloadLinks patch={caseData} />
            ) : (
              <p className="text-ink-sub text-sm">패치를 준비 중입니다.</p>
            )}
          </div>
          <div className="space-y-2 border-line border-t pt-4 text-sm">
            <Link href="/guide" className={`block ${TEXT_LINK}`}>
              공통 패치 적용 가이드
            </Link>
            {released ? (
              <Link href="/report" className={`block ${TEXT_LINK}`}>
                패치 문제 제보하기
              </Link>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0 space-y-8 md:col-start-1 md:row-start-1">
          <section className="space-y-3">
            <h2 className={HEADING}>지원 원본판</h2>
            {patch.baseRequirements.length === 0 ? (
              <p>{regionLabel(patch.baseRegion)}</p>
            ) : (
              <ul className="divide-y divide-line border-line border-y">
                {patch.baseRequirements.map((base) => (
                  <li key={`${base.region}/${base.gameId ?? ''}`} className="space-y-1 py-3">
                    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-bold">
                      {regionLabel(base.region)}
                      {base.gameId ? (
                        <code className="font-num font-normal text-ink-sub text-xs wrap-anywhere">
                          {base.gameId}
                        </code>
                      ) : null}
                    </p>
                    {base.dumpFormat ? (
                      <p className="break-keep text-sm">{base.dumpFormat}</p>
                    ) : null}
                    {base.note ? (
                      <p className="break-keep text-ink-sub text-sm leading-relaxed wrap-anywhere">
                        {base.note}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {patch.body.trim() ? (
            <section className="space-y-3">
              <h2 className={HEADING}>패치 안내</h2>
              <MarkdownBody markdown={patch.body} variant="reading" />
            </section>
          ) : null}

          {patch.compatibility.length > 0 ? (
            <section className="space-y-3">
              <h2 className={HEADING}>구동 환경</h2>
              <ul className="divide-y divide-line border-line border-y text-sm">
                {patch.compatibility.map((entry) => (
                  <li key={entry.environment} className="py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="font-bold">{entry.environment}</span>
                      <span className="text-ink-sub">{COMPATIBILITY_LABELS[entry.status]}</span>
                    </div>
                    {entry.note ? (
                      <p className="mt-1 break-keep text-ink-sub">{entry.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {patch.knownIssues.length > 0 ? (
            <section className="space-y-3">
              <h2 className={HEADING}>알려진 문제</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {patch.knownIssues.map((issue) => (
                  <li key={issue} className="break-keep wrap-anywhere">
                    {issue}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}
