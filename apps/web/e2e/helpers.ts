import type { Page } from '@playwright/test';

/**
 * 페이지에서 난 오류를 모은다: 잡히지 않은 예외(pageerror)와 console.error.
 * 테스트 끝에 빈 배열인지 확인한다. 바깥 서비스가 내는 소음은 IGNORED에 이유와 함께 적는다.
 */
const IGNORED: readonly RegExp[] = [
  // Turnstile(봇 확인) 위젯이 시험 환경(localhost)에서 내는 경고
  /challenges\.cloudflare\.com/u,
];

export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !IGNORED.some((pattern) => pattern.test(message.text()))) {
      errors.push(`console: ${message.text()}`);
    }
  });
  return errors;
}

/** 등줄기 글자 칸 검사 결과(겹침·잘림이 있는 등줄기만) */
export interface SpineProblem {
  readonly slug: string;
  readonly overlaps: number;
  readonly clipped: number;
}

/**
 * 진열장의 모든 등줄기에서 같은 열 안 글자 칸이 겹치거나(앞 칸 아래보다 위에서 시작), 제목 칸 밖으로 잘리는지 잰다.
 * 10/7 iOS Safari에서 띄어쓰기 자리 글자가 겹친 일을 다시 잡기 위한 검사다.
 */
export function measureSpines(page: Page): Promise<SpineProblem[]> {
  return page.evaluate(async () => {
    await document.fonts.ready;
    const problems: SpineProblem[] = [];
    for (const title of document.querySelectorAll<HTMLElement>('[data-spine="title"]')) {
      const slug = title.closest('[data-slug]')?.getAttribute('data-slug') ?? '?';
      const box = title.getBoundingClientRect();
      const bottom = box.bottom - Number.parseFloat(getComputedStyle(title).paddingBottom);
      const cells = [...title.querySelectorAll('[data-spine="cell"]')].map((cell) =>
        cell.getBoundingClientRect(),
      );
      let overlaps = 0;
      for (const [index, cell] of cells.entries()) {
        const previous = cells[index - 1];
        if (
          previous &&
          Math.abs(previous.left - cell.left) < 1 &&
          cell.top < previous.bottom - 0.5
        ) {
          overlaps += 1;
        }
      }
      const clipped = cells.filter(
        (cell) => cell.bottom > bottom + 0.5 || cell.right > box.right + 0.5,
      ).length;
      if (overlaps > 0 || clipped > 0) {
        problems.push({ slug, overlaps, clipped });
      }
    }
    return problems;
  });
}
