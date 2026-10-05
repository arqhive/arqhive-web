'use client';

import type { SubmittedReport } from '@arqhive/shared';
import { useEffect } from 'react';
import type { SubmitState } from './use-report-submit.ts';

/** Turnstile 위젯 전역 객체(스크립트가 window에 만든다). 토큰은 한 번만 쓸 수 있어 보낸 뒤 다시 받는다 */
type TurnstileGlobal = typeof globalThis & { turnstile?: { reset: () => void } };

/**
 * 보낸 뒤 정리: 성공이면 양식을 비우고(reset) 방금 만든 제보를 목록으로 넘기고(onSubmitted),
 * 성공·실패 모두 Turnstile 토큰을 새로 받는다.
 * onSubmitted·reset은 고정된 함수(useCallback)여야 한다. 아니면 그릴 때마다 다시 돈다.
 */
export function useAfterSubmit(
  state: SubmitState,
  reset: () => void,
  onSubmitted: (report: SubmittedReport) => void,
) {
  useEffect(() => {
    if (state.status === 'done') {
      reset();
      if (state.report !== undefined) {
        onSubmitted(state.report);
      }
    }
    if (state.status === 'done' || state.status === 'error') {
      (globalThis as TurnstileGlobal).turnstile?.reset();
    }
  }, [state, reset, onSubmitted]);
}
