// Server copy of the pieces of src/engine needed to validate a submission.
// Kept dependency-free so Deno can bundle it; src/engine/server-parity.test.ts asserts it matches the app.
export const POOL = ['turn', 'gap', 'shade', 'change', 'count'] as const;
const hash = (s: string) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const mkRng = (a: number) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const pickTasks = (seed: string) => { const r = mkRng(hash('pick' + seed)), a: string[] = [...POOL]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, 3); };
export const pts = (r: [string, number, number]) => (r[1] ? 70 + Math.round(30 * Math.max(0, 1 - r[2] / 5000)) : 0);

/** Returns an error string, or null when the submission is plausible. */
export function validate(day: unknown, deviceId: unknown, res: unknown, nowUtc = new Date()): string | null {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return 'bad day';
  if (typeof deviceId !== 'string' || !/^[0-9a-f-]{36}$/i.test(deviceId)) return 'bad device';
  const dayMs = Date.parse(day + 'T00:00:00Z'), today = Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate());
  if (!(Math.abs(dayMs - today) <= 864e5)) return 'day out of range'; // local dates span UTC-12..UTC+14
  const tasks = pickTasks(day);
  if (!Array.isArray(res) || res.length !== 12) return 'need 12 answers';
  for (let i = 0; i < 12; i++) {
    const r = res[i];
    if (!Array.isArray(r) || r[0] !== tasks[Math.floor(i / 4)] || (r[1] !== 0 && r[1] !== 1) || !Number.isInteger(r[2]) || r[2] < 150 || r[2] > 120000) return `bad answer ${i}`;
  }
  return null;
}
