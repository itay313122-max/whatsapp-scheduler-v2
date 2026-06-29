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
  kind: 'dead-button' | 'unlinked-screen' | 'no-navigation' | 'empty-handler' | 'missing-screen';
  severity: 'error' | 'warn';
  message: string;
  /** Best-effort source snippet so a human (or the repair prompt) can locate it. */
  evidence?: string;
}

export interface QualityReport {
  ok: boolean;
  score: number; // 0..100, higher is better
  issues: QualityIssue[];
  blueprint: {
    navStateVars: string[];
    definedScreens: string[];
    reachableScreens: string[];
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
      blueprint: { navStateVars: [], definedScreens: [], reachableScreens: [], buttonCount: 0, wiredButtonCount: 0 },
    };
  }

  const clean = stripNoise(appJsx);

  const nav = findNavState(clean);
  const definedScreens = findDefinedScreens(clean, nav.vars);
  const reachableScreens = findReachableScreens(clean, nav.setters, nav.initials);

  // Dead buttons / empty handlers run on the RAW code (we need the real
  // attribute text), but string-noise inside attrs is rare enough not to matter.
  const buttons = analyzeButtons(appJsx);
  issues.push(...buttons.dead, ...buttons.emptyHandlers);

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
  let score = 100;
  for (const it of issues) score -= it.severity === 'error' ? 18 : 7;
  score = Math.max(0, score);

  return {
    ok: issues.filter((i) => i.severity === 'error').length === 0,
    score,
    issues,
    blueprint: {
      navStateVars: nav.vars,
      definedScreens,
      reachableScreens,
      buttonCount: buttons.total,
      wiredButtonCount: buttons.wired,
    },
  };
}

/**
 * Build a focused repair instruction the model can act on. Returns null when
 * there is nothing worth repairing (so callers can skip the round-trip).
 */
export function buildRepairPrompt(report: QualityReport): string | null {
  const errors = report.issues.filter((i) => i.severity === 'error');
  if (errors.length === 0) return null;

  const lines = errors.map((e, i) => `${i + 1}. [${e.kind}] ${e.message}${e.evidence ? `  (near: ${e.evidence})` : ''}`);

  return [
    'The previous app has quality defects that MUST be fixed. Keep everything else identical.',
    '',
    'DEFECTS:',
    ...lines,
    '',
    'FIX RULES:',
    '- Every <button> must have a real onClick that changes state, navigates, or performs an action. No empty () => {}.',
    '- Every screen you define (case / === branch) must be reachable: add a control that calls the navigation setter with that screen id.',
    '- If a screen is genuinely unused, REMOVE it rather than leave it unreachable.',
    '- Do not introduce new defects. Return the COMPLETE updated function App(){...}.',
  ].join('\n');
}
