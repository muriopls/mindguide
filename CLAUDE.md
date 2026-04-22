# MindGuide — CLAUDE.md

## Project Overview
KI-gestützte Nachhilfe-Webapp. Die KI begleitet Schüler:innen sokratisch — verrät keine Lösungen, führt durch Fragen zum eigenen Verständnis. Multi-User, skalierbar (Vercel + Supabase).

## Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript strict — kein `any`)
- **Styling:** Tailwind CSS v4 via npm + shadcn/ui (Radix UI)
- **i18n:** next-intl — Locales: `de` (default), `en` — URL-Struktur: `/de/...`, `/en/...`
- **AI:** Vercel AI SDK — Claude + OpenAI provider
- **State:** Zustand (global), React Context (theme, snackbar)
- **Auth/DB:** Supabase (Auth, Postgres, Vault für verschlüsselte API Keys)
- **Tests:** Vitest + React Testing Library (unit), Playwright (e2e)
- **Deployment:** Vercel (auto-deploy main), Supabase cloud

## File Structure
```
src/
  app/
    [locale]/       ← Alle Seiten unter /de oder /en
      layout.tsx    ← next-intl + ThemeProvider + SnackbarProvider + Header
      page.tsx      ← Chat-Hauptseite
    api/chat/       ← AI Streaming Endpoint (Phase 2)
    layout.tsx      ← Root (HTML, Fonts, globals.css)
  components/
    ui/             ← shadcn base + eigene: snackbar, loading-spinner, progress-bar
    chat/           ← ChatWindow, ChatBubble, ChatInput
    layout/         ← Header, ThemeSwitcher, LocaleSwitcher
    providers/      ← ThemeProvider, SnackbarProvider
  hooks/            ← useSnackbar
  lib/
    ai/             ← providers.ts, system-prompts.ts (Phase 2)
    supabase/       ← client.ts, server.ts (Phase 5)
    utils.ts        ← shadcn cn()
  i18n/             ← routing.ts, request.ts
  stores/           ← Zustand stores
  types/            ← index.ts
messages/
  de.json           ← Deutsche UI-Strings
  en.json           ← Englische UI-Strings
tests/unit/         ← Vitest Unit Tests
e2e/                ← Playwright E2E Tests
supabase/migrations/ ← DB Migrations (Phase 5)
.claude/skills/     ← Agent Skills
```

## Non-Negotiable Rules
1. **Kein TypeScript `any`** — immer konkrete Types oder `unknown`
2. **Alle UI-Strings über next-intl** — nie hardcoded Text in Komponenten
3. **JEDE create/update/delete Aktion → `useSnackbar().show(...)`**
4. **JEDER Fetch-Request → `<LoadingSpinner>` solange pending**
5. **AI-Streaming → `<ProgressBar active={isStreaming}>`**
6. **Mobile-First** — immer zuerst `sm:` dann größere Breakpoints
7. **Dark Mode** — alle neuen Klassen mit `dark:` Variante prüfen
8. **API Keys NIE im Frontend** — nur in API Routes und Env Vars
9. **RLS aktiviert** für alle Supabase-Tabellen (Phase 5+)

## Semantisches Farbschema (Tailwind v4 CSS Custom Properties)
```
--color-mg-primary          Lernblau — interaktive Elemente, Buttons, Links
--color-mg-secondary        Warmgelb — Akzente, Highlights
--color-mg-success          Grün — korrekt, abgeschlossen, erstellt
--color-mg-warning          Orange — Hinweise, partielle Fortschritte
--color-mg-error            Rot — Fehler, Löschoperationen
--color-mg-info             Hellblau — neutrale Informationen
```

## Git Workflow
- Branch-Naming: `feature/<name>`, `fix/<name>`, `chore/<name>`
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- Flow: `main` → feature branch → PR → squash merge
- **Nie direkt auf `main` pushen**

## Testing
```bash
npm test              # Vitest unit tests
npm run test:watch    # Watch mode
npm run test:e2e      # Playwright
```
- Jede Komponente hat mindestens einen Unit Test
- Kritische User Journeys haben E2E Tests
- Kein `expect(true).toBe(true)` — immer echte Assertionen

## Deployment
- Vercel: auto-deploy on push to `main`
- Preview: Jeder PR bekommt Preview URL
- Env Vars nur in Vercel Dashboard — **nie in `.env` committen**
- `.env.local` ist in `.gitignore`

## Wichtig für neue Agents
- **`PRODUCT.md`** — Fachliche Anforderungen: Was ist MindGuide, für wen, wie verhält sich die KI, UI-Pflichten, Scope
- **`DECISIONS.md`** — Technische Entscheidungen: warum welche Library, verworfene Ansätze, kritische Gotchas (Next.js 16, Tailwind v4, Custom ThemeProvider, Font-Cascade, h-dvh)

## Phasen-Status
- [x] Phase 1: Foundation (Next.js, UI-System, Dummy-Chat)
- [ ] Phase 2: AI API Integration (Vercel AI SDK, Claude + OpenAI)
- [ ] Phase 3: Prompt Evaluation (Sideproject)
- [ ] Phase 4: Vercel Deployment
- [ ] Phase 5: Supabase Auth + User Profiles + API Keys
- [ ] Phase 6: Fächer, Lernstatus, Empfehlungen

## Environment Variables
```bash
# Phase 2+
ANTHROPIC_API_KEY=          # Operator-Key für Claude
OPENAI_API_KEY=             # Operator-Key für OpenAI
# Phase 5+
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # NUR serverseitig
```
