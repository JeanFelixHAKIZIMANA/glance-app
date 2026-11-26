import * as Clipboard from 'expo-clipboard';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, Share, View } from 'react-native';
import { addDays, Answer, DayKey, MAX, Mode, percentile, pickTasks, POOL, profile, sampleWorld, setNo, skillIndex, SKILLS, SkillId, streak, tierOf, today, World } from '@/engine';
import { useWorld } from '@/lib/api';
import { play } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { Histogram, Legend, Meter, Radar, WeekLine } from '@/ui/charts';
import { Btn, Card, Glyph, Ring, s, Screen, T } from '@/ui/kit';
import { useColors } from '@/ui/theme';

const fmt = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const avgMs = (rs: Answer[]) => { const ok = rs.filter(r => r[1]); return ok.length ? ok.reduce((a, r) => a + r[2], 0) / ok.length : null; };
const andList = (a: string[]) => a.join(', ').replace(/, ([^,]*)$/, ' and $1');

function useCountUp(to: number) {
  const [n, setN] = useState(to);
  useEffect(() => {
    let raf = 0, live = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (reduce || !live) return;
      const t0 = Date.now(), f = () => { const p = Math.min(1, (Date.now() - t0) / 800); setN(Math.round(to * (1 - (1 - p) ** 3))); if (p < 1) raf = requestAnimationFrame(f); };
      f();
    });
    return () => { live = false; cancelAnimationFrame(raf); };
  }, [to]);
  return n;
}
function useCountdown() {
  const left = () => { const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1); return Math.max(0, Math.floor((+m - +n) / 1000)); };
  const [sec, setSec] = useState(left);
  useEffect(() => { const t = setInterval(() => setSec(left()), 1000); return () => clearInterval(t); }, []);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(Math.floor(sec / 3600))}:${p(Math.floor(sec / 60) % 60)}:${p(sec % 60)}`;
}

function Compare({ id, rs, w }: { id: SkillId; rs: Answer[]; w: World }) {
  const ws = w.skill[id], n = rs.filter(r => r[1]).length, accY = Math.round((n / rs.length) * 100), accW = Math.round(ws.acc * 100), ms = avgMs(rs), d = ms == null ? null : ws.ms - ms;
  return (
    <View style={{ gap: 8, paddingTop: 6 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}><T v="b">{SKILLS[id].skill}</T><T v="mut">{rs.map(r => (r[1] ? '■' : '□')).join(' ')}</T></View>
      <Meter label="Accuracy" bar={accY} tick={accW} />
      <Meter label="Speed" dot={ms == null ? null : ms / 60} tick={ws.ms / 60} />
      <T v="small" style={{ fontWeight: '600' }}>{accY >= accW ? `${accY - accW} points more accurate` : `${accW - accY} points less accurate`}{d == null ? '' : ` · ${fmt(Math.abs(d))} ${d >= 0 ? 'faster' : 'slower'} than average`}</T>
    </View>
  );
}

function Profile({ w, extra }: { w: World; extra: Answer[] }) {
  const c = useColors(), { history, drills } = useStore();
  const mine = profile([...Object.values(history).flatMap(h => h.res), ...drills.flat(), ...extra]);
  const world = Object.fromEntries(POOL.map(id => [id, skillIndex(w.skill[id].acc, w.skill[id].ms)])) as Record<SkillId, number>;
  const missing = POOL.filter(id => mine[id] == null), weak = POOL.slice().sort((a, b) => mine[a]! - mine[b]!)[0];
  return (
    <Card>
      <T v="b">Your perception profile</T>
      <Radar mine={mine} world={world} />
      <Legend items={[{ label: 'You, all time', color: c.acc }, { label: 'World average', dashed: true }]} />
      <T v="small" style={{ textAlign: 'center' }}>{missing.length ? `Play ${andList(missing.map(id => SKILLS[id].short))} to complete your profile.` : `Your weakest corner is ${SKILLS[weak].short}. Push it outward.`}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {(missing.length ? missing : [weak]).map(id => <Btn key={id} small label={`Drill ${SKILLS[id].short}`} icon={<Glyph id={id} size={20} />} onPress={() => { router.dismissAll(); play('drill', today(), id); }} />)}
      </View>
    </Card>
  );
}

function DrillResults({ res }: { res: Answer[] }) {
  const c = useColors(), id = res[0][0], w = useWorld(today()), ws = w.skill[id], ok = res.filter(r => r[1]).length;
  const accY = Math.round((ok / res.length) * 100), accW = Math.round(ws.acc * 100), ms = avgMs(res), d = ms == null ? null : ws.ms - ms;
  return (
    <Screen>
      <T v="mut">Skill drill · {SKILLS[id].skill}</T>
      <T v="big">{ok}<T v="h1" style={{ color: c.mut }}> / {res.length}</T></T>
      <T v="h1" style={{ fontSize: 22, lineHeight: 26 }}>{accY >= accW ? 'More accurate than the average player.' : `Room to grow: the average player gets ${accW}%.`}</T>
      <T v="mut">{accY}% correct{ms == null ? '' : ` · ${fmt(ms)} average · ${fmt(Math.abs(d!))} ${d! >= 0 ? 'faster' : 'slower'} than average`}</T>
      <Card>
        <T v="b">Round by round</T>
        <View style={{ flexDirection: 'row', gap: 8, height: 130, alignItems: 'flex-end' }}>
          {res.map((r, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <View style={{ width: '100%', height: `${Math.max(8, Math.min(85, r[2] / 60))}%`, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: r[1] ? c.ink : c.acc }} />
              <T v="small">{r[1] ? fmt(r[2]) : 'miss'}</T>
            </View>
          ))}
        </View>
        <T v="small">Bar height is time taken; rounds get harder left to right. Red rounds were misses.</T>
      </Card>
      <Profile w={w} extra={[]} />
      <Btn kind="pri" label={`Drill ${SKILLS[id].short} again`} onPress={() => router.replace({ pathname: '/play', params: { mode: 'drill', day: today(), skill: id } })} />
      <Btn label="Done" onPress={() => router.dismissAll()} />
      <T v="small">Drills build your profile but don’t change your daily score or streak.{w.sample ? ' World averages are sample data until enough players join.' : ''}</T>
    </Screen>
  );
}

export default function Results() {
  const p = useLocalSearchParams<{ mode: Mode; day: DayKey }>(), st = useStore();
  const rec = p.mode === 'today' || p.mode === 'archive' ? st.history[p.day] ?? st.last?.rec : st.last?.rec;
  if (!rec) return <Redirect href="/" />;
  if (p.mode === 'drill') return <DrillResults res={rec.res} />;
  return <SetResults mode={p.mode} day={p.day} rec={rec} />;
}

function SetResults({ mode, day, rec }: { mode: Mode; day: DayKey; rec: { score: number; res: Answer[]; tasks: SkillId[] } }) {
  const c = useColors(), { history } = useStore(), w = useWorld(day), shown = useCountUp(rec.score), clock = useCountdown();
  const pct = percentile(rec.score, w), tier = tierOf(pct), st = streak(history), right = rec.res.filter(r => r[1]).length;
  const others = Object.keys(history).filter(d => d !== day).map(d => history[d].score), pb = mode !== 'practice' && others.length > 0 && rec.score > Math.max(...others);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today(), i - 6));
  // shortcut: other days use sample means; fetch day_stats for the week range once players exist.
  const worldWeek = days.map(d => Math.round(d === day ? w.mean : sampleWorld(d).mean));
  const sq = (id: SkillId) => rec.res.filter(r => r[0] === id).map(r => (r[1] ? '■' : '□')).join('');
  const shareText = `Glance #${setNo(day)}${mode === 'practice' ? ' (practice)' : ''} · ${rec.score}/${MAX} · Top ${100 - pct}% · ${tier}\n` + rec.tasks.map(id => `${sq(id)} ${SKILLS[id].short}`).join('\n') + (process.env.EXPO_PUBLIC_SHARE_URL ? `\n${process.env.EXPO_PUBLIC_SHARE_URL}` : '');
  const [copied, setCopied] = useState(false);
  const share = async () => {
    if (Platform.OS === 'web') { await Clipboard.setStringAsync(shareText); setCopied(true); return; }
    try { await Share.share({ message: shareText }); } catch { await Clipboard.setStringAsync(shareText); setCopied(true); }
  };
  const tomorrow = pickTasks(addDays(today(), 1));
  return (
    <Screen>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <T v="mut">{mode === 'practice' ? 'Practice set' : `Set #${setNo(day)}${mode === 'archive' ? ' · from the archive' : ''}`}</T>
        {pb && <T style={{ color: c.acc, fontWeight: '800' }}>New personal best</T>}
      </View>
      <T v="big" accessibilityLabel={`Score ${rec.score}`}>{shown}</T>
      <View style={[s.row, { alignSelf: 'flex-start', backgroundColor: c.ink, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, gap: 8 }]}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.acc }} /><T style={{ color: c.bg, fontWeight: '800' }}>{tier}</T>
      </View>
      <T v="h1" style={{ fontSize: 22, lineHeight: 26 }}>{mode === 'practice' ? `This would beat ${pct}% of today's players.` : `Better than ${pct}% of ${w.players.toLocaleString()} players today.`}</T>
      <T v="mut">{right} of {rec.res.length} correct · world average {Math.round(w.mean)}</T>

      <Card><T v="b">Today’s scores worldwide</T><Histogram w={w} score={rec.score} /></Card>

      <Card>
        <T v="b">How you compare</T>
        <T v="small">Your bar or dot in red; the black tick is the world average.</T>
        {rec.tasks.map(id => <Compare key={id} id={id} rs={rec.res.filter(r => r[0] === id)} w={w} />)}
      </Card>

      {mode !== 'practice' && (
        <Card>
          <View style={s.row}><Ring n={st} /><View style={{ flex: 1 }}><T v="b">{st}-day streak</T><T v="mut">{mode === 'today' ? `Play tomorrow to make it ${st + 1}.` : "Archive sets don't add to your streak."}</T></View></View>
          <View style={[s.row, { gap: 8 }]}>
            {[3, 7, 30].map(m => (
              <View key={m} style={{ flex: 1, borderRadius: 14, padding: 10, alignItems: 'center', gap: 2, backgroundColor: st >= m ? c.ink : c.bg }}>
                <T v="h1" style={{ fontSize: 20, lineHeight: 24, color: st >= m ? c.acc : c.ink }}>{m}</T>
                <T v="small" style={{ color: st >= m ? c.bg : c.mut }}>days{st >= m ? ' · earned' : ''}</T>
                <View style={{ alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: c.line, marginTop: 6 }}><View style={{ width: `${Math.min(100, (st / m) * 100)}%`, height: 6, borderRadius: 3, backgroundColor: c.acc }} /></View>
              </View>
            ))}
          </View>
          <T v="mut">Next set in</T>
          <T v="h1" style={{ fontVariant: ['tabular-nums'] }}>{clock}</T>
          <View style={s.row}><View style={[s.row, { gap: 6 }]}>{tomorrow.map(id => <Glyph key={id} id={id} size={24} dim />)}</View><T v="mut" style={{ flex: 1 }}>{tomorrow.map(id => SKILLS[id].short).join(' · ')}</T></View>
        </Card>
      )}

      <Profile w={w} extra={mode === 'practice' ? rec.res : []} />

      <Card>
        <T v="b">Your last 7 days</T>
        <WeekLine days={days} mine={days.map(d => (history[d] && !history[d].late ? history[d].score : null))} world={worldWeek} />
      </Card>

      <View style={{ backgroundColor: c.ink, borderRadius: 20, padding: 18, gap: 4 }}>
        <T style={{ color: c.bg, fontWeight: '800' }}>Glance #{setNo(day)} · {rec.score}</T>
        <T style={{ color: c.bg, opacity: 0.75, marginBottom: 6 }}>Top {100 - pct}% · {tier}</T>
        {rec.tasks.map(id => <T key={id} style={{ color: c.bg }}>{sq(id).split('').join(' ')}  {SKILLS[id].short}</T>)}
      </View>
      <Btn kind="pri" label={copied ? 'Copied' : Platform.OS === 'web' ? 'Copy result' : 'Share result'} onPress={share} />
      <Btn label="Done" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      {w.sample && <T v="small">Worldwide numbers are sample data until enough players join.</T>}
    </Screen>
  );
}
