import type { MetadataRoute } from 'next';
import { SITE } from '@/shared/config';

/**
 * /robots.txt: 검색엔진 수집 규칙. 공개 페이지뿐이라 모두 허용하고, 사이트맵 위치를 알려 준다.
 * (API는 다른 주소(workers.dev)라 여기서 다루지 않는다.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
