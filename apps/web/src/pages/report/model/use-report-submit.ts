'use client';

import type { SubmittedReport } from '@arqhive/shared';
import { useCallback, useRef, useState } from 'react';
import { track } from '@/shared/analytics';
import { reencodeImage } from '../lib/reencode-image.ts';

/** API 응답 모양(실패 코드는 API와 맞춘다) */
interface ApiResponse {
  readonly ok: boolean;
  readonly url?: string;
  /** 저장 공간 한도 때문에 스크린샷 없이 글만 등록됐으면 true */
  readonly imagesSkipped?: boolean;
  /** 방금 만든 제보(목록 맨 위에 바로 붙인다) */
  readonly report?: SubmittedReport;
  readonly code?: 'invalid' | 'rate' | 'bot' | 'server';
}

/** 방문 통계: 제보 결과(어느 패치, 성공/실패 이유, 스크린샷 수). 제보 내용은 보내지 않는다 */
function trackResult(data: FormData, result: ApiResponse, imageCount: number) {
  track(result.ok ? 'report-sent' : 'report-failed', {
    patch: String(data.get('slug') ?? ''),
    images: imageCount,
    ...(result.ok ? {} : { code: result.code ?? 'server' }),
  });
}

/** 보내기 결과. 문구는 화면이 정한다 */
export type SubmitState =
  | { readonly status: 'idle' }
  | { readonly status: 'sending' }
  | {
      readonly status: 'done';
      readonly url: string;
      readonly imagesSkipped: boolean;
      readonly report: SubmittedReport | undefined;
    }
  | {
      readonly status: 'error';
      readonly code: 'invalid' | 'rate' | 'bot' | 'server' | 'network';
    };

/**
 * 제보 보내기. 양식 값(게임·내용·허니팟·Turnstile 토큰)에 페이지를 연 뒤 지난 시간(elapsedMs, 너무 빠르면 봇)과
 * 다시 저장한 스크린샷(webp, 위치 정보 제거)을 붙여 API로 보낸다(multipart/form-data).
 */
export function useReportSubmit(apiUrl: string | undefined) {
  const [state, setState] = useState<SubmitState>({ status: 'idle' });
  const startedAt = useRef(Date.now());

  const submit = useCallback(
    async (form: HTMLFormElement, images: readonly File[]) => {
      if (apiUrl === undefined) {
        return;
      }
      setState({ status: 'sending' });
      try {
        const data = new FormData(form);
        data.set('elapsedMs', String(Date.now() - startedAt.current));
        data.delete('images');
        for (const [index, file] of images.entries()) {
          // biome-ignore lint/performance/noAwaitInLoops: 이미지는 많아야 3장이고, 순서대로 붙여야 번호가 맞다
          data.append('images', await reencodeImage(file), `screenshot-${index + 1}.webp`);
        }
        const response = await fetch(`${apiUrl}/reports`, { method: 'POST', body: data });
        const result = (await response.json()) as ApiResponse;
        trackResult(data, result, images.length);
        setState(
          result.ok && result.url
            ? {
                status: 'done',
                url: result.url,
                imagesSkipped: result.imagesSkipped === true,
                report: result.report,
              }
            : { status: 'error', code: result.code ?? 'server' },
        );
      } catch {
        track('report-failed', { code: 'network' });
        setState({ status: 'error', code: 'network' });
      }
    },
    [apiUrl],
  );

  return { state, submit, reset: () => setState({ status: 'idle' }) };
}
