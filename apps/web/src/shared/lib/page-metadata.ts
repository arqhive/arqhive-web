import type { Metadata } from 'next';
import { SITE } from '../config/site.ts';

/**
 * 페이지 하나의 검색·공유용 메타데이터를 한 모양으로 만든다.
 * - title: 탭 제목(루트 레이아웃의 template이 " · arqhive"를 붙인다)
 * - description: 검색 결과 아래 설명·미리보기 카드 설명. 페이지마다 달라야 검색엔진이 페이지를 구분한다
 * - canonical: 이 페이지의 대표 주소. 같은 내용이 여러 주소(끝의 /, 추적용 ?쿼리)로 보여도 이 주소 하나로 모은다
 * - openGraph: 하위 페이지의 openGraph는 루트 값을 통째로 덮어쓰므로, 사이트 이름·언어까지 여기서 다시 적는다
 */
export function pageMetadata({
  title,
  description,
  path,
  type = 'website',
}: {
  readonly title: string;
  readonly description: string;
  /** "/guide"처럼 / 로 시작하는 주소(metadataBase 기준으로 절대 주소가 된다) */
  readonly path: string;
  readonly type?: 'website' | 'article';
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE.name,
      locale: 'ko_KR',
      title: `${title} · ${SITE.name}`,
      description,
      url: path,
    },
  };
}
