import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import GroupGateScreen from '../screens/group/GroupGateScreen';
import FeedScreen from '../screens/home/FeedScreen';
import RecordScreen from '../screens/record/RecordScreen';

const Stack = createNativeStackNavigator();

// Dark theme for the navigation container background.
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg },
};

function LoadingScreen() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export default function RootNavigator() {
  const { user, initializing, profile, profileLoading } = useAuth();

  // Wait for Firebase to restore any persisted session before deciding
  // which stack to show — avoids a flash of the login screen on launch.
  if (initializing) return <LoadingScreen />;
  // Signed in but we don't yet know their group — hold on the loader so we
  // don't flash the "join a group" screen at someone who has one.
  if (user && profileLoading) return <LoadingScreen />;

  const inGroup = Boolean(profile?.groupId);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : !inGroup ? (
          // Signed in, no group yet → create or join.
          <Stack.Screen name="GroupGate" component={GroupGateScreen} />
        ) : (
          // Signed in and in a group → the live Feed (+ full-screen recorder).
          <>
            <Stack.Screen name="Feed" component={FeedScreen} />
            <Stack.Screen
              name="Record"
              component={RecordScreen}
              options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});

export { LoadingScreen };
