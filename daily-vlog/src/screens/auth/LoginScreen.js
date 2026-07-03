import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { authErrorMessage } from '../../utils/authErrors';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // On success, onAuthStateChanged flips the navigator to the app stack.
    } catch (e) {
      Alert.alert('Login failed', authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout title="Welcome back" subtitle="Log in to see today's vlog">
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
        placeholder="••••••••"
        secureTextEntry
        autoComplete="password"
      />
      <PrimaryButton title="Log in" onPress={handleLogin} loading={loading} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <PrimaryButton
          title="Create one"
          variant="ghost"
          onPress={() => navigation.navigate('SignUp')}
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
