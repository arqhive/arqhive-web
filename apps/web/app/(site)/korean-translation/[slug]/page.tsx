// "/korean-translation/<slug>" 주소: 진열장을 그리고, 주소의 패치 케이스를 선반 자리에서 꺼내 바로 연다.
// 화면은 진열장(/korean-translation)과 같고, 어느 패치를 열지(initialSlug)만 넘긴다.
import { patches } from '@arqhive/content';
import type { Metadata } from 'next';
import { TranslationPage } from '@/pages/korean-translation';
import { pageMetadata } from '@/shared/lib';

/** 패치 주소는 빌드할 때 모두 미리 만든다(패치 수만큼). 목록에 없는 주소는 404 */
export function generateStaticParams() {
  return patches.map((patch) => ({ slug: patch.slug }));
}
export const dynamicParams = false;

/** 탭 제목 "게임 이름 한글 패치 · arqhive", 검색 설명은 패치 소개(summary), 대표 주소는 이 패치 주소 */
export async function generateMetadata({
  params,
}: PageProps<'/korean-translation/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const patch = patches.find((candidate) => candidate.slug === slug);
  if (patch === undefined) {
    return { title: '한글 패치' };
  }
  return pageMetadata({
    title: `${patch.titleKo} 한글 패치`,
    description: patch.summary,
    path: `/korean-translation/${patch.slug}`,
    type: 'article',
  });
}

// 진열장과 같은 주기(1시간)로 다시 그린다(최근 갱신·다운로드 수). 라우트 파일에서만 읽히는 설정이다.
export const revalidate = 3600;

export default async function TranslationSlugRoute({
  params,
}: PageProps<'/korean-translation/[slug]'>) {
  const { slug } = await params;
  return <TranslationPage initialSlug={slug} />;
}
