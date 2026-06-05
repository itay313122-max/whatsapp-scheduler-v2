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

  // Current Expo API endpoint (api.expo.dev replaced exp.host)
  const response = await fetch('https://api.expo.dev/v2/snack/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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

  console.log('[ExpoSnack] Parsed keys:', Object.keys(data));
  console.log('[ExpoSnack] id:', data.id, '| hashId:', data.hashId);

  // API returns 'id'; strip any accidental @snack/ prefix just in case
  const rawId = ((data.id || data.hashId) ?? '').toString().replace(/^@snack\//, '');

  if (!rawId) {
    throw new Error(`Expo Snack returned no id. Full response: ${responseText.slice(0, 300)}`);
  }

  console.log('[ExpoSnack] Final snackId:', rawId);

  // Embed URL format: snack.expo.dev/embedded/{id} (no @snack/ prefix — current format)
  return {
    snackId: rawId,
    embedUrl: `https://snack.expo.dev/embedded/${rawId}?platform=web&preview=true&theme=light&loading=lazy`,
    shareUrl: `https://snack.expo.dev/${rawId}`,
  };
}
