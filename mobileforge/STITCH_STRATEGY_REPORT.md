# Google Stitch — Deep Research & MobileForge Strategy

**Date:** 2026-06-26
**Author:** Claude (Research + Implementation)
**Branch:** `claude/mobileforge-mobile-builder-wEYm1`

---

## Part 1: How Google Stitch Works (Deep Dive)

### Workspace & Environment

Stitch (stitch.withgoogle.com) calls itself an **"AI-native software design canvas."**
Key workspace elements:

| Element | How it works |
|---|---|
| **Infinite Canvas** | Figma-style canvas where multiple screens coexist. You can zoom, pan, and see all screens at once. Added in March 2026 update. |
| **Prompt Input** | Text field at the top — describe what you want in natural language. Also accepts image upload (screenshot/sketch) and voice input ("Voice Canvas"). |
| **Multi-screen generation** | Generates up to **5 connected screens simultaneously** from a single prompt. Maintains design consistency across all screens. |
| **Preview / Prototyping** | "Play" button to interact with the generated screens. Screens are linked — you can click navigation elements to move between them. |
| **Code Panel** | Side panel shows the generated code (HTML + TailwindCSS). Can copy/export. |
| **Build Modes** | Two main modes: **Standard** (Gemini 2.5 Flash — fast, ~10s) and **Experimental** (Gemini 2.5 Pro — higher fidelity, accepts images, ~30s). |

### The AI Engine

- **Model:** Gemini 2.5 Flash (Standard) / Gemini 2.5 Pro (Experimental). Upgraded to Gemini 3 in December 2025.
- **Output:** Generates HTML + TailwindCSS. NOT full React components, NOT full-stack apps. It's a design tool, not an app builder.
- **Iteration:** Follow-up prompts modify the existing design. Can target specific screens. Redesign mode regenerates from scratch.
- **Context:** Maintains conversation history for iterative refinement.
- **Multi-screen logic:** AI decides how many screens are needed based on the prompt. Maps user journeys and creates navigation flow automatically.

### Design System

- **Material Design 3 / Material You** influence — tonal color system, rounded shapes, clean typography.
- **Tonal Scale:** T0 (darkest) through T100 (lightest) for each color.
- **DESIGN.md:** Open-source specification (YAML front matter + markdown prose) that captures the design system in a portable, AI-readable format.
- **Figma Export:** Standard mode supports paste-to-Figma. Experimental mode does NOT support Figma export.
- **Code Export:** HTML + TailwindCSS, Flutter, and up to 7 frameworks listed. React/React Native NOT explicitly supported.

### What Stitch Does Well

1. **Speed of exploration** — Type a sentence, get 5 connected screens in ~15 seconds. Zero friction.
2. **Visual consistency** — Multi-screen generation maintains a coherent design language automatically.
3. **Free** — No credit card, no paid plan. 400 daily design credits. Low barrier.
4. **Voice Canvas** — Talk to your design. AI asks clarifying questions, gives critiques, makes live updates.
5. **Image input** — Upload a screenshot or sketch, Stitch recreates it and improves it.
6. **Material Design quality** — Outputs look polished, modern, and native-feeling.
7. **DESIGN.md portability** — The open spec lets you carry design systems to other tools.

---

## Part 2: Google Stitch's Problems & Limitations

### Critical Limitations

| Problem | Impact | Source |
|---|---|---|
| **No element-level editing** | Can't click a button and change its color/text. Must re-prompt everything. Figma still wins for precision editing. | Multiple reviews, LogRocket, Moda |
| **Frontend only** | No backend, no database, no auth, no API integration. "Design tool, not app builder." | Every comparison article |
| **No design system upload** | Can't import brand guidelines, component libraries, or design tokens. Brand colors require manual hex prompting each time. | LESS Studio, Superdesign |
| **Inconsistent output** | Same prompt produces different results every time. Useful for exploration, terrible for production. | NxCode, Moda |
| **Quality degradation post-Gemini 3** | After the Dec 2025 update, users reported worse design quality. Google acknowledged it on their forum. | Google AI Dev Forum |
| **No code deployment** | Can't ship a Stitch app. No build, no deploy, no hosting. Export is raw HTML. | Every review |
| **Credit limits** | 400 daily design credits, 15 daily redesigns. Teams hit limits quickly. No way to pay for more. | Banani, NxCode |
| **Geographic restrictions** | Not available in Ukraine, Balkans, UAE, and other regions. | Multiple sources |
| **No SLA / Labs status** | Experimental Google Labs product. Google kills Labs products regularly. No enterprise reliability. | Moda, LESS Studio |
| **WCAG failures** | Generated apps often fail basic accessibility: color contrast, touch target sizes. | LogRocket, Index.dev |

### User Complaints (Real Feedback)

1. **"Great for inspiration, wrong for production"** — The Design Project
2. **"You cannot tweak fonts or backgrounds without re-prompting"** — Same-prompt ranking test placed Stitch last vs Claude Design, Claude Code, and Figma Make
3. **"Looks AI-generated"** — Users say the output has a recognizable "AI template" feel
4. **"No component naming or design system structure"** — Designs lack semantic meaning
5. **"Exports only HTML/TailwindCSS"** — No SwiftUI, React Native, or Flutter export (despite claims)
6. **"Figma export broken in Experimental mode"** — The more powerful mode can't export to Figma
7. **"Can't enforce brand consistency across projects"** — Each generation starts from zero

### What Stitch Fundamentally Can't Do

- Backend logic / API integration
- Database / data persistence
- Authentication / user management
- Real-time features (WebSocket, push notifications)
- State management in generated apps
- Working forms that actually submit
- Interactive prototyping with real business logic
- Deploy / host the generated app
- CI/CD integration
- Version control for designs

---

## Part 3: Where MobileForge Beats Stitch (Already)

| Capability | Stitch | MobileForge | Advantage |
|---|---|---|---|
| **Real working apps** | Static mockups / HTML | Fully interactive React with real state | **MobileForge** |
| **Buttons that work** | Decorative only | Every button has onClick, real state changes | **MobileForge** |
| **Forms that submit** | Visual only | Validate + update state + show confirmation | **MobileForge** |
| **Element-level editing** | Can't select elements | Annotate mode: tap element → describe change | **MobileForge** |
| **Interactive preview** | Limited prototype | Play mode: full app interactivity in preview | **MobileForge** |
| **AI provider resilience** | Gemini only (single point of failure) | 5-provider fallback chain (Groq → Gemini → OpenRouter → Cerebras → Together) | **MobileForge** |
| **Credit limits** | 400/day design, 15/day redesign | No artificial limits | **MobileForge** |
| **Design system injection** | User must prompt for design quality | Professional CSS design system auto-injected into every app | **MobileForge** |
| **No-emoji enforcement** | No quality control | Strict SVG-only icon rule + 12-point quality checklist | **MobileForge** |
| **Empty/error/loading states** | Not generated | Mandatory in every app (system prompt enforces) | **MobileForge** |
| **Dark mode** | Basic | Full dark mode with proper theme-matching preview overlay | **MobileForge** |
| **Multiple exports** | HTML + Tailwind only | HTML, React project, PWA, DESIGN.md | **MobileForge** |
| **Build modes** | Standard / Experimental | Ideate / Flash / Thinking (mapped to quality tiers) | **Parity** |
| **Multi-screen** | Up to 5 screens | Screens from features, screen navigator | **Stitch ahead** |
| **Infinite canvas** | Yes | No (single preview) | **Stitch ahead** |
| **Voice input** | Yes (Voice Canvas) | No | **Stitch ahead** |
| **Figma export** | Yes (Standard mode) | No | **Stitch ahead** |
| **Image input** | Yes (sketch/screenshot) | No | **Stitch ahead** |
| **Template gallery** | Basic | Not yet | **Neither strong** |

---

## Part 4: MobileForge vs. The Market

### Competitive Landscape

| Tool | Positioning | What it generates | Pricing |
|---|---|---|---|
| **Google Stitch** | Design-first, "vibe design" | UI mockups (HTML/Tailwind) | Free (credit limits) |
| **v0 (Vercel)** | Component-first | React/Next.js components | Free tier + $20/mo Pro |
| **Lovable** | App-first, non-technical users | Full-stack apps (Supabase, auth) | Free tier + $20/mo |
| **Bolt.new** | Full-stack from chat | Complete apps (frontend + backend + DB) | Free tier + $20/mo |
| **Replit Agent** | IDE-integrated builder | Full apps with deployment | $25/mo |
| **MobileForge** | Mobile-first app builder | Working React apps (interactive, styled) | Free (beta) |

### MobileForge's Unique Position

MobileForge sits in a gap none of the competitors fill well:

1. **Better than Stitch** because our apps actually WORK — real state, real interactions, real forms. Stitch generates pretty mockups.
2. **Better than Bolt/Lovable** for mobile UI quality because our design system and quality prompt are specifically tuned for mobile-first, App Store-quality output.
3. **More accessible than v0** because users don't need to understand React components — they describe an app and get one.

The key differentiator: **MobileForge generates apps that feel like real products, not AI demos.**

---

## Part 5: Strategic Roadmap — What to Build Next

### Tier 1: Must-Have (Close the Gaps with Stitch)

| # | Feature | Why | Effort |
|---|---|---|---|
| 1 | **Template Gallery** | Stitch has it, users expect it, reduces the "blank prompt" anxiety | Medium |
| 2 | **Multi-screen deep linking** | Stitch generates 5 connected screens. MobileForge should show screen navigation in the builder and let users click between screens | Medium |
| 3 | **Design System JSON export** | Complement DESIGN.md with a machine-readable JSON export for developers | Small |

### Tier 2: Exceed Stitch (Our Killer Features)

| # | Feature | Why | Effort |
|---|---|---|---|
| 4 | **One-click deploy** | Stitch can't deploy at all. A "Deploy" button that publishes to Vercel/Netlify would be a massive differentiator | Large |
| 5 | **Version history / snapshots** | Show previous iterations, let users go back. Codex started this — needs Firestore persistence | Medium |
| 6 | **Backend generation** | Generate Express/Supabase backend alongside the frontend. This is what makes us a real app builder, not a design tool | Large |
| 7 | **Image/sketch input** | Accept a screenshot or wireframe and generate from it. Stitch has this, but we can do it better since our output is a real app | Medium |

### Tier 3: Market-Breaking (Things Nobody Does Well)

| # | Feature | Why | Effort |
|---|---|---|---|
| 8 | **Collaborative editing** | Real-time multiplayer builder. Stitch is single-user. | Large |
| 9 | **App Store packaging** | Generate PWA manifest, icons, splash screens. One-click submit to app stores | Large |
| 10 | **Analytics dashboard** | Show usage stats for deployed apps. No AI builder does this | Large |
| 11 | **A/B testing** | Generate variant UIs, let users test which performs better | Large |

---

## Part 6: What We Implemented in This Session

### Previously Completed (Claude)

| Feature | Status | Inspired by Stitch |
|---|---|---|
| Fix AI generation (Gemini model fallback) | Done | - |
| Fix localStorage crash in sandboxed preview | Done | - |
| Play / Prototype mode | Done | Stitch Prototypes |
| Annotate mode (element-level editing) | Done | Stitch lacks this! |
| Agent build log (7-step pacing) | Done | Stitch's generation experience |
| DESIGN.md export | Done | Stitch's open-source format |
| Dark-mode loading overlay | Done | - |
| Build modes (Ideate/Flash/Thinking) | Done | Stitch Standard/Experimental |
| Device toolbar (iPhone/Galaxy/iPad/Desktop) | Done | Stitch device preview |
| Platform target (App/Web) | Done | - |

### Codex Additions (On User's Local Machine)

| Feature | Status | Notes |
|---|---|---|
| `designSystem` metadata in generation response | Done (local) | Palette, tonal scale, typography, components |
| `screens` metadata in generation response | Done (local) | Fallback from features |
| `DesignWorkspace` component | Done (local) | Shows design system next to preview |
| Updated system prompt for metadata | Done (local) | AI returns designSystem + screens |
| Firestore persistence | Done (local) | Saves designSystem and screens |

### Still Needed for "Ultimate" Level

1. Template gallery in builder
2. Persistent version snapshots
3. Screen-to-screen linking in prototype mode
4. Stronger React project export
5. Image/sketch input
6. One-click deploy

---

## Conclusion

**Google Stitch is a design exploration tool.** It's fast and free, but produces static mockups you can't ship. Its biggest weakness is that it stops at the picture — the gap between "here's how it could look" and "here's a working app" is enormous.

**MobileForge is an app builder.** Every generated app has real state, real interactions, and real styling. The gap we need to close is the workspace experience (template gallery, version history, multi-screen canvas). The gap Stitch needs to close to compete with us is... everything that makes software actually work.

**Bottom line:** Stitch helps you imagine an app. MobileForge helps you build one.
