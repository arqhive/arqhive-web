'use client';

import { PLATFORM_LABELS } from '@arqhive/shared';
import {
  matchesFilter,
  type PatchCaseData,
  type PickHandler,
  type PlatformFilter,
  patchPath,
  pickOnPlainClick,
} from '@/entities/patch';
import { formatDate } from '@/shared/lib';

/**
 * 목록 보기(시안 A 기록보관소의 촘촘한 표). 분류 번호 순으로 보여 준다.
 * 데스크톱(md 이상)은 표, 휴대폰은 한 줄 카드로 바뀐다(같은 데이터, 다른 배치).
 * 휴대폰 카드의 오른쪽 칸(배포 배지·기종)은 줄마다 폭이 달라서, 둘 다 오른쪽 끝에 맞춘다(justify-self-end).
 */
export function PatchTable({
  items,
  filter,
  onPick,
}: {
  readonly items: readonly PatchCaseData[];
  readonly filter: PlatformFilter;
  readonly onPick: PickHandler;
}) {
  const rows = items
    .filter((item) => matchesFilter(item, filter))
    .toSorted((a, b) => a.catalogNo.localeCompare(b.catalogNo));

  return (
    <ul className="border-ink border-t-2">
      {rows.map((item) => (
        <li key={item.slug} className="border-line border-b">
          <a
            href={patchPath(item.slug)}
            data-track="case-open"
            data-track-patch={item.slug}
            onClick={(event) => pickOnPlainClick(event, item, onPick)}
            className="grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-1 py-3 text-left hover:bg-card focus-visible:outline-2 focus-visible:outline-stamp md:grid-cols-[7.5rem_1fr_4.5rem_4.5rem_5rem_6rem] md:items-center"
          >
            <span className="order-3 font-num text-ink-sub text-xs md:order-none">
              {item.catalogNo}
            </span>
            <span className="order-1 md:order-none">
              <span className="block break-keep font-title text-base">{item.titleKo}</span>
              <span className="block text-ink-sub text-xs">{item.titleOriginal}</span>
            </span>
            <span className="order-4 justify-self-end font-num text-ink-sub text-xs md:order-none md:justify-self-start md:text-ink md:text-sm">
              {PLATFORM_LABELS[item.platform]}
            </span>
            <span className="hidden font-num text-sm md:inline">
              {item.status === 'released' ? item.latestVersion : '—'}
            </span>
            <span className="order-2 justify-self-end md:order-none md:justify-self-start">
              <span
                className={`inline-block border-[1.5px] px-1.5 py-px text-xs ${item.status === 'released' ? 'border-stamp text-stamp' : 'border-ink-sub text-ink-sub'}`}
              >
                {item.status === 'released' ? '배포' : '작업 중'}
              </span>
            </span>
            <span className="hidden font-num text-ink-sub text-sm md:inline">
              {formatDate(item.latestReleaseDate)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
