import { json, type Env } from '../../_lib/env';
import { clearSession } from '../../_lib/session';

export const onRequestPost: PagesFunction<Env> = async () => json({ ok: true }, 200, { 'set-cookie': clearSession() });
