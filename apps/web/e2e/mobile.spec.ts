import { expect, test } from '@playwright/test';

// 휴대폰 화면에만 있는 것들. playwright.config.ts에서 데스크톱(chromium) 프로젝트는 이 파일을 돌리지 않는다.

test('하단 메뉴: 아이콘과 글자가 있고 지금 페이지를 표시하며, 누르면 그 페이지로 간다', async ({
  page,
}) => {
  await page.goto('/guide');
  const nav = page.getByRole('navigation', { name: '주 메뉴' }).last();
  await expect(nav.locator('a svg')).toHaveCount(4);
  await expect(nav.getByRole('link', { name: '가이드' })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('link', { name: '한글 패치' }).click();
  await expect(page).toHaveURL(/\/korean-translation$/u);
});
