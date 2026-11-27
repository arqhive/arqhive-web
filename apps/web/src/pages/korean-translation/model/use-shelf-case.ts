import { useCallback, useEffect, useRef, useState } from 'react';
import { type PatchCaseData, patchPath } from '@/entities/patch';
import { track } from '@/shared/analytics';
import { SITE } from '@/shared/config';

function showAddress(patch: PatchCaseData | null) {
  globalThis.history.replaceState(
    null,
    '',
    patch === null ? '/korean-translation' : patchPath(patch.slug),
  );
  document.title = `${patch === null ? '한글 패치' : `${patch.titleKo} 한글 패치`} · ${SITE.name}`;
}

/** 선반 폭과 글꼴이 자리 잡으면 해당 등줄기에서 케이스를 꺼낸다. */
function useOpenFromAddress(
  item: PatchCaseData | null,
  onPick: (item: PatchCaseData, element: HTMLElement | null) => void,
) {
  useEffect(() => {
    if (item === null) {
      return;
    }
    let cancelled = false;
    document.fonts.ready
      .then(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      )
      .then(() => {
        if (cancelled) {
          return;
        }
        const spine = document.querySelector<HTMLElement>(
          `a[data-slug="${CSS.escape(item.slug)}"]`,
        );
        onPick(item, spine);
        track('case-open', { patch: item.slug, from: 'address' });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [item, onPick]);
}

export function useShelfCase(initialPatch: PatchCaseData | null) {
  // 공유 주소는 서버에서 속지까지 그린다. 실제 열기 연출은 선반 위치를 잰 뒤 시작한다.
  const [picked, setPicked] = useState(initialPatch);
  const [readyToOpen, setReadyToOpen] = useState(initialPatch === null);
  const originRef = useRef<HTMLElement | null>(null);

  const onPick = useCallback((item: PatchCaseData, element: HTMLElement | null) => {
    originRef.current = element;
    if (element !== null) {
      element.style.visibility = 'hidden';
    }
    setPicked(item);
    setReadyToOpen(true);
    showAddress(item);
  }, []);

  const onClose = useCallback(() => {
    if (originRef.current !== null) {
      originRef.current.style.visibility = '';
      originRef.current = null;
    }
    setPicked(null);
    showAddress(null);
  }, []);

  useOpenFromAddress(initialPatch, onPick);
  return { picked, readyToOpen, originRef, onPick, onClose };
}
