export default function ImpressumPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold">Impressum</h1>
      <p className="text-muted-foreground text-sm">Angaben gemäß § 5 TMG</p>
      <div className="rounded-2xl border border-border/60 bg-background/60 p-6 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">MindGuide</p>
        <p>Inhaber: [Name]</p>
        <p>[Straße, PLZ, Stadt]</p>
        <p>E-Mail: [kontakt@mindguide.app]</p>
      </div>
      <p className="text-xs text-muted-foreground">Diese Seite ist ein Platzhalter — bitte vollständige Angaben vor dem Launch eintragen.</p>
    </div>
  );
}
