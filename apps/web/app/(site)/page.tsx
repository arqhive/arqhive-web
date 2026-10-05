// "/" 주소의 페이지. (site)처럼 괄호로 감싼 폴더는 "라우트 그룹"이라 주소에 나타나지 않는다.
// 공개 페이지끼리 레이아웃을 묶을 때 쓴다(나중에 (site)/layout.tsx에 헤더·푸터를 둔다).
//
// Next.js 라우팅 파일은 FSD의 pages 층 화면을 불러와 기본 내보내기로 넘기기만 한다.
// 화면의 실제 내용은 src/pages/home에 있다(사이트 소개).
export { HomePage as default } from '@/pages/home';
