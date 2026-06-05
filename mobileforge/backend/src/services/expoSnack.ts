interface SnackFile {
  type: 'CODE' | 'ASSET';
  contents: string;
}

interface SnackSaveResponse {
  id: string;
  hashId: string;
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
      sdkVersion: '51.0.0',
      name,
      slug: 'mobileforge-' + Date.now(),
      version: '1.0.0',
    },
    code: snackFiles,
    dependencies: {},
  };

  const response = await fetch('https://exp.host/--/api/v2/snack/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Snack-Api-Version': '3.0.0',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Expo Snack API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as SnackSaveResponse;
  const snackId = data.id || data.hashId;

  return {
    snackId,
    embedUrl: `https://snack.expo.dev/embedded/@snack/${snackId}?platform=web&preview=true&theme=dark&loading=lazy`,
    shareUrl: `https://snack.expo.dev/@snack/${snackId}`,
  };
}
