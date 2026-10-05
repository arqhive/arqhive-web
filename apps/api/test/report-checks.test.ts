import { describe, expect, it } from 'vitest';
import { looksLikeBot, readImages, sniffImage } from '../src/modules/reports/report-checks.ts';

/** 글자 하나 = 바이트 하나로 바이트 배열 만들기(파일 앞부분 흉내) */
function bytes(text: string): Uint8Array {
  return Uint8Array.from([...text].map((char) => char.charCodeAt(0)));
}

describe('sniffImage', () => {
  it('파일 앞부분으로 png·jpg·webp를 알아본다', () => {
    expect(sniffImage(bytes('\x89PNG\r\n'))).toBe('png');
    expect(sniffImage(bytes('\xff\xd8\xff\xe0'))).toBe('jpg');
    expect(sniffImage(bytes('RIFF\x00\x00\x00\x00WEBPVP8 '))).toBe('webp');
  });

  it('이미지가 아니면 null(확장자를 꾸며도 안 속는다)', () => {
    expect(sniffImage(bytes('<html>'))).toBeNull();
    expect(sniffImage(bytes('RIFF\x00\x00\x00\x00WAVE'))).toBeNull();
  });
});

describe('looksLikeBot', () => {
  function form(fields: Record<string, string>): FormData {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      data.append(key, value);
    }
    return data;
  }

  it('허니팟이 채워졌거나 너무 빨리 보내면 봇으로 본다', () => {
    expect(looksLikeBot(form({ website: 'spam', elapsedMs: '9000' }))).toBe(true);
    expect(looksLikeBot(form({ website: '', elapsedMs: '500' }))).toBe(true);
    expect(looksLikeBot(form({ website: '' }))).toBe(true);
  });

  it('사람처럼 보내면 통과', () => {
    expect(looksLikeBot(form({ website: '', elapsedMs: '9000' }))).toBe(false);
  });
});

describe('readImages', () => {
  it('이미지가 아닌 파일이 섞이면 전체를 받지 않는다', async () => {
    const data = new FormData();
    data.append('images', new File([bytes('\x89PNG\r\n')], 'a.png', { type: 'image/png' }));
    data.append('images', new File([bytes('<html>')], 'b.png', { type: 'image/png' }));
    expect(await readImages(data)).toBeNull();
  });

  it('4장 이상이면 받지 않는다', async () => {
    const data = new FormData();
    for (let index = 0; index < 4; index += 1) {
      data.append(
        'images',
        new File([bytes('\x89PNG\r\n')], `${index}.png`, { type: 'image/png' }),
      );
    }
    expect(await readImages(data)).toBeNull();
  });
});
