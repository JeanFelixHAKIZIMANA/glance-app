import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { flushPending } from '@/lib/api';
import { loadStore, useStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const scheme = useColorScheme(), { ready } = useStore();
  useEffect(() => { loadStore().then(() => { SplashScreen.hideAsync().catch(() => {}); flushPending(); }); }, []);
  if (!ready) return null;
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="play" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="results" options={{ animation: 'fade' }} />
      </Stack>
    </ThemeProvider>
  );
}
