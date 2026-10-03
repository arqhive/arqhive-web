'use client';

import { useEffect, useState } from 'react';
import type { Theme } from '@/shared/config';
import { applyTheme, currentTheme } from '../model/theme.ts';

/**
 * 밝게·어둡게 전환 버튼.
 * 서버는 사용자의 모드를 모르므로 처음에는 null로 그리고(서버·브라우저 결과를 같게 해서 hydration 오류를 막음),
 * 브라우저에서 실제 모드를 읽은 뒤 글자를 정한다.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const nextLabel = next === 'dark' ? '어둡게' : '밝게';
  // 모드를 읽기 전(서버 렌더링·첫 화면)에는 중립적인 글자를 보여 준다.
  const text = theme === null ? '화면' : nextLabel;

  return (
    <button
      type="button"
      aria-label={`화면을 ${nextLabel} 바꾸기`}
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      className="border border-line px-2 py-1 font-num text-ink-sub text-xs hover:bg-card hover:text-ink"
    >
      {text}
    </button>
  );
}
