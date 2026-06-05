'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, logout, type User } from '@/lib/firebase';
import { getProjects, createProject, deleteProject } from '@/lib/api';
import ProjectCard from '@/components/ProjectCard';
import Navbar from '@/components/Navbar';

interface Project {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  colorScheme?: { primary: string; background: string; text: string };
  features?: string[];
  lastSnackId?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    return onAuthChange((u) => {
      if (!u) {
        router.push('/auth');
        return;
      }
      setUser(u);
      loadProjects();
    });
  }, [router]);

  async function loadProjects() {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      // Firebase may not be configured — show empty state
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) return;
    setCreating(true);
    try {
      const project = await createProject(newProjectName.trim(), newProjectDesc.trim());
      setProjects((prev) => [project, ...prev]);
      setShowNewModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      router.push(`/builder/${project.id}`);
    } catch {
      // If Firebase not configured, create local project and navigate
      const tempId = 'local-' + Date.now();
      router.push(`/builder/${tempId}?name=${encodeURIComponent(newProjectName)}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('האם אתה בטוח שברצונך למחוק פרויקט זה?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('שגיאה במחיקת הפרויקט');
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary" dir="rtl">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display font-bold text-3xl mb-1">
              הפרויקטים שלי
            </h1>
            <p className="text-text-secondary">
              {user?.displayName || user?.email} · {projects.length} פרויקטים
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-opacity shadow-glow"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            פרויקט חדש
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl shimmer" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center text-4xl">
              📱
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl mb-2">אין פרויקטים עדיין</h2>
              <p className="text-text-secondary mb-6">
                צור את הפרויקט הראשון שלך ותתחיל לבנות אפליקציות!
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-opacity shadow-glow"
              >
                צור פרויקט ראשון
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                {...project}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewModal(false); }}
        >
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6">
            <h3 className="font-display font-bold text-xl mb-6">פרויקט חדש</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-xs mb-1.5">שם הפרויקט *</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="למשל: אפליקציית מסעדות"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-primary transition-colors"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); }}
                />
              </div>
              <div>
                <label className="block text-text-secondary text-xs mb-1.5">תיאור (אופציונלי)</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="תאר בקצרה את האפליקציה…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || creating}
                className="flex-1 py-3 rounded-xl bg-gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow"
              >
                {creating ? 'יוצר…' : 'צור פרויקט'}
              </button>
              <button
                onClick={() => setShowNewModal(false)}
                className="px-5 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
