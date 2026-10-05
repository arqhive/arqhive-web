import { THEME_STORAGE_KEY, type Theme } from '@/shared/config';

/**
 * 지금 화면에 적용된 모드. 사용자가 고른 값(<html data-theme>)이 있으면 그것, 없으면 시스템 설정.
 * dataset 대신 getAttribute를 쓴다: TS 엄격 설정(noPropertyAccessFromIndexSignature)과
 * Biome(useLiteralKeys)이 dataset의 접근 방식을 서로 반대로 요구하기 때문이다.
 */
export function currentTheme(): Theme {
  const chosen = document.documentElement.getAttribute('data-theme');
  if (chosen === 'light' || chosen === 'dark') {
    return chosen;
  }
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** 사용자가 직접 모드를 고른 적이 있는지(<html data-theme>이 붙어 있는지). 없으면 시스템 설정을 따르는 중이다 */
export function hasChosenTheme(): boolean {
  return document.documentElement.hasAttribute('data-theme');
}

/** 모드를 적용하고 기억한다. 저장이 막힌 환경(사생활 보호 모드 등)에서도 적용은 된다. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 저장하지 못해도 이번 방문 동안은 적용된 상태로 둔다.
  }
}
