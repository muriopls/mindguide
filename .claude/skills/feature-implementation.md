# Skill: Feature implementieren

Vollständiger Zyklus für neue Features in MindGuide.

## Schritt 1: Branch anlegen
```bash
git checkout -b feature/<feature-name>
```

## Schritt 2: Implementierung
Checkliste vor dem Commit:

### TypeScript
- [ ] Kein `any` — konkrete Types in `src/types/index.ts`
- [ ] Props-Interface für jede neue Komponente

### i18n
- [ ] Neue UI-Strings in `messages/de.json` UND `messages/en.json`
- [ ] `useTranslations('<namespace>')` in Client-Komponenten
- [ ] `getTranslations('<namespace>')` in Server-Komponenten

### UI/UX Rules
- [ ] create/update/delete → `useSnackbar().show('...', 'success'|'error')`
- [ ] Fetch-Operationen → `<LoadingSpinner>` bei `isLoading`
- [ ] AI Streaming → `<ProgressBar active={isStreaming}>`
- [ ] Semantische Farben: `mg-primary`, `mg-success`, `mg-error` etc.
- [ ] Mobile-First Klassen geprüft (kein lg: ohne sm: davor)
- [ ] Dark Mode: neue Elemente mit `.dark` Variante getestet

### API Security (Phase 2+)
- [ ] Keine API Keys in Client-Code
- [ ] API Keys nur in `/app/api/` Routes via `process.env`

## Schritt 3: Tests schreiben
```bash
# Unit Test anlegen
touch tests/unit/components/<ComponentName>.test.tsx
npm test  # muss grün sein
```

## Schritt 4: Manueller Check
```bash
npm run dev
# Prüfen auf: mobile, desktop, dark mode, light mode, DE, EN
```

## Schritt 5: Commit und PR
```bash
git add src/components/... src/hooks/... messages/...
git commit -m "feat(<scope>): <beschreibung>"
git push -u origin feature/<feature-name>
gh pr create --title "feat(<scope>): <beschreibung>" --body "..."
```

## Häufige Fehler vermeiden
- Vergessene i18n-Strings (App baut nicht ohne alle Keys)
- `'use client'` vergessen bei useState/useEffect
- Snackbar nicht importiert nach create/update/delete
- ThemeSwitcher bricht ohne suppressHydrationWarning im Root
