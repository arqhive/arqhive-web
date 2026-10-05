import { patches } from '@arqhive/content';
import type { MetadataRoute } from 'next';
import { SITE } from '@/shared/config';

/**
 * /sitemap.xml: 검색엔진에 알려 줄 페이지 목록. Next.js가 이 파일을 읽어 빌드할 때 XML로 만든다.
 * 패치 페이지는 마지막 릴리즈 날짜를 lastModified로 적어, 검색엔진이 바뀐 페이지부터 다시 읽게 한다.
 * 서치 콘솔·네이버 서치어드바이저에 이 주소를 등록한다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/korean-translation', '/guide', '/report'].map((path) => ({
    url: `${SITE.url}${path}`,
  }));
  const patchPages = patches.map((patch) => ({
    url: `${SITE.url}/korean-translation/${patch.slug}`,
    lastModified: patch.latestReleaseDate,
  }));
  return [...pages, ...patchPages];
}
