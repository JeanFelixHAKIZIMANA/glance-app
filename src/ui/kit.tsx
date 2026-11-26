import { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextProps, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Cell, norm, SkillId } from '@/engine';
import { useColors } from './theme';

export const svgFont = Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined;

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const c = useColors();
  const inner = <View style={s.col}>{children}</View>;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      {scroll ? <ScrollView contentContainerStyle={s.scroll}>{inner}</ScrollView> : <View style={s.scroll}>{inner}</View>}
    </SafeAreaView>
  );
}

type V = 'h1' | 'h2' | 'big' | 'body' | 'b' | 'mut' | 'small' | 'lead';
export function T({ v = 'body', style, ...p }: TextProps & { v?: V }) {
  const c = useColors();
  const base = { h1: s.h1, h2: s.h2, big: s.big, body: s.body, b: s.b, mut: s.body, small: s.small, lead: s.lead }[v];
  return <Text {...p} style={[base, { color: v === 'mut' || v === 'small' ? c.mut : c.ink }, style]} />;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return <View style={[s.card, { backgroundColor: c.card }, style]}>{children}</View>;
}

export function Btn({ label, onPress, kind = 'line', disabled, state, small, icon }: { label: string; onPress: () => void; kind?: 'pri' | 'line'; disabled?: boolean; state?: 'ok' | 'bad'; small?: boolean; icon?: ReactNode }) {
  const c = useColors();
  const bg = state === 'ok' ? c.ok : state === 'bad' ? c.acc : kind === 'pri' ? c.ink : 'transparent';
  const fg = state ? c.onAcc : kind === 'pri' ? c.bg : c.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [s.btn, small && s.btnSm, { backgroundColor: bg, borderColor: state ? bg : c.ink, opacity: disabled ? 0.3 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      {icon}<Text style={[s.btnTxt, small && { fontSize: 15 }, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Ring({ n, size = 72, label }: { n: number; size?: number; label?: boolean }) {
  const c = useColors(), C = 2 * Math.PI * 42, f = Math.min(n, 7) / 7;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={`${n} day streak`}>
      <Circle cx={50} cy={50} r={42} fill="none" stroke={c.line} strokeWidth={8} />
      <Circle cx={50} cy={50} r={42} fill="none" stroke={c.acc} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${f * C} ${C}`} transform="rotate(-90 50 50)" />
      <SvgText fontFamily={svgFont} x={50} y={label ? 57 : 61} textAnchor="middle" fontSize={label ? 28 : 32} fontWeight="800" fill={c.ink}>{n}</SvgText>
      {label && <SvgText fontFamily={svgFont} x={50} y={74} textAnchor="middle" fontSize={9.5} fill={c.mut}>day streak</SvgText>}
    </Svg>
  );
}

export function ShapeSvg({ cells, size = 100, hi }: { cells: Cell[]; size?: number; hi?: boolean }) {
  const c = useColors(), n = norm(cells), w = Math.max(...n.map(p => p[0])) + 1, h = Math.max(...n.map(p => p[1])) + 1, S = Math.max(w, h, 4), ox = (S - w) / 2, oy = (S - h) / 2;
  return (
    <Svg width={size} height={size} viewBox={`-0.3 -0.3 ${S + 0.6} ${S + 0.6}`}>
      {n.map(([x, y], i) => <Rect key={i} x={x + ox + 0.06} y={y + oy + 0.06} width={0.88} height={0.88} rx={0.14} fill={hi && i === 0 ? c.acc : c.ink} />)}
    </Svg>
  );
}

export function HoleSvg({ cells, size = 200 }: { cells: Cell[]; size?: number }) {
  const c = useColors(), n = norm(cells), w = Math.max(...n.map(p => p[0])) + 1, h = Math.max(...n.map(p => p[1])) + 1, W = w + 2, H = h + 2, S = Math.max(W, H), ox = (S - W) / 2, oy = (S - H) / 2, hole = new Set(n.map(p => p.join(',')));
  const rects = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!hole.has(`${x - 1},${y - 1}`)) rects.push(<Rect key={`${x}-${y}`} x={x + ox} y={y + oy} width={1.02} height={1.02} fill={c.ink} />);
  return <Svg width={size} height={size} viewBox={`-0.2 -0.2 ${S + 0.4} ${S + 0.4}`}>{rects}</Svg>;
}

export function Glyph({ id, size = 34, dim }: { id: SkillId; size?: number; dim?: boolean }) {
  const c = useColors(), ink = c.ink, acc = c.acc;
  const g = {
    turn: <ShapeSvg cells={[[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]]} size={size} hi />,
    gap: <Svg width={size} height={size} viewBox="0 0 30 30"><Path d="M2 2h26v26H2zM10 10v10h6v-4h4v-6z" fill={ink} fillRule="evenodd" /><Rect x={20} y={20} width={4} height={4} fill={acc} /></Svg>,
    shade: <Svg width={size} height={size} viewBox="0 0 30 30">{[0, 1, 2].flatMap(i => [0, 1, 2].map(j => <Rect key={`${i}${j}`} x={j * 10 + 1} y={i * 10 + 1} width={8} height={8} rx={2} fill={i === 1 && j === 2 ? acc : ink} />))}</Svg>,
    change: <Svg width={size} height={size} viewBox="0 0 30 30">{[0, 1, 2].flatMap(i => [0, 1, 2].map(j => <Circle key={`${i}${j}`} cx={j * 10 + 5} cy={i * 10 + 5} r={3.4} fill={i === 0 && j === 1 ? acc : ink} />))}</Svg>,
    count: <Svg width={size} height={size} viewBox="0 0 30 30">{[[5, 7], [11, 4], [8, 14], [4, 22], [12, 24], [20, 6], [25, 12], [19, 18], [26, 24], [21, 26], [14, 17]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.6} fill={i === 6 ? acc : ink} />)}</Svg>,
  }[id];
  return <View style={{ opacity: dim ? 0.6 : 1 }} accessibilityElementsHidden>{g}</View>;
}

export const s = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 32 },
  col: { width: '100%', maxWidth: 480, paddingHorizontal: 18, paddingTop: 12, gap: 14 },
  h1: { fontSize: 32, lineHeight: 34, fontWeight: '800' },
  h2: { fontSize: 44, lineHeight: 46, fontWeight: '800' },
  big: { fontSize: 88, lineHeight: 92, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  body: { fontSize: 16, lineHeight: 23 },
  b: { fontSize: 16, lineHeight: 23, fontWeight: '700' },
  lead: { fontSize: 17, lineHeight: 24 },
  small: { fontSize: 13, lineHeight: 18 },
  card: { borderRadius: 24, padding: 20, gap: 10 },
  btn: { minHeight: 54, borderRadius: 16, borderWidth: 2, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnSm: { minHeight: 44, borderRadius: 12 },
  btnTxt: { fontSize: 17, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
