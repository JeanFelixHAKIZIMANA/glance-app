import { View } from 'react-native';
import { addDays, bestStreak, MAX, POOL, SKILLS, streak, toDate, today } from '@/engine';
import { useStore } from '@/lib/store';
import { Card, Ring, s, Screen, T } from '@/ui/kit';
import { useColors } from '@/ui/theme';

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

export default function Stats() {
  const c = useColors(), { history } = useStore(), keys = Object.keys(history), k = today();
  if (!keys.length) return <Screen><T v="h1">Stats</T><View style={{ alignItems: 'center', gap: 12, marginTop: 30 }}><Ring n={0} size={132} label /><T v="lead">Finish today’s set to start your record.</T></View></Screen>;

  const avg = Math.round(keys.reduce((a, d) => a + history[d].score, 0) / keys.length);
  const start = addDays(k, -((toDate(k).getDay() + 6) % 7) - 28);
  const cells = Array.from({ length: 35 }, (_, i) => addDays(start, i));
  const acc = POOL.map(id => { let t = 0, o = 0; keys.forEach(d => history[d].res.forEach(r => { if (r[0] === id) { t++; o += r[1]; } })); return { id, t, o }; }).filter(a => a.t);

  return (
    <Screen>
      <T v="h1">Stats</T>
      <View style={[s.row, { justifyContent: 'space-around' }]}>
        <View style={{ alignItems: 'center' }}><T v="h1" style={{ fontSize: 24 }}>{plural(bestStreak(history), 'day')}</T><T v="small">best streak</T></View>
        <Ring n={streak(history)} size={132} label />
        <View style={{ alignItems: 'center' }}><T v="h1" style={{ fontSize: 24 }}>{plural(keys.length, 'set')}</T><T v="small">played</T></View>
      </View>

      <Card>
        <View style={[s.row, { justifyContent: 'space-between' }]}><T v="b">Last five weeks</T><T v="mut">avg {avg}</T></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <View key={i} style={{ width: `${100 / 7}%`, alignItems: 'center' }}><T v="small">{d}</T></View>)}
          {cells.map(d => {
            const rec = history[d], fut = d > k;
            return (
              <View key={d} style={{ width: `${100 / 7}%`, padding: 3 }} accessibilityLabel={`${d}${rec ? `: ${rec.score}` : ''}`}>
                <View style={{ aspectRatio: 1, borderRadius: 6, backgroundColor: fut ? 'transparent' : rec ? (rec.late ? c.mut : c.ink) : c.line, opacity: rec && !rec.late ? 0.35 + 0.65 * rec.score / MAX : 1, borderWidth: d === k ? 2 : fut ? 1 : 0, borderColor: d === k ? c.acc : c.line, borderStyle: fut ? 'dashed' : 'solid' }} />
              </View>
            );
          })}
        </View>
        <T v="small">Darker means a higher score. Grey days were solved later from the archive.</T>
      </Card>

      <Card>
        <T v="b">Accuracy by skill</T>
        {acc.map(a => {
          const p = Math.round((a.o / a.t) * 100);
          return (
            <View key={a.id} style={s.row}>
              <T style={{ width: 150 }}>{SKILLS[a.id].skill}</T>
              <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: c.line }}><View style={{ width: `${p}%`, height: 10, borderRadius: 5, backgroundColor: c.ink }} /></View>
              <T style={{ width: 44, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{p}%</T>
            </View>
          );
        })}
        <T v="small">Built only from rounds you actually played.</T>
      </Card>
    </Screen>
  );
}
