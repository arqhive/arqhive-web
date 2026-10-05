import type { SubmitState } from '../model/use-report-submit.ts';

/** 보내기 결과 문구. 실패 코드마다 할 일을 알려 준다 */
export function FormMessage({ state }: { readonly state: SubmitState }) {
  if (state.status === 'done') {
    return (
      <p className="text-ink text-sm">
        제보가 등록되었습니다. 감사합니다.{' '}
        <a
          href={state.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          GitHub에서 보기
        </a>
        {state.imagesSkipped ? (
          <span className="mt-1 block text-ink-sub">
            저장 공간이 다 차서 스크린샷 없이 글만 등록되었습니다.
          </span>
        ) : null}
      </p>
    );
  }
  if (state.status !== 'error') {
    return null;
  }
  return (
    <p className="text-sm text-stamp">
      {state.code === 'invalid' ? <>입력한 내용을 다시 확인해 주세요.</> : null}
      {state.code === 'rate' ? <>잠시 뒤에 다시 보내 주세요.</> : null}
      {state.code === 'bot' ? <>자동 입력 확인을 다시 해 주세요.</> : null}
      {state.code === 'server' || state.code === 'network' ? (
        <>보내지 못했습니다. 잠시 뒤에 다시 시도해 주세요.</>
      ) : null}
    </p>
  );
}
