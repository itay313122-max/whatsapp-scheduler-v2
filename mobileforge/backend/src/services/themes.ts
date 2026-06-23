/**
 * Design themes — concrete, opinionated visual presets the user can pick.
 * Each theme injects precise color/typography/radius/component guidance into
 * the generation system prompt so "design per request" is consistent, not vague.
 */

export interface ThemeMeta {
  id: string;
  name: string;        // Hebrew label for the UI
  swatches: string[];  // 3 colors for a preview chip [bg, accent, text/secondary]
}

export const THEME_LIST: ThemeMeta[] = [
  { id: 'minimal-white', name: 'לבן מינימלי', swatches: ['#ffffff', '#111827', '#6B7280'] },
  { id: 'dark-premium',  name: 'כהה פרימיום', swatches: ['#0B0B0F', '#7C5CFF', '#F4F4F6'] },
  { id: 'vibrant',       name: 'צבעוני נועז', swatches: ['#ffffff', '#FF5A5F', '#2563EB'] },
  { id: 'ios-native',    name: 'iOS נקי',     swatches: ['#F2F2F7', '#007AFF', '#8E8E93'] },
  { id: 'material',      name: 'Material',    swatches: ['#ffffff', '#6750A4', '#625B71'] },
];

const THEME_PROMPTS: Record<string, string> = {
  'minimal-white': `
━━━ ACTIVE DESIGN THEME — MINIMAL WHITE (FOLLOW EXACTLY) ━━━
- Background: pure #FFFFFF. App surface clean and airy with generous whitespace.
- ONE accent color: near-black #111827, used sparingly for primary buttons only.
- Text: #111827; secondary text #6B7280.
- Cards: white, 1px solid #F1F5F9 border, NO heavy shadow, border-radius 16px.
- Icons: thin 1.5 stroke SVG in #111827.
- Typography: large bold headings, clean and quiet. No gradients, no glows.`,

  'dark-premium': `
━━━ ACTIVE DESIGN THEME — DARK PREMIUM (FOLLOW EXACTLY) ━━━
- Background: #0B0B0F. Elevated surfaces #16161C and #1E1E26.
- ONE vibrant accent: #7C5CFF for primary actions and active states.
- Text: #F4F4F6; secondary text #9CA3AF.
- Cards: dark surface, 1px border #26262E, border-radius 18px, soft shadow.
- Icons: 1.5 stroke SVG in #F4F4F6 (accent #7C5CFF when active).
- Set --c-bg/surface/text CSS vars to these dark values. High-contrast, premium feel.`,

  'vibrant': `
━━━ ACTIVE DESIGN THEME — VIBRANT & BOLD (FOLLOW EXACTLY) ━━━
- Background: white or very light. Pick ONE bold solid accent for the whole app
  (one of #FF5A5F, #16C784, #2563EB, #F59E0B) and use it confidently.
- Large rounded corners: border-radius 20–24px. Chunky, tappable buttons.
- Strong solid color blocks, high contrast, playful but clean.
- NO gradients. Text #111827 / secondary #6B7280. Thin SVG icons.`,

  'ios-native': `
━━━ ACTIVE DESIGN THEME — iOS NATIVE (FOLLOW EXACTLY) ━━━
- Background: #F2F2F7 (system grouped). White grouped list cells with hairline
  separators (#E5E5EA), border-radius 12px on grouped sections.
- Accent: system blue #007AFF. Secondary text #8E8E93.
- Large bold navigation title at the top. Segmented controls and switch toggles.
- Clean SF-style spacing, bottom tab bar. Thin SVG icons. Subtle, refined.`,

  'material': `
━━━ ACTIVE DESIGN THEME — MATERIAL DESIGN (FOLLOW EXACTLY) ━━━
- Background: #FFFFFF; surfaces #F7F7FB. Primary accent #6750A4 (Material You).
- Elevation via SOFT shadows (not borders). Border-radius 12–16px.
- Filled tonal buttons; a circular FAB (bottom-right) for the primary action.
- Clear type scale, secondary text #625B71. Thin SVG icons in the accent color.`,
};

/** Returns the injectable prompt block for a theme, or '' if unknown/none. */
export function getThemePrompt(themeId?: string): string {
  if (!themeId) return '';
  return THEME_PROMPTS[themeId] || '';
}

export function isValidTheme(themeId?: string): boolean {
  return !!themeId && themeId in THEME_PROMPTS;
}
