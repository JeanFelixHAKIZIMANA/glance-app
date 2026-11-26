import { router } from 'expo-router';
import type { DayKey, Mode, SkillId } from '@/engine';

export const play = (mode: Mode, day: DayKey, skill?: SkillId) => router.push({ pathname: '/play', params: { mode, day, ...(skill ? { skill } : {}) } });
export const showResults = (mode: Mode, day: DayKey, replace = false) => router[replace ? 'replace' : 'push']({ pathname: '/results', params: { mode, day } });
