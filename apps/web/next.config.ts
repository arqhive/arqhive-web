import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 빌드 없는 내부 패키지(TS 원본)를 Next.js가 함께 컴파일한다.
  // node_modules 안의 패키지는 보통 이미 JS로 빌드돼 있다고 가정하므로, TS 원본인 우리 패키지는 따로 알려 줘야 한다.
  transpilePackages: ['@arqhive/shared', '@arqhive/content'],
  // <Link href="...">에 존재하지 않는 주소를 넣으면 타입 오류가 나게 한다.
  typedRoutes: true,
  // 3단계에서 rewrites()로 /api/* 요청을 Workers(api)로 넘긴다.
};

export default nextConfig;
