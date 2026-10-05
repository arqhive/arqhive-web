// Pretendard 글꼴(CSS + 글자 범위별 woff2)을 public/fonts/pretendard-<버전>/으로 복사한다. dev·build 전에 실행된다.
//
// 왜 복사하나: CSS로 import하면 Next.js가 사이트 CSS 한 파일에 합쳐서, 글꼴 조각 목록(@font-face 92개)까지
// 다 받아야 화면을 그리기 시작한다(렌더링 차단). 정적 파일로 두면 루트 레이아웃이 그 CSS를 화면을 막지 않게 따로 불러올 수 있다.
// 폴더 이름에 버전을 넣어, 글꼴을 올리면 주소가 바뀌므로 오래 캐시(immutable)해도 옛 파일이 남지 않는다.
// 결과물은 git에 올리지 않는다(.gitignore의 apps/web/public/fonts/).
import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageJson = require.resolve('pretendard/package.json');
const { version } = JSON.parse(await readFile(packageJson, 'utf8'));
const source = join(dirname(packageJson), 'dist', 'web', 'variable');
const fontsRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'fonts');
const target = join(fontsRoot, `pretendard-${version}`);

// 옛 버전 폴더가 남지 않게 fonts 폴더를 비우고 다시 만든다
await rm(fontsRoot, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(
  join(source, 'pretendardvariable-dynamic-subset.css'),
  join(target, 'pretendardvariable-dynamic-subset.css'),
);
await cp(join(source, 'woff2-dynamic-subset'), join(target, 'woff2-dynamic-subset'), {
  recursive: true,
});
console.log(`Pretendard ${version} → public/fonts/pretendard-${version}`);
