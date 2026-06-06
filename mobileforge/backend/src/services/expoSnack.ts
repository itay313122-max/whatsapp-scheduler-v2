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

// Icon component names exported by @expo/vector-icons and react-native-vector-icons
const ICON_COMPONENTS = [
  'Ionicons', 'MaterialIcons', 'FontAwesome', 'FontAwesome5', 'AntDesign',
  'Entypo', 'EvilIcons', 'Feather', 'Foundation', 'MaterialCommunityIcons',
  'Octicons', 'SimpleLineIcons', 'Zocial',
];
const ICON_OPEN_RE = new RegExp(`<(${ICON_COMPONENTS.join('|')})(\\s[^>]*)?\\/?>`, 'g');
const ICON_CLOSE_RE = new RegExp(`<\\/(${ICON_COMPONENTS.join('|')})>`, 'g');

// Packages whose imports we always strip (we replace their components with RN equivalents)
const STRIP_PACKAGES = [
  'expo-linear-gradient',
  'expo-font',
  '@expo/vector-icons',
  'react-native-vector-icons',
  'react-native-linear-gradient',
];
const STRIP_PKG_RE = new RegExp(
  `import\\s*\\{[\\s\\S]*?\\}\\s*from\\s*['"](?:${STRIP_PACKAGES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})['"]\\ *;?[ \\t]*\\n?`,
  'g'
);
const STRIP_PKG_DEFAULT_RE = new RegExp(
  `import\\s+\\w+\\s+from\\s*['"](?:${STRIP_PACKAGES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})['"]\\ *;?[ \\t]*\\n?`,
  'g'
);

/**
 * Replace external-library components with plain react-native equivalents so
 * the code runs in Expo Snack without any optional packages.
 *
 *  LinearGradient  → View  (gradient props on View are silently ignored)
 *  <Ionicons ...>  → <Text>●</Text>
 *  useFonts(...)   → [true]  (no-op, always ready)
 */
function replaceExternalComponents(code: string): string {
  let out = code;

  // LinearGradient → View, preserving the first color from colors=[...] as backgroundColor
  out = out.replace(/<LinearGradient([\s\S]*?)>/g, (_, attrs) => {
    // Extract first color string from colors={['#xxx', ...]} or colors={["#xxx", ...]}
    const colorMatch = attrs.match(/colors\s*=\s*\{[\s\S]*?\[\s*['"](#?[^'"]+)['"]/);
    const firstColor = colorMatch ? colorMatch[1] : null;

    // Remove gradient-only props (handles one level of nesting in the value)
    let newAttrs = attrs
      .replace(/\s*colors\s*=\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, '')
      .replace(/\s*start\s*=\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, '')
      .replace(/\s*end\s*=\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, '')
      .replace(/\s*locations\s*=\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, '');

    if (firstColor) {
      // Wrap existing style in an array so we can append backgroundColor
      // Handles: style={styles.X}  and  style={{...}}
      const styleRe = /style\s*=\s*(\{(?:[^{}]|\{[^{}]*\})*\})/;
      const styleMatch = newAttrs.match(styleRe);
      if (styleMatch) {
        // Strip outer { } so the value works inside an array literal:
        //   {styles.bg}  → styles.bg   → style={[styles.bg, {bg}]}
        //   {{flex:1}}   → {flex:1}    → style={[{flex:1}, {bg}]}
        const innerVal = styleMatch[1].slice(1, -1).trim();
        newAttrs = newAttrs.replace(
          styleRe,
          `style={[${innerVal}, {backgroundColor: '${firstColor}'}]}`
        );
      } else {
        newAttrs += ` style={{backgroundColor: '${firstColor}'}}`;
      }
    }

    return `<View${newAttrs}>`;
  });
  out = out.replace(/<\/LinearGradient>/g, '</View>');

  // Icon components → bullet emoji
  out = out.replace(ICON_OPEN_RE, '<Text>●</Text>');
  out = out.replace(ICON_CLOSE_RE, '');

  // expo-font: useFonts({...}) → [true]
  out = out.replace(
    /const\s+\[([^\]]*)\]\s*=\s*useFonts\s*\(\s*\{[\s\S]*?\}\s*\)\s*;?/g,
    (_, vars) => {
      const first = vars.split(',')[0].trim();
      return `const [${first}] = [true];`;
    }
  );

  return out;
}

/**
 * Deterministically rebuild react-native and react imports from what is
 * actually used in the code, regardless of what the LLM generated.
 * Also replaces unsupported external components with react-native equivalents.
 * Prevents every "X is not defined" runtime error in Expo Snack.
 */
export function sanitizeCode(code: string): string {
  // 1. Replace external components BEFORE stripping imports so new View/Text
  //    usages are visible to the scanner below
  let body = replaceExternalComponents(code);

  // 2. Strip imports for known problematic external packages
  body = body.replace(STRIP_PKG_RE, '');
  body = body.replace(STRIP_PKG_DEFAULT_RE, '');

  // 3. Strip all react-native imports (single-line and multi-line) — we rebuild
  body = body.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]react-native['"]\s*;?[ \t]*\n?/g, '');
  body = body.replace(/import\s+\w+\s+from\s*['"]react-native['"]\s*;?[ \t]*\n?/g, '');

  // 4. Strip all React imports — we rebuild a canonical one
  body = body.replace(/import\s+React[\s\S]*?from\s*['"]react['"]\s*;?[ \t]*\n?/g, '');

  // 5. Scan remaining code for each react-native identifier
  const used = RN_IDENTIFIERS.filter((id) => new RegExp(`\\b${id}\\b`).test(body));
  console.log('[sanitizeCode] detected react-native identifiers:', used);

  // 6. Build canonical import lines
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
