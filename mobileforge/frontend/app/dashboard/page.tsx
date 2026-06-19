'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
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

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isGuest } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user && !isGuest) router.push('/auth');
  }, [user, authLoading, isGuest, router]);

  useEffect(() => {
    if (!user) return;
    // In guest mode, skip fetching projects from backend
    if (isGuest) {
      setLoadingProjects(false);
      return;
    }
    loadProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isGuest]);

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      // Firebase not configured — show empty state
    } finally {
      setLoadingProjects(false);
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!user && !isGuest) return null;

  return (
    <div className="min-h-screen bg-bg text-text-primary" dir="rtl">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="font-display font-bold text-3xl mb-1">הפרויקטים שלי</h1>
            <p className="text-text-secondary text-sm">
              {user?.displayName || user?.email || 'Guest'}
              {projects.length > 0 && ` · ${projects.length} פרויקטים`}
            </p>
          </div>
          <motion.button
            onClick={() => setShowNewModal(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-opacity shadow-glow"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            פרויקט חדש
          </motion.button>
        </motion.div>

        {/* Content */}
        {loadingProjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl shimmer" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24 gap-6 text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center text-4xl shadow-card">
              📱
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl mb-2">אין פרויקטים עדיין</h2>
              <p className="text-text-secondary mb-6">
                צור את הפרויקט הראשון שלך — 10 credits מחכים לך!
              </p>
              <motion.button
                onClick={() => setShowNewModal(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-opacity shadow-glow"
              >
                צור פרויקט ראשון ✨
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            {projects.map((project) => (
              <motion.div key={project.id} variants={fadeUp}>
                <ProjectCard
                  {...project}
                  onDelete={handleDeleteProject}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewModal && (
          <>
            <motion.div
              className="fixed inset-0 bg-indigo-950/20 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewModal(false)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <div
                className="w-full max-w-md glass-card rounded-3xl p-6 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-display font-bold text-xl mb-1">פרויקט חדש</h3>
                <p className="text-text-secondary text-sm mb-6">נשמר אוטומטית אחרי כל generation</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-text-secondary text-xs font-medium mb-1.5">שם הפרויקט *</label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="למשל: אפליקציית מסעדות"
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-soft text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); }}
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-xs font-medium mb-1.5">תיאור (אופציונלי)</label>
                    <textarea
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      placeholder="תאר בקצרה את האפליקציה…"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-soft text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || creating}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl bg-gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow"
                  >
                    {creating ? 'יוצר…' : 'צור פרויקט'}
                  </motion.button>
                  <button
                    onClick={() => setShowNewModal(false)}
                    className="px-5 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all text-sm"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
