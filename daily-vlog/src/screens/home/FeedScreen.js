import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import ClipCard from '../../components/ClipCard';
import Countdown from '../../components/Countdown';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { getGroup, getMemberNames } from '../../services/groupService';
import { subscribeActiveTurn, subscribeClips } from '../../services/feedService';
import { triggerSelection } from '../../services/functionsService';
import { colors } from '../../theme/colors';

// STAGE 3: the live Feed — today's vlogger, 24h timer, clips in real time,
// reactions in real time. Video upload is still mocked (Stage 4 adds the
// camera); the daily pick is faked with a dev button until the Cloud Function
// lands in Stage 5.
export default function FeedScreen({ navigation }) {
  const { user, profile, logout } = useAuth();
  const groupId = profile?.groupId;

  const [group, setGroup] = useState(null);
  const [names, setNames] = useState({});
  const [turn, setTurn] = useState(null);
  const [clips, setClips] = useState([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [busy, setBusy] = useState(false);

  // Load group + member names once.
  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    setLoadingGroup(true);
    try {
      const g = await getGroup({ db }, groupId);
      setGroup(g);
      if (g?.memberIds) setNames(await getMemberNames({ db }, g.memberIds));
    } finally {
      setLoadingGroup(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  // Subscribe to the active turn.
  useEffect(() => {
    if (!groupId) return;
    return subscribeActiveTurn({ db }, groupId, setTurn, () => setTurn(null));
  }, [groupId]);

  // Subscribe to the active turn's clips.
  useEffect(() => {
    if (!groupId || !turn?.id) {
      setClips([]);
      return;
    }
    return subscribeClips({ db }, groupId, turn.id, setClips, () => setClips([]));
  }, [groupId, turn?.id]);

  const nameFor = (uid) => (uid === user?.uid ? 'You' : names[uid] || uid?.slice(0, 6));
  const isMyTurn = turn?.userId === user?.uid;

  function invite() {
    if (!group?.inviteCode) return;
    Share.share({
      message: `Join our Daily Vlog group "${group.name}" with invite code: ${group.inviteCode}`,
    });
  }

  function recordClip() {
    if (!turn?.id) return;
    navigation.navigate('Record', { turnId: turn.id, nextOrder: clips.length });
  }

  async function pickVlogger() {
    setBusy(true);
    try {
      await triggerSelection(groupId); // server-side pick; the turn arrives via the listener
    } catch (e) {
      Alert.alert('Could not pick a vlogger', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <Text style={styles.groupName} numberOfLines={1}>
          {group?.name || 'Daily Vlog'}
        </Text>
        <Pressable onPress={invite} style={styles.inviteBtn}>
          <Text style={styles.inviteText}>Invite</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {loadingGroup ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : turn ? (
            <>
              <View style={styles.banner}>
                <Text style={styles.crown}>👑</Text>
                <Text style={styles.bannerTitle}>
                  {isMyTurn ? "You're up today" : `${nameFor(turn.userId)}'s vlog`}
                </Text>
                <Countdown expiresAt={turn.expiresAt} style={styles.timer} />
              </View>

              {isMyTurn && (
                <PrimaryButton
                  title="＋ Record a clip"
                  onPress={recordClip}
                  style={{ marginBottom: 16 }}
                />
              )}

              {clips.length === 0 ? (
                <Text style={styles.empty}>
                  {isMyTurn ? 'Add your first clip of the day.' : 'No clips yet — check back soon.'}
                </Text>
              ) : (
                clips.map((clip) => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    groupId={groupId}
                    turnId={turn.id}
                    uid={user.uid}
                    nameFor={nameFor}
                  />
                ))
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.crown}>🌙</Text>
              <Text style={styles.emptyTitle}>No vlog today yet</Text>
              <Text style={styles.emptySub}>
                Each morning someone is picked at random to vlog. That runs from a
                Cloud Function (Stage 5).
              </Text>
              {__DEV__ && (
                <PrimaryButton
                  title="🧪 Pick today's vlogger (test)"
                  variant="ghost"
                  onPress={pickVlogger}
                  loading={busy}
                  style={{ marginTop: 16 }}
                />
              )}
            </View>
          )}

          <View style={styles.footer}>
            <PrimaryButton title="Log out" variant="ghost" onPress={logout} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  groupName: { color: colors.text, fontSize: 20, fontWeight: '800', flex: 1, marginRight: 12 },
  inviteBtn: {
    backgroundColor: colors.surfaceAlt, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  inviteText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  scroll: { padding: 20, paddingBottom: 40 },
  banner: { alignItems: 'center', marginBottom: 20 },
  crown: { fontSize: 40 },
  bannerTitle: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 6 },
  timer: { fontSize: 15, marginTop: 4 },
  empty: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 12 },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 10 },
  emptySub: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  footer: { alignItems: 'center', marginTop: 24 },
});
