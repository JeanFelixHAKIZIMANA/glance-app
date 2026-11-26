import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Dot, PAL, Round } from '@/engine';
import { Btn, HoleSvg, ShapeSvg, svgFont, T } from './kit';
import { useColors } from './theme';

const now = () => Date.now(); // module-level so the React compiler treats render as pure

export type Feedback = { picked: string; ok: boolean; ms: number } | null;

/** One puzzle round. Timing starts when the round becomes answerable (after any memorise/flash phase). */
export function Board({ q, label, fb, onAnswer }: { q: Round; label: string; fb: Feedback; onAnswer: (a: string, ms: number) => void }) {
  const c = useColors(), { width } = useWindowDimensions(), W = Math.min(width, 480) - 36 - 28;
  const timed = q.id === 'count' || q.id === 'change';
  const [phase, setPhase] = useState<'look' | 'blank' | 'go'>(timed ? 'look' : 'go');
  const t0 = useRef(0);

  useEffect(() => {
    t0.current = now();
    if (q.id === 'count') { const t = setTimeout(() => { setPhase('go'); t0.current = now(); }, 850); return () => clearTimeout(t); }
    if (q.id === 'change') {
      const a = setTimeout(() => setPhase('blank'), q.show), b = setTimeout(() => { setPhase('go'); t0.current = now(); }, q.show + 350);
      return () => { clearTimeout(a); clearTimeout(b); };
    }
  }, [q]);

  const pick = (a: string) => { if (phase === 'go' && !fb) onAnswer(a, now() - t0.current); };
  const mark = (a: string) => (fb?.picked === a ? (fb.ok ? 'ok' : 'bad') : fb && !fb.ok && String(q.ans) === a ? 'show' : undefined);
  const ring = (m?: string) => (m === 'ok' ? { borderColor: c.ok, borderWidth: 4 } : m === 'bad' ? { borderColor: c.acc, borderWidth: 4 } : m === 'show' ? { borderColor: c.ok, borderWidth: 4, borderStyle: 'dashed' as const } : {});
  const status = fb ? `${fb.ok ? 'Correct' : 'Not quite'} · ${(fb.ms / 1000).toFixed(1)}s`
    : phase === 'look' ? (q.id === 'change' ? 'Remember the colours' : 'Look') : q.id === 'count' ? 'Which side had more?' : q.id === 'change' ? 'Tap the one that changed' : label;

  let board = null, answers = null;
  const half = (W - 12) / 2;
  if (q.id === 'turn') {
    board = <View style={st.pair}>{[q.a, q.b].map((cells, i) => <View key={i} style={[st.fig, { backgroundColor: c.bg }]}><ShapeSvg cells={cells} size={half - 20} /><T v="small">{i ? 'Turned?' : 'Original'}</T></View>)}</View>;
    answers = <View style={st.pair}>{[['same', 'Same, turned'], ['mirror', 'Mirror image']].map(([a, l]) => <View key={a} style={{ flex: 1 }}><Btn label={l} onPress={() => pick(a)} state={mark(a) === 'show' ? undefined : (mark(a) as 'ok' | 'bad')} /></View>)}</View>;
  } else if (q.id === 'gap') {
    board = <View style={[st.fig, { backgroundColor: c.bg, alignSelf: 'center' }]}><HoleSvg cells={q.hole} size={Math.min(200, W - 40)} /><T v="small">Fill this hole</T></View>;
    answers = <View style={st.pair}>{q.opts.map((o, j) => <Pressable key={j} accessibilityRole="button" accessibilityLabel={`Piece ${j + 1}`} onPress={() => pick(String(j))} style={[st.opt, { backgroundColor: c.card, borderColor: 'transparent' }, ring(mark(String(j)))]}><ShapeSvg cells={o} size={(W + 28 - 20) / 3 - 24} /></Pressable>)}</View>;
  } else if (q.id === 'shade' || q.id === 'change') {
    const n = q.n, size = (W - (n - 1) * 8) / n;
    board = (
      <View style={st.grid}>{Array.from({ length: n * n }, (_, j) => {
        const fill = q.id === 'shade' ? (j === q.ans ? q.odd : q.base) : PAL[(phase === 'go' ? q.B : q.A)[j]];
        return (
          <Pressable key={j} accessibilityRole="button" accessibilityLabel={`Tile ${j + 1}`} disabled={phase !== 'go'} onPress={() => pick(String(j))}
            style={[{ width: size, height: size, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: q.id === 'shade' ? fill : c.bg, borderColor: 'transparent', borderWidth: 0 }, ring(mark(String(j)))]}>
            {q.id === 'change' && phase !== 'blank' && <View style={{ width: size * 0.62, height: size * 0.62, borderRadius: size, backgroundColor: fill }} />}
          </Pressable>
        );
      })}</View>
    );
  } else {
    board = <View style={st.pair}>{[q.L, q.R].map((d, i) => <View key={i} style={[st.fig, { backgroundColor: c.bg }]}><Cloud dots={d} size={half - 20} hidden={phase === 'go'} /><T v="small">{i ? 'Right' : 'Left'}</T></View>)}</View>;
    answers = <View style={st.pair}>{[['L', 'Left'], ['R', 'Right']].map(([a, l]) => <View key={a} style={{ flex: 1 }}><Btn label={l} disabled={phase !== 'go'} onPress={() => pick(a)} state={mark(a) === 'show' ? undefined : (mark(a) as 'ok' | 'bad')} /></View>)}</View>;
  }

  return (
    <View style={{ gap: 14 }}>
      <T v="b" accessibilityLiveRegion="polite">{status}</T>
      <View style={[st.board, { backgroundColor: c.card, borderColor: fb ? (fb.ok ? c.ok : c.acc) : 'transparent' }]}>{board}</View>
      {answers}
    </View>
  );
}

function Cloud({ dots, size, hidden }: { dots: Dot[]; size: number; hidden: boolean }) {
  const c = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {!hidden && dots.map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill={c.ink} />)}
      {hidden && <SvgText fontFamily={svgFont} x={50} y={62} textAnchor="middle" fontSize={36} fontWeight="800" fill={c.ink}>?</SvgText>}
    </Svg>
  );
}

const st = StyleSheet.create({
  board: { borderRadius: 24, padding: 14, borderWidth: 3 },
  pair: { flexDirection: 'row', gap: 12 },
  fig: { flex: 1, borderRadius: 16, padding: 10, alignItems: 'center', gap: 4 },
  opt: { flex: 1, borderRadius: 16, padding: 10, alignItems: 'center', borderWidth: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
