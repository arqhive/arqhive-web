import { z } from 'zod';
import { PLATFORMS } from './platform.ts';

/**
 * 실행 중에 기종 값을 검사하는 스키마. API 입력이나 MDX frontmatter를 검사할 때 쓴다.
 * 기종 이름 표(platform.ts)와 파일을 나눈 이유: 화면 코드는 이름 표만 쓰는데, 같은 파일에 zod 호출이 있으면
 * 브라우저 묶음에 zod(약 88KB gzip)가 통째로 딸려 간다. 패키지의 "sideEffects": false와 함께, 쓰지 않는 이 파일은 묶음에서 빠진다.
 */
export const platformSchema = z.enum(PLATFORMS);
