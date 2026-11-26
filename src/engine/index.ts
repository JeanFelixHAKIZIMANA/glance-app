// Pure game logic: no React, no storage. Shared by app, web and tests.

/* ---------- dates & seeds ---------- */
export type DayKey = string; // YYYY-MM-DD in the player's local time
const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date): DayKey => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toDate = (k: DayKey) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k: DayKey, n: number) => { const d = toDate(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const today = () => dayKey(new Date());
const LAUNCH = Date.UTC(2026, 0, 1);
export const setNo = (k: DayKey) => { const [y, m, d] = k.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, d) - LAUNCH) / 864e5) + 1; };

export const hash = (s: string) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export type Rng = () => number;
export const mkRng = (a: number): Rng => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/* ---------- shapes ---------- */
export type Cell = [number, number];
export const norm = (c: Cell[]): Cell[] => { const mx = Math.min(...c.map(p => p[0])), my = Math.min(...c.map(p => p[1])); return c.map(([x, y]) => [x - mx, y - my] as Cell).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
export const keyOf = (c: Cell[]) => norm(c).map(p => p.join(',')).join(';');
export const rot = (c: Cell[]) => c.map(([x, y]) => [y, -x] as Cell);
export const flip = (c: Cell[]) => c.map(([x, y]) => [-x, y] as Cell);
export const rotKeys = (c: Cell[]) => { const s = new Set<string>(); let b = c; for (let i = 0; i < 4; i++) { s.add(keyOf(b)); b = rot(b); } return s; };
const DIRS: Cell[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
/** Random polyomino whose mirror image is NOT a rotation of itself, so "mirror" is always a real answer. */
export function poly(r: Rng, n: number): Cell[] {
  for (;;) {
    const c: Cell[] = [[0, 0]];
    while (c.length < n) {
      const [x, y] = c[Math.floor(r() * c.length)], [dx, dy] = DIRS[Math.floor(r() * 4)], p: Cell = [x + dx, y + dy];
      if (!c.some(q => q[0] === p[0] && q[1] === p[1])) c.push(p);
    }
    if (!rotKeys(c).has(keyOf(flip(c)))) return c;
  }
}
export type Dot = [number, number, number];
function dots(r: Rng, n: number): Dot[] {
  const p: Dot[] = []; let g = 0;
  while (p.length < n && g++ < 6000) { const x = 9 + r() * 82, y = 9 + r() * 82; if (p.every(q => (q[0] - x) ** 2 + (q[1] - y) ** 2 > 110)) p.push([x, y, 2.6 + r() * 2.2]); }
  return p;
}

/* ---------- puzzles ---------- */
export const PAL = ['#ff4d2e', '#2563eb', '#f2b705', '#12a150', '#9b51e0'];
export type SkillId = 'turn' | 'gap' | 'shade' | 'change' | 'count';
export type Round =
  | { id: 'turn'; a: Cell[]; b: Cell[]; ans: 'same' | 'mirror' }
  | { id: 'gap'; hole: Cell[]; opts: Cell[][]; ans: number }
  | { id: 'shade'; n: number; base: string; odd: string; ans: number }
  | { id: 'change'; n: number; A: number[]; B: number[]; ans: number; show: number }
  | { id: 'count'; L: Dot[]; R: Dot[]; ans: 'L' | 'R' };

const GEN: { [K in SkillId]: (r: Rng, lvl: number) => Extract<Round, { id: K }> } = {
  turn: (r, i) => { const a = poly(r, [5, 6, 6, 7][i]), mir = r() < .5; let b = mir ? flip(a) : a; for (let j = 0, k = 1 + Math.floor(r() * 3); j < k; j++) b = rot(b); return { id: 'turn', a, b, ans: mir ? 'mirror' : 'same' }; },
  gap: (r, i) => {
    const n = [4, 5, 5, 6][i], p = poly(r, n), ks = rotKeys(p); let b = p;
    for (let j = 0, k = Math.floor(r() * 4); j < k; j++) b = rot(b);
    const opts = [b]; if (i > 1) opts.push(flip(p)); // mirror trap on hard levels
    while (opts.length < 3) { const q = poly(r, n), qk = keyOf(q); if (ks.has(qk) || opts.slice(1).some(o => rotKeys(o).has(qk))) continue; opts.push(q); }
    const ans = Math.floor(r() * 3); [opts[0], opts[ans]] = [opts[ans], opts[0]];
    return { id: 'gap', hole: p, opts, ans };
  },
  shade: (r, i) => { const [n, d] = ([[4, 11], [4, 8], [5, 6], [5, 4.5]] as const)[i], h = Math.floor(r() * 360), s = Math.round(45 + r() * 25), l = Math.round(46 + r() * 10), sg = r() < .5 ? -1 : 1; return { id: 'shade', n, base: `hsl(${h}, ${s}%, ${l}%)`, odd: `hsl(${h}, ${s}%, ${l + sg * d}%)`, ans: Math.floor(r() * n * n) }; },
  change: (r, i) => { const n = [3, 4, 4, 5][i], A = Array.from({ length: n * n }, () => Math.floor(r() * 5)), ans = Math.floor(r() * n * n), B = A.slice(); B[ans] = (A[ans] + 1 + Math.floor(r() * 4)) % 5; return { id: 'change', n, A, B, ans, show: [1400, 1300, 1100, 1100][i] }; },
  count: (r, i) => { const [x, y] = [[10, 14], [13, 16], [15, 17], [18, 20]][i], big = r() < .5 ? 'L' : 'R'; return { id: 'count', L: dots(r, big === 'L' ? y : x), R: dots(r, big === 'R' ? y : x), ans: big }; },
};
export const genRound = (id: SkillId, r: Rng, lvl: number): Round => GEN[id](r, lvl);

export const SKILLS: Record<SkillId, { name: string; skill: string; short: string; desc: string }> = {
  turn: { name: 'Turn', skill: 'Mental rotation', short: 'Rotation', desc: 'Is the right shape the left one turned, or its mirror image?' },
  gap: { name: 'Gap', skill: 'Negative space', short: 'Negative space', desc: 'Which piece fills the hole? Pieces can turn but not flip.' },
  shade: { name: 'Shade', skill: 'Visual discrimination', short: 'Shade', desc: 'One tile is a slightly different shade. Tap it.' },
  change: { name: 'Change', skill: 'Change detection', short: 'Change', desc: 'Remember the colours. After a blink, tap the one that changed.' },
  count: { name: 'Count', skill: 'Number sense', short: 'Count', desc: 'Two dot clouds flash for under a second. Which side had more?' },
};
export const POOL = Object.keys(SKILLS) as SkillId[];
export const PER = 4, PERSET = 3, MAX = PER * PERSET * 100;
export const LEVELS = [0, 1, 2, 3], DRILL = [0, 1, 2, 2, 3, 3];

export const pickTasks = (seed: string): SkillId[] => {
  const r = mkRng(hash('pick' + seed)), a = POOL.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, PERSET);
};
export type Mode = 'today' | 'archive' | 'practice' | 'drill';
/** Same date => same rounds for every player. Practice and drills get a random seed. */
export function buildSet(k: DayKey, mode: Mode, only?: SkillId) {
  const random = mode === 'practice' || mode === 'drill', seed = random ? String(Math.random()) : k;
  const tasks = only ? [only] : pickTasks(random ? seed : k), lv = only ? DRILL : LEVELS;
  return { tasks, rounds: tasks.flatMap(id => { const r = mkRng(hash(seed + id)); return lv.map(i => genRound(id, r, i)); }) };
}
export const isCorrect = (q: Round, a: string) => String(q.ans) === a;

/* ---------- scoring & history ---------- */
export type Answer = [SkillId, 0 | 1, number]; // skill, correct, ms
export type SetRecord = { score: number; res: Answer[]; tasks: SkillId[]; late: boolean };
export type History = Record<DayKey, SetRecord>;
export const pts = (r: Answer) => (r[1] ? 70 + Math.round(30 * Math.max(0, 1 - r[2] / 5000)) : 0);
export const scoreOf = (res: Answer[]) => res.reduce((s, r) => s + pts(r), 0);

export function streak(h: History, now = today()) {
  let n = 0, k = now; const on = (d: DayKey) => !!h[d] && !h[d].late;
  if (!on(k)) k = addDays(k, -1);
  while (on(k)) { n++; k = addDays(k, -1); }
  return n;
}
export function bestStreak(h: History) {
  let b = 0, c = 0, prev: string | null = null;
  for (const k of Object.keys(h).filter(k => !h[k].late).sort()) { c = prev && addDays(prev, 1) === k ? c + 1 : 1; b = Math.max(b, c); prev = k; }
  return b;
}
export const skillIndex = (acc: number, ms: number) => Math.round(100 * (0.7 * acc + 0.3 * Math.max(0, Math.min(1, 1 - (ms - 600) / 5400))));
export function profile(answers: Answer[]) {
  const all: Partial<Record<SkillId, { t: number; o: number; ms: number }>> = {};
  for (const r of answers) { const a = (all[r[0]] ??= { t: 0, o: 0, ms: 0 }); a.t++; if (r[1]) { a.o++; a.ms += r[2]; } }
  const mine: Partial<Record<SkillId, number>> = {};
  for (const id of POOL) { const a = all[id]; if (a) mine[id] = skillIndex(a.o / a.t, a.o ? a.ms / a.o : 6000); }
  return mine;
}

/* ---------- worldwide stats ---------- */
export type World = { players: number; mean: number; sd: number; skill: Record<SkillId, { acc: number; ms: number }>; sample: boolean };
const erf = (x: number) => { const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); };
export const cdf = (x: number, m: number, s: number) => 0.5 * (1 + erf((x - m) / (s * Math.SQRT2)));
export const percentile = (score: number, w: World) => Math.max(1, Math.min(99, Math.round(cdf(score, w.mean, w.sd) * 100)));
const WBASE: Record<SkillId, [number, number]> = { turn: [0.78, 3600], gap: [0.74, 3100], shade: [0.71, 2500], change: [0.66, 1900], count: [0.81, 1300] };
/** shortcut: sample numbers until the server's day_stats exist; api.ts replaces this when online. */
export function sampleWorld(k: DayKey): World {
  const r = mkRng(hash('world' + k)), skill = {} as World['skill'];
  for (const id of POOL) skill[id] = { acc: WBASE[id][0] + (r() - 0.5) * 0.06, ms: WBASE[id][1] * (0.92 + r() * 0.16) };
  return { players: Math.round(9000 + r() * 6000), mean: Math.round(715 + r() * 70), sd: 165, skill, sample: true };
}
const TIERS: [number, string][] = [[95, 'Eagle eye'], [85, 'Hawk eye'], [60, 'Keen eye'], [30, 'Steady eye'], [0, 'Warming up']];
export const tierOf = (p: number) => TIERS.find(t => p >= t[0])![1];
