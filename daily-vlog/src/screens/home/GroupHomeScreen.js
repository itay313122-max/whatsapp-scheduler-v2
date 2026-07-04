import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { getGroup } from '../../services/groupService';
import { colors } from '../../theme/colors';

// STAGE 2 home for a user who is in a group: shows the group, the shareable
// invite code, and members. Stage 3 turns this into the live Feed (today's
// vlogger, 24h timer, clips, reactions).
export default function GroupHomeScreen() {
  const { user, profile, logout } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!profile?.groupId) return;
    setLoading(true);
    setError(null);
    try {
      setGroup(await getGroup({ db }, profile.groupId));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.groupId]);

  useEffect(() => {
    load();
  }, [load]);

  function shareCode() {
    if (!group?.inviteCode) return;
    Share.share({
      message: `Join our Daily Vlog group "${group.name}" with invite code: ${group.inviteCode}`,
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>{group?.name || 'Your group'}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.card}>
            <Text style={styles.errorText}>{error}</Text>
            <PrimaryButton title="Retry" variant="ghost" onPress={load} />
          </View>
        ) : group ? (
          <>
            <Pressable style={styles.codeCard} onPress={shareCode}>
              <Text style={styles.codeLabel}>INVITE CODE — tap to share</Text>
              <Text style={styles.code}>{group.inviteCode}</Text>
            </Pressable>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Members ({group.memberIds?.length || 0})
              </Text>
              {(group.memberIds || []).map((id) => (
                <Text key={id} style={styles.member}>
                  {id === user?.uid ? '• You' : `• ${id.slice(0, 6)}…`}
                </Text>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Today's vlog</Text>
              <Text style={styles.muted}>
                {group.currentTurn
                  ? 'A vlog is live.'
                  : "No one's up yet. The daily pick runs from a Cloud Function (Stage 5)."}
              </Text>
              <Text style={styles.mutedSmall}>
                Round {group.roundNumber} · {group.currentBagPool?.length || 0} left in the bag
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.muted}>Group not found.</Text>
          </View>
        )}

        <View style={styles.footer}>
          <PrimaryButton title="Log out" variant="ghost" onPress={logout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 12, marginBottom: 20 },
  crown: { fontSize: 44 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 6 },
  codeCard: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  code: { color: colors.primary, fontSize: 34, fontWeight: '900', letterSpacing: 6, marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 6,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  member: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  mutedSmall: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  errorText: { color: colors.danger, fontSize: 14, marginBottom: 8 },
  footer: { alignItems: 'center', marginTop: 8 },
});
