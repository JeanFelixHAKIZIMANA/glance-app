import { View } from 'react-native';
import { addDays, pickTasks, toDate, today } from '@/engine';
import { play, showResults } from '@/lib/nav';
import { getState, setState, useStore } from '@/lib/store';
import { Btn, Card, Glyph, s, Screen, T } from '@/ui/kit';

const FREE_DAYS = 2;

export default function Archive() {
  const { history, prefs } = useStore(), k = today();
  // shortcut: unlock is local and simulated; wire to RevenueCat entitlement "lifetime" before release.
  const unlock = () => setState({ prefs: { ...getState().prefs, unlocked: true } });
  const days = Array.from({ length: 14 }, (_, i) => addDays(k, -(i + 1)));
  return (
    <Screen>
      <T v="h1">Archive</T>
      {!prefs.unlocked && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View><T v="b">Lifetime</T><T v="mut">Full archive, no ads</T></View>
          <Btn small kind="pri" label="Unlock" onPress={unlock} />
        </Card>
      )}
      {days.map((d, i) => {
        const rec = history[d], free = i < FREE_DAYS || prefs.unlocked;
        return (
          <Card key={d} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: free || rec ? 1 : 0.75 }}>
            <View style={{ gap: 8 }}>
              <T v="b">{toDate(d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</T>
              <View style={[s.row, { gap: 6 }]}>{pickTasks(d).map(id => <Glyph key={id} id={id} size={24} dim />)}</View>
            </View>
            {rec ? <Btn small label={String(rec.score)} onPress={() => showResults('archive', d)} />
              : free ? <Btn small kind="pri" label="Solve" onPress={() => play('archive', d)} />
              : <Btn small label="Locked" onPress={unlock} />}
          </Card>
        );
      })}
      <T v="small">The two most recent days are free. Purchases are simulated in this build. Archive solves don’t count toward your streak.</T>
    </Screen>
  );
}
