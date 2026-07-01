'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getGallery, publishToGallery, galleryAppUrl, type GalleryItem } from '@/lib/api';
import { getLocalProjects, type LocalProject } from '@/lib/localProjects';

// Public apps gallery — browse apps others published, and publish your own
// (read from your local projects). Fully self-contained page.
export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<LocalProject[]>([]);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [published, setPublished] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<GalleryItem | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setItems(await getGallery());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    setMine(getLocalProjects().filter((p) => p.htmlDoc));
  }, [refresh]);

  const handlePublish = async (p: LocalProject) => {
    if (!p.htmlDoc) return;
    setPublishing(p.id);
    const id = await publishToGallery({
      htmlDoc: p.htmlDoc,
      appName: p.name,
      description: p.description || '',
      primary: p.colorScheme?.primary || '#6366F1',
    });
    setPublishing(null);
    if (id) {
      setPublished((s) => new Set(s).add(p.id));
      refresh();
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary theme-dark" dir="ltr">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border/50 sticky top-0 bg-bg/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-text-primary flex items-center justify-center">
            <span className="text-bg font-bold text-[11px]">MF</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold">Apps Gallery</h1>
            <p className="text-[11px] text-text-secondary">Real apps built with MobileForge · tap to try them live</p>
          </div>
        </div>
        <Link href="/dashboard" className="text-xs font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-all">
          ← Back to builder
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6">
        {/* Publish your own */}
        {mine.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-text-soft mb-2.5">Publish your apps</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mine.map((p) => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border/60 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.colorScheme?.primary || '#6366F1' }} />
                  <span className="text-xs font-medium max-w-[140px] truncate">{p.name}</span>
                  <button
                    onClick={() => handlePublish(p)}
                    disabled={publishing === p.id || published.has(p.id)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
                  >
                    {published.has(p.id) ? '✓ Published' : publishing === p.id ? 'Publishing…' : 'Publish'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* The public gallery */}
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-text-soft mb-3">
          {loading ? 'Loading…' : `${items.length} published app${items.length === 1 ? '' : 's'}`}
        </h2>

        {!loading && items.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">
            <p className="text-sm">No apps published yet.</p>
            {mine.length > 0 && <p className="text-xs mt-1">Be the first — publish one of your apps above.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => setOpen(it)}
                className="flex flex-col rounded-2xl overflow-hidden bg-surface border border-border/60 hover:border-border transition-all text-left group"
              >
                <div className="relative h-52 bg-white overflow-hidden">
                  <iframe
                    title={it.appName}
                    src={galleryAppUrl(it.id)}
                    sandbox="allow-scripts"
                    scrolling="no"
                    className="border-0 origin-top-left pointer-events-none"
                    style={{ width: '200%', height: '200%', transform: 'scale(0.5)' }}
                  />
                  <div className="absolute inset-0 group-hover:bg-primary/5 transition-colors flex items-end justify-center pb-2">
                    <span className="text-[10px] font-semibold text-white bg-black/60 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Open live</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border/50">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: it.primary }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{it.appName}</p>
                    {it.description && <p className="text-[10px] text-text-secondary truncate">{it.description}</p>}
                  </div>
                  <span className="text-[10px] text-text-soft flex-shrink-0">{it.views} views</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Full-screen open */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col" onClick={() => setOpen(null)}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-semibold text-white">{open.appName}</span>
            <div className="flex items-center gap-2">
              <a href={galleryAppUrl(open.id)} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-white/80 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all">Open in new tab ↗</a>
              <button onClick={() => setOpen(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10" aria-label="Close">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <iframe title={open.appName} src={galleryAppUrl(open.id)} sandbox="allow-scripts" className="w-[420px] h-full max-h-[860px] rounded-2xl bg-white border-0 shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
