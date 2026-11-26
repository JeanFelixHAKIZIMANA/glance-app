import { Pressable, View } from 'react-native';
import { addDays, buildSet, pickTasks, POOL, profile, setNo, SKILLS, streak, toDate, today } from '@/engine';
import { play, showResults } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { Btn, Card, Glyph, Ring, s, Screen, T } from '@/ui/kit';
import { useColors } from '@/ui/theme';

export default function Today() {
  const c = useColors(), { history, drills } = useStore(), k = today(), rec = history[k];
  const tasks = rec ? rec.tasks : buildSet(k, 'today').tasks, tomorrow = pickTasks(addDays(k, 1));
  const mine = profile([...Object.values(history).flatMap(h => h.res), ...drills.flat()]);
  return (
    <Screen>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <View>
          <T v="mut">{toDate(k).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</T>
          <T v="mut">Set #{setNo(k)}</T>
        </View>
        <Ring n={streak(history)} />
      </View>

      <Card>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <T v="h1">Today’s set</T>
          {rec && <T style={{ color: c.ok, fontWeight: '600' }}>✓ Done</T>}
        </View>
        {rec ? <T v="big">{rec.score}</T> : <T v="lead">Three quick looks, about two minutes. Everyone gets the same set.</T>}
        <View style={[s.row, { gap: 8 }]}>
          {tasks.map(id => (
            <View key={id} style={{ flex: 1, backgroundColor: c.bg, borderRadius: 16, padding: 12, alignItems: 'center', gap: 8 }}>
              <Glyph id={id} />
              <T v="small" style={{ color: c.ink, textAlign: 'center' }}>{SKILLS[id].skill}</T>
              {rec && <T v="small" style={{ color: c.ok, fontWeight: '600' }}>{rec.res.filter(r => r[0] === id && r[1]).length}/4</T>}
            </View>
          ))}
        </View>
        {rec ? <Btn label="See results again" onPress={() => showResults('today', k)} />
          : <Btn kind="pri" label="Start today's set" onPress={() => play('today', k)} />}
      </Card>

      <Card>
        <T style={{ color: c.acc, fontWeight: '600' }}>Tomorrow</T>
        <View style={s.row}>
          <View style={[s.row, { gap: 6 }]}>{tomorrow.map(id => <Glyph key={id} id={id} size={26} dim />)}</View>
          <T v="b" style={{ flex: 1 }}>{tomorrow.map(id => SKILLS[id].skill).join(' · ')}</T>
        </View>
      </Card>

      <Card>
        <T v="b">Train one skill</T>
        <T v="mut">Six rounds of a single puzzle type. Builds your profile, not your streak.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {POOL.map(id => (
            <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Drill ${SKILLS[id].short}`} onPress={() => play('drill', k, id)}
              style={({ pressed }) => ({ flexGrow: 1, flexBasis: 56, backgroundColor: c.bg, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}>
              <Glyph id={id} size={28} />
              <T v="small" style={{ color: c.ink, textAlign: 'center', fontSize: 12 }}>{SKILLS[id].short}</T>
              {mine[id] == null ? <T style={{ fontSize: 11, fontWeight: '800', color: c.onAcc, backgroundColor: c.acc, borderRadius: 999, paddingHorizontal: 7, overflow: 'hidden' }}>New</T> : <T v="small">{mine[id]}</T>}
            </Pressable>
          ))}
        </View>
      </Card>

      <Btn label="Play a practice set" onPress={() => play('practice', k)} />
    </Screen>
  );
}
