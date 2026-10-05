'use client';

import type { SubmittedReport } from '@arqhive/shared';
import Script from 'next/script';
import { type SyntheticEvent, useCallback, useRef, useState } from 'react';
import { reportApiUrl, turnstileSiteKey } from '@/shared/config';
import { useAfterSubmit } from '../model/use-after-submit.ts';
import { useImagePicker } from '../model/use-image-picker.ts';
import { useReportSubmit } from '../model/use-report-submit.ts';
import { FormMessage } from './form-message.tsx';
import { ImageField } from './image-field.tsx';
import { type GameOption, GameSelect, Honeypot, TextField } from './report-fields.tsx';

/**
 * 제보 양식: 게임 + 내용 + 스크린샷 + (보이지 않는) 허니팟 + Turnstile(봇 확인).
 * API 주소가 설정되지 않았으면 보내기를 막고 준비 중이라고 알린다.
 * 보내기에 성공하면 양식을 비우고, 방금 만든 제보를 onSubmitted로 넘겨 목록 맨 위에 바로 붙이게 한다.
 */
export function ReportForm({
  games,
  onSubmitted,
}: {
  readonly games: readonly GameOption[];
  readonly onSubmitted: (report: SubmittedReport) => void;
}) {
  const apiUrl = reportApiUrl();
  const siteKey = turnstileSiteKey();
  const formRef = useRef<HTMLFormElement>(null);
  const [text, setText] = useState('');
  const picker = useImagePicker();
  const { state, submit } = useReportSubmit(apiUrl);
  const { clear } = picker;

  const resetForm = useCallback(() => {
    formRef.current?.reset();
    setText('');
    clear();
  }, [clear]);
  useAfterSubmit(state, resetForm, onSubmitted);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(
      event.currentTarget,
      picker.images.map((image) => image.file),
    ).catch(() => undefined);
  };

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="relative space-y-5 border border-line bg-card/50 p-5"
    >
      <GameSelect games={games} />
      <TextField value={text} onChange={setText} />
      <ImageField
        images={picker.images}
        error={picker.error}
        onAdd={picker.add}
        onRemove={picker.remove}
      />
      <Honeypot />
      {siteKey === undefined ? null : (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            async={true}
            defer={true}
          />
          <div className="cf-turnstile" data-sitekey={siteKey} data-theme="auto" />
        </>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={apiUrl === undefined || state.status === 'sending'}
          className="border border-ink bg-ink px-5 py-2 text-paper text-sm hover:opacity-90 disabled:opacity-40"
        >
          {state.status === 'sending' ? <>보내는 중…</> : <>제보하기</>}
        </button>
        {apiUrl === undefined ? (
          <p className="text-ink-sub text-sm">제보 접수를 준비하고 있습니다.</p>
        ) : (
          <FormMessage state={state} />
        )}
      </div>
    </form>
  );
}
