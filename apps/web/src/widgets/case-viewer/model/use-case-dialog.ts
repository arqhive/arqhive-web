'use client';

import {
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { flyIn, flyOut, prefersReducedMotion, wait } from '../lib/motion.ts';

/** 표지가 덮이는 시간(ms). ui의 transition 시간과 맞춘다. */
const COVER_CLOSE_MS = 900;

const ignore = () => undefined;

/**
 * dialog를 닫는 사용자 입력 두 가지를 연출이 있는 close로 연결한다.
 * - ESC: 브라우저가 바로 닫아 버리므로(cancel 이벤트) 막고 close로 바꾼다.
 * - 빈 곳 클릭: 무대가 클릭을 통과시켜 클릭 대상이 dialog 자신이 될 때만 닫는다.
 */
function useDismissHandlers(close: () => void) {
  const onCancel = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      close();
    },
    [close],
  );
  const onBackdropClick = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) {
        close();
      }
    },
    [close],
  );
  return { onCancel, onBackdropClick };
}

/**
 * 케이스 열기·닫기 순서(FSD model 칸: 화면이 아닌 동작 로직). 움직임 계산은 lib/motion.ts가 맡는다.
 *
 * 열기: dialog 띄우기 → 케이스를 "누른 표지 자리"에서 화면 가운데로 이동(flyIn) → isOpen=true(표지가 넘어감)
 * 닫기: isOpen=false(표지가 덮임) → 케이스를 원래 표지 자리로 이동(flyOut) → dialog 닫기 → onClosed()
 */
export function useCaseDialog(
  key: string | null,
  originRef: RefObject<HTMLElement | null>,
  onClosed: () => void,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const caseRef = useRef<HTMLDivElement>(null);
  const [isShown, setIsShown] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isClosingRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const box = caseRef.current;
    if (key === null || dialog === null || box === null) {
      return;
    }
    dialog.showModal();
    isClosingRef.current = false;
    setIsShown(true);
    const move = flyIn(box, originRef.current);
    move.finished.then(() => setIsOpen(true)).catch(ignore);
    return () => move.cancel();
  }, [key, originRef]);

  const close = useCallback(() => {
    const dialog = dialogRef.current;
    const box = caseRef.current;
    if (dialog === null || box === null || isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    setIsOpen(false);
    wait(prefersReducedMotion() ? 0 : COVER_CLOSE_MS)
      .then(() => {
        setIsShown(false);
        return flyOut(box, originRef.current);
      })
      .then(() => {
        dialog.close();
        onClosed();
      })
      .catch(ignore);
  }, [originRef, onClosed]);

  const { onCancel, onBackdropClick } = useDismissHandlers(close);

  return { dialogRef, caseRef, isShown, isOpen, close, onCancel, onBackdropClick };
}
