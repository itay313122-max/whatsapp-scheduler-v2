// Build a self-contained HTML document from an app JSX file.
//   node --import tsx experiments/build.ts <in.jsx> <out.html> [title]
// Run from mobileforge/backend so tsx + deps resolve.
import fs from 'fs';
import path from 'path';
import { buildHtmlDocument } from '../backend/src/services/webRenderer';

const [, , inFile, outFile, title] = process.argv;
if (!inFile || !outFile) {
  console.error('usage: node --import tsx experiments/build.ts <in.jsx> <out.html> [title]');
  process.exit(1);
}
const code = fs.readFileSync(path.resolve(inFile), 'utf8');
const html = buildHtmlDocument(code, title || 'MobileForge App');
fs.writeFileSync(path.resolve(outFile), html);
console.log('built', outFile, html.length, 'bytes');
