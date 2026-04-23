export default function DatenschutzPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold">Datenschutzerklärung</h1>
      <p className="text-muted-foreground text-sm">Gemäß DSGVO / Art. 13 DSGVO</p>
      <div className="rounded-2xl border border-border/60 bg-background/60 p-6 text-sm text-muted-foreground space-y-4">
        <div>
          <p className="font-medium text-foreground mb-1">Verantwortlicher</p>
          <p>[Name, Adresse, E-Mail]</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Erhobene Daten</p>
          <p>Wir verarbeiten E-Mail-Adresse, Anzeigename und (optional) eigene API-Schlüssel. Konversationen werden nicht dauerhaft gespeichert.</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Drittanbieter</p>
          <p>Supabase (Authentifizierung & Datenbank), Anthropic / OpenAI (KI-Verarbeitung), Vercel (Hosting).</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Diese Seite ist ein Platzhalter — bitte vollständige Datenschutzerklärung vor dem Launch eintragen.</p>
    </div>
  );
}
