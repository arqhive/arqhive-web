import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { agentRuns, downloadSnapshots, guideChunks, reportEmbeddings } from './schema.ts';

/**
 * Neon에 붙는 Drizzle 클라이언트. Workers에서는 오래 붙어 있는 TCP 연결을 쓸 수 없어서,
 * 요청마다 HTTP로 쿼리 하나를 보내는 Neon HTTP 드라이버를 쓴다(Cron처럼 가끔 몇 번 부르는 용도에 알맞다).
 * 연결 문자열(DATABASE_URL)은 비밀값이라 부르는 쪽(api의 env)이 넘긴다.
 */
export function createDb(databaseUrl: string) {
  return drizzle(neon(databaseUrl), {
    schema: { downloadSnapshots, guideChunks, reportEmbeddings, agentRuns },
  });
}

export type Db = ReturnType<typeof createDb>;
