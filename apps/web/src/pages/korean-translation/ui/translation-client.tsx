'use client';

import { type ReactNode, useId, useState } from 'react';
import { type PatchCaseData, type PlatformFilter, toggleFilter } from '@/entities/patch';
import { QueryProvider } from '@/shared/query';
import { CaseViewer } from '@/widgets/case-viewer';
import { PatchTable } from '@/widgets/patch-table';
import { FaceOutRow, Shelf } from '@/widgets/shelf';
import { loadChangelog } from '../api/load-changelog.tsx';
import { useShelfCase } from '../model/use-shelf-case.ts';
import type { ViewMode } from '../model/view-mode.ts';
import { PatchInstructionsDisclosure } from './patch-instructions-disclosure.tsx';
import { TranslationToolbar } from './translation-toolbar.tsx';

/**
 * 진열장 화면의 상태를 갖는 클라이언트 부분.
 * - filter: 기종 필터 / view: 진열장·목록 보기 / picked: 꺼내 열려 있는 작품
 * - 누른 요소(등줄기·표지·목록 줄)는 열려 있는 동안 감춰서 "그 자리에서 꺼냈다"처럼 보이게 하고,
 *   닫히면 다시 보이게 한다. 같은 작품이 표지 진열과 선반에 동시에 있을 수 있어,
 *   작품이 아니라 **누른 요소**를 기준으로 감춘다.
 * - 열려 있는 동안 주소창은 작품 주소, 닫으면 진열장 주소(replaceState: 방문 기록은 늘리지 않음).
 */
export function TranslationClient({
  items,
  recent,
  changelogSlugs,
  initialSlug,
  initialInstructions,
}: {
  readonly items: readonly PatchCaseData[];
  readonly recent: readonly PatchCaseData[];
  /** 업데이트 내역(CHANGELOG)이 있는 패치 slug. 없는 패치는 단추를 숨긴다. 내용은 누를 때 서버에서 받는다 */
  readonly changelogSlugs: readonly string[];
  readonly initialSlug?: string | undefined;
  readonly initialInstructions?: ReactNode;
}) {
  const initialPatch = items.find((item) => item.slug === initialSlug) ?? null;
  const [filter, setFilter] = useState<PlatformFilter>([]);
  const [view, setView] = useState<ViewMode>('shelf');
  const { picked, readyToOpen, originRef, onPick, onClose } = useShelfCase(initialPatch);
  // 섹션 제목과 섹션을 잇는 id. useId는 서버·브라우저에서 같은 고유값을 만든다.
  const recentId = useId();
  const shelfId = useId();

  const isPrimaryCase = picked !== null && picked.slug === initialSlug;

  return (
    // 업데이트 내역 불러오기(CaseViewer의 useQuery)가 쓰는 TanStack Query 제공자
    <QueryProvider>
      <div className="space-y-10">
        {isPrimaryCase ? null : <h1 className="sr-only">한글 패치</h1>}
        {/* 최근 2주 안에 갱신된 패치가 없으면 이 칸은 통째로 보이지 않는다 */}
        {recent.length === 0 ? null : (
          <section aria-labelledby={recentId}>
            <h2 id={recentId} className="font-bold font-title text-xl">
              최근 갱신 패치
            </h2>
            <FaceOutRow items={recent} onPick={onPick} />
          </section>
        )}

        <section aria-labelledby={shelfId} className="space-y-4">
          <h2 id={shelfId} className="sr-only">
            전체 진열
          </h2>
          <TranslationToolbar
            items={items}
            filter={filter}
            onToggleFilter={(key) => setFilter((prev) => toggleFilter(prev, key))}
            view={view}
            onView={setView}
          />
          {view === 'shelf' ? (
            <Shelf items={items} filter={filter} onPick={onPick} />
          ) : (
            <PatchTable items={items} filter={filter} onPick={onPick} />
          )}
        </section>

        <CaseViewer
          patch={picked}
          readyToOpen={readyToOpen}
          isPrimaryCase={isPrimaryCase}
          instructions={
            picked?.status === 'released' ? (
              <PatchInstructionsDisclosure
                key={picked.slug}
                slug={picked.slug}
                initial={isPrimaryCase ? initialInstructions : undefined}
              />
            ) : undefined
          }
          loadChangelog={
            picked !== null && changelogSlugs.includes(picked.slug) ? loadChangelog : undefined
          }
          originRef={originRef}
          onClose={onClose}
        />
      </div>
    </QueryProvider>
  );
}
