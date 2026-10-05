'use client';

import { REPORT_LIMITS } from '@arqhive/shared';
import { useCallback, useState } from 'react';

/** 받는 이미지 형식(MIME) */
const TYPES: readonly string[] = REPORT_LIMITS.imageTypes;

/** 고른 스크린샷 하나: 원본 파일과 미리보기 주소(blob:) */
export interface PickedImage {
  readonly file: File;
  readonly preview: string;
}

/** 고르다 생긴 문제: 형식이 아님 / 너무 큼 / 장수 초과. 문구는 화면이 정한다 */
export type PickError = 'type' | 'size' | 'count' | null;

/**
 * 스크린샷 고르기. 형식(png·jpg·webp)·크기(5MB)·장수(3장)를 고를 때 바로 검사한다(서버도 다시 검사한다).
 * 미리보기 주소는 빼거나 비울 때 놓아 준다(URL.revokeObjectURL, 메모리 정리).
 */
export function useImagePicker() {
  const [images, setImages] = useState<readonly PickedImage[]>([]);
  const [error, setError] = useState<PickError>(null);

  const add = useCallback(
    (files: FileList | null) => {
      const picked = [...(files ?? [])];
      const valid = picked.filter((file) => TYPES.includes(file.type));
      const small = valid.filter((file) => file.size <= REPORT_LIMITS.maxImageBytes);
      const room = Math.max(0, REPORT_LIMITS.maxImages - images.length);
      if (valid.length < picked.length) {
        setError('type');
      } else if (small.length < valid.length) {
        setError('size');
      } else {
        setError(small.length > room ? 'count' : null);
      }
      const added = small
        .slice(0, room)
        .map((file) => ({ file, preview: URL.createObjectURL(file) }));
      setImages([...images, ...added]);
    },
    [images],
  );

  const remove = useCallback((index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target !== undefined) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clear = useCallback(() => {
    setImages((prev) => {
      for (const image of prev) {
        URL.revokeObjectURL(image.preview);
      }
      return [];
    });
    setError(null);
  }, []);

  return { images, error, add, remove, clear };
}
