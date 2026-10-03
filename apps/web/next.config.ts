import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 빌드 없는 내부 패키지(TS 원본)를 Next.js가 함께 컴파일한다.
  transpilePackages: ['@arqhive/shared'],
  typedRoutes: true,
};

export default nextConfig;
