import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import type { Answer, DayKey, History, Mode, SetRecord, SkillId } from '@/engine';

export type Prefs = { am: boolean; pm: boolean; unlocked: boolean };
export type Pending = { day: DayKey; tasks: SkillId[]; res: Answer[] };
type Saved = { history: History; drills: Answer[][]; prefs: Prefs; deviceId: string; pending: Pending[] };
type State = Saved & { ready: boolean; last?: { rec: SetRecord; day: DayKey; mode: Mode } };

const KEY = 'glance-v1';
// shortcut: anonymous random device id, not an account; move to Supabase anonymous auth / Sign in with Apple before prizes or cross-device sync.
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); });

let state: State = { history: {}, drills: [], prefs: { am: true, pm: true, unlocked: false }, deviceId: '', pending: [], ready: false };
const subs = new Set<() => void>();

export const getState = () => state;
export function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  subs.forEach(f => f());
  const { history, drills, prefs, deviceId, pending } = state;
  AsyncStorage.setItem(KEY, JSON.stringify({ history, drills, prefs, deviceId, pending })).catch(() => {});
}
export async function loadStore() {
  let saved: Partial<Saved> = {};
  try { saved = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}'); } catch {}
  setState({ ...saved, deviceId: saved.deviceId || uuid(), ready: true });
}
export const useStore = () => useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, getState, getState);
