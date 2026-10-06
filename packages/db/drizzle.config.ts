import process from 'node:process';
import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit 설정(마이그레이션 만들기·적용). 개발 PC에서만 실행한다.
 * - `pnpm --dir packages/db db:generate`: schema.ts를 바꾸면 그 차이를 SQL 파일(drizzle/)로 만든다. 이 파일은 git에 올린다.
 * - `pnpm --dir packages/db db:migrate`: 아직 적용하지 않은 SQL을 Neon에 적용한다.
 * 연결 문자열은 packages/db/.env의 DATABASE_URL(git 제외)에서 읽는다.
 */
try {
  process.loadEnvFile('.env');
} catch {
  // .env가 없으면 이미 설정된 환경 변수를 쓴다
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
