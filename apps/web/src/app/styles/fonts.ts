import { IBM_Plex_Mono as ibmPlexMono } from 'next/font/google';

/**
 * 디자인 토큰 2안(기록보관소)의 글꼴. 모두 SIL Open Font License라 무료로 쓸 수 있다.
 * 제목·본문 글꼴 Pretendard는 Google Fonts에 없어서 여기가 아니라 루트 레이아웃(app/layout.tsx)에서 패키지 CSS로 불러온다.
 * 여기서는 번호(기종·버전·날짜) 글꼴만 다룬다.
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
  variable: '--font-ibm-plex-mono',
});

/** <html>에 붙일 클래스. 번호 글꼴의 CSS 변수를 문서 전체에 정의한다. */
export const fontVariables = num.variable;
