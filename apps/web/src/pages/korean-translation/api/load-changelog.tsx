'use server';

import { patches } from '@arqhive/content';
import type { ReactNode } from 'react';
import { fetchChangelog } from '@/entities/patch';
import { MarkdownBody } from '@/shared/markdown';

/**
 * 업데이트 내역(CHANGELOG)을 열 때 불러오는 서버 함수(Server Function, 'use server').
 * 브라우저에서 부르면 Next.js가 서버로 요청을 보내고, 서버에서 마크다운을 화면 요소로 그려 돌려준다.
 * - 진열장 페이지에 20개 패치의 CHANGELOG를 미리 다 실으면 HTML이 커져서(페이지 데이터의 대부분), 누를 때만 받는다.
 * - 마크다운 라이브러리는 여전히 서버에서만 돈다(브라우저 묶음에 들어가지 않는다).
 * - 바깥에서 누구나 부를 수 있는 주소가 되므로, 받은 slug는 콘텐츠 목록에 있는 공개 패치인지 확인한다.
 *   GitHub 읽기는 fetchChangelog의 캐시(1시간)를 그대로 쓴다.
 */
export async function loadChangelog(slug: string): Promise<ReactNode | null> {
  const patch = patches.find(
    (candidate) => candidate.slug === slug && candidate.status === 'released',
  );
  if (patch === undefined) {
    return null;
  }
  const markdown = await fetchChangelog(patch.repo);
  if (!markdown) {
    return null;
  }
  // CHANGELOG 속 상대 링크(docs/releases/…)는 저장소 기본 가지의 파일 보기 주소로 바꾼다
  const linkBase = `https://github.com/${patch.repo.owner}/${patch.repo.name}/blob/HEAD/`;
  return <MarkdownBody markdown={markdown} linkBase={linkBase} />;
}
