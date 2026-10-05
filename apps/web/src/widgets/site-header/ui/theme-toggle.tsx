'use client';

import { useEffect, useState } from 'react';
import type { Theme } from '@/shared/config';
import { applyTheme, currentTheme, hasChosenTheme } from '../model/theme.ts';

/**
 * 전구 아이콘(Lucide `lightbulb` 모양을 바탕으로 함, ISC License).
 * - on(밝은 화면): 전구 안을 노랗게 채우고 빛줄기를 그린다.
 * - off(어두운 화면): 테두리만.
 * - null(모드를 읽기 전): 꺼진 모양과 같지만 빛줄기 자리도 비워 둔다.
 */
function BulbIcon({ on }: { readonly on: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 fill-none stroke-current"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14Z"
        className={on ? 'fill-amber-300 stroke-amber-600' : ''}
      />
      <path d="M9 18h6M10 22h4" />
      {on ? (
        <path
          d="M12 0.5v1.5M3.5 4l1.1 1.1M20.5 4l-1.1 1.1M1 9h1.5M21.5 9H23"
          className="stroke-amber-500"
        />
      ) : null}
    </svg>
  );
}

/**
 * 밝게·어둡게 전환 단추(전등을 켜고 끄는 모양).
 * - 처음에는 시스템 설정을 따르고, 누르면 고른 모드를 저장해 다음 방문 때도 쓴다(model/theme.ts).
 * - 아직 고른 적이 없으면 시스템 설정이 바뀔 때(예: 저녁에 자동 다크 모드) 아이콘도 따라 바뀐다.
 *   화면 색은 CSS(prefers-color-scheme)가 이미 따라가므로 여기서는 아이콘 상태만 맞춘다.
 * - 서버는 사용자의 모드를 모르므로 처음에는 null로 그린다(서버·브라우저 결과를 같게 해 hydration 오류를 막음).
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(currentTheme());
    const media = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (!hasChosenTheme()) {
        setTheme(currentTheme());
      }
    };
    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, []);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  // 누르면 일어날 일을 이름으로 쓴다: 지금 밝으면 "전등 끄기"(어두운 화면으로), 어두우면 "전등 켜기".
  const label = next === 'dark' ? '전등 끄기' : '전등 켜기';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      className="flex items-center justify-center border border-line p-1 text-ink-sub hover:bg-card hover:text-ink"
    >
      <BulbIcon on={theme === 'light'} />
    </button>
  );
}
