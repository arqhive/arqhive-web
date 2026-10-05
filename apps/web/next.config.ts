import type { NextConfig } from 'next';

// biome-ignore lint/correctness/noProcessGlobal: 설정 파일은 빌드할 때 Node.js에서 환경 변수를 읽는다
const { env } = process;
const isDev = env.NODE_ENV === 'development';

/** 제보 API의 출처(origin). 양식이 여기로 보내고(connect-src), 개발 중에는 스크린샷도 여기서 받는다(img-src) */
const apiOrigin = env.NEXT_PUBLIC_API_URL ? new URL(env.NEXT_PUBLIC_API_URL).origin : '';
/** 제보 스크린샷을 올린 R2 버킷의 공개 주소(API의 REPORT_IMAGE_BASE_URL과 같다). 도메인을 연결하면 함께 바꾼다 */
const reportImageOrigin = 'https://pub-032e2a3dea5c4e4c89f0c7196a9606ca.r2.dev';
/** Cloudflare Turnstile(봇 확인 위젯): 스크립트를 받고, 확인 화면을 iframe으로 띄운다 */
const turnstile = 'https://challenges.cloudflare.com';

/**
 * 콘텐츠 보안 정책(CSP): 이 사이트가 어디서 무엇을 불러올 수 있는지 브라우저에 알려 주는 허용 목록.
 * 글에 끼어든 악성 스크립트가 다른 서버로 정보를 보내거나, 남의 사이트가 이 사이트를 iframe에 넣어 속이는 것을 막는다.
 *
 * - script-src 'unsafe-inline': Next.js는 페이지 데이터(RSC)와 화면 모드 초기화를 인라인 스크립트로 넣는다.
 *   요청마다 nonce를 붙이면 막을 수 있지만, 그러면 모든 페이지가 정적 생성·ISR 없이 매번 서버에서 그려진다.
 *   이 사이트는 사용자 글을 HTML로 넣지 않으므로(제보 글은 텍스트로만 그림) 정적 생성을 지키고 인라인을 허용한다.
 * - 'unsafe-eval'·ws:는 개발 서버(빠른 새로 고침)에만 필요하다.
 * - style-src 'unsafe-inline': 케이스 연출이 style 속성(CSS 변수)을 쓴다.
 * - img-src blob:: 제보 양식이 고른 스크린샷을 미리 보여 줄 때 쓴다.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${turnstile}${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${reportImageOrigin} ${apiOrigin}`,
  "font-src 'self'",
  `connect-src 'self' ${apiOrigin}${isDev ? ' ws:' : ''}`,
  `frame-src ${turnstile}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .map((rule) => rule.trim())
  .join('; ');

/** 모든 응답에 붙이는 보안 헤더. HSTS(HTTPS만 쓰기)는 Vercel이 이미 붙인다 */
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // 응답의 content-type을 그대로 믿게 한다(브라우저가 내용을 보고 스크립트로 추측해 실행하지 않게)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // 다른 사이트로 갈 때는 주소 전체가 아니라 출처(https://arqhive.vercel.app)만 알려 준다
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // frame-ancestors를 모르는 옛 브라우저용: 다른 사이트의 iframe에 들어가지 않는다
  { key: 'X-Frame-Options', value: 'DENY' },
  // 쓰지 않는 기기 기능은 꺼 둔다(사이트 안에 끼어든 코드도 쓸 수 없다)
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  // 빌드 없는 내부 패키지(TS 원본)를 Next.js가 함께 컴파일한다.
  // node_modules 안의 패키지는 보통 이미 JS로 빌드돼 있다고 가정하므로, TS 원본인 우리 패키지는 따로 알려 줘야 한다.
  transpilePackages: ['@arqhive/shared', '@arqhive/content'],
  // <Link href="...">에 존재하지 않는 주소를 넣으면 타입 오류가 나게 한다.
  typedRoutes: true,
  // 모든 주소의 응답에 보안 헤더를 붙인다
  headers() {
    return Promise.resolve([
      { source: '/:path*', headers: securityHeaders },
      // 복사해 둔 글꼴(scripts/copy-fonts.mjs)은 폴더 이름에 버전이 있어 내용이 바뀌지 않으므로 1년 캐시한다
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]);
  },
};

export default nextConfig;
