import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

/**
 * 화면 검사(E2E, Playwright). 빌드한 사이트(next start)를 실제 브라우저로 열어 본다.
 * - 두 엔진: Chromium(데스크톱 크롬)과 WebKit(아이폰 Safari와 같은 엔진, 아이폰 화면 크기·터치).
 *   단위 테스트(Vitest)로는 못 잡는 "화면에서만 보이는 문제"(예: iOS Safari 등줄기 글자 겹침, 10/7)를 배포 전에 잡는다.
 * - 연출은 "동작 줄이기"로 끈다(케이스가 바로 열리고 닫혀 테스트가 빠르고 흔들리지 않는다).
 * - 실행 전에 web을 빌드해 두어야 한다(`pnpm build`). 로컬은 이미 떠 있는 서버(3100)가 있으면 그걸 쓴다.
 */

const PORT = 3100;
// 읽는 환경 변수의 타입(선언하지 않으면 TypeScript는 env['CI'], Biome은 env.CI를 요구해 부딪친다. src/shared/config/server-env.ts와 같은 방식)
declare global {
  // biome-ignore lint/style/noNamespace: Node.js 타입이 환경 변수를 NodeJS 네임스페이스에 정의해 두어 그 안에 더해야 한다
  namespace NodeJS {
    interface ProcessEnv {
      /** GitHub Actions 등 CI가 넣는 값 */
      readonly CI?: string;
    }
  }
}

const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  // CI 가상 머신은 가끔 느리다. 한 번 더 돌려 보고도 실패하면 진짜 실패로 본다
  retries: isCi ? 1 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    // biome-ignore lint/style/useNamingConvention: Playwright 설정 이름(baseURL)이라 바꿀 수 없다
    baseURL: `http://localhost:${PORT}`,
    reducedMotion: 'reduce',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
  },
  projects: [
    // 데스크톱: 휴대폰 화면에만 있는 것(mobile.spec)은 돌리지 않는다
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile\.spec\.ts$/u },
    { name: 'webkit-iphone', use: { ...devices['iPhone 15'] } },
  ],
  webServer: {
    command: `pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
