'use client';

import { REPORT_LIMITS } from '@arqhive/shared';
import { useId } from 'react';

/** 칸 이름과 입력 상자 모양(게임·내용 칸이 함께 쓴다) */
const LABEL = 'font-bold text-ink text-sm';
const BOX =
  'mt-2 w-full border border-line bg-card px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-stamp';

/** 게임 고르기 목록의 한 칸 */
export interface GameOption {
  readonly slug: string;
  readonly label: string;
}

/** 게임 고르기(필수). 공개된 패치만 고를 수 있다 */
export function GameSelect({ games }: { readonly games: readonly GameOption[] }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        게임
      </label>
      {/* 브라우저 기본 화살표는 위치를 못 옮겨서 끄고(appearance-none), 오른쪽 여백을 둔 화살표를 직접 그린다 */}
      <div className="relative">
        <select
          id={id}
          name="slug"
          required={true}
          defaultValue=""
          className={`${BOX} cursor-pointer appearance-none pr-11`}
        >
          <option value="" disabled={true}>
            게임을 고르세요
          </option>
          {games.map((game) => (
            <option key={game.slug} value={game.slug}>
              {game.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 right-4 mt-1 size-4 -translate-y-1/2 fill-none stroke-current stroke-2 text-ink-sub"
        >
          <path d="M3.5 6l4.5 4.5L12.5 6" />
        </svg>
      </div>
    </div>
  );
}

/** 제보 내용(필수, 10~2,000자). 글자 수를 아래에 보여 준다 */
export function TextField({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        제보 내용
      </label>
      <textarea
        id={id}
        name="text"
        required={true}
        minLength={REPORT_LIMITS.textMin}
        maxLength={REPORT_LIMITS.textMax}
        rows={6}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="어느 장면에서 어떤 문제가 있었는지 적어 주세요. (오역, 깨진 글자, 실행 문제 등)"
        className={`${BOX} resize-none leading-relaxed`}
      />
      <p className="mt-1 text-right font-num text-ink-sub text-xs">
        {value.length.toLocaleString('ko-KR')} / {REPORT_LIMITS.textMax.toLocaleString('ko-KR')}
      </p>
    </div>
  );
}

/**
 * 허니팟: 사람 눈과 키보드에는 안 보이는 칸. 양식을 자동으로 다 채우는 봇은 여기도 채우므로, 값이 있으면 서버가 버린다.
 * display:none으로 숨기면 일부 봇이 건너뛰어서 화면 밖으로 밀어 둔다.
 */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        홈페이지
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
