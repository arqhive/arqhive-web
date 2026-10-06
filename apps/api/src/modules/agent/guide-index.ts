import { createDb } from '@arqhive/db';
import type { ApiEnv } from '../../platform/env.ts';
import { sha256 } from '../../platform/rate-limit.ts';
import { embed } from '../../platform/workers-ai.ts';
import { buildGuideChunks } from './guide-chunks.ts';
import { loadGuideHashes, writeGuideChunks } from './store.ts';

/**
 * 가이드 문단 색인 맞추기(ADR 0017). 일일 정산 Cron이 부른다.
 * 콘텐츠의 문단과 Neon의 내용 해시를 비교해 **바뀐 문단만** 다시 임베딩한다(임베딩도 뉴런을 쓴다).
 * 가이드를 고쳐 배포하면 그날 밤 반영된다.
 */

/** 임베딩 한 번에 보낼 문단 수 */
const EMBED_BATCH = 20;

export interface GuideSyncResult {
  readonly total: number;
  readonly embedded: number;
  readonly removed: number;
}

export async function syncGuideIndex(env: ApiEnv): Promise<GuideSyncResult | null> {
  if (!env.DATABASE_URL) {
    return null;
  }
  const db = createDb(env.DATABASE_URL);
  const chunks = await Promise.all(
    buildGuideChunks().map(async (chunk) => ({
      ...chunk,
      hash: await sha256(`${chunk.title}\n${chunk.url}\n${chunk.content}`),
    })),
  );
  const stored = await loadGuideHashes(db);
  const changed = chunks.filter((chunk) => stored.get(chunk.id) !== chunk.hash);
  const ids = new Set(chunks.map((chunk) => chunk.id));
  const removedIds = [...stored.keys()].filter((id) => !ids.has(id));
  const embedded: ((typeof changed)[number] & { embedding: number[] })[] = [];
  for (let index = 0; index < changed.length; index += EMBED_BATCH) {
    const batch = changed.slice(index, index + EMBED_BATCH);
    // biome-ignore lint/performance/noAwaitInLoops: 한 번에 너무 많이 보내지 않게 묶음별로 차례로 임베딩한다
    const vectors = await embed(
      env.AI,
      batch.map((chunk) => `${chunk.title}\n${chunk.content}`),
    );
    batch.forEach((chunk, offset) => {
      const embedding = vectors[offset];
      if (embedding !== undefined) {
        embedded.push({ ...chunk, embedding });
      }
    });
  }
  await writeGuideChunks(db, embedded, removedIds);
  return { total: chunks.length, embedded: embedded.length, removed: removedIds.length };
}
