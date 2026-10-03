'use client';

import { useRef, useState } from 'react';
import { CaseCover, type PatchCaseData } from '@/entities/patch';
import { CaseViewer } from '@/widgets/case-viewer';

/**
 * 시제품 확인용 화면의 클라이언트 부분. 표지를 누르면 그 표지가 화면 가운데로 날아가 열린다.
 *
 * - originRef: 누른 표지 요소. 케이스가 날아갈 출발점·돌아올 도착점을 이 요소의 위치로 잰다.
 * - 열려 있는 동안 원래 표지는 invisible로 감춰 "같은 케이스를 꺼냈다"처럼 보이게 한다
 *   (invisible은 자리를 차지한 채 안 보이게 하므로, 위치를 다시 재도 그대로다).
 */
export function CaseLabClient({ items }: { readonly items: readonly PatchCaseData[] }) {
  const [selected, setSelected] = useState<PatchCaseData | null>(null);
  const originRef = useRef<HTMLElement | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {items.map((item) => (
          <li key={item.slug}>
            <button
              type="button"
              onClick={(event) => {
                originRef.current = event.currentTarget;
                setSelected(item);
              }}
              className={`block aspect-[3/4] w-full text-left transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-stamp focus-visible:outline-offset-2 ${item.status === 'in_progress' ? 'opacity-60' : ''} ${selected?.slug === item.slug ? 'invisible' : ''}`}
            >
              <CaseCover patch={item} />
            </button>
          </li>
        ))}
      </ul>
      <CaseViewer patch={selected} originRef={originRef} onClose={() => setSelected(null)} />
    </>
  );
}
