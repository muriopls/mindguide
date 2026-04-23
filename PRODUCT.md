# MindGuide — Produktanforderungen & Fachliche Spezifikation

Dieses Dokument beschreibt **was** MindGuide ist, **für wen** es gebaut wird, und **wie** es sich verhalten soll. Es ist die fachliche Referenz — technische Entscheidungen stehen in `DECISIONS.md`.

---

## Vision

MindGuide ist ein KI-gestützter Nachhilfelehrer für Schüler:innen. Die KI hilft beim Verstehen von Themen und Hausaufgaben — aber sie **verrät keine direkten Lösungen**. Stattdessen führt sie die Schüler:innen durch sokratisches Fragen schrittweise zur eigenen Erkenntnis.

**Kernprinzip:** Nicht die Antwort geben, sondern das Denken anleiten.

---

## Zielgruppe

- **Primär:** Schüler:innen (ca. 10–18 Jahre), die bei Hausaufgaben oder Themenverständnis Hilfe brauchen
- **Sekundär:** Lehrkräfte oder Eltern, die das Tool als Lernunterstützung einsetzen
- Sprachen: Deutsch (primär) und Englisch

---

## Kernfunktionen nach Phase

### Phase 1 — Foundation ✅ (abgeschlossen)
- Next.js App mit vollständigem UI-System
- Dummy-Chat (keine echte KI, statische Antworten)
- Dark/Light Mode
- Deutsch/Englisch Sprachunterstützung (URL-basiert: `/de/`, `/en/`)
- Snackbar-Feedback bei Aktionen
- Mobile-first responsive Layout

### Phase 2 — AI Integration ✅ (abgeschlossen)
- Echter KI-gestützter Chat über Vercel AI SDK
- **Claude** (Anthropic) und **OpenAI** als Anbieter — wählbar im Chat
- Streaming-Antworten mit sichtbarem Fortschrittsbalken
- **Hybrid Key-Strategie:**
  - Standard: Operator-Key (vom System bereitgestellt)
  - Optional: User kann eigenen Key nutzen (Override, Phase 4)
- Systempromt erzwingt sokratischen Stil (Deutsch + Englisch)

### Phase 3 — Vercel Deployment ✅ (abgeschlossen)
- App ist öffentlich erreichbar
- Preview-URLs für jeden PR automatisch
- Keine Konfiguration nötig, um die App zu benutzen

### Phase 4 — Auth & User-Verwaltung
- Registrierung und Login (E-Mail/Passwort, optional Google OAuth)
- Jeder User hat ein Profil (Anzeigename, Sprache, bevorzugter KI-Anbieter)
- User kann eigenen Claude- oder OpenAI-Key hinterlegen
  - Key wird **verschlüsselt** in Supabase Vault gespeichert
  - Eigener Key überschreibt den Operator-Key für diesen User
- Geschützte Routen — ohne Login kein Zugriff auf Dashboard/Settings
- Row Level Security: jeder User sieht nur seine eigenen Daten

### Phase 5 — Lernstruktur & Empfehlungen
- User legt Fächer an (Mathe, Deutsch, Englisch, etc.)
- Jedes Gespräch wird einem Fach zugeordnet
- Nach jeder Konversation: KI extrahiert eine Zusammenfassung + identifiziert Stärken und Lücken
- Dashboard zeigt Lernstatus pro Fach
- KI generiert personalisierte Lernempfehlungen basierend auf erkannten Lücken

### Phase 6 — Prompt-Evaluation (Sideproject)
- Separates Evaluierungs-Skript außerhalb des Repos
- Testet System-Prompts gegen definierte Szenarien (z.B. "Schüler fragt direkt nach Lösung")
- Ziel: optimalen Prompt finden, der nie die Antwort verrät und trotzdem natürlich und hilfreich wirkt
- Ergebnis wird als finaler System-Prompt in die App übernommen

---

## Verhalten der KI (Sokratischer Ansatz)

**Was die KI tun soll:**
- Mit Gegenfragen antworten, die den Schüler zum Nachdenken bringen
- Schrittweise Hinweise geben, nicht die fertige Lösung
- Fehler erkennen und gezielt nachfragen ("Was denkst du, warum das so ist?")
- Lob für Fortschritte, auch kleine
- Altersgerechte Sprache (einfach, klar, motivierend)

**Was die KI nie tun darf:**
- Die Lösung einer Aufgabe direkt nennen
- Komplette Aufsätze, Rechnungen oder Antworten liefern, die der Schüler abgeben kann
- Hausaufgaben "erledigen"

**Beispiel:**
> Schüler: "Was ist 12 × 7?"
> MindGuide: "Weißt du noch, wie du 12 × 7 zerlegen kannst? Was wäre 12 × 5?"

---

## UI/UX-Anforderungen

### Pflicht-Elemente
| Element | Wann |
|---|---|
| `<LoadingSpinner>` | Jeder Fetch/API-Request solange pending |
| `<ProgressBar active>` | Während AI-Antwort streamt |
| `<Snackbar>` | Nach jeder create/update/delete Aktion |

### Snackbar-Verhalten
- Position: oben rechts
- Auto-dismiss nach 4 Sekunden
- Varianten: `success`, `error`, `warning`, `info`
- Verwende `useSnackbar().show(...)` aus `@/hooks/useSnackbar`

### Responsiveness
- **Mobile-First:** erst `sm:` Breakpoint, dann größer
- Chat-Input immer am unteren Rand sichtbar — auch auf Mobile mit Browser-Chrome
- Kein horizontales Scrollen

### Dark Mode
- Alle neuen Komponenten müssen `dark:` Varianten haben
- Theme-Umschaltung ohne Flash (FOUC-Prevention vorhanden)
- Toggle im Header

---

## Mehrsprachigkeit

Alle UI-Texte über `next-intl` — **nie hardcoded** Text in Komponenten.

```ts
// Korrekt:
const t = useTranslations('chat');
<p>{t('welcomeTitle')}</p>

// Falsch:
<p>Hallo! Ich bin MindGuide</p>
```

Neue Strings immer in beide Dateien eintragen: `messages/de.json` **und** `messages/en.json`.

---

## Sicherheit & Datenschutz

- API Keys werden **nie** im Frontend oder in Git gespeichert
- User-Keys werden verschlüsselt in Supabase Vault abgelegt (Phase 5)
- Row Level Security für alle User-Tabellen (Phase 5)
- Keine AI-Antworten cachen (sensitive Lerninhalte)
- `.env.local` ist in `.gitignore` — Env Vars nur im Vercel Dashboard

---

## Bewusst ausgelassen (kein Scope)

- **Rate Limiting** — wird erst relevant bei öffentlichem Traffic (Phase 5+ via Upstash)
- **Admin-Dashboard** — kein Verwaltungsinterface geplant (Phase 6+)
- **Native Mobile App** — nur Web (PWA ist denkbar, aber nicht geplant)
- **Server-Side Response Caching** — zu komplex für MVP, kein pädagogischer Mehrwert
- **Gamification** — Punkte, Badges etc. sind nicht im MVP
