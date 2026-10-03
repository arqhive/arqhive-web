import { THEME_STORAGE_KEY } from '@/shared/config';

/**
 * 첫 화면이 그려지기 전에 실행되는 아주 작은 스크립트(루트 레이아웃이 <head>에 넣는다).
 * 사용자가 전에 고른 모드를 <html data-theme>에 미리 붙여서, 밝은 화면이 잠깐 번쩍이는 현상(FOUC)을 막는다.
 * React가 실행되기 전에 돌아야 하므로 문자열로 된 순수 JS다.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`;
