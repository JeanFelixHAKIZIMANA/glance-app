import { describe, expect, it } from 'vitest';
import { addDays, bestStreak, buildSet, genRound, hash, History, keyOf, mkRng, pickTasks, POOL, rotKeys, scoreOf, streak } from './index';

describe('puzzles', () => {
  it('every generated round has exactly one right answer', () => {
    for (let s = 0; s < 300; s++) {
      const r = mkRng(s * 7919 + 1);
      for (let i = 0; i < 4; i++) {
        const g = genRound('gap', r, i);
        if (g.id !== 'gap') throw 0;
        const fits = g.opts.filter(o => rotKeys(o).has(keyOf(g.hole)));
        expect(fits).toHaveLength(1);
        expect(rotKeys(g.opts[g.ans]).has(keyOf(g.hole))).toBe(true);

        const c = genRound('change', r, i);
        if (c.id !== 'change') throw 0;
        expect(c.A.filter((a, j) => a !== c.B[j])).toHaveLength(1);

        const n = genRound('count', r, i);
        if (n.id !== 'count') throw 0;
        const [big, small] = n.ans === 'L' ? [n.L, n.R] : [n.R, n.L];
        expect(big.length).toBeGreaterThan(small.length);

        const t = genRound('turn', r, i);
        if (t.id !== 'turn') throw 0;
        expect(rotKeys(t.a).has(keyOf(t.b))).toBe(t.ans === 'same');
      }
    }
  });

  it('daily sets are identical for everyone and pick 3 distinct skills', () => {
    const a = buildSet('2026-11-26', 'today'), b = buildSet('2026-11-26', 'today');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(new Set(a.tasks).size).toBe(3);
    expect(a.rounds).toHaveLength(12);
    for (let d = 0; d < 60; d++) expect(new Set(pickTasks(addDays('2026-11-01', d))).size).toBe(3);
  });

  it('drills are one skill, six rounds', () => {
    const d = buildSet('2026-11-26', 'drill', 'gap');
    expect(d.tasks).toEqual(['gap']);
    expect(d.rounds.every(r => r.id === 'gap')).toBe(true);
    expect(d.rounds).toHaveLength(6);
  });

  it('every skill shows up in the daily rotation', () => {
    const seen = new Set<string>();
    for (let d = 0; d < 30; d++) pickTasks(addDays('2026-11-01', d)).forEach(t => seen.add(t));
    expect([...seen].sort()).toEqual([...POOL].sort());
    expect(hash('a')).not.toBe(hash('b'));
  });
});

describe('scoring', () => {
  it('rewards correct and fast answers, caps at 100 per round', () => {
    expect(scoreOf([['turn', 1, 0]])).toBe(100);
    expect(scoreOf([['turn', 1, 9000]])).toBe(70);
    expect(scoreOf([['turn', 0, 100]])).toBe(0);
  });

  it('streak ignores archive solves and survives an unplayed today', () => {
    const rec = { score: 1, res: [], tasks: [], late: false };
    const h: History = { '2026-11-24': rec, '2026-11-25': rec, '2026-11-23': { ...rec, late: true } };
    expect(streak(h, '2026-11-26')).toBe(2);
    expect(streak({ ...h, '2026-11-26': rec }, '2026-11-26')).toBe(3);
    expect(streak(h, '2026-11-28')).toBe(0);
    expect(bestStreak({ ...h, '2026-11-20': rec })).toBe(2);
  });
});
