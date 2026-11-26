// 패키지의 공개 창구. Velite가 만든 데이터(.velite/)를 그대로 다시 내보낸다.
// .velite/는 빌드 결과물이라 git에 올리지 않고, `velite build`(이 패키지의 build·typecheck 스크립트)가 만든다.
import { patches as generatedPatches } from '../.velite/index.js';

const releasedByRepo = new Map<string, number>();
for (const patch of generatedPatches) {
  if (patch.status === 'released') {
    const key = `${patch.repo.owner}/${patch.repo.name}`;
    releasedByRepo.set(key, (releasedByRepo.get(key) ?? 0) + 1);
  }
}

export type { Faq, Guide, GuideSection, Patch } from '../.velite/index.js';
export { faqs, guideSections, guides, patches } from '../.velite/index.js';

export function repoHasMultipleReleasedPatches(repo: {
  readonly owner: string;
  readonly name: string;
}): boolean {
  return (releasedByRepo.get(`${repo.owner}/${repo.name}`) ?? 0) > 1;
}
