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
}

export interface GenerateResponse {
  appName: string;
  description: string;
  files: Record<string, string>;
  colorScheme: { primary: string; background: string; text: string; accent?: string };
  features: string[];
  hebrewSummary: string;
  snackId: string;
  embedUrl: string;
  shareUrl: string;
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
    throw new Error(err.error || 'Generation failed');
  }

  return res.json();
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
        if (data.done && data.result) onDone(data.result);
        if (data.error) onError(data.error);
      } catch {
        // ignore malformed lines
      }
    }
  }
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
    throw new Error(err.error || 'Vision generation failed');
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
