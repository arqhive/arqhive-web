'use client';

import { useCallback, useRef, useState } from 'react';
import { CASE_SPECS, CaseCover, type PatchCaseData } from '@/entities/patch';
import { QueryProvider } from '@/shared/query';
import { CaseViewer } from '@/widgets/case-viewer';
import { loadChangelog } from '../api/load-changelog.tsx';

export function PatchCasePreview({
  patch,
  hasChangelog,
}: {
  readonly patch: PatchCaseData;
  readonly hasChangelog: boolean;
}) {
  const [open, setOpen] = useState(false);
  const originRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <QueryProvider>
      <div
        ref={originRef}
        className="relative flex w-full flex-col items-center justify-center gap-3 border border-line bg-card px-4 py-2 hover:border-ink sm:py-4"
      >
        <div
          aria-hidden="true"
          className={`hidden w-24 shadow-md sm:block ${CASE_SPECS[patch.platform].aspect}`}
        >
          <CaseCover patch={patch} />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-track="case-open"
          data-track-patch={patch.slug}
          className="font-bold text-sm after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp"
        >
          케이스 열기 <span aria-hidden="true">↗</span>
        </button>
      </div>
      <CaseViewer
        patch={open ? patch : null}
        loadChangelog={hasChangelog ? loadChangelog : undefined}
        originRef={originRef}
        onClose={close}
      />
    </QueryProvider>
  );
}
