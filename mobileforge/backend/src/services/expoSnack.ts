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

// All react-native identifiers we know how to detect and auto-import
const RN_IDENTIFIERS = [
  // Visual components
  'View', 'Text', 'ScrollView', 'FlatList', 'SectionList', 'TouchableOpacity',
  'Pressable', 'TextInput', 'Image', 'Modal', 'ActivityIndicator', 'Switch',
  'SafeAreaView', 'KeyboardAvoidingView', 'RefreshControl', 'Button', 'StatusBar',
  // Utilities & APIs
  'StyleSheet', 'I18nManager', 'Platform', 'Dimensions', 'Alert', 'Appearance',
  'Animated', 'Linking',
];

/**
 * Deterministically rebuild react-native and react imports from what's
 * actually used in the code, regardless of what the LLM put in the import
 * block. Prevents "X is not defined" runtime errors in Expo Snack.
 */
export function sanitizeCode(code: string): string {
  // 1. Strip all existing react-native imports (single-line and multi-line)
  let body = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]react-native['"]\s*;?[ \t]*\n?/g, '');
  body = body.replace(/import\s+\w+\s+from\s*['"]react-native['"]\s*;?[ \t]*\n?/g, '');

  // 2. Strip all existing React imports (we'll add a canonical one)
  body = body.replace(/import\s+React[\s\S]*?from\s*['"]react['"]\s*;?[ \t]*\n?/g, '');

  // 3. Scan remaining code for each react-native identifier
  const used = RN_IDENTIFIERS.filter((id) => new RegExp(`\\b${id}\\b`).test(body));
  console.log('[sanitizeCode] detected react-native identifiers:', used);

  // 4. Build canonical import lines
  const reactImport = `import React, { useState, useEffect, useRef, useCallback } from 'react';\n`;
  const rnImport = used.length > 0
    ? `import {\n  ${used.join(',\n  ')},\n} from 'react-native';\n`
    : '';

  return reactImport + rnImport + '\n' + body.trimStart();
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
 *
 * Handles all three forms:
 *   import { X } from '@expo/vector-icons'   ← ES6 named import
 *   import '@react-navigation/native'         ← side-effect import
 *   require('@react-native-async-storage/..') ← CommonJS require
 */
function extractImportedPackages(code: string): string[] {
  const raw = new Set<string>();

  // 1. `from 'pkg'` — covers: import X from, import { X } from, import * from
  const fromRe = /from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = fromRe.exec(code)) !== null) raw.add(m[1]);

  // 2. `import 'pkg'` — side-effect imports (no `from`)
  const sideRe = /import\s+['"]([^'"]+)['"]/g;
  while ((m = sideRe.exec(code)) !== null) raw.add(m[1]);

  // 3. `require('pkg')` — CommonJS
  const reqRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = reqRe.exec(code)) !== null) raw.add(m[1]);

  const builtIns = new Set(['react', 'react-native', 'expo']);

  return [...raw]
    .filter((p) => !p.startsWith('.') && !p.startsWith('/'))
    // Normalise: '@scope/pkg/deep' → '@scope/pkg', 'pkg/sub' → 'pkg'
    .map((p) =>
      p.startsWith('@') ? p.split('/').slice(0, 2).join('/') : p.split('/')[0]
    )
    .filter((p) => !builtIns.has(p));
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
  // Sanitize app code — rebuild react-native + react imports from actual usage
  const sanitizedFiles: Record<string, string> = {};
  for (const [filename, contents] of Object.entries(files)) {
    sanitizedFiles[filename] =
      filename === 'App.js' || filename === 'App.tsx'
        ? sanitizeCode(contents)
        : contents;
  }

  const snackFiles: Record<string, SnackFile> = {};
  for (const [filename, contents] of Object.entries(sanitizedFiles)) {
    snackFiles[filename] = { type: 'CODE', contents };
  }

  // Extract dependencies from the sanitized app code
  const appCode = sanitizedFiles['App.js'] ?? sanitizedFiles['App.tsx'] ?? '';
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

  // preview=true is required — embedded Snacks default to preview=false (code-only view)
  // platform=web runs in the browser immediately without a device emulator
  // supportedPlatforms shows the platform switcher for iOS / Android emulation too
  return {
    snackId: rawId,
    embedUrl: `https://snack.expo.dev/embedded/${rawId}?preview=true&platform=web&supportedPlatforms=web,ios,android&theme=light`,
    shareUrl: `https://snack.expo.dev/${rawId}`,
  };
}
