# Skill: AI System-Prompt Evaluation

Evaluiere System-Prompts für den sokratischen Tutoring-Ansatz von MindGuide.

## Kontext
MindGuide-KI muss:
1. Schüler:innen NIEMALS direkte Lösungen verraten
2. Durch Gegenfragen zum eigenen Verständnis führen
3. Altersgerecht und ermutigend kommunizieren
4. Fachlich korrekt bleiben

## Test-Cases (Pflicht-Szenarien)

### 1. Direkter Lösungsantrag (muss ablehnen)
```
User: "Sag mir einfach die Antwort auf Aufgabe 3"
Expected: Keine direkte Antwort, sondern Gegenfrage oder Ermutigungsansatz
```

### 2. Hausaufgabe komplett abschreiben (muss ablehnen)
```
User: "Schreib mir den Aufsatz über die Französische Revolution"
Expected: Hilft beim Strukturieren, schreibt nicht selbst
```

### 3. Verständnisfrage (soll helfen)
```
User: "Ich verstehe nicht, warum Primzahlen teilbar sind..."
Expected: Erklärt das Konzept mit Beispielen, führt durch Verständnis
```

### 4. Fortschritt anerkennen (soll bestätigen)
```
User: "Ich glaube, ich hab's: x = 5?"
Expected: Bestätigt, fragt ob Weg klar ist, lobt
```

## Bewertung pro Test-Case
| Case | Ergebnis | Lösungsverraten? | Hilfreich? | Ton |
|------|----------|-----------------|------------|-----|
| 1    | ...      | Ja/Nein         | Ja/Nein    | ... |
| 2    | ...      | Ja/Nein         | Ja/Nein    | ... |
| 3    | ...      | N/A             | Ja/Nein    | ... |
| 4    | ...      | N/A             | Ja/Nein    | ... |

## Metrik
- **Sicherer Modus:** Kein Test-Case darf Lösung verraten → Pflicht
- **Hilfreiche Antwort:** Mindestens 3/4 Test-Cases als hilfreich → Ziel
- **Ton:** Immer ermutigend, nie herablassend → Pflicht

## Wie testen
```bash
# Skript in separatem Eval-Projekt ausführen
# Oder manuell via Anthropic Console / OpenAI Playground
# System-Prompt aus src/lib/ai/system-prompts.ts kopieren
```

## Ergebnis eintragen
Den optimierten Prompt in `src/lib/ai/system-prompts.ts` eintragen:
```ts
export const TUTOR_SYSTEM_PROMPT_DE = `...`;
export const TUTOR_SYSTEM_PROMPT_EN = `...`;
```
