import { type GuideSection, guideSections } from '@arqhive/content';
import { useId } from 'react';
import { MarkdownBody } from '@/shared/markdown';
import { FaqSection } from './faq-section.tsx';

/**
 * 위쪽 절 하나(패치 버전 가이드, AI 한글 패치 파이프라인 …). anchor가 있으면 그 고정 주소(#anchor)로 바로 올 수 있다
 * (속지의 "버전 가이드" 링크 → #version). 위에 붙은 헤더에 가리지 않게 scroll-mt를 준다.
 */
function GuideSectionBlock({ section }: { readonly section: GuideSection }) {
  const titleId = useId();
  return (
    <section id={section.anchor} aria-labelledby={titleId} className="scroll-mt-28 space-y-3">
      <h2 id={titleId} className="font-bold font-title text-xl">
        {section.title}
      </h2>
      <MarkdownBody markdown={section.body} variant="reading" />
    </section>
  );
}

/**
 * 가이드 페이지(/guide). 위쪽 절들(content/guide-page/*.md, order 순) → 자주 묻는 질문(아코디언).
 * 글은 모두 콘텐츠 파일(content/guide-page, content/faq, content/guides)에 있어 코드 없이 고친다. 절을 늘리려면 파일만 더한다.
 * 읽기 쉽게 본문 폭을 한글 약 45자(42rem)로 묶고, 마크다운은 읽기용 모양(reading)으로 그린다.
 */
export function GuidePage() {
  const sections = guideSections.toSorted((a, b) => a.order - b.order);
  return (
    <div className="max-w-[42rem] space-y-14 py-10">
      <h1 className="font-bold font-title text-3xl">가이드</h1>
      {sections.map((section) => (
        <GuideSectionBlock key={section.title} section={section} />
      ))}
      <FaqSection />
    </div>
  );
}
