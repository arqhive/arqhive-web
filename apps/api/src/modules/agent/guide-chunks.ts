import { faqs, guideSections, guides } from '@arqhive/content';

/**
 * 가이드·FAQ를 검색할 문단으로 자른다(ADR 0017). 순수 함수라 테스트로 모양을 고정한다.
 * - 패치 방식별 가이드(content/guides): 요약+머리말 한 문단, 이후 "## 절"마다 한 문단
 * - 자주 묻는 질문(content/faq): 질문 하나 = 한 문단
 * - 가이드 페이지 절(content/guide-page): 절 하나 = 한 문단(앵커가 있으면 주소에 붙인다)
 * 모두 /guide 한 페이지에 보이므로 주소는 /guide다.
 */

const GUIDE_URL = 'https://arqhive.vercel.app/guide';
/** "## 제목" 줄(절의 시작) */
const SECTION_HEADING = /^## +(.+)$/mu;

export interface ChunkSource {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly content: string;
}

/** 마크다운 본문을 "## 절" 단위로 나눈다. 첫 절 앞부분은 제목 없이 앞에 둔다 */
export function splitSections(markdown: string): { heading: string | null; body: string }[] {
  const parts = markdown.split(SECTION_HEADING);
  const sections: { heading: string | null; body: string }[] = [];
  const intro = (parts[0] ?? '').trim();
  if (intro !== '') {
    sections.push({ heading: null, body: intro });
  }
  // split에 묶음(괄호)이 있어 [앞부분, 제목1, 본문1, 제목2, 본문2, …] 순서로 나온다
  for (let index = 1; index < parts.length; index += 2) {
    sections.push({ heading: (parts[index] ?? '').trim(), body: (parts[index + 1] ?? '').trim() });
  }
  return sections;
}

export function buildGuideChunks(): ChunkSource[] {
  const chunks: ChunkSource[] = [];
  for (const guide of guides) {
    for (const [index, section] of splitSections(guide.raw).entries()) {
      chunks.push({
        id: `guide:${guide.slug}#${index}`,
        title: section.heading === null ? guide.title : `${guide.title} — ${section.heading}`,
        url: GUIDE_URL,
        content: section.heading === null ? `${guide.summary}\n\n${section.body}` : section.body,
      });
    }
  }
  for (const faq of faqs) {
    chunks.push({
      id: `faq:${faq.question}`,
      title: faq.question,
      url: GUIDE_URL,
      content: faq.answer.trim(),
    });
  }
  for (const section of guideSections) {
    chunks.push({
      id: `section:${section.title}`,
      title: section.title,
      url: section.anchor ? `${GUIDE_URL}#${section.anchor}` : GUIDE_URL,
      content: section.body.trim(),
    });
  }
  return chunks.filter((chunk) => chunk.content !== '');
}
