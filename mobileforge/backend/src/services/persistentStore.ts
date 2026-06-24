import fs from 'fs';
import path from 'path';

/**
 * Zero-dependency, file-backed key→value store.
 *
 * Survives server restarts without Redis/SQLite/Firebase — matching MobileForge's
 * self-contained philosophy. Writes are debounced and atomic (tmp + rename) so a
 * crash mid-write never corrupts the data file. Used for shared apps and live
 * session docs, both of which previously lived only in memory and vanished on
 * every restart.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data');

export class PersistentStore<T> {
  private map = new Map<string, T>();
  private file: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(name: string) {
    this.file = path.join(DATA_DIR, `${name}.json`);
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.file)) {
        const raw = fs.readFileSync(this.file, 'utf8');
        const obj = JSON.parse(raw) as Record<string, T>;
        for (const [k, v] of Object.entries(obj)) this.map.set(k, v);
        console.log(`[store] loaded ${this.map.size} entries from ${path.basename(this.file)}`);
      }
    } catch (e) {
      console.warn(`[store] failed to load ${this.file}:`, (e as Error).message);
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.flush();
    }, 500);
    // Don't keep the event loop alive just for a pending flush.
    this.saveTimer.unref?.();
  }

  /** Write the whole map to disk atomically. Safe to call any time. */
  flush(): void {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const obj: Record<string, T> = {};
      for (const [k, v] of this.map) obj[k] = v;
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(obj));
      fs.renameSync(tmp, this.file);
    } catch (e) {
      console.warn(`[store] failed to save ${this.file}:`, (e as Error).message);
    }
  }

  get(k: string): T | undefined {
    return this.map.get(k);
  }

  set(k: string, v: T): void {
    this.map.set(k, v);
    this.scheduleSave();
  }

  delete(k: string): boolean {
    const removed = this.map.delete(k);
    if (removed) this.scheduleSave();
    return removed;
  }

  has(k: string): boolean {
    return this.map.has(k);
  }

  get size(): number {
    return this.map.size;
  }

  entries(): IterableIterator<[string, T]> {
    return this.map.entries();
  }

  [Symbol.iterator](): IterableIterator<[string, T]> {
    return this.map[Symbol.iterator]();
  }
}
