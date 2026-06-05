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

export async function createExpoSnack(
  files: Record<string, string>,
  name = 'MobileForge App'
): Promise<SnackResult> {
  const snackFiles: Record<string, SnackFile> = {};

  for (const [filename, contents] of Object.entries(files)) {
    snackFiles[filename] = {
      type: 'CODE',
      contents,
    };
  }

  const payload = {
    manifest: {
      sdkVersion: '52.0.0',
      name,
      slug: 'mobileforge-' + Date.now(),
      version: '1.0.0',
    },
    code: snackFiles,
    dependencies: {},
  };

  console.log('[ExpoSnack] Saving snack:', name, '| files:', Object.keys(files));

  const response = await fetch('https://exp.host/--/api/v2/snack/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Snack-Api-Version': '3.0.0',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  console.log('[ExpoSnack] Status:', response.status);
  console.log('[ExpoSnack] Raw response:', responseText.slice(0, 500));

  if (!response.ok) {
    throw new Error(`Expo Snack API error ${response.status}: ${responseText}`);
  }

  let data: SnackSaveResponse;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`Expo Snack returned non-JSON: ${responseText.slice(0, 200)}`);
  }

  console.log('[ExpoSnack] Parsed response keys:', Object.keys(data));
  console.log('[ExpoSnack] id:', data.id, '| hashId:', data.hashId);

  // Prefer hashId; strip any accidental @snack/ prefix
  const rawId = (data.hashId || data.id || '').toString().replace(/^@snack\//, '');

  if (!rawId) {
    throw new Error(`Expo Snack returned no id. Full response: ${responseText.slice(0, 300)}`);
  }

  console.log('[ExpoSnack] Using snackId:', rawId);

  return {
    snackId: rawId,
    embedUrl: `https://snack.expo.dev/embedded/@snack/${rawId}?platform=web&preview=true&theme=light&loading=lazy`,
    shareUrl: `https://snack.expo.dev/@snack/${rawId}`,
  };
}
