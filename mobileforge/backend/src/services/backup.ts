import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const MAX_BACKUPS = 10;

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function createBackup(): { file: string; size: number; stores: string[] } {
  ensureDir(BACKUP_DIR);
  const stores: string[] = [];
  const bundle: Record<string, unknown> = {};

  for (const name of ['feedback', 'shares', 'live']) {
    const src = path.join(DATA_DIR, `${name}.json`);
    if (fs.existsSync(src)) {
      bundle[name] = JSON.parse(fs.readFileSync(src, 'utf8'));
      stores.push(name);
    }
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(BACKUP_DIR, `backup-${ts}.json`);
  const data = JSON.stringify({ version: 1, createdAt: Date.now(), stores: bundle }, null, 2);
  fs.writeFileSync(file, data);

  pruneOldBackups();

  return { file: path.basename(file), size: data.length, stores };
}

export function listBackups(): { file: string; size: number; createdAt: string }[] {
  ensureDir(BACKUP_DIR);
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
    .map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      return { file: f, size: stat.size, createdAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function restoreBackup(filename: string): { restored: string[] } {
  const safe = path.basename(filename);
  const file = path.join(BACKUP_DIR, safe);
  if (!fs.existsSync(file)) throw new Error('Backup not found');

  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!raw.stores || typeof raw.stores !== 'object') throw new Error('Invalid backup format');

  const restored: string[] = [];
  for (const [name, data] of Object.entries(raw.stores)) {
    const dest = path.join(DATA_DIR, `${name}.json`);
    fs.writeFileSync(dest, JSON.stringify(data));
    restored.push(name);
  }

  return { restored };
}

export function getBackupData(filename: string): string {
  const safe = path.basename(filename);
  const file = path.join(BACKUP_DIR, safe);
  if (!fs.existsSync(file)) throw new Error('Backup not found');
  return fs.readFileSync(file, 'utf8');
}

function pruneOldBackups() {
  const backups = listBackups();
  if (backups.length <= MAX_BACKUPS) return;
  for (const old of backups.slice(MAX_BACKUPS)) {
    try { fs.unlinkSync(path.join(BACKUP_DIR, old.file)); } catch { /* ignore */ }
  }
}

// Scheduled auto-backup: every 6 hours (only if data exists).
const SIX_HOURS = 6 * 60 * 60 * 1000;
const autoBackupTimer = setInterval(() => {
  try {
    const hasData = ['feedback', 'shares', 'live'].some(
      n => fs.existsSync(path.join(DATA_DIR, `${n}.json`))
    );
    if (hasData) {
      const result = createBackup();
      console.log(`[backup] auto-backup created: ${result.file} (${result.stores.join(', ')})`);
    }
  } catch (e) {
    console.warn('[backup] auto-backup failed:', (e as Error).message);
  }
}, SIX_HOURS);
autoBackupTimer.unref?.();
