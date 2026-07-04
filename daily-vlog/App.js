import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { isFirebaseConfigured } from './src/firebase/config';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { setupNotificationHandler } from './src/services/pushService';
import { colors } from './src/theme/colors';

// Configure how notifications appear in the foreground (runs once at startup).
setupNotificationHandler();

// Shown when .env is missing/empty so setup problems are obvious, not a
// cryptic Firebase crash.
function ConfigMissing() {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>🔧</Text>
      <Text style={styles.title}>Firebase not configured</Text>
      <Text style={styles.body}>
        Copy <Text style={styles.mono}>.env.example</Text> to{' '}
        <Text style={styles.mono}>.env</Text> and fill in your Firebase web
        config, then restart with{' '}
        <Text style={styles.mono}>npx expo start -c</Text>.
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      {isFirebaseConfigured ? (
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      ) : (
        <ConfigMissing />
      )}
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 10 },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  mono: { color: colors.primary, fontWeight: '700' },
});
