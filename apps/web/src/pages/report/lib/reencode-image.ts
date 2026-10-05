/** 긴 변 최대 픽셀(스크린샷에 충분하고 용량은 줄인다) */
const MAX_SIDE = 2560;
/** webp 화질 */
const QUALITY = 0.9;

/**
 * 이미지를 브라우저에서 다시 그려 webp로 저장한다. 원본 파일의 메타데이터(EXIF: 찍은 위치·기기 등)는
 * 그림에 들어 있지 않으므로 새 파일에는 남지 않는다. 너무 크면 긴 변 2560px로 줄인다.
 */
export async function reencodeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = new OffscreenCanvas(
    Math.round(bitmap.width * scale),
    Math.round(bitmap.height * scale),
  );
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.convertToBlob({ type: 'image/webp', quality: QUALITY });
}
