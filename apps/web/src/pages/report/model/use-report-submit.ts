'use client';

import type { SubmittedReport } from '@arqhive/shared';
import type { InferResponseType } from 'hono/client';
import { useCallback, useRef, useState } from 'react';
import { track } from '@/shared/analytics';
import { apiClient } from '@/shared/api';
import { reencodeImage } from '../lib/reencode-image.ts';

/**
 * API 응답 모양. 손으로 적지 않고 API 코드(Hono RPC 타입)에서 뽑는다 — 성공·시험(dry run)·실패 응답의 합집합.
 * API가 응답을 바꾸면 여기서 타입 오류가 난다.
 */
type ApiResponse = InferResponseType<ReturnType<typeof apiClient>['api']['reports']['$post']>;

/** 방문 통계: 제보 결과(어느 패치, 성공/실패 이유, 스크린샷 수). 제보 내용은 보내지 않는다 */
function trackResult(data: FormData, result: ApiResponse, imageCount: number) {
  track(result.ok ? 'report-sent' : 'report-failed', {
    patch: String(data.get('slug') ?? ''),
    images: imageCount,
    ...(result.ok ? {} : { code: result.code }),
  });
}

/** 보내기 결과. 문구는 화면이 정한다 */
type SubmitState =
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
 * API 응답 → 화면 상태. ok로 성공·실패가 갈린다(실패에만 code가 있다).
 * imagesSkipped는 저장 한도로 스크린샷을 뺐을 때만 응답에 들어 있다.
 */
function toState(result: ApiResponse): SubmitState {
  if (!result.ok) {
    return { status: 'error', code: result.code };
  }
  return {
    status: 'done',
    url: result.url,
    imagesSkipped: 'imagesSkipped' in result && result.imagesSkipped,
    report: result.report,
  };
}

/**
 * 제보 보내기. 양식 값(게임·내용·허니팟·Turnstile 토큰)에 페이지를 연 뒤 지난 시간(elapsedMs, 너무 빠르면 봇)과
 * 다시 저장한 스크린샷(webp, 위치 정보 제거)을 붙여 API로 보낸다(multipart/form-data).
 */
function useReportSubmit(apiUrl: string | undefined) {
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
        // 양식(multipart/form-data)은 API가 검사기 없이 직접 읽으므로 본문을 init으로 그대로 넘긴다
        const response = await apiClient(apiUrl).api.reports.$post(undefined, {
          init: { body: data },
        });
        const result: ApiResponse = await response.json();
        trackResult(data, result, images.length);
        setState(toState(result));
      } catch {
        track('report-failed', { code: 'network' });
        setState({ status: 'error', code: 'network' });
      }
    },
    [apiUrl],
  );

  return { state, submit, reset: () => setState({ status: 'idle' }) };
}

export type { SubmitState };
export { useReportSubmit };
