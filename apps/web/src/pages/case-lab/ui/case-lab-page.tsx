import { patches } from '@arqhive/content';
import { toCaseData } from '@/entities/patch';
import { CaseLabClient } from './case-lab-client.tsx';

/**
 * 케이스 열기 시제품 확인용 화면(임시, 검색에 노출하지 않음).
 * 서버 컴포넌트에서 콘텐츠를 읽고, 케이스에 필요한 필드만 골라 클라이언트 컴포넌트로 넘긴다.
 * 기종마다 하나씩 + 작업 중 하나를 골라 연출 차이(디스크·팩 크기, 색)를 한눈에 본다.
 */
export function CaseLabPage() {
  const picked = new Set<string>();
  const items = patches
    .filter((patch) => {
      const key = patch.status === 'in_progress' ? 'in_progress' : patch.platform;
      if (picked.has(key)) {
        return false;
      }
      picked.add(key);
      return true;
    })
    .map(toCaseData);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="font-num text-ink-sub text-xs">LAB · 시제품</p>
      <h1 className="mt-1 font-bold font-title text-3xl">케이스 열기</h1>
      <p className="mt-2 mb-8 text-ink-sub text-sm">
        표지를 누르면 케이스가 앞으로 나와 열립니다. 휴대폰 폭에서는 위로 열립니다. ESC나 바깥을
        눌러 닫습니다.
      </p>
      <CaseLabClient items={items} />
    </main>
  );
}
