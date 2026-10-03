/**
 * 화면 모드(밝게·어둡게) 저장 키. 사용자가 고른 값을 localStorage에 둔다.
 * 고르지 않았으면 저장값이 없고, 시스템 설정(prefers-color-scheme)을 따른다.
 * 헤더의 전환 버튼과 첫 화면 전에 실행되는 초기화 스크립트가 같은 키를 쓴다.
 */
export const THEME_STORAGE_KEY = 'arqhive-theme';

export type Theme = 'light' | 'dark';
