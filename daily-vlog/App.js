import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './src/theme/colors';

// STAGE 0 placeholder root.
// This just proves the Expo project boots and the toolchain works.
// Stage 1 replaces this with the real navigation + auth flow.
export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.title}>Daily Vlog</Text>
        <Text style={styles.subtitle}>Stage 0 — project scaffold is running.</Text>
        <Text style={styles.hint}>Next: Firebase + Auth (Stage 1)</Text>
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  crown: { fontSize: 64, marginBottom: 12 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 16, marginTop: 8, textAlign: 'center' },
  hint: { color: colors.primary, fontSize: 14, marginTop: 24, fontWeight: '600' },
});
