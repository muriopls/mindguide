# Skill: Git Workflow

Verwalte den gesamten Git-Workflow für MindGuide nach den Konventionen in CLAUDE.md.

## Branch anlegen
```bash
git checkout -b feature/<name>   # für neue Features
git checkout -b fix/<name>       # für Bugfixes
git checkout -b chore/<name>     # für Maintenance
```

## Conventional Commits
Format: `<type>(<scope>): <beschreibung>`

Types:
- `feat:` — neues Feature
- `fix:` — Bugfix
- `chore:` — Maintenance, Dependencies, Config
- `docs:` — Dokumentation
- `test:` — Tests
- `refactor:` — Refactoring ohne Feature/Fix

Beispiele:
```
feat(chat): add streaming progress bar
fix(snackbar): correct dismiss timer on rapid messages
chore: update next-intl to 4.10
test(components): add ChatBubble unit tests
```

## Commit erstellen
```bash
git add <spezifische-files>   # nie git add -A oder git add .
git status                     # prüfen was staged ist
git commit -m "$(cat <<'EOF'
feat(chat): add dummy response with typing indicator

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

## PR erstellen
```bash
git push -u origin <branch-name>
gh pr create \
  --title "<type>(<scope>): <kurze Beschreibung>" \
  --body "$(cat <<'EOF'
## Summary
- Was wurde geändert und warum

## Test plan
- [ ] `npm test` grün
- [ ] Manuell getestet auf Mobile + Desktop
- [ ] Dark Mode geprüft

🤖 Generated with Claude Code
EOF
)"
```

## Regeln
- Nie direkt auf `main` pushen
- Nie `--no-verify` verwenden
- Spezifische Dateien adden, nie `git add -A`
- Nach dem Merge: Branch lokal und remote löschen
