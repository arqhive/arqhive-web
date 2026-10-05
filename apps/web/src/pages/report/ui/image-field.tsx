'use client';

import { REPORT_LIMITS } from '@arqhive/shared';
import { useRef } from 'react';
import type { PickError, PickedImage } from '../model/use-image-picker.ts';

/** 고르기 문제 문구(JSX: 한글 문자열 상수는 Biome noSecrets가 비밀값으로 잘못 본다) */
function PickErrorText({ error }: { readonly error: PickError }) {
  if (error === 'type') {
    return <>png·jpg·webp 이미지만 올릴 수 있습니다.</>;
  }
  if (error === 'size') {
    return <>한 장에 5MB까지 올릴 수 있습니다.</>;
  }
  return error === 'count' ? <>스크린샷은 3장까지 올릴 수 있습니다.</> : null;
}

/**
 * 스크린샷 칸: 파일 고르기 단추 + 미리보기 썸네일(× 단추로 빼기). 실제 파일 입력은 숨기고 단추로 연다.
 * 다 찼으면(3장) 고르기 단추를 막는다.
 */
export function ImageField({
  images,
  error,
  onAdd,
  onRemove,
}: {
  readonly images: readonly PickedImage[];
  readonly error: PickError;
  readonly onAdd: (files: FileList | null) => void;
  readonly onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const full = images.length >= REPORT_LIMITS.maxImages;
  return (
    <fieldset>
      <legend className="font-bold text-ink text-sm">
        스크린샷 <span className="font-normal text-ink-sub">(선택, 최대 3장)</span>
      </legend>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {images.map((image, index) => (
          <div key={image.preview} className="relative">
            {/* biome-ignore lint/performance/noImgElement: 방금 고른 파일의 미리보기(blob: 주소)라 next/image를 쓸 수 없다 */}
            <img
              src={image.preview}
              alt={`고른 스크린샷 ${index + 1}`}
              width={160}
              height={90}
              className="h-20 w-auto border border-line"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`스크린샷 ${index + 1} 빼기`}
              className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-line bg-paper text-ink text-xs"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={full}
          onClick={() => inputRef.current?.click()}
          className="h-20 border border-line border-dashed px-4 text-ink-sub text-sm hover:text-ink disabled:opacity-40"
        >
          + 스크린샷 추가
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={REPORT_LIMITS.imageTypes.join(',')}
          multiple={true}
          hidden={true}
          onChange={(event) => {
            onAdd(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
        />
      </div>
      {error === null ? null : (
        <p className="mt-2 text-sm text-stamp">
          <PickErrorText error={error} />
        </p>
      )}
    </fieldset>
  );
}
