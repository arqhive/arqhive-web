import { IBM_Plex_Mono as ibmPlexMono } from 'next/font/google';
import pretendardPackage from 'pretendard/package.json' with { type: 'json' };

/**
 * 디자인 토큰 2안(기록보관소)의 글꼴. 모두 SIL Open Font License라 무료로 쓸 수 있다.
 * 제목·본문 글꼴 Pretendard는 Google Fonts에 없어서 npm 패키지의 파일을 public/fonts로 복사해 쓴다(scripts/copy-fonts.mjs).
 * 번호(기종·버전·날짜) 글꼴은 next/font로 불러온다.
 *
 * next/font는 빌드할 때 글꼴 파일을 내려받아 사이트에 함께 올린다(실행 중 Google 서버에 요청하지 않음).
 * 한글 글꼴은 글자 범위별로 잘게 나뉜 파일로 받아져서, 화면에 실제로 쓰인 글자 범위만 내려간다.
 * `subsets`는 미리 불러올(preload) 범위다. 한글용 subset 이름은 없어서 latin만 지정한다.
 * `variable`은 CSS 변수 이름이다. globals.css의 @theme에서 이 변수를 글꼴 토큰으로 연결한다.
 */
const num = ibmPlexMono({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  // 첫 화면에서 미리 받지 않는다. 번호는 작은 글씨라 잠깐 기본 고정폭 글꼴로 보여도 되고,
  // 미리 받으면 HTML·CSS와 회선을 나눠 써서 첫 화면이 늦어진다(PageSpeed 측정).
  preload: false,
  variable: '--font-ibm-plex-mono',
});

/** <html>에 붙일 클래스. 번호 글꼴의 CSS 변수를 문서 전체에 정의한다. */
export const fontVariables = num.variable;

/** 복사해 둔 Pretendard CSS 주소(버전이 들어 있어 오래 캐시해도 된다. next.config.ts의 /fonts 헤더) */
export const PRETENDARD_CSS = `/fonts/pretendard-${pretendardPackage.version}/pretendardvariable-dynamic-subset.css`;

/**
 * Pretendard CSS를 화면을 막지 않게 붙이는 스크립트(루트 레이아웃이 <head>에서 가장 먼저 실행한다).
 * HTML에 적힌 <link rel="stylesheet">는 다 받을 때까지 화면을 그리지 않지만, 스크립트가 만들어 붙인 것은 막지 않는다.
 * 그래서 첫 화면은 기기 한글 글꼴(맑은 고딕·애플 SD 고딕)로 바로 뜨고, 글꼴 파일이 오면 Pretendard로 바뀐다(font-display: swap).
 */
export const PRETENDARD_LOAD_SCRIPT = `(function(){var l=document.createElement("link");l.rel="stylesheet";l.href=${JSON.stringify(PRETENDARD_CSS)};document.head.appendChild(l)})()`;
