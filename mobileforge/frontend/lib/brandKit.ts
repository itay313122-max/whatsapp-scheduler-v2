// brandKit.ts — client-side storage for an uploaded brand kit.
//
// We store the RAW uploaded JSON (any supported format: Figma/W3C tokens,
// Tokens Studio, Tailwind theme, or a flat kit) and let the backend do the
// authoritative parse + enforcement. Here we only persist it per-project and
// provide a lightweight summary for UI confirmation.

const keyFor = (projectId?: string) => `mf_brandkit_${projectId || 'global'}`;

export interface BrandKitSummary {
  colors: number;
  hasRadii: boolean;
  hasFonts: boolean;
}

/** Store the raw kit text for a project. Pass null to clear. */
export function storeBrandKit(projectId: string | undefined, raw: string | null): void {
  try {
    if (raw == null) localStorage.removeItem(keyFor(projectId));
    else localStorage.setItem(keyFor(projectId), raw);
  } catch {
    /* storage unavailable — non-fatal */
  }
}

/** Load the parsed kit object for a project, or null if none/invalid. */
export function loadBrandKit(projectId?: string): unknown {
  try {
    const raw = localStorage.getItem(keyFor(projectId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** A quick, format-agnostic summary for the UI — counts hex colors anywhere in
    the JSON and flags radius/font presence. Not authoritative (the backend's
    parser is), just enough to confirm "your kit loaded". */
export function summarizeBrandKit(raw: string): BrandKitSummary | null {
  try {
    JSON.parse(raw); // validate it's JSON at all
  } catch {
    return null;
  }
  const hexes = raw.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  const uniqueColors = new Set(hexes.map((h) => h.toLowerCase())).size;
  return {
    colors: uniqueColors,
    hasRadii: /radi|rounded|corner/i.test(raw),
    hasFonts: /font|typeface|family/i.test(raw),
  };
}
