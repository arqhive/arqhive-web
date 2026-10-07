import { expect, test } from '@playwright/test';
import { collectErrors } from './helpers.ts';

/** 공개 패치 수의 하한(제보 양식의 게임 목록이 비거나 크게 줄면 콘텐츠·빌드가 잘못된 것) */
const MIN_RELEASED = 15;

test('홈이 오류 없이 열린다', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors).toStrictEqual([]);
});

test('가이드: 자주 묻는 질문을 펼칠 수 있다', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/guide');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const question = page.locator('details').first();
  await question.locator('summary').click();
  await expect(question).toHaveAttribute('open', '');
  expect(errors).toStrictEqual([]);
});

test('제보: 양식에 공개 패치 목록이 들어 있다', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/report');
  const options = page.locator('select option');
  expect(await options.count()).toBeGreaterThanOrEqual(MIN_RELEASED);
  await expect(page.locator('textarea')).toBeVisible();
  expect(errors).toStrictEqual([]);
});
