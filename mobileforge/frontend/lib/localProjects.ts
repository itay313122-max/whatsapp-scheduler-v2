'use client';

import type { GenerateResponse } from './api';

export interface LocalProject {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  colorScheme?: { primary: string; background: string; text: string; accent?: string };
  features?: string[];
  htmlDoc?: string;
  appCode?: string;
  prompt?: string;
}

const STORAGE_KEY = 'mf_projects';
const MAX_PROJECTS = 50;

function getAll(): LocalProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(projects: LocalProject[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, MAX_PROJECTS)));
  } catch {
    // localStorage full — remove oldest
    const trimmed = projects.slice(0, Math.floor(MAX_PROJECTS / 2));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch { /* give up */ }
  }
}

export function getLocalProjects(): LocalProject[] {
  return getAll().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getLocalProject(id: string): LocalProject | null {
  return getAll().find(p => p.id === id) ?? null;
}

export function saveLocalProject(id: string, result: GenerateResponse, prompt?: string): LocalProject {
  const projects = getAll();
  const existing = projects.find(p => p.id === id);
  const appCode = result.files?.['App.jsx'] ?? result.files?.['App.tsx'] ?? '';

  const project: LocalProject = {
    id,
    name: result.appName || existing?.name || 'App',
    description: result.hebrewSummary || result.description || '',
    updatedAt: new Date().toISOString(),
    colorScheme: result.colorScheme,
    features: result.features,
    htmlDoc: result.htmlDoc,
    appCode,
    prompt: prompt || existing?.prompt,
  };

  const filtered = projects.filter(p => p.id !== id);
  filtered.unshift(project);
  saveAll(filtered);
  return project;
}

export function deleteLocalProject(id: string) {
  const projects = getAll().filter(p => p.id !== id);
  saveAll(projects);
}

export function createLocalProjectId(): string {
  return 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}
