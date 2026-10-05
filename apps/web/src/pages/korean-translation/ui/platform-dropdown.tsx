'use client';

import { useEffect, useRef } from 'react';
import type { PlatformFilter, PlatformGroupKey } from '@/entities/patch';

/**
 * 좁은 화면용 기종 필터: "플랫폼 ▾" 단추를 누르면 체크 목록이 펼쳐진다(여러 개 선택).
 * - <details>·<summary>: JS 없이 열고 닫히는 브라우저 기본 요소. 펼친 채로 여러 개를 연달아 고를 수 있다.
 * - 바깥을 누르거나 ESC를 누르면 닫는다(<details>는 스스로 닫지 않으므로 여기서 처리).
 * - 단추 글자에 지금 고른 것을 요약한다: 전체 / GC / GC 외 2.
 */
export function PlatformDropdown({
  groups,
  filter,
  onToggle,
}: {
  readonly groups: readonly { readonly key: PlatformGroupKey; readonly label: string }[];
  readonly filter: PlatformFilter;
  readonly onToggle: (key: PlatformGroupKey | 'all') => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = (event: Event) => {
      const el = ref.current;
      if (el === null || !el.open) {
        return;
      }
      const outside = event instanceof PointerEvent && !el.contains(event.target as Node);
      const pressedEscape = event instanceof KeyboardEvent && event.key === 'Escape';
      if (outside || pressedEscape) {
        el.open = false;
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, []);

  const chosen = groups.filter((g) => filter.includes(g.key));
  const summary =
    chosen.length === 0
      ? '전체'
      : `${chosen[0]?.label}${chosen.length > 1 ? ` 외 ${chosen.length - 1}` : ''}`;

  return (
    <details ref={ref} className="relative">
      {/* 기종을 하나라도 고르면(전체가 아니면) 보기 단추의 눌린 모양처럼 칠해 필터가 걸려 있음을 알린다 */}
      <summary
        className={`list-none border px-2.5 py-1 text-xs ${chosen.length === 0 ? 'border-line text-ink' : 'border-ink bg-ink text-paper'}`}
      >
        플랫폼: {summary} ▾
      </summary>
      <fieldset className="absolute left-0 z-20 mt-1 flex min-w-40 flex-col gap-1.5 border border-line bg-card p-3 text-sm shadow-md">
        <legend className="sr-only">기종 필터</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={filter.length === 0} onChange={() => onToggle('all')} />
          전체
        </label>
        {groups.map((g) => (
          <label key={g.key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filter.includes(g.key)}
              onChange={() => onToggle(g.key)}
            />
            {g.label}
          </label>
        ))}
      </fieldset>
    </details>
  );
}
