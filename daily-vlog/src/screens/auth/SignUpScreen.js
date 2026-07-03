import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { authErrorMessage } from '../../utils/authErrors';
import { colors } from '../../theme/colors';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!displayName.trim()) {
      Alert.alert('Missing name', 'Please enter a display name.');
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, displayName);
      // onAuthStateChanged flips the navigator to the app stack automatically.
    } catch (e) {
      Alert.alert('Sign up failed', authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Create account"
      subtitle="Join your group and take your turn"
    >
      <TextField
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="How friends see you"
        autoCapitalize="words"
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
        autoComplete="new-password"
      />
      <PrimaryButton title="Sign up" onPress={handleSignUp} loading={loading} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <PrimaryButton
          title="Log in"
          variant="ghost"
          onPress={() => navigation.navigate('Login')}
          style={styles.footerBtn}
        />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  footer: { marginTop: 16, alignItems: 'center' },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerBtn: { marginTop: 2 },
});
