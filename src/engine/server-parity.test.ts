import { describe, expect, it } from 'vitest';
import * as server from '../../supabase/functions/_shared/game';
import { addDays, Answer, buildSet, pickTasks, pts } from './index';

describe('server validation matches the app', () => {
  it('picks the same daily skills and scores the same way', () => {
    for (let d = 0; d < 120; d++) { const k = addDays('2026-11-01', d); expect(server.pickTasks(k)).toEqual(pickTasks(k)); }
    for (const r of [['turn', 1, 0], ['turn', 1, 2500], ['gap', 0, 900]] as Answer[]) expect(server.pts(r)).toBe(pts(r));
  });
  it('accepts a real play and rejects tampering', () => {
    const now = new Date('2026-11-26T12:00:00Z'), day = '2026-11-26', id = '0f8fad5b-d9cb-469f-a165-70867728950e';
    const res = buildSet(day, 'today').rounds.map(q => [q.id, 1, 1200]);
    expect(server.validate(day, id, res, now)).toBeNull();
    expect(server.validate('2026-11-20', id, res, now)).toBe('day out of range');
    expect(server.validate(day, id, res.slice(1), now)).toBe('need 12 answers');
    expect(server.validate(day, id, res.map(r => [r[0], 1, 20]), now)).toBe('bad answer 0');
    expect(server.validate(day, id, [...res].reverse(), now)).toMatch(/bad answer/);
  });
});
