'use client';

import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { loadPatchInstructions } from '../api/load-patch-instructions.tsx';

export function PatchInstructionsDisclosure({
  slug,
  initial,
}: {
  readonly slug: string;
  readonly initial?: ReactNode;
}) {
  const [isOpen, setOpen] = useState(false);
  const { data, isError, refetch } = useQuery({
    queryKey: ['patch-instructions', slug],
    queryFn: () => loadPatchInstructions(slug),
    enabled: isOpen && initial === undefined,
    staleTime: Number.POSITIVE_INFINITY,
  });

  return (
    <details
      className="mt-2 shrink-0 text-xs md:text-[0.875em]"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer font-bold underline underline-offset-2 hover:text-stamp focus-visible:outline-2 focus-visible:outline-stamp">
        패치 적용 안내
      </summary>
      {initial ??
        data ??
        (isError ? (
          <button
            type="button"
            className="mt-2 underline"
            onClick={async () => {
              await refetch();
            }}
          >
            적용 안내 다시 불러오기
          </button>
        ) : (
          <p className="mt-2 text-ink-sub" role="status">
            {data === null ? '등록된 적용 안내가 없습니다.' : '적용 안내를 불러오는 중…'}
          </p>
        ))}
    </details>
  );
}
