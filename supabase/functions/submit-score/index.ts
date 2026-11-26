import { createClient } from 'npm:@supabase/supabase-js@2';
import { pts, validate } from './game.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const PER_IP_PER_MIN = 20;

async function sha256(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let body: { day?: unknown; device_id?: unknown; res?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }

  const err = validate(body.day, body.device_id, body.res);
  if (err) return json({ error: err }, 422);
  const res = body.res as [string, number, number][];

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const ipHash = await sha256(ip + (Deno.env.get('IP_SALT') ?? ''));
  const { count } = await db.from('scores').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', new Date(Date.now() - 60_000).toISOString());
  if ((count ?? 0) >= PER_IP_PER_MIN) return json({ error: 'slow down' }, 429);

  const score = res.reduce((s, r) => s + pts(r), 0); // never trust a client-sent score
  const { error } = await db.from('scores').upsert({ day: body.day, device_id: body.device_id, score, answers: res, ip_hash: ipHash }, { onConflict: 'day,device_id', ignoreDuplicates: true });
  if (error) { console.error(error); return json({ error: 'store failed' }, 500); }
  return json({ ok: true, score });
});
