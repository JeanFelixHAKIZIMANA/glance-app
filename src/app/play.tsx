import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Answer, buildSet, DayKey, isCorrect, Mode, scoreOf, setNo, SKILLS, SkillId, toDate } from '@/engine';
import { submit } from '@/lib/api';
import { showResults } from '@/lib/nav';
import { getState, setState } from '@/lib/store';
import { Board, Feedback } from '@/ui/Board';
import { Btn, s, Screen, T } from '@/ui/kit';
import { useColors } from '@/ui/theme';

export default function Play() {
  const c = useColors(), p = useLocalSearchParams<{ mode: Mode; day: DayKey; skill?: SkillId }>();
  const { mode, day } = p, set = useMemo(() => buildSet(day, mode, p.skill), [day, mode, p.skill]);
  const per = set.rounds.length / set.tasks.length;
  const [i, setI] = useState(0), [res, setRes] = useState<Answer[]>([]), [intro, setIntro] = useState(true), [fb, setFb] = useState<Feedback>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const q = set.rounds[i], meta = SKILLS[q.id];

  function finish(all: Answer[]) {
    const rec = { score: scoreOf(all), res: all, tasks: set.tasks, late: mode === 'archive' }, st = getState();
    if ((mode === 'today' || mode === 'archive') && !st.history[day]) setState({ history: { ...st.history, [day]: rec } });
    if (mode === 'today') submit({ day, tasks: set.tasks, res: all }); // only same-day plays feed the global curve
    if (mode === 'drill') setState({ drills: [...st.drills, all].slice(-300) });
    setState({ last: { rec, day, mode } });
    showResults(mode, day, true);
  }
  function answer(a: string, ms: number) {
    const ok = isCorrect(q, a), all = [...res, [q.id, ok ? 1 : 0, ms] as Answer];
    setFb({ picked: a, ok, ms }); setRes(all);
    timer.current = setTimeout(() => {
      setFb(null);
      if (i + 1 === set.rounds.length) return finish(all);
      if (set.rounds[i + 1].id !== q.id) setIntro(true);
      setI(i + 1);
    }, ok ? 450 : 950);
  }

  const label = mode === 'drill' ? 'Skill drill' : mode === 'practice' ? 'Practice' : mode === 'archive' ? toDate(day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : `Set #${setNo(day)}`;
  return (
    <Screen>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <T v="mut">{label}</T>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}><T style={{ color: c.acc, fontWeight: '600' }}>Quit</T></Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`Round ${i + 1} of ${set.rounds.length}`}>
        {set.rounds.map((_, j) => <View key={j} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: j < res.length ? (res[j][1] ? c.ink : c.acc) : j === i ? c.mut : c.line }} />)}
      </View>
      {intro ? (
        <View style={{ gap: 10 }}>
          <T v="mut">{mode === 'drill' ? `${per} rounds, getting harder` : `Task ${set.tasks.indexOf(q.id) + 1} of ${set.tasks.length}`} · {meta.skill}</T>
          <T v="h2">{meta.name}</T>
          <T v="lead">{meta.desc}</T>
          <Btn kind="pri" label="Go" onPress={() => setIntro(false)} />
        </View>
      ) : (
        <Board key={i} q={q} fb={fb} label={`${meta.name} · round ${(i % per) + 1} of ${per}`} onAnswer={answer} />
      )}
    </Screen>
  );
}
