import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

// STAGE 1 placeholder for the authenticated area.
// Proves login/persistence works. Stage 2 replaces this with the group
// create/join flow, and Stage 3 with the real Feed.
export default function HomePlaceholder() {
  const { user, profile, logout } = useAuth();
  const name = profile?.displayName || user?.displayName || user?.email;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.check}>✅</Text>
        <Text style={styles.title}>You're logged in</Text>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            Next up (Stage 2): create or join a group with an invite code.
          </Text>
          <Text style={styles.cardText}>
            Your group: {profile?.groupId ? profile.groupId : 'none yet'}
          </Text>
        </View>

        <PrimaryButton title="Log out" variant="ghost" onPress={logout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  check: { fontSize: 56, marginBottom: 8 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  name: { color: colors.primary, fontSize: 18, fontWeight: '700', marginTop: 8 },
  email: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginVertical: 28,
    width: '100%',
    gap: 8,
  },
  cardText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
});
