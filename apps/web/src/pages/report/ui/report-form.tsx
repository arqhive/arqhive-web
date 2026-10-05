'use client';

import Script from 'next/script';
import { type SyntheticEvent, useEffect, useRef, useState } from 'react';
import { reportApiUrl, turnstileSiteKey } from '@/shared/config';
import { useImagePicker } from '../model/use-image-picker.ts';
import { useReportSubmit } from '../model/use-report-submit.ts';
import { FormMessage } from './form-message.tsx';
import { ImageField } from './image-field.tsx';
import { type GameOption, GameSelect, Honeypot, TextField } from './report-fields.tsx';

/** Turnstile 위젯 전역 객체(스크립트가 window에 만든다). 토큰은 한 번만 쓸 수 있어 보낸 뒤 다시 받는다 */
type TurnstileGlobal = typeof globalThis & { turnstile?: { reset: () => void } };

/**
 * 제보 양식: 게임 + 내용 + 스크린샷 + (보이지 않는) 허니팟 + Turnstile(봇 확인).
 * API 주소가 설정되지 않았으면 보내기를 막고 준비 중이라고 알린다. 보내기에 성공하면 양식을 비운다.
 */
export function ReportForm({ games }: { readonly games: readonly GameOption[] }) {
  const apiUrl = reportApiUrl();
  const siteKey = turnstileSiteKey();
  const formRef = useRef<HTMLFormElement>(null);
  const [text, setText] = useState('');
  const picker = useImagePicker();
  const { state, submit } = useReportSubmit(apiUrl);
  const { clear } = picker;

  // 보낸 뒤: 성공이면 양식 비우기, 성공·실패 모두 Turnstile 토큰 새로 받기
  useEffect(() => {
    if (state.status === 'done') {
      formRef.current?.reset();
      setText('');
      clear();
    }
    if (state.status === 'done' || state.status === 'error') {
      (globalThis as TurnstileGlobal).turnstile?.reset();
    }
  }, [state.status, clear]);

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
