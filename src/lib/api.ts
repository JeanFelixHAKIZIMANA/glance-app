import { useEffect, useState } from 'react';
import { DayKey, POOL, sampleWorld, World } from '@/engine';
import { getState, Pending, setState } from './store';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const online = !!(URL && KEY);
const headers = { apikey: KEY ?? '', Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' };

async function call(path: string, init: RequestInit = {}, tries = 3): Promise<Response> {
  for (let i = 0; ; i++) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(`${URL}${path}`, { ...init, headers, signal: ctl.signal });
      if (r.status < 500 && r.status !== 429) return r; // 4xx is final, don't hammer
      if (i >= tries - 1) return r;
    } catch (e) { if (i >= tries - 1) throw e; } finally { clearTimeout(t); }
    await new Promise(res => setTimeout(res, 500 * 2 ** i + Math.random() * 300)); // exponential backoff + jitter
  }
}

/** Queue then flush; server dedupes on (day, device), so retrying is safe. */
export async function submit(p: Pending) {
  setState({ pending: [...getState().pending.filter(x => x.day !== p.day), p] });
  await flushPending();
}
export async function flushPending() {
  if (!online) return;
  for (const p of getState().pending) {
    try {
      const r = await call('/functions/v1/submit-score', { method: 'POST', body: JSON.stringify({ ...p, device_id: getState().deviceId }) });
      if (r.ok || (r.status >= 400 && r.status < 500 && r.status !== 429)) setState({ pending: getState().pending.filter(x => x !== p) });
    } catch { return; } // offline: try again next launch
  }
}

const cache = new Map<DayKey, World>();
async function fetchWorld(day: DayKey): Promise<World> {
  const fallback = sampleWorld(day);
  if (!online) return fallback;
  try {
    const r = await call(`/rest/v1/day_stats?day=eq.${day}&select=players,mean,sd,skill`, {}, 2);
    const [row] = r.ok ? await r.json() : [];
    if (!row || row.players < 20) return fallback; // too few players for a meaningful curve
    const skill = { ...fallback.skill };
    for (const id of POOL) if (row.skill?.[id]) skill[id] = { acc: Number(row.skill[id].acc), ms: Number(row.skill[id].ms) || fallback.skill[id].ms };
    return { players: row.players, mean: row.mean, sd: Math.max(60, row.sd), skill, sample: false };
  } catch { return fallback; }
}
export function useWorld(day: DayKey) {
  const [w, setW] = useState<World>(() => cache.get(day) ?? sampleWorld(day));
  useEffect(() => {
    let live = true;
    if (!cache.has(day)) fetchWorld(day).then(x => { if (!x.sample) cache.set(day, x); if (live) setW(x); });
    return () => { live = false; };
  }, [day]);
  return w;
}
