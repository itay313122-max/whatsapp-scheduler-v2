interface SnackFile {
  type: 'CODE' | 'ASSET';
  contents: string;
}

interface SnackSaveResponse {
  id?: string;
  hashId?: string;
  [key: string]: unknown;
}

export interface SnackResult {
  snackId: string;
  embedUrl: string;
  shareUrl: string;
}

/**
 * Package → version map for Expo SDK 52 bundled/common packages.
 * Wildcard "*" tells the Snack runtime to resolve the SDK-compatible version.
 * Packages that are always bundled with Expo Snack (react-native, react, expo)
 * are omitted — they don't need to be declared.
 */
const KNOWN_PACKAGES: Record<string, string> = {
  // Expo packages
  'expo-linear-gradient': '*',
  'expo-blur': '*',
  'expo-font': '*',
  'expo-status-bar': '*',
  'expo-constants': '*',
  'expo-camera': '*',
  'expo-location': '*',
  'expo-image': '*',
  'expo-av': '*',
  'expo-haptics': '*',
  'expo-sharing': '*',
  'expo-file-system': '*',
  'expo-secure-store': '*',
  'expo-web-browser': '*',
  'expo-linking': '*',
  // Icons (bundled with Expo Snack)
  '@expo/vector-icons': '*',
  // React Navigation
  '@react-navigation/native': '*',
  '@react-navigation/native-stack': '*',
  '@react-navigation/stack': '*',
  '@react-navigation/bottom-tabs': '*',
  '@react-navigation/drawer': '*',
  '@react-navigation/material-top-tabs': '*',
  'react-native-screens': '*',
  'react-native-safe-area-context': '*',
  'react-native-gesture-handler': '*',
  'react-native-reanimated': '*',
  // Storage & data
  '@react-native-async-storage/async-storage': '*',
  'react-native-mmkv': '*',
  // UI & animation
  'react-native-paper': '*',
  'react-native-svg': '*',
  'react-native-vector-icons': '*',
  'react-native-animatable': '*',
  'lottie-react-native': '*',
  // Network
  'axios': '*',
};

/**
 * Parse import statements from the app code and return the set of external
 * package names referenced (relative imports and react/react-native excluded).
 */
function extractImportedPackages(code: string): string[] {
  const packages = new Set<string>();
  // Matches: import ... from 'pkg' / import 'pkg' / require('pkg')
  const re = /(?:from|import|require)\s*\(\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    const raw = m[1];
    if (raw.startsWith('.') || raw.startsWith('/')) continue; // relative
    // Normalise to root package name: '@scope/pkg/sub' → '@scope/pkg'
    const root = raw.startsWith('@')
      ? raw.split('/').slice(0, 2).join('/')
      : raw.split('/')[0];
    packages.add(root);
  }
  // Remove packages that are always built-in
  const builtIns = new Set(['react', 'react-native', 'expo']);
  return [...packages].filter((p) => !builtIns.has(p));
}

/**
 * Build the dependencies object for the Snack payload by mapping imported
 * packages to their known Expo-compatible versions.
 */
function buildDependencies(code: string): Record<string, string> {
  const imported = extractImportedPackages(code);
  const deps: Record<string, string> = {};

  for (const pkg of imported) {
    if (KNOWN_PACKAGES[pkg]) {
      deps[pkg] = KNOWN_PACKAGES[pkg];
    } else {
      // Unknown package — still include it with wildcard so Snack can try
      deps[pkg] = '*';
      console.log(`[ExpoSnack] Unknown package in imports: ${pkg} (using *)`);
    }
  }

  return deps;
}

export async function createExpoSnack(
  files: Record<string, string>,
  name = 'MobileForge App'
): Promise<SnackResult> {
  const snackFiles: Record<string, SnackFile> = {};
  for (const [filename, contents] of Object.entries(files)) {
    snackFiles[filename] = { type: 'CODE', contents };
  }

  // Extract dependencies from the app code
  const appCode = files['App.js'] ?? files['App.tsx'] ?? '';
  const dependencies = buildDependencies(appCode);
  console.log('[ExpoSnack] Detected dependencies:', Object.keys(dependencies));

  const payload = {
    manifest: {
      sdkVersion: '52.0.0',
      name,
      slug: 'mobileforge-' + Date.now(),
      version: '1.0.0',
    },
    code: snackFiles,
    dependencies,
  };

  console.log('[ExpoSnack] Saving snack:', name, '| files:', Object.keys(files));

  const response = await fetch('https://api.expo.dev/v2/snack/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  console.log('[ExpoSnack] Status:', response.status);
  console.log('[ExpoSnack] Raw response:', responseText.slice(0, 400));

  if (!response.ok) {
    throw new Error(`Expo Snack API error ${response.status}: ${responseText}`);
  }

  let data: SnackSaveResponse;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`Expo Snack returned non-JSON: ${responseText.slice(0, 200)}`);
  }

  const rawId = ((data.id || data.hashId) ?? '').toString().replace(/^@snack\//, '');

  if (!rawId) {
    throw new Error(`Expo Snack returned no id. Full response: ${responseText.slice(0, 300)}`);
  }

  console.log('[ExpoSnack] snackId:', rawId);

  return {
    snackId: rawId,
    embedUrl: `https://snack.expo.dev/embedded/${rawId}?platform=web&preview=true&theme=light&loading=lazy`,
    shareUrl: `https://snack.expo.dev/${rawId}`,
  };
}
