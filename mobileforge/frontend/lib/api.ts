import { getFirebaseAuth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) return { 'Content-Type': 'application/json' };
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export interface GenerateRequest {
  projectId?: string;
  prompt: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  editMode?: boolean;
  existingCode?: string;
  theme?: string;
}

export interface ThemeMeta {
  id: string;
  name: string;
  swatches: string[];
}

/** Fetch the available design themes for the picker. */
export async function getThemes(): Promise<ThemeMeta[]> {
  try {
    const res = await fetch(`${API_URL}/api/generate/themes`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.themes || [];
  } catch {
    return [];
  }
}

export interface GenerateResponse {
  appName: string;
  description: string;
  files: Record<string, string>;
  colorScheme: { primary: string; background: string; text: string; accent?: string };
  features: string[];
  hebrewSummary: string;
  htmlDoc: string;       // full HTML document for iframe srcDoc (web renderer)
  snackId: string;       // legacy — empty for web-mode apps
  embedUrl: string;      // legacy — empty for web-mode apps
  shareUrl: string;      // legacy — empty for web-mode apps
}

export async function generateApp(req: GenerateRequest): Promise<GenerateResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    // Surface the real reason (the backend includes it in `details`) so failures
    // are diagnosable on screen instead of a generic "Generation failed".
    const msg = err.details ? `${err.error || 'Generation failed'} — ${err.details}` : (err.error || 'Generation failed');
    throw new Error(msg);
  }

  return res.json();
}

export interface PlanQuestion {
  id: string;
  q: string;
  options: string[];
}

export interface PlanResult {
  ready: boolean;
  intro?: string;
  questions?: PlanQuestion[];
}

/**
 * Chat-Mode planning (Lovable-style): ask the backend whether it has enough
 * context to build, or whether it wants to ask a few clarifying questions
 * first. Always fails open — on any error we return { ready: true } so the
 * build is never blocked.
 */
export async function planApp(
  prompt: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<PlanResult> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/generate/plan`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, conversationHistory }),
    });
    if (!res.ok) return { ready: true };
    return res.json();
  } catch {
    return { ready: true };
  }
}

export async function streamGenerateApp(
  req: GenerateRequest,
  onChunk: (chunk: string) => void,
  onDone: (result: GenerateResponse) => void,
  onError: (err: string) => void
): Promise<void> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/generate/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(req),
  });

  if (!res.ok || !res.body) {
    onError('Stream failed to start');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let gotDone = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.chunk) onChunk(data.chunk);
          if (data.done && data.result) { onDone(data.result); gotDone = true; }
          if (data.error) onError(data.error);
        } catch {
          // ignore malformed lines
        }
      }
    }
  } finally {
    reader.cancel().catch(() => {});
    if (!gotDone) onError('Stream ended unexpectedly');
  }
}

/** Live-sync: the builder pushes the current app; any device on the live URL reloads. */
export async function pushLive(sessionId: string, htmlDoc: string, appName?: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/live/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ htmlDoc, appName }),
    });
  } catch {
    /* best-effort — a dropped push just means this version isn't mirrored */
  }
}

/** The URL a phone opens to watch the app update live. */
export function liveUrl(sessionId: string): string {
  return `${API_URL}/api/live/${sessionId}`;
}

export async function shareApp(htmlDoc: string, appName: string): Promise<{ id: string; shareUrl: string }> {
  const res = await fetch(`${API_URL}/api/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ htmlDoc, appName }),
  });
  if (!res.ok) throw new Error('Failed to share app');
  return res.json();
}

export async function createProject(name: string, description?: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function getProjects() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/projects`, { headers });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function getProject(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/projects/${id}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
}

export async function deleteProject(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete project');
  return res.json();
}

export async function getProjectMessages(projectId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/projects/${projectId}/messages`, { headers });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export interface GenerateFromImageRequest {
  image: string;       // base64 (no data-url prefix)
  mimeType: string;    // 'image/jpeg' | 'image/png' | etc.
  prompt?: string;
  projectId?: string;
  isSketch?: boolean;
}

export async function generateFromImage(req: GenerateFromImageRequest): Promise<GenerateResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/generate/vision`, {
    method: 'POST',
    headers,
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    // Use Hebrew message from backend when available (e.g. VISION_NOT_SUPPORTED)
    throw new Error(err.message || err.error || 'Vision generation failed');
  }
  return res.json();
}

export async function createSnack(files: Record<string, string>, name?: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/snack`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ files, name }),
  });
  if (!res.ok) throw new Error('Failed to create snack');
  return res.json();
}

export interface ProjectContext {
  appName?: string;
  description?: string;
  currentCode?: string;
  colorScheme?: Record<string, string>;
  features?: string[];
}

export async function streamAssistantMessage(
  userMessage: string,
  projectContext: ProjectContext,
  history: { role: 'user' | 'assistant'; content: string }[],
  onText: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/assistant`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userMessage, projectContext, history }),
  });

  if (!res.ok || !res.body) {
    onError('Failed to connect to assistant');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6);
      if (payload === '[DONE]') {
        onDone();
        return;
      }
      try {
        const data = JSON.parse(payload);
        if (data.text) onText(data.text);
        if (data.error) { onError(data.error); return; }
      } catch {
        // ignore malformed lines
      }
    }
  }

  onDone();
}

// ── Beta feedback ────────────────────────────────────────────────────────────
export async function submitFeedback(input: {
  text: string;
  rating?: number;
  page?: string;
  name?: string;
}): Promise<{ ok: boolean; id?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}

// ── Closed beta gate ─────────────────────────────────────────────────────────
export async function betaStatus(): Promise<{ gateEnabled: boolean }> {
  try {
    const res = await fetch(`${API_URL}/api/beta/status`);
    if (!res.ok) return { gateEnabled: false };
    return await res.json();
  } catch {
    return { gateEnabled: false };
  }
}

export async function verifyBetaKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/beta/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.valid;
  } catch {
    return false;
  }
}
