// Test runner: bundles the .mjs test files (so Node doesn't trip over the
// ESM `export` syntax in the .js source, which its nearest package.json marks
// as CommonJS), then runs them with Node's built-in test runner.
//
// Usage:
//   node tests/run.mjs unit          # unit tests only (no emulator needed)
//   node tests/run.mjs integration   # emulator tests only
//   node tests/run.mjs all           # everything
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '.build');

const GROUPS = {
  unit: ['inviteCode.test.mjs', 'authErrors.test.mjs'],
  integration: [
    'auth.integration.test.mjs',
    'group.integration.test.mjs',
    'feed.integration.test.mjs',
  ],
};

const which = process.argv[2] || 'all';
const files =
  which === 'all'
    ? [...GROUPS.unit, ...GROUPS.integration]
    : GROUPS[which] || [];

if (files.length === 0) {
  console.error(`Unknown test group: ${which} (use unit | integration | all)`);
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: files.map((f) => join(here, f)),
  outdir: outDir,
  outExtension: { '.js': '.cjs' },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  logLevel: 'warning',
});

const built = readdirSync(outDir).filter((f) => f.endsWith('.cjs'));
// --test-force-exit: the Firebase SDK keeps gRPC connections open, so the
// test process won't exit on its own after the tests finish. Force it.
const res = spawnSync(
  process.execPath,
  ['--test', '--test-force-exit', ...built.map((f) => join(outDir, f))],
  { stdio: 'inherit' }
);
process.exit(res.status ?? 1);
