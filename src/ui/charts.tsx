import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { cdf, DayKey, POOL, SKILLS, SkillId, toDate, World } from '@/engine';
import { svgFont, T } from './kit';
import { useColors } from './theme';

const useWidth = () => { const [w, setW] = useState(0); return [w, (e: { nativeEvent: { layout: { width: number } } }) => setW(e.nativeEvent.layout.width)] as const; };
const barPath = (x: number, y: number, w: number, h: number, r: number) => { r = Math.max(0, Math.min(r, w / 2, h)); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; };

export function Legend({ items }: { items: { label: string; color?: string; dashed?: boolean }[] }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
      {items.map(i => (
        <View key={i.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {i.dashed ? <View style={{ width: 16, borderTopWidth: 2, borderStyle: 'dashed', borderColor: c.mut }} /> : <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: i.color }} />}
          <T v="small">{i.label}</T>
        </View>
      ))}
    </View>
  );
}

/** Today's score distribution; tap a bar for its share. */
export function Histogram({ w, score }: { w: World; score: number }) {
  const c = useColors(), [W, onLayout] = useWidth(), [sel, setSel] = useState<number | null>(null);
  const H = 170, yb = H - 20, bins = 12, bw = W / bins, me = Math.min(11, Math.floor(score / 100));
  const p = Array.from({ length: bins }, (_, i) => (i === bins - 1 ? 1 : cdf((i + 1) * 100, w.mean, w.sd)) - (i ? cdf(i * 100, w.mean, w.sd) : 0)), mx = Math.max(...p);
  const bh = (i: number) => Math.max(3, (p[i] / mx) * (yb - 26)), ax = (w.mean / 1200) * W;
  return (
    <View onLayout={onLayout} style={{ gap: 6 }}>
      {W > 0 && (
        <Svg width={W} height={H}>
          {p.map((_, i) => <Path key={i} d={barPath(i * bw + 1, yb - bh(i), bw - 2, bh(i), 4)} fill={i === me ? c.acc : c.bar} />)}
          <Line x1={ax} x2={ax} y1={2} y2={yb} stroke={c.ink} strokeWidth={2} strokeDasharray="4 4" />
          <SvgText fontFamily={svgFont} x={me * bw + bw / 2} y={yb - bh(me) - 8} textAnchor="middle" fontSize={13} fontWeight="800" fill={c.ink}>You</SvgText>
          <Line x1={0} x2={W} y1={yb} y2={yb} stroke={c.line} />
          {[0, 600, 1200].map((v, i) => <SvgText fontFamily={svgFont} key={v} x={(v / 1200) * W} y={H - 3} textAnchor={(['start', 'middle', 'end'] as const)[i]} fontSize={12} fill={c.mut}>{v}</SvgText>)}
          {p.map((_, i) => <Rect key={`h${i}`} x={i * bw} y={0} width={bw} height={yb} fill="transparent" onPress={() => setSel(i)} />)}
        </Svg>
      )}
      <T v="small" style={{ textAlign: 'center', minHeight: 18 }}>{sel == null ? 'Tap a bar for details' : `${sel * 100}–${sel * 100 + 99}: ${(p[sel] * 100).toFixed(1)}% of players${sel === me ? ' · you' : ''}`}</T>
      <Legend items={[{ label: 'Your score', color: c.acc }, { label: 'Other players', color: c.bar }, { label: 'World average', dashed: true }]} />
    </View>
  );
}

export function WeekLine({ days, mine, world }: { days: DayKey[]; mine: (number | null)[]; world: number[] }) {
  const c = useColors(), [W, onLayout] = useWidth(), [sel, setSel] = useState<number | null>(null);
  const H = 150, yb = H - 20, X = (i: number) => 14 + (i * (W - 28)) / 6, Y = (v: number) => 8 + (1 - v / 1200) * (yb - 8), cw = (W - 28) / 6;
  const segs: string[][] = []; let seg: string[] = [];
  mine.forEach((v, i) => { if (v == null) { if (seg.length) segs.push(seg); seg = []; } else seg.push(`${X(i)},${Y(v)}`); });
  if (seg.length) segs.push(seg);
  return (
    <View onLayout={onLayout} style={{ gap: 6 }}>
      {W > 0 && (
        <Svg width={W} height={H}>
          {[0, 600, 1200].map(v => <G key={v}><Line x1={0} x2={W} y1={Y(v)} y2={Y(v)} stroke={c.line} /><SvgText fontFamily={svgFont} x={W} y={Y(v) - 4} textAnchor="end" fontSize={11} fill={c.mut}>{v}</SvgText></G>)}
          <Polyline points={world.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} fill="none" stroke={c.mut} strokeWidth={2} strokeDasharray="4 4" />
          {segs.filter(g => g.length > 1).map((g, i) => <Polyline key={i} points={g.join(' ')} fill="none" stroke={c.acc} strokeWidth={2} />)}
          {mine.map((v, i) => v == null ? null : <Circle key={i} cx={X(i)} cy={Y(v)} r={5} fill={c.acc} stroke={c.card} strokeWidth={2} />)}
          {days.map((d, i) => <G key={d}><SvgText fontFamily={svgFont} x={X(i)} y={H - 3} textAnchor="middle" fontSize={12} fill={c.mut}>{toDate(d).toLocaleDateString(undefined, { weekday: 'narrow' })}</SvgText><Rect x={X(i) - cw / 2} y={0} width={cw} height={yb} fill="transparent" onPress={() => setSel(i)} /></G>)}
        </Svg>
      )}
      <T v="small" style={{ textAlign: 'center', minHeight: 18 }}>{sel == null ? 'Tap a day for details' : `${toDate(days[sel]).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}: ${mine[sel] == null ? 'not played' : `you ${mine[sel]}`} · world ${world[sel]}`}</T>
      <Legend items={[{ label: 'You', color: c.acc }, { label: 'World average', dashed: true }]} />
    </View>
  );
}

export function Radar({ mine, world }: { mine: Partial<Record<SkillId, number>>; world: Record<SkillId, number> }) {
  const c = useColors(), cx = 180, cy = 150, R = 100, n = POOL.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n, pt = (i: number, v: number) => [cx + Math.cos(ang(i)) * R * v / 100, cy + Math.sin(ang(i)) * R * v / 100];
  const poly = (f: (id: SkillId) => number) => POOL.map((id, i) => pt(i, f(id)).map(v => v.toFixed(1)).join(',')).join(' ');
  return (
    <View style={{ width: '100%', aspectRatio: 516 / 338, maxWidth: 400, alignSelf: 'center' }} accessibilityLabel="Perception profile: your skill scores against the world average">
      <Svg width="100%" height="100%" viewBox="-78 -26 516 338">
        {[25, 50, 75, 100].map(v => <Polygon key={v} points={poly(() => v)} fill="none" stroke={c.line} />)}
        {POOL.map((_, i) => <Line key={i} x1={cx} y1={cy} x2={pt(i, 100)[0]} y2={pt(i, 100)[1]} stroke={c.line} />)}
        <Polygon points={poly(id => world[id])} fill="none" stroke={c.mut} strokeWidth={2} strokeDasharray="4 4" />
        <Polygon points={poly(id => mine[id] ?? 0)} fill={c.acc} fillOpacity={0.18} stroke={c.acc} strokeWidth={2} strokeLinejoin="round" />
        {POOL.map((id, i) => mine[id] == null ? null : <Circle key={id} cx={pt(i, mine[id]!)[0]} cy={pt(i, mine[id]!)[1]} r={4.5} fill={c.acc} stroke={c.card} strokeWidth={2} />)}
        {POOL.map((id, i) => {
          const [x, y] = pt(i, 126), a = Math.abs(x - cx) < 10 ? 'middle' : x > cx ? 'start' : 'end', yy = i === 0 ? y - 20 : y;
          return (
            <G key={`l${id}`}>
              <SvgText fontFamily={svgFont} x={x} y={yy} textAnchor={a} fontSize={18} fontWeight="600" fill={mine[id] == null ? c.mut : c.ink}>{SKILLS[id].short}</SvgText>
              <SvgText fontFamily={svgFont} x={x} y={yy + 19} textAnchor={a} fontSize={15} fill={c.mut}>{mine[id] == null ? 'not played yet' : `${mine[id]} · world ${world[id]}`}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/** Bar = you, tick = world. For speed, pass a dot position instead of a bar. */
export function Meter({ label, bar, dot, tick }: { label: string; bar?: number; dot?: number | null; tick: number }) {
  const c = useColors(), pct = (v: number) => `${Math.max(0, Math.min(100, v))}%` as const;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <T v="small" style={{ width: 70 }}>{label}</T>
      <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: c.line }}>
        {bar != null && <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct(bar), borderRadius: 5, backgroundColor: c.acc }} />}
        {dot != null && <View style={{ position: 'absolute', top: -2, left: pct(dot), marginLeft: -7, width: 14, height: 14, borderRadius: 7, backgroundColor: c.acc, borderWidth: 2, borderColor: c.card }} />}
        <View style={{ position: 'absolute', top: -4, bottom: -4, left: pct(tick), width: 2, backgroundColor: c.ink }} />
      </View>
    </View>
  );
}
