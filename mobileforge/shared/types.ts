export interface User {
  uid: string;
  email: string;
  displayName: string;
  credits: number;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  lastSnackId?: string;
  colorScheme?: ColorScheme;
  features: string[];
}

export interface ColorScheme {
  primary: string;
  background: string;
  text: string;
  accent?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: Record<string, string>;
  hebrewSummary?: string;
  snackId?: string;
  embedUrl?: string;
  shareUrl?: string;
  appName?: string;
  colorScheme?: ColorScheme;
  features?: string[];
  timestamp: string;
  isLoading?: boolean;
}

export interface GenerateRequest {
  projectId: string;
  prompt: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}

export interface GenerateResponse {
  appName: string;
  description: string;
  files: Record<string, string>;
  colorScheme: ColorScheme;
  features: string[];
  hebrewSummary: string;
  snackId: string;
  embedUrl: string;
  shareUrl: string;
}

export interface SnackCreateRequest {
  files: Record<string, string>;
  name?: string;
}

export interface SnackCreateResponse {
  snackId: string;
  embedUrl: string;
  shareUrl: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
