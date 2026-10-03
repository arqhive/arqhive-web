import { Hono } from 'hono';

/** 배포 확인용. 서버가 살아 있는지만 알려 준다. */
export const healthRoute = new Hono().get('/', (c) => c.json({ status: 'ok' } as const));
