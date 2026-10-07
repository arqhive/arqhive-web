import { expect, test } from '@playwright/test';
import { collectErrors, measureSpines } from './helpers.ts';

/** 시험에 쓰는 공개 패치(SFC 카트리지 상자). 콘텐츠에서 빠지면 다른 공개 패치로 바꾼다 */
const SLUG = 'star-fox-2';
const TITLE = '스타폭스 2';
/** 진열장 등줄기 글자 칸 수의 하한(10/7 기준 약 200칸) */
const MIN_SPINE_CELLS = 100;

test.describe('진열장', () => {
  test('오류 없이 열리고, 등줄기 글자가 겹치거나 잘리지 않는다', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/korean-translation');
    await expect(page.locator('[data-spine="title"]').first()).toBeVisible();
    // 등줄기가 하나도 없으면 "문제 0"으로 그냥 통과해 버리므로 개수부터 확인한다
    expect(await page.locator('[data-spine="cell"]').count()).toBeGreaterThan(MIN_SPINE_CELLS);
    expect(await measureSpines(page)).toStrictEqual([]);
    expect(errors).toStrictEqual([]);
  });

  test('등줄기를 누르면 케이스가 열리고 주소가 바뀌며, ESC로 닫으면 진열장 주소로 돌아온다', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto('/korean-translation');
    await page.locator(`[data-slug="${SLUG}"]`).last().click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/korean-translation/${SLUG}$`, 'u'));
    await expect(dialog.getByRole('heading', { level: 2 })).toContainText(TITLE);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page).toHaveURL(/\/korean-translation$/u);
    expect(errors).toStrictEqual([]);
  });

  test('매체는 패치 파일(또는 최신 릴리즈 페이지)로 연결된다', async ({ page }) => {
    await page.goto(`/korean-translation/${SLUG}`);
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    // GitHub를 읽었으면 첨부 파일 주소, 못 읽었으면(한도 등) 최신 릴리즈 페이지로 간다
    const href = await dialog.locator('a[data-track="download"]').first().getAttribute('href');
    expect(href).toMatch(/\/releases\/(?:download\/[^/]+\/[A-Z0-9]+_KPatch_.+|latest)$/u);
  });
});

test.describe('패치 주소로 바로 들어오기', () => {
  test('소개 띠(h1)와 케이스가 보이고, 케이스를 닫으면 소개 띠가 사라진다', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`/korean-translation/${SLUG}`);
    const intro = page.getByRole('heading', { level: 1, name: `${TITLE} 한글 패치` });
    await expect(intro).toBeVisible();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(intro).toHaveCount(0);
    expect(errors).toStrictEqual([]);
  });
});
