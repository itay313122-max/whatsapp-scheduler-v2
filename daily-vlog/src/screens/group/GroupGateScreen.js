import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { createGroup, joinGroup } from '../../services/groupService';
import { normalizeInviteCode } from '../../utils/inviteCode';
import { colors } from '../../theme/colors';

// Shown to a signed-in user who isn't in a group yet. Two modes: create a new
// group, or join one with an invite code.
export default function GroupGateScreen() {
  const { user, profile, logout, refreshProfile } = useAuth();
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [groupName, setGroupName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const displayName = profile?.displayName || user?.displayName || user?.email;

  async function handleCreate() {
    if (!groupName.trim()) {
      Alert.alert('Missing name', 'Give your group a name.');
      return;
    }
    setLoading(true);
    try {
      const { inviteCode } = await createGroup(
        { db },
        { name: groupName, uid: user.uid }
      );
      await refreshProfile(); // flips navigation to the group home
      Alert.alert('Group created 🎉', `Share this invite code:\n\n${inviteCode}`);
    } catch (e) {
      Alert.alert('Could not create group', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const normalized = normalizeInviteCode(code);
    if (!normalized) {
      Alert.alert('Missing code', 'Enter the invite code you were given.');
      return;
    }
    setLoading(true);
    try {
      await joinGroup({ db }, { inviteCode: normalized, uid: user.uid });
      await refreshProfile();
    } catch (e) {
      Alert.alert('Could not join group', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.hi}>Hi {displayName} 👋</Text>
          <Text style={styles.title}>Join the vlog</Text>
          <Text style={styles.subtitle}>
            Create a group for your friends, or join one with a code.
          </Text>

          <View style={styles.toggle}>
            <Pressable
              onPress={() => setMode('create')}
              style={[styles.toggleBtn, mode === 'create' && styles.toggleActive]}
            >
              <Text style={[styles.toggleText, mode === 'create' && styles.toggleTextActive]}>
                Create
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('join')}
              style={[styles.toggleBtn, mode === 'join' && styles.toggleActive]}
            >
              <Text style={[styles.toggleText, mode === 'join' && styles.toggleTextActive]}>
                Join
              </Text>
            </Pressable>
          </View>

          {mode === 'create' ? (
            <View style={styles.card}>
              <TextField
                label="Group name"
                value={groupName}
                onChangeText={setGroupName}
                placeholder="The Boys 🍻"
                autoCapitalize="words"
              />
              <PrimaryButton title="Create group" onPress={handleCreate} loading={loading} />
            </View>
          ) : (
            <View style={styles.card}>
              <TextField
                label="Invite code"
                value={code}
                onChangeText={setCode}
                placeholder="e.g. K7QW2M"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
              <PrimaryButton title="Join group" onPress={handleJoin} loading={loading} />
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
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  hi: { color: colors.textMuted, fontSize: 16, textAlign: 'center' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  subtitle: { color: colors.textMuted, fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },
  toggleTextActive: { color: colors.onPrimary },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
  },
  footer: { marginTop: 24, alignItems: 'center' },
});
