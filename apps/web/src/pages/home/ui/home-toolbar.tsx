'use client';

import {
  type PatchCaseData,
  type PlatformFilter,
  type PlatformGroupKey,
  usedGroups,
} from '@/entities/patch';
import type { ViewMode } from '../model/view-mode.ts';
import { PlatformDropdown } from './platform-dropdown.tsx';

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
 * - 기종 필터는 여러 개를 함께 고를 수 있다. "전체"는 나머지를 모두 해제한다(entities의 toggleFilter).
 * - 넓은 화면(lg 이상)은 단추를 늘어놓고, 툴바가 두 줄로 넘어가는 좁은 화면은 펼침 목록(PlatformDropdown)으로 바꾼다.
 */
export function HomeToolbar({
  items,
  filter,
  onToggleFilter,
  view,
  onView,
}: {
  readonly items: readonly PatchCaseData[];
  readonly filter: PlatformFilter;
  /** 기종 단추 하나를 눌렀을 때("전체" 포함). 켜고 끄는 계산은 상태를 가진 쪽이 최신 값으로 한다 */
  readonly onToggleFilter: (key: PlatformGroupKey | 'all') => void;
  readonly view: ViewMode;
  readonly onView: (view: ViewMode) => void;
}) {
  const groups = usedGroups(items);
  const chips = [{ key: 'all', label: '전체' } as const, ...groups];
  const onToggle = onToggleFilter;
  const isOn = (key: (typeof chips)[number]['key']) =>
    key === 'all' ? filter.length === 0 : filter.includes(key);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="lg:hidden">
        <PlatformDropdown groups={groups} filter={filter} onToggle={onToggle} />
      </div>
      <fieldset className="m-0 hidden min-w-0 gap-1.5 border-0 p-0 pb-1 lg:flex">
        <legend className="sr-only">기종 필터</legend>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            aria-pressed={isOn(chip.key)}
            onClick={() => onToggle(chip.key)}
            className={`${CHIP} ${isOn(chip.key) ? CHIP_ON : CHIP_OFF}`}
          >
            {chip.label}
          </button>
        ))}
      </fieldset>
      <fieldset className="m-0 ml-auto flex min-w-0 items-center gap-1.5 border-0 p-0">
        <legend className="sr-only">보기 방식</legend>
        {/* 눈에 보이는 이름표. legend는 묶음 안에서 배치가 특이해(flex 항목이 되지 않음) 화면 낭독기용으로만 두고,
            보이는 글자는 따로 둔다. 같은 말을 두 번 읽지 않게 aria-hidden. */}
        <span aria-hidden="true" className="mr-1 text-ink-sub text-xs">
          보기
        </span>
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
