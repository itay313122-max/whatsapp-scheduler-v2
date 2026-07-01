// qualityGate.ts — static quality analysis for generated apps.
//
// WHY THIS EXISTS
// ---------------
// Google Stitch generates in two phases: it first produces a *blueprint*
// (the set of screens + the navigation graph between them) and then renders
// pixels that must satisfy that blueprint — every screen reachable, every
// control wired. We generate in one shot, so nothing guarantees the contract.
// The two failure modes that leak through are:
//   1. DEAD BUTTONS    — a clickable element with no working handler.
//   2. UNLINKED SCREENS — a screen the code defines but nothing ever navigates to.
//
// This module reconstructs the blueprint *from the generated code* (which
// screens exist, which are reachable, which controls have engines) and reports
// the gaps. It is intentionally dependency-free (regex/heuristic, no Babel) so
// it can run on every generation with negligible cost. False positives are
// tuned down deliberately — we only flag things we are fairly confident about,
// because a noisy gate that cries wolf gets ignored.

export interface QualityIssue {
  kind: 'dead-button' | 'unlinked-screen' | 'no-navigation' | 'empty-handler' | 'missing-screen'
    | 'img-no-alt' | 'icon-button-no-label' | 'touch-target-small';
  severity: 'error' | 'warn';
  message: string;
  /** Best-effort source snippet so a human (or the repair prompt) can locate it. */
  evidence?: string;
}

/** A navigation edge reconstructed from the code: screen `from` links to `to`. */
export interface NavEdge { from: string; to: string }

export interface QualityReport {
  ok: boolean;
  score: number; // 0..100, higher is better
  issues: QualityIssue[];
  blueprint: {
    navStateVars: string[];
    definedScreens: string[];
    reachableScreens: string[];
    /** Navigation graph: which screen links to which (best-effort, switch/case). */
    edges: NavEdge[];
    buttonCount: number;
    wiredButtonCount: number;
  };
}

// Strip comments only. We deliberately KEEP string literals intact, because the
// screen identifiers we need to read (setScreen('profile'), case 'home':) live
// inside those literals. Blanking them would erase the very blueprint we want.
function stripNoise(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

// Identify the state variable(s) that drive screen/tab navigation, and their
// initial values. We look for the canonical `const [x, setX] = useState('init')`
// where x is one of the well-known navigation nouns.
const NAV_NOUNS = /(screen|tab|active(?:tab|screen|view|page)?|view|page|route|step|section)/i;

function findNavState(code: string): { vars: string[]; setters: string[]; initials: string[] } {
  const vars: string[] = [];
  const setters: string[] = [];
  const initials: string[] = [];
  const re = /const\s*\[\s*([A-Za-z0-9_]+)\s*,\s*(set[A-Za-z0-9_]+)\s*\]\s*=\s*useState\s*\(\s*(['"])([^'"]*)\3/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const [, varName, setterName, , initial] = m;
    if (NAV_NOUNS.test(varName) || NAV_NOUNS.test(setterName)) {
      vars.push(varName);
      setters.push(setterName);
      if (initial) initials.push(initial);
    }
  }
  return { vars: uniq(vars), setters: uniq(setters), initials: uniq(initials) };
}

// Screens the code *defines* — i.e. branches of the render that correspond to a
// nav value. We accept the common shapes:
//   case 'home':            (switch in renderContent)
//   screen === 'home'       (conditional render)
//   { home: <Home/>, ... }  (lookup map) — captured loosely as `home:`
function findDefinedScreens(code: string, navVars: string[]): string[] {
  const found: string[] = [];

  // case 'x':
  const caseRe = /case\s+(['"])([^'"]+)\1\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = caseRe.exec(code))) found.push(m[2]);

  // navVar === 'x'  /  'x' === navVar
  for (const v of navVars) {
    const eqRe = new RegExp(`(?:${v}\\s*===?\\s*(['"])([^'"]+)\\1)|(?:(['"])([^'"]+)\\3\\s*===?\\s*${v})`, 'g');
    while ((m = eqRe.exec(code))) found.push(m[2] || m[4]);
  }

  return uniq(found.filter(Boolean));
}

// Screens that are *reachable* — any value passed to a navigation setter, plus
// the initial useState values (the landing screen is reachable by definition).
function findReachableScreens(code: string, setters: string[], initials: string[]): string[] {
  const reached: string[] = [...initials];
  for (const s of setters) {
    const re = new RegExp(`${s}\\s*\\(\\s*(['"])([^'"]+)\\1`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) reached.push(m[2]);
  }
  return uniq(reached.filter(Boolean));
}

// Reconstruct the navigation GRAPH (which screen links to which). We slice the
// code at screen-branch boundaries — both `case 'X':` (switch) AND `navVar === 'X'`
// (conditional render, the other shape the prompt suggests) — so each slice is
// the render for screen X, then find the setScreen('Y') calls inside it → edge
// X→Y. Best-effort; a global nav bar (rendered before the first branch) is
// attributed to the landing screen so the bar still shows as connected.
function findNavEdges(code: string, setters: string[], navVars: string[], definedScreens: string[], landing: string): NavEdge[] {
  if (!setters.length || definedScreens.length < 2) return [];
  const setterAlt = setters.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const callRe = new RegExp(`(?:${setterAlt})\\s*\\(\\s*['"]([^'"]+)['"]`, 'g');

  // Collect branch markers from BOTH shapes, then sort by position so slicing
  // between consecutive markers yields each screen's render body regardless of
  // whether the app used switch/case or if/=== conditionals.
  const markers: { id: string; start: number }[] = [];
  let m: RegExpExecArray | null;

  const caseRe = /case\s+['"]([^'"]+)['"]\s*:/g;
  while ((m = caseRe.exec(code))) markers.push({ id: m[1], start: m.index + m[0].length });

  for (const v of navVars) {
    const vEsc = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const eqRe = new RegExp(`(?:${vEsc}\\s*===?\\s*(['"])([^'"]+)\\1)|(?:(['"])([^'"]+)\\3\\s*===?\\s*${vEsc})`, 'g');
    while ((m = eqRe.exec(code))) markers.push({ id: m[2] || m[4], start: m.index + m[0].length });
  }

  markers.sort((a, b) => a.start - b.start);

  const edges: NavEdge[] = [];
  const seen = new Set<string>();
  const push = (from: string, to: string) => {
    if (from === to) return; // self-nav (re-render) isn't an edge worth showing
    const k = `${from}>${to}`;
    if (seen.has(k)) return;
    seen.add(k); edges.push({ from, to });
  };

  if (markers.length) {
    // Code before the first branch (shared header / nav bar) → attribute to landing.
    const preamble = code.slice(0, markers[0].start);
    callRe.lastIndex = 0;
    while ((m = callRe.exec(preamble))) push(landing, m[1]);

    for (let i = 0; i < markers.length; i++) {
      const from = markers[i].id;
      const body = code.slice(markers[i].start, i + 1 < markers.length ? markers[i + 1].start : code.length);
      callRe.lastIndex = 0;
      while ((m = callRe.exec(body))) push(from, m[1]);
    }
  }
  return edges;
}

// Count buttons and how many carry a real handler. We treat as "clickable":
//   <button ...>, role="button", .nav-tab / .btn-* class elements with onClick.
// A button is "wired" if it has onClick={...non-empty...} OR type="submit"
// (a submit button is driven by the form's onSubmit, which is a valid engine).
function analyzeButtons(rawCode: string): {
  total: number;
  wired: number;
  dead: QualityIssue[];
  emptyHandlers: QualityIssue[];
} {
  const dead: QualityIssue[] = [];
  const emptyHandlers: QualityIssue[] = [];
  let total = 0;
  let wired = 0;

  // Match each <button ...> opening tag. We must allow `>` when it's part of an
  // arrow function (`=>`) inside an inline onClick, otherwise the capture stops
  // mid-attribute at the arrow and we misread the handler. `(?:=>|[^>])*` consumes
  // arrows as a unit and any other non-`>` char, then a real closing `>`.
  const tagRe = /<button\b((?:=>|[^>])*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(rawCode))) {
    total++;
    const attrs = m[1];
    const hasOnClick = /onClick\s*=\s*\{/.test(attrs);
    const isSubmit = /type\s*=\s*["']submit["']/.test(attrs);
    // Empty/no-op handler: onClick={() => {}} or onClick={()=>{}} or onClick={undefined}
    const emptyHandler = /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(attrs) ||
      /onClick\s*=\s*\{\s*undefined\s*\}/.test(attrs) ||
      /onClick\s*=\s*\{\s*null\s*\}/.test(attrs);

    if (isSubmit) { wired++; continue; }
    if (!hasOnClick) {
      dead.push({
        kind: 'dead-button',
        severity: 'error',
        message: 'A <button> has no onClick handler and is not a form submit — it does nothing when tapped.',
        evidence: m[0].slice(0, 120),
      });
      continue;
    }
    if (emptyHandler) {
      emptyHandlers.push({
        kind: 'empty-handler',
        severity: 'error',
        message: 'A <button> has an empty onClick (() => {}) — visually present but functionally dead.',
        evidence: m[0].slice(0, 120),
      });
      continue;
    }
    wired++;
  }

  return { total, wired, dead, emptyHandlers };
}

// Accessibility checks (a documented Stitch weakness — "designs often fail basic
// contrast and touch-target requirements"). We statically catch the reliably-
// detectable issues: images without alt text, icon-only buttons with no
// accessible label, and clickable elements with an explicitly tiny hit area.
// These are 'warn' severity — they surface and nudge the score, but don't fail
// the functional gate or trigger the repair loop.
function analyzeAccessibility(rawCode: string): QualityIssue[] {
  const issues: QualityIssue[] = [];

  // 1. Images missing alt text.
  const imgRe = /<img\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  let imgNoAlt = 0;
  while ((m = imgRe.exec(rawCode))) {
    if (!/\balt\s*=/.test(m[1])) imgNoAlt++;
  }
  if (imgNoAlt > 0) {
    issues.push({
      kind: 'img-no-alt',
      severity: 'warn',
      message: `${imgNoAlt} image${imgNoAlt > 1 ? 's are' : ' is'} missing alt text — screen readers can't describe ${imgNoAlt > 1 ? 'them' : 'it'}.`,
    });
  }

  // 2. Icon-only buttons with no accessible label: a <button> whose entire body
  //    is an <svg> (icon) with no visible text, and no aria-label / title / aria-labelledby.
  const iconBtnRe = /<button\b((?:=>|[^>])*)>\s*<svg[\s\S]*?<\/svg>\s*<\/button>/gi;
  let iconNoLabel = 0;
  while ((m = iconBtnRe.exec(rawCode))) {
    const attrs = m[1];
    if (!/aria-label\s*=|title\s*=|aria-labelledby\s*=/.test(attrs)) iconNoLabel++;
  }
  if (iconNoLabel > 0) {
    issues.push({
      kind: 'icon-button-no-label',
      severity: 'warn',
      message: `${iconNoLabel} icon-only button${iconNoLabel > 1 ? 's have' : ' has'} no aria-label — unusable for screen-reader users.`,
    });
  }

  // 3. Tiny touch targets: a clickable element with an explicit inline height or
  //    width under 36px. Conservative threshold to avoid false positives (the
  //    design system's own buttons are 44–52px).
  const smallRe = /<(?:button|a)\b[^>]*style=\{\{[^}]*?(?:height|width)\s*:\s*['"]?(\d{1,2})(px)?['"]?[^}]*\}\}/gi;
  let tiny = 0;
  while ((m = smallRe.exec(rawCode))) {
    const px = parseInt(m[1], 10);
    if (Number.isFinite(px) && px > 0 && px < 36) tiny++;
  }
  if (tiny > 0) {
    issues.push({
      kind: 'touch-target-small',
      severity: 'warn',
      message: `${tiny} tap target${tiny > 1 ? 's are' : ' is'} under 36px — below the 44px minimum for comfortable touch.`,
    });
  }

  return issues;
}

/**
 * Analyze generated App.jsx and return a quality report describing the
 * reconstructed blueprint plus any dead-UI / unreachable-screen issues.
 *
 * @param expectedScreens Optional blueprint screen ids (the Ideate contract).
 *        When provided, the gate also verifies every promised screen exists in
 *        the code — catching screens the model silently dropped.
 */
export function analyzeQuality(appJsx: string, expectedScreens?: string[]): QualityReport {
  const issues: QualityIssue[] = [];
  if (!appJsx || appJsx.length < 100) {
    return {
      ok: false,
      score: 0,
      issues: [{ kind: 'no-navigation', severity: 'error', message: 'Empty or trivially-short app code.' }],
      blueprint: { navStateVars: [], definedScreens: [], reachableScreens: [], edges: [], buttonCount: 0, wiredButtonCount: 0 },
    };
  }

  const clean = stripNoise(appJsx);

  const nav = findNavState(clean);
  const definedScreens = findDefinedScreens(clean, nav.vars);
  const reachableScreens = findReachableScreens(clean, nav.setters, nav.initials);
  const landing = nav.initials[0] || definedScreens[0] || '';
  const edges = findNavEdges(clean, nav.setters, nav.vars, definedScreens, landing);

  // Dead buttons / empty handlers run on the RAW code (we need the real
  // attribute text), but string-noise inside attrs is rare enough not to matter.
  const buttons = analyzeButtons(appJsx);
  issues.push(...buttons.dead, ...buttons.emptyHandlers);

  // Accessibility (warn-level) — a documented Stitch weakness we verify.
  const a11yIssues = analyzeAccessibility(appJsx);
  issues.push(...a11yIssues);

  // Unlinked screens: defined but never reachable. The landing screen counts as
  // reachable via the initial state, so it won't be flagged.
  const unlinked = definedScreens.filter((s) => !reachableScreens.includes(s));
  for (const s of unlinked) {
    issues.push({
      kind: 'unlinked-screen',
      severity: 'error',
      message: `Screen "${s}" is defined in the render but nothing ever navigates to it — it is unreachable.`,
      evidence: s,
    });
  }

  // Blueprint coverage: every screen the Ideate phase promised must exist in the
  // code. We match loosely (a defined screen id contains the expected id or vice
  // versa) to tolerate minor naming drift (e.g. "detail" vs "productdetail").
  if (expectedScreens && expectedScreens.length) {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const have = definedScreens.map(norm);
    for (const exp of expectedScreens) {
      const e = norm(exp);
      const present = have.some((d) => d === e || d.includes(e) || e.includes(d));
      if (!present) {
        issues.push({
          kind: 'missing-screen',
          severity: 'error',
          message: `Blueprint promised a "${exp}" screen but the generated code never defines it.`,
          evidence: exp,
        });
      }
    }
  }

  // Multi-screen app with no navigation setter at all → the tabs/links are decorative.
  if (definedScreens.length > 1 && nav.setters.length === 0) {
    issues.push({
      kind: 'no-navigation',
      severity: 'error',
      message: `App defines ${definedScreens.length} screens but has no navigation setter — the screens can't be switched.`,
    });
  }

  // Score: start at 100, subtract per issue (errors hurt more), floor at 0.
  const A11Y = new Set(['img-no-alt', 'icon-button-no-label', 'touch-target-small']);
  let score = 100;
  for (const it of issues) {
    if (it.severity === 'error') score -= 18;
    else if (A11Y.has(it.kind)) score -= 4;  // accessibility warnings weigh lighter
    else score -= 7;
  }
  score = Math.max(0, score);

  return {
    ok: issues.filter((i) => i.severity === 'error').length === 0,
    score,
    issues,
    blueprint: {
      navStateVars: nav.vars,
      definedScreens,
      reachableScreens,
      edges,
      buttonCount: buttons.total,
      wiredButtonCount: buttons.wired,
    },
  };
}

/**
 * Build a focused repair instruction the model can act on. Returns null when
 * there is nothing worth repairing (so callers can skip the round-trip).
 *
 * The instructions are issue-SPECIFIC and prescriptive: a generic "fix dead UI"
 * prompt let the model reproduce the same bug (observed live), so each defect now
 * names the exact symbol and the exact edit that resolves it.
 */
export function buildRepairPrompt(report: QualityReport): string | null {
  const errors = report.issues.filter((i) => i.severity === 'error');
  if (errors.length === 0) return null;

  // Identify the navigation setter so the fix can name it concretely (the model
  // is far more reliable when told `setScreen('profile')` than "the nav setter").
  const setter = report.blueprint.navStateVars.length
    ? `set${report.blueprint.navStateVars[0].charAt(0).toUpperCase()}${report.blueprint.navStateVars[0].slice(1)}`
    : 'setScreen';

  const steps: string[] = [];
  for (const e of errors) {
    if (e.kind === 'unlinked-screen' || e.kind === 'missing-screen') {
      const id = e.evidence || 'that screen';
      steps.push(
        `Screen "${id}" is unreachable. Add a REAL, tappable control that runs ${setter}('${id}') — ` +
        `put it in the bottom navigation bar (a nav tab) AND/OR as a button/list-item on a screen the user already sees. ` +
        `Every screen must have at least one path to it. If "${id}" is truly not needed, delete its render branch entirely.`
      );
    } else if (e.kind === 'dead-button') {
      steps.push(
        `A <button> has no onClick. Give EVERY button a real onClick that navigates (${setter}(...)), ` +
        `toggles state, opens a modal, or performs the action its label implies. No decorative buttons.`
      );
    } else if (e.kind === 'empty-handler') {
      steps.push(
        `A <button> has an empty onClick (() => {}). Replace it with a real action — navigation, state change, or modal. ` +
        `If the button has no purpose, remove it.`
      );
    } else if (e.kind === 'no-navigation') {
      steps.push(
        `The app defines multiple screens but has no working navigation. Add a bottom nav bar whose tabs call ${setter}(...) ` +
        `for each screen, and make the initial screen render correctly.`
      );
    }
  }

  // Piggyback accessibility warnings onto the repair we're ALREADY doing — free
  // quality with no extra round-trip (a11y warns alone never trigger a repair).
  const a11y = report.issues.filter((i) => ['img-no-alt', 'icon-button-no-label', 'touch-target-small'].includes(i.kind));
  const a11ySteps = a11y.map((e) => `While you're here, also fix: ${e.message} (add alt="..."/aria-label, keep tap targets ≥44px).`);

  return [
    'The previous app has QUALITY DEFECTS that MUST be fixed. Change ONLY what is needed to fix them; keep all other code, styles, and content identical.',
    '',
    'DEFECTS AND THEIR EXACT FIX:',
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    ...(a11ySteps.length ? ['', 'ALSO (accessibility):', ...a11ySteps.map((s) => `- ${s}`)] : []),
    '',
    'AFTER FIXING, self-check: trace every screen — can the user reach it by tapping something? Can every button be tapped to do something real? If not, you have not fixed it.',
    'Return the COMPLETE updated function App(){...}. Do not introduce new defects.',
  ].join('\n');
}
