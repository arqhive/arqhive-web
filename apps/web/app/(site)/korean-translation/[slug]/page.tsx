// "/korean-translation/<slug>" 주소: 진열장을 그리고, 주소의 작품 케이스를 선반 자리에서 꺼내 바로 연다.
// 화면은 진열장(/korean-translation)과 같고, 어느 작품을 열지(initialSlug)만 넘긴다.
import { patches } from '@arqhive/content';
import type { Metadata } from 'next';
import { TranslationPage } from '@/pages/korean-translation';

/** 작품 주소는 빌드할 때 모두 미리 만든다(작품 수만큼). 목록에 없는 주소는 404 */
export function generateStaticParams() {
  return patches.map((patch) => ({ slug: patch.slug }));
}
export const dynamicParams = false;

/** 탭 제목: "작품 이름 · arqhive"(루트 레이아웃의 template) */
export async function generateMetadata({
  params,
}: PageProps<'/korean-translation/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  return { title: patches.find((patch) => patch.slug === slug)?.titleKo ?? '한글 패치' };
}

// 진열장과 같은 주기(1시간)로 다시 그린다(최근 갱신·다운로드 수). 라우트 파일에서만 읽히는 설정이다.
export const revalidate = 3600;

export default async function TranslationSlugRoute({
  params,
}: PageProps<'/korean-translation/[slug]'>) {
  const { slug } = await params;
  return <TranslationPage initialSlug={slug} />;
}
