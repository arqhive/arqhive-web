'use client';

import { type PatchCaseData, type PlatformFilter, usedGroups } from '@/entities/patch';
import type { ViewMode } from '../model/view-mode.ts';

const VIEWS = [
  { key: 'shelf', label: '진열장' },
  { key: 'list', label: '목록' },
] as const satisfies readonly { key: ViewMode; label: string }[];

const CHIP =
  'shrink-0 border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-stamp';
const CHIP_ON = 'border-ink bg-ink text-paper';
const CHIP_OFF = 'border-line text-ink-sub hover:border-ink hover:text-ink';

/**
 * 기종 필터와 보기 전환. 홈에서만 쓰는 조작이라 별도 조각(features)으로 나누지 않고 화면 안에 둔다
 * (FSD: 여러 곳에서 쓰이기 전까지는 쓰는 곳 가까이에 두는 편이 낫다).
 * - <fieldset>·<legend>: 버튼 묶음에 이름을 붙이는 HTML 기본 요소(role="group"보다 의미가 분명하다).
 * - aria-pressed: 눌린 상태를 보조 기술(화면 낭독기)에 알린다.
 */
export function HomeToolbar({
  items,
  filter,
  onFilter,
  view,
  onView,
}: {
  readonly items: readonly PatchCaseData[];
  readonly filter: PlatformFilter;
  readonly onFilter: (filter: PlatformFilter) => void;
  readonly view: ViewMode;
  readonly onView: (view: ViewMode) => void;
}) {
  const chips = [{ key: 'all', label: '전체' } as const, ...usedGroups(items)];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <fieldset className="m-0 flex min-w-0 gap-1.5 overflow-x-auto border-0 p-0 pb-1">
        <legend className="sr-only">기종 필터</legend>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            aria-pressed={filter === chip.key}
            onClick={() => onFilter(chip.key)}
            className={`${CHIP} ${filter === chip.key ? CHIP_ON : CHIP_OFF}`}
          >
            {chip.label}
          </button>
        ))}
      </fieldset>
      <fieldset className="m-0 ml-auto flex min-w-0 gap-1.5 border-0 p-0">
        <legend className="sr-only">보기 방식</legend>
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            aria-pressed={view === v.key}
            onClick={() => onView(v.key)}
            className={`${CHIP} ${view === v.key ? CHIP_ON : CHIP_OFF}`}
          >
            {v.label}
          </button>
        ))}
      </fieldset>
    </div>
  );
}
