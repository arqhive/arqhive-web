import { versionGuide } from '@arqhive/content';
import { useId } from 'react';
import { MarkdownBody } from '@/shared/markdown';
import { FaqSection } from './faq-section.tsx';

/**
 * 가이드 페이지(/guide). 위에서부터 패치 버전 가이드 → 자주 묻는 질문(아코디언).
 * 글은 모두 콘텐츠 파일(content/guide-page/version.md, content/faq/*.md, content/guides/*.mdx)에 있어 코드 없이 고친다.
 * 읽기 쉽게 본문 폭을 한글 약 45자(42rem)로 묶고, 마크다운은 읽기용 모양(reading)으로 그린다.
 * 버전 가이드는 #version으로 바로 갈 수 있다(속지의 "버전 가이드" 링크). 위에 붙은 헤더에 가리지 않게 scroll-mt를 준다.
 */
export function GuidePage() {
  const versionId = useId();
  return (
    <div className="max-w-[42rem] space-y-14 py-10">
      <h1 className="font-bold font-title text-3xl">가이드</h1>

      {/* biome-ignore lint/correctness/useUniqueElementIds: 속지의 "버전 가이드" 링크(/guide#version)가 가리키는 고정 주소라 바뀌면 안 된다 */}
      <section id="version" aria-labelledby={versionId} className="scroll-mt-28 space-y-3">
        <h2 id={versionId} className="font-bold font-title text-xl">
          {versionGuide.title}
        </h2>
        <MarkdownBody markdown={versionGuide.body} variant="reading" />
      </section>

      <FaqSection />
    </div>
  );
}
