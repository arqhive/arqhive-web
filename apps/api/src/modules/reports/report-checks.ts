import { REPORT_LIMITS } from '@arqhive/shared';

/**
 * 제보 받기 전 검사(순수 함수: 바깥 연결 없이 시험할 수 있다).
 * - 봇 흔적: 허니팟 칸(website)이 채워졌거나, 페이지를 연 지 3초도 안 돼 보냈다
 * - 이미지: 장수·크기, 그리고 파일 앞부분(매직 바이트)으로 진짜 png·jpg·webp인지(확장자·MIME은 꾸밀 수 있다)
 */

/** 사람이 양식을 채우는 데 걸리는 최소 시간(ms). 이보다 빠르면 자동 입력으로 본다 */
const MIN_ELAPSED_MS = 3000;

/** 파일 앞부분 바이트(글자 하나 = 바이트 하나, \x는 16진수) */
const PNG = '\x89PNG';
const JPEG = '\xff\xd8\xff';
const RIFF_HEADER = 'RIFF';
const WEBP_HEADER = 'WEBP';
/** webp는 "RIFF" 4바이트 + 크기 4바이트 다음에 "WEBP"가 온다 */
const WEBP_OFFSET = 8;

type ImageKind = 'png' | 'jpg' | 'webp';

interface CheckedImage {
  readonly bytes: Uint8Array;
  readonly kind: ImageKind;
}

const CONTENT_TYPES: Readonly<Record<ImageKind, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

function startsWith(bytes: Uint8Array, signature: string, offset = 0): boolean {
  return [...signature].every((char, index) => bytes[offset + index] === char.charCodeAt(0));
}

/** 파일 앞부분으로 이미지 종류를 알아낸다. 아니면 null */
function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (startsWith(bytes, PNG)) {
    return 'png';
  }
  if (startsWith(bytes, JPEG)) {
    return 'jpg';
  }
  return startsWith(bytes, RIFF_HEADER) && startsWith(bytes, WEBP_HEADER, WEBP_OFFSET)
    ? 'webp'
    : null;
}

/** 봇으로 보이면 true: 허니팟이 채워졌거나 너무 빨리 보냄 */
function looksLikeBot(form: FormData): boolean {
  const honeypot = form.get('website');
  const elapsed = Number(form.get('elapsedMs') ?? '0');
  return (typeof honeypot === 'string' && honeypot !== '') || !(elapsed >= MIN_ELAPSED_MS);
}

/** 양식의 이미지들을 읽어 검사한다. 하나라도 어긋나면 null(제보 전체를 받지 않는다) */
async function readImages(form: FormData): Promise<readonly CheckedImage[] | null> {
  const files = form.getAll('images').filter((value): value is File => typeof value !== 'string');
  if (files.length > REPORT_LIMITS.maxImages) {
    return null;
  }
  const images: CheckedImage[] = [];
  for (const file of files) {
    if (file.size > REPORT_LIMITS.maxImageBytes) {
      return null;
    }
    // biome-ignore lint/performance/noAwaitInLoops: 많아야 3장이고, 하나라도 어긋나면 바로 멈춘다
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffImage(bytes);
    if (kind === null) {
      return null;
    }
    images.push({ bytes, kind });
  }
  return images;
}

export { type CheckedImage, CONTENT_TYPES, type ImageKind, looksLikeBot, readImages, sniffImage };
