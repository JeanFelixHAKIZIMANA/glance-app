import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { getState, Prefs, setState, useStore } from '@/lib/store';
import { Btn, Card, s, Screen, T } from '@/ui/kit';
import { useColors } from '@/ui/theme';

function Row({ title, sub, right }: { title: string; sub?: string; right: React.ReactNode }) {
  return <View style={[s.row, { justifyContent: 'space-between', minHeight: 48 }]}><View style={{ flex: 1 }}><T>{title}</T>{sub && <T v="small">{sub}</T>}</View>{right}</View>;
}

export default function Settings() {
  const c = useColors(), { prefs } = useStore(), [open, setOpen] = useState(false);
  const set = (p: Partial<Prefs>) => setState({ prefs: { ...getState().prefs, ...p } });
  const sw = (k: 'am' | 'pm') => <Switch value={prefs[k]} onValueChange={v => set({ [k]: v })} trackColor={{ true: c.acc, false: c.line }} />;
  return (
    <Screen>
      <T v="h1">Settings</T>
      <T v="small">Notifications</T>
      <Card>
        <Row title="New set reminder" sub="Every morning at 8:00" right={sw('am')} />
        <Row title="Streak-at-risk alert" sub="9 PM, only if today is unplayed" right={sw('pm')} />
      </Card>
      <T v="small">General</T>
      <Card><Row title="Leaderboard" sub="Live once the score server is connected" right={<T v="mut">{process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Connected' : 'Offline'}</T>} /></Card>
      <T v="small">Purchases</T>
      <Card>
        <Row title="Glance Lifetime" sub="Full archive, no ads" right={prefs.unlocked ? <T style={{ color: c.ok, fontWeight: '600' }}>Owned</T> : <Btn small kind="pri" label="Unlock" onPress={() => set({ unlocked: true })} />} />
        <Row title="Reset purchase" sub="Simulated, for testing" right={<Btn small label="Reset" onPress={() => set({ unlocked: false })} />} />
      </Card>
      <T v="small">About</T>
      <Card>
        <Pressable accessibilityRole="button" onPress={() => setOpen(!open)}><Row title="Our scientific stance" right={<T v="mut">{open ? '–' : '+'}</T>} /></Pressable>
        {open && <T v="mut">Glance is a daily puzzle, not brain training. Practising these tasks makes you better at these tasks. Large reviews have found no compelling evidence that gains like these carry over to everyday memory, attention or intelligence (Simons et al., 2016, Psychological Science in the Public Interest). Your score compares you with yourself and other players.</T>}
        <Row title="Version" right={<T v="mut">{Constants.expoConfig?.version}</T>} />
      </Card>
      <T v="small">Switches save your choice; reminder scheduling ships with the notifications milestone.</T>
    </Screen>
  );
}
