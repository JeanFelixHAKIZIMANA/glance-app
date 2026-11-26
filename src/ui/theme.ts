import { useColorScheme } from 'react-native';

const light = { bg: '#ffffff', ink: '#141414', mut: '#68686a', line: '#e3e2dd', card: '#f3f2ee', acc: '#ff4d2e', ok: '#127a48', bar: '#d6d5cf', onAcc: '#ffffff' };
const dark: typeof light = { bg: '#111214', ink: '#f2f2ef', mut: '#9c9c98', line: '#2b2c30', card: '#1b1c20', acc: '#ff5a3c', ok: '#3fcf8e', bar: '#3a3b40', onAcc: '#ffffff' };
export type Colors = typeof light;
export const useColors = () => (useColorScheme() === 'dark' ? dark : light);
