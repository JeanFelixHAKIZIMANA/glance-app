import { Tabs } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useColors } from '@/ui/theme';

const icons = {
  index: (c: string) => <><Circle cx={12} cy={12} r={9} fill="none" stroke={c} strokeWidth={2} /><Circle cx={12} cy={12} r={3} fill={c} /></>,
  archive: (c: string) => <><Rect x={4} y={9} width={16} height={10} rx={3} fill="none" stroke={c} strokeWidth={2} /><Path d="M6 6h12" stroke={c} strokeWidth={2} strokeLinecap="round" /></>,
  stats: (c: string) => <Path d="M4 18l5-6 4 3 7-9" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />,
  settings: (c: string) => <><Circle cx={12} cy={12} r={3.2} fill="none" stroke={c} strokeWidth={2} /><Path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke={c} strokeWidth={2} strokeLinecap="round" /></>,
};
const titles = { index: 'Today', archive: 'Archive', stats: 'Stats', settings: 'Settings' };

export default function TabLayout() {
  const c = useColors();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.acc, tabBarInactiveTintColor: c.mut, tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.line } }}>
      {(Object.keys(icons) as (keyof typeof icons)[]).map(name => (
        <Tabs.Screen key={name} name={name} options={{ title: titles[name], tabBarIcon: ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24">{icons[name](String(color))}</Svg> }} />
      ))}
    </Tabs>
  );
}
