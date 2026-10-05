'use client';

import { useCallback, useId, useRef, useState } from 'react';
import {
  type PatchCaseData,
  type PickHandler,
  type PlatformFilter,
  patchPath,
  toggleFilter,
} from '@/entities/patch';
import { SITE } from '@/shared/config';
import { CaseViewer } from '@/widgets/case-viewer';
import { PatchTable } from '@/widgets/patch-table';
import { FaceOutRow, Shelf } from '@/widgets/shelf';
import { loadChangelog } from '../api/load-changelog.tsx';
import { useOpenFromAddress } from '../model/use-open-from-address.ts';
import type { ViewMode } from '../model/view-mode.ts';
import { TranslationToolbar } from './translation-toolbar.tsx';

/** 진열장 주소. 케이스를 열면 패치 주소로, 닫으면 이 주소로 주소창만 바꾼다 */
const SHELF_PATH = '/korean-translation';

/**
 * 주소와 함께 탭 제목도 바꾼다(주소창만 바꾸면 제목은 그대로라서). 형식은 패치 페이지·진열장의 metadata 제목과 같다.
 * title이 null이면 진열장 제목.
 */
function showAddress(path: string, title: string | null) {
  globalThis.history.replaceState(null, '', path);
  document.title = `${title === null ? '한글 패치' : `${title} 한글 패치`} · ${SITE.name}`;
}

/**
 * 진열장 화면의 상태를 갖는 클라이언트 부분.
 * - filter: 기종 필터 / view: 진열장·목록 보기 / picked: 꺼내 열려 있는 작품
 * - 누른 요소(등줄기·표지·목록 줄)는 열려 있는 동안 감춰서 "그 자리에서 꺼냈다"처럼 보이게 하고,
 *   닫히면 다시 보이게 한다. 같은 작품이 표지 진열과 선반에 동시에 있을 수 있어,
 *   작품이 아니라 **누른 요소**를 기준으로 감춘다.
 * - 작품 주소(/korean-translation/<slug>)로 들어오면(initialSlug) 선반의 그 등줄기를 눌렀을 때와 똑같이 꺼낸다.
 * - 열려 있는 동안 주소창은 작품 주소, 닫으면 진열장 주소(replaceState: 방문 기록은 늘리지 않음).
 */
export function TranslationClient({
  items,
  recent,
  initialSlug,
  changelogSlugs,
}: {
  readonly items: readonly PatchCaseData[];
  readonly recent: readonly PatchCaseData[];
  readonly initialSlug?: string | undefined;
  /** 업데이트 내역(CHANGELOG)이 있는 패치 slug. 없는 패치는 단추를 숨긴다. 내용은 누를 때 서버에서 받는다 */
  readonly changelogSlugs: readonly string[];
}) {
  const [filter, setFilter] = useState<PlatformFilter>([]);
  const [view, setView] = useState<ViewMode>('shelf');
  const [picked, setPicked] = useState<PatchCaseData | null>(null);
  const originRef = useRef<HTMLElement | null>(null);
  // 섹션 제목과 섹션을 잇는 id. useId는 서버·브라우저에서 같은 고유값을 만든다.
  const recentId = useId();
  const shelfId = useId();

  const onPick: PickHandler = useCallback((item, element) => {
    originRef.current = element;
    element.style.visibility = 'hidden';
    setPicked(item);
    showAddress(patchPath(item.slug), item.titleKo);
  }, []);

  const onClose = useCallback(() => {
    if (originRef.current !== null) {
      originRef.current.style.visibility = '';
    }
    setPicked(null);
    showAddress(SHELF_PATH, null);
  }, []);

  useOpenFromAddress(items, initialSlug, onPick);

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

      <CaseViewer
        patch={picked}
        loadChangelog={
          picked !== null && changelogSlugs.includes(picked.slug) ? loadChangelog : undefined
        }
        originRef={originRef}
        onClose={onClose}
      />
    </div>
  );
}
