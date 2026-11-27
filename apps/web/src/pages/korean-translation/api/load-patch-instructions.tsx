'use server';

import { patches } from '@arqhive/content';
import { PatchInstructions } from '../ui/patch-instructions.tsx';

// biome-ignore lint/suspicious/useAwait: Next.js 서버 함수는 로컬 콘텐츠만 읽어도 async로 선언해야 한다.
export async function loadPatchInstructions(slug: string) {
  const patch = patches.find((item) => item.slug === slug && item.status === 'released');
  return patch === undefined ? null : <PatchInstructions patch={patch} />;
}
