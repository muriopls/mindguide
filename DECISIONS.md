# MindGuide — Architecture Decisions & Gotchas

This document captures every non-obvious decision made during development: *what* was chosen, *why*, and *what was rejected*. A fresh agent reading only the repo (no conversation history) should be able to understand the full context from this file.

---

## Framework & Versions

### Next.js 16 (not 15)
`create-next-app` installed Next.js **16.2.4**. The plan was written for Next.js 15, but the installed version is 16. Key breaking change:

**`middleware.ts` was renamed to `proxy.ts` in Next.js 16.**
- The export must be a named export `proxy`, not `export default`.
- File: `src/proxy.ts`
```ts
export const proxy = createMiddleware(routing);
export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'] };
```
Do NOT create or rename to `middleware.ts` — it will be ignored.

### Tailwind CSS v4
Tailwind v4 uses **CSS-based configuration** — there is no `tailwind.config.ts` file. All theme customization lives in `src/app/globals.css` inside `@theme inline { }` blocks.

- Custom colors use the prefix `--color-mg-*` (e.g. `--color-mg-primary`)
- Tailwind classes map directly: `bg-mg-primary`, `text-mg-primary-foreground`
- OKLCH color space is the default (not hex or hsl)
- `tw-animate-css` replaces `tailwindcss-animate`

### Vercel AI SDK v6 — no `useChat` hook
`npm install ai` installed **v6.0.x**, which removed the `useChat` hook from `ai/react` (the subpath export no longer exists). The plan assumed v3/v4 patterns.

**What changed in v6:**
- No `useChat` / `ai/react` — replaced by class-based `AbstractChat`
- `streamText(...).toDataStreamResponse()` → `toTextStreamResponse()`
- `LanguageModelV1` type → `LanguageModel`

**Solution:** Streaming is implemented manually in `ChatWindow.tsx` using `fetch` + `ReadableStream` reader. This is actually simpler and framework-agnostic:
```ts
const res = await fetch('/api/chat', { method: 'POST', body: ... });
const reader = res.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // append chunk to last assistant message
}
```

The API route uses `streamText(...).toTextStreamResponse()` which returns a plain UTF-8 text stream (not SSE).

### shadcn/ui "base-nova" style
The installed shadcn style is `base-nova`, which uses `@base-ui/react` (not the older Radix UI). This is Tailwind v4 compatible. Do not assume Radix UI APIs.

### next-intl v4.9.1
- Uses `defineRouting` (not `createSharedPathnamesNavigation`)
- `hasLocale` function instead of manual locale checks
- `getMessages()` on server, `useTranslations()` on client
- All locale routing defined in `src/i18n/routing.ts`

---

## Theme System

### Custom ThemeProvider (not next-themes)
**Rejected:** `next-themes` — caused a React 19 console error:
> "Encountered a script tag while rendering React component tree"

`next-themes` injects a `<script>` into the React tree to prevent FOUC, which React 19 rejects.

**Solution:** Custom `ThemeProvider` at `src/components/providers/ThemeProvider.tsx`
- No `<script>` in React tree
- Theme stored in `localStorage` key `mg-theme` (not `theme`)
- Applies `.dark` class to `<html>` element
- Listens to system preference changes

**FOUC prevention:** A `dangerouslySetInnerHTML` inline script in the Server Component `src/app/layout.tsx` reads `mg-theme` from localStorage and adds `.dark` class before React hydrates. This is the only `<script>` and lives in a Server Component, not React tree.

**`useTheme()` is exported from `@/components/providers/ThemeProvider`**, not from `next-themes`. Do not import from `next-themes`.

---

## Font Loading

### Inter (not Geist)
User chose Inter over the Next.js default Geist font.

**Gotcha: Tailwind v4 font cascade**
`shadcn/ui` auto-generates a second `@theme inline { }` block that also sets `--font-sans`. Since Tailwind v4 merges these with last-writer-wins, the shadcn block (which appeared after our block) was overriding `--font-sans` with its own value.

**Fix:** Both `@theme inline` blocks in `globals.css` must set `--font-sans: var(--font-inter)`:
```css
/* Our MindGuide block */
@theme inline {
  --font-sans: var(--font-inter);
  /* ... */
}

/* shadcn block — must also have this line */
@theme inline {
  --font-sans: var(--font-inter); /* ← required, not var(--font-sans) */
  /* ... */
}
```

---

## Layout & Mobile

### `h-dvh` (not `100vh`)
`100vh` on mobile ignores the browser chrome (address bar), causing the input to be hidden below the fold.

**Fix:** Body uses `h-dvh` (dynamic viewport height). This is set in `src/app/layout.tsx`.

### Overflow chain for chat scroll
The message list must scroll while input stays pinned. This requires `overflow-hidden` on every flex ancestor up the tree:
- `body` → `h-dvh flex flex-col overflow-hidden`
- `<main>` → `flex-1 flex flex-col overflow-hidden`
- page `<div>` → `flex-1 flex flex-col overflow-hidden`
- `ChatWindow` → `flex-1 flex flex-col overflow-hidden`
- message list `<div>` → `flex-1 overflow-y-auto`

Breaking any link in this chain causes the input to be pushed off screen on mobile.

### Gradient background
The gradient is viewport-fixed (does not repeat/scroll):
```css
body {
  background-attachment: fixed; /* ← critical — without this, gradient tiles on scroll */
  background-image:
    radial-gradient(ellipse 130% 100% at 10% 0%, var(--gradient-a) 0%, transparent 70%),
    radial-gradient(ellipse 110% 90% at 90% 100%, var(--gradient-b) 0%, transparent 70%);
}
```
Gradient colors are defined as CSS vars in `:root` and `.dark` (not in `@theme inline`) because they use opacity and aren't Tailwind utilities.

---

## Color Choices

### Primary color: neutral indigo
After iterations through blue → violet → neutral indigo, the current primary is:
```css
--color-mg-primary: oklch(0.52 0.14 270);
```
Lower chroma (0.14) makes it neutral/professional rather than vivid. The gradient uses the same hue.

### Rejected colors
- `oklch(0.6 0.2 250)` — original blue, too vivid/standard
- `oklch(0.58 0.24 295)` — violet, too colorful
- Hex colors — avoided throughout; OKLCH only

---

## Chat UI

### Glassmorphism bubbles
User bubbles: semi-transparent primary with backdrop blur.
AI bubbles: frosted white glass (light) / dark glass (dark mode).

Key properties:
- `backdrop-blur-xl` — blur through the bubble
- `border border-white/70` — subtle edge highlight
- `shadow-[...,inset_0_1px_0_rgba(255,255,255,0.8)]` — top-edge highlight simulating refraction
- `whitespace-pre-wrap` — preserves newlines typed by user

### No emoji in UI
All emoji have been removed from components. The AI welcome message in `messages/de.json` and `messages/en.json` still contains the `👋` emoji in the string (user did not request removal there).

Header uses a Lucide `Sparkles` icon in a colored square badge. AI avatar in ChatBubble also uses `Sparkles`. User avatar shows text "Du" (DE) or "You" (EN) — hardcoded, not from i18n (minor deviation).

---

## Git History

All early fix(ui)/feat(ui) commits were squashed into a single commit via `git reset --soft` + new commit + force push to main. Current `main` has a clean, linear history.

**Local git identity:**
```
user.name = Murio
user.email = msemmler@gmx.net
```
This is set locally (`.git/config`), not globally.

---

## What Was NOT Built Yet

- Phase 2: AI API integration (`/api/chat/route.ts`, `useChat`, streaming, ProgressBar active state)
- Phase 3: Prompt evaluation
- Phase 4: Vercel deployment config
- Phase 5: Supabase auth, user API keys, encrypted storage
- Phase 6: Subjects, learning status, recommendations
- `LocaleSwitcher` component (file structure planned but not implemented)
- Zustand store (`src/stores/chatStore.ts` — currently chat state is local in ChatWindow)
- `<LoadingSpinner>` for fetch states (only planned)
- `<ProgressBar>` for AI streaming (only planned; UI placeholder exists)

---

## npm Scripts
```bash
npm run dev       # Start dev server (default port 3000)
npm test          # Vitest unit tests
npm run test:watch
npm run test:e2e  # Playwright
npm run build     # Production build
npm run lint
```

---

## Project Creation Note
`create-next-app` rejected "MindGuide" (capital letters in npm package name). Project was bootstrapped in `/tmp/mindguide-tmp` and moved to this directory. The `name` in `package.json` is `mindguide` (lowercase).
