// brandTokens.ts — multi-format brand-kit token parsing.
//
// Accepts the formats designers actually have on hand and normalizes them into
// one token shape the generator can enforce. Supported inputs (all JSON):
//   1. W3C Design Tokens / Figma variables export:
//        { "color": { "primary": { "$value": "#6366F1", "$type": "color" } } }
//   2. Tokens Studio (Figma plugin) export:
//        { "global": { "primary": { "value": "#6366F1", "type": "color" } } }
//   3. Tailwind theme as JSON (tailwind.config theme/extend serialized):
//        { "theme": { "extend": { "colors": {...}, "borderRadius": {...}, "fontFamily": {...} } } }
//   4. Plain flat kit: { "colors": {...}, "radii": {...}, "fonts": {...} }
//
// JS tailwind.config files must be converted to JSON by the caller (we never
// eval user code). Parsing is best-effort and lossy by design: we harvest
// colors, radii, and font families — the three token families the generator
// actually enforces — and ignore everything else.

export interface BrandTokens {
  colors: Record<string, string>;  // name → #hex
  radii: Record<string, string>;   // name → CSS length ('12px')
  fonts: Record<string, string>;   // name → font-family string
}

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;

const isHex = (v: unknown): v is string => typeof v === 'string' && HEX_RE.test(v.trim());

/** '12px' | '0.75rem' | 12 → normalized CSS length, or null if unusable. */
function normalizeLength(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return `${v}px`;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(s)) return s;
  if (/^\d+(\.\d+)?$/.test(s)) return `${s}px`;
  if (s === '9999px' || s === 'full') return '9999px';
  return null;
}

function normalizeFont(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (Array.isArray(v) && v.length) return v.map(String).join(', ');
  return null;
}

// Walk an arbitrary token tree collecting leaves. A "leaf" is either a direct
// primitive, or a {$value}/{value} wrapper (W3C / Tokens Studio). Names join
// the path with '-' ('color.brand.primary' → 'brand-primary' under colors).
function walk(
  node: unknown,
  path: string[],
  visit: (path: string[], value: unknown, type?: string) => void
): void {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    visit(path, node);
    return;
  }
  const obj = node as Record<string, unknown>;
  const wrappedValue = '$value' in obj ? obj.$value : 'value' in obj ? obj.value : undefined;
  if (wrappedValue !== undefined) {
    const type = (obj.$type ?? obj.type) as string | undefined;
    visit(path, wrappedValue, type);
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue; // $description, $extensions, …
    walk(v, [...path, k], visit);
  }
}

const FAMILY_HINTS = {
  color: /color|palette|fill|accent|brand|background|surface|text/i,
  radius: /radius|radii|rounded|corner/i,
  font: /font|typeface|family|typography/i,
};

/**
 * Parse any supported brand-kit JSON into normalized tokens.
 * Never throws on shape problems — returns whatever it could harvest, and an
 * empty kit ({} everywhere) for unusable input, so callers can degrade softly.
 */
export function parseBrandTokens(input: unknown): BrandTokens {
  const out: BrandTokens = { colors: {}, radii: {}, fonts: {} };
  let root = input;

  if (typeof root === 'string') {
    try { root = JSON.parse(root); } catch { return out; }
  }
  if (root === null || typeof root !== 'object') return out;

  // Tailwind: hoist theme/extend so its families are walked like any other tree.
  const r = root as Record<string, unknown>;
  if (r.theme && typeof r.theme === 'object') {
    const theme = r.theme as Record<string, unknown>;
    const extend = (theme.extend ?? {}) as Record<string, unknown>;
    root = { ...theme, ...extend };
    delete (root as Record<string, unknown>).extend;
  }

  // Token name: drop the leading family-container segment only ('color.surface'
  // → 'surface'), never inner segments — 'surface' itself matches the color
  // hint and must survive as a name.
  const nameFor = (path: string[], familyRe: RegExp) =>
    (path.length > 1 && familyRe.test(path[0]) ? path.slice(1) : path).join('-');

  walk(root, [], (path, value, type) => {
    if (!path.length) return;
    const joined = path.join('-');
    // A token's family comes from its declared $type first, else from path hints.
    const familyKey = type ?? path.find((p) => FAMILY_HINTS.color.test(p) || FAMILY_HINTS.radius.test(p) || FAMILY_HINTS.font.test(p)) ?? '';

    if ((type === 'color' || FAMILY_HINTS.color.test(familyKey) || isHex(value)) && isHex(value)) {
      out.colors[nameFor(path, FAMILY_HINTS.color)] = (value as string).trim();
      return;
    }
    if (type === 'borderRadius' || (type === 'dimension' && FAMILY_HINTS.radius.test(joined)) || FAMILY_HINTS.radius.test(familyKey)) {
      const len = normalizeLength(value);
      if (len) out.radii[nameFor(path, FAMILY_HINTS.radius)] = len;
      return;
    }
    if (type === 'fontFamilies' || type === 'fontFamily' || FAMILY_HINTS.font.test(familyKey)) {
      const fam = normalizeFont(value);
      if (fam) out.fonts[nameFor(path, FAMILY_HINTS.font)] = fam;
    }
  });

  return out;
}

/** True when the kit carries at least one usable token. */
export function hasTokens(kit: BrandTokens): boolean {
  return Object.keys(kit.colors).length > 0 || Object.keys(kit.radii).length > 0 || Object.keys(kit.fonts).length > 0;
}

/**
 * Render tokens as a prompt fragment the generator appends to its system
 * prompt, so generated apps USE the brand instead of inventing one. This is
 * the anti-"token drift" enforcement: named values, stated as hard rules.
 */
export function brandTokensToPromptFragment(kit: BrandTokens): string {
  if (!hasTokens(kit)) return '';
  const lines: string[] = ['', 'BRAND KIT — HARD CONSTRAINTS (the user uploaded their brand; obey it exactly):'];
  const colorEntries = Object.entries(kit.colors);
  if (colorEntries.length) {
    lines.push('COLORS (use ONLY these for accents/branding; neutrals may complement them):');
    for (const [name, hex] of colorEntries.slice(0, 12)) lines.push(`  ${name}: ${hex}`);
    const primary = kit.colors.primary ?? colorEntries[0][1];
    lines.push(`Set --c-primary to ${primary}. Do NOT introduce other vibrant accent colors.`);
  }
  const radiusEntries = Object.entries(kit.radii);
  if (radiusEntries.length) {
    lines.push('CORNER RADII (use ONLY these values):');
    for (const [name, v] of radiusEntries.slice(0, 6)) lines.push(`  ${name}: ${v}`);
  }
  const fontEntries = Object.entries(kit.fonts);
  if (fontEntries.length) {
    lines.push('FONTS (use ONLY these families):');
    for (const [name, v] of fontEntries.slice(0, 4)) lines.push(`  ${name}: ${v}`);
  }
  lines.push('Every screen must use the SAME tokens — no drift between screens.');
  return lines.join('\n');
}
