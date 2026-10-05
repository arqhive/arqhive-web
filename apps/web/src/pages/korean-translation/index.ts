// FSD 조각(slice)의 공개 창구. 바깥(Next.js 라우팅 파일 등)은 '@/pages/korean-translation'으로만 가져온다.
// 조각 안의 칸(ui/, model/ …) 구조는 바깥에 드러나지 않으므로 마음대로 바꿀 수 있다.
export { TranslationPage } from './ui/translation-page.tsx';
