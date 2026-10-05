'use client';

import { useCallback, useId, useRef, useState } from 'react';
import {
  type PatchCaseData,
  type PickHandler,
  type PlatformFilter,
  toggleFilter,
} from '@/entities/patch';
import { CaseViewer } from '@/widgets/case-viewer';
import { PatchTable } from '@/widgets/patch-table';
import { FaceOutRow, Shelf } from '@/widgets/shelf';
import type { ViewMode } from '../model/view-mode.ts';
import { TranslationToolbar } from './translation-toolbar.tsx';

/**
 * 진열장 화면의 상태를 갖는 클라이언트 부분.
 * - filter: 기종 필터 / view: 진열장·목록 보기 / picked: 꺼내 열려 있는 작품
 * - 누른 요소(등줄기·표지·목록 줄)는 열려 있는 동안 감춰서 "그 자리에서 꺼냈다"처럼 보이게 하고,
 *   닫히면 다시 보이게 한다. 같은 작품이 표지 진열과 선반에 동시에 있을 수 있어,
 *   작품이 아니라 **누른 요소**를 기준으로 감춘다.
 */
export function TranslationClient({
  items,
  recent,
}: {
  readonly items: readonly PatchCaseData[];
  readonly recent: readonly PatchCaseData[];
}) {
  const [filter, setFilter] = useState<PlatformFilter>([]);
  const [view, setView] = useState<ViewMode>('shelf');
  const [picked, setPicked] = useState<PatchCaseData | null>(null);
  const originRef = useRef<HTMLElement | null>(null);
  // 섹션 제목과 섹션을 잇는 id. useId는 서버·브라우저에서 같은 고유값을 만든다.
  const recentId = useId();
  const shelfId = useId();

  const onPick: PickHandler = (item, element) => {
    originRef.current = element;
    element.style.visibility = 'hidden';
    setPicked(item);
  };

  const onClose = useCallback(() => {
    if (originRef.current !== null) {
      originRef.current.style.visibility = '';
    }
    setPicked(null);
  }, []);

  return (
    <div className="space-y-10">
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

      <CaseViewer patch={picked} originRef={originRef} onClose={onClose} />
    </div>
  );
}
