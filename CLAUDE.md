# BokuNoDevToys

SvelteKit-Projekt mit Dev-Tools im Browser. Läuft produktiv via Docker unter https://devtoys.bokunocompany.at/

## Projektstruktur

- `src/lib/tools/` — Svelte-Komponenten für jedes Tool
- `src/lib/tools/config.ts` — Tool-Registry: hier neue Tools registrieren (id, name, description, Kategorie)
- `src/routes/tools/[tool]/+page.svelte` — Routing: hier neue Tool-Komponenten einbinden

## Neues Tool hinzufügen

1. Svelte-Komponente in `src/lib/tools/MeinTool.svelte` erstellen
2. In `src/lib/tools/config.ts` unter der passenden Kategorie eintragen:
   ```ts
   { id: 'mein-tool', name: 'Mein Tool', description: '...' }
   ```
3. In `src/routes/tools/[tool]/+page.svelte` importieren und per `{:else if toolId === 'mein-tool'}` einbinden

## Arbeitsweise

**Immer direkt im Projektverzeichnis `/mnt/data/claude/BokuNoDevToys/` auf `srv-ubuntu` (10.0.0.3) arbeiten** — nie in Worktrees oder anderen Verzeichnissen, da Docker von hier baut und ein `git pull` sonst nötig wäre. (Vormals lief das Projekt auf dem Raspberry Pi unter `/home/pi/BokuNoDevToys/` — dorthin nicht mehr deployen.)

## Barrierefreiheit (WCAG 2.1 AAA — Pflicht)

Die Seite muss zu 100% barrierefrei sein. Folgende Regeln gelten für **jede neue Komponente und jede Änderung**:

### Farbkontrast (WCAG AAA — Pflicht)
- Normaler Text (< 18pt / < 14pt bold): Kontrastverhältnis **mindestens 7:1**
- Großer Text (≥ 18pt / ≥ 14pt bold): Kontrastverhältnis mindestens 4.5:1
- **Erlaubte Text-Farben** auf dunklem Hintergrund (bg-slate-800/900):
  - `text-slate-300` oder heller für Beschriftungen, Überschriften, Hinweistexte
  - `text-violet-300` für Code-Highlights, aktive Nav-Links
  - `text-red-300` für Fehlermeldungen
  - `text-emerald-400`, `text-amber-400`, `text-sky-400` (nur auf bg-slate-900: ≥ 7.6:1)
- **Buttons aktiv**: `bg-violet-700 text-white` (7.10:1 ✓)
- **Buttons inaktiv auf bg-slate-700**: `text-slate-200` (8.40:1 ✓)
- **Buttons inaktiv auf bg-slate-900**: `text-slate-300` (12.02:1 ✓)
- **Hover** auf bg-slate-600: `text-white` (7.57:1 ✓)
- **Nie verwenden** für lesbaren Text: `text-slate-400` bis `text-slate-700` auf slate-800/900 Hintergründen

### Formularelemente
- Jedes `<input>`, `<textarea>`, `<select>` **muss** ein zugeordnetes `<label for="id">` oder `aria-label` / `aria-labelledby` haben
- Sichtbare Labels: `<label for="input-id">` + `id="input-id"` am Control
- Nur für Screen-Reader: `<label for="id" class="sr-only">…</label>` (Tailwind `sr-only`)
- Fehlermeldungen: `role="alert"` auf dem Fehler-`<p>`

### Buttons & Interactive Elements
- Icon-only Buttons (✕, ▶, ▼, SVG-Icons ohne Text): immer `aria-label="…"` setzen
- Toggle-Buttons (an/aus, aktiv/inaktiv): `aria-pressed={bool}`
- Expand/Collapse-Buttons: `aria-expanded={bool}` + `aria-label`
- Gruppen von zusammengehörigen Buttons: `role="group"` mit `aria-label` auf dem Container

### Landmarks & Struktur
- `<aside>`: `aria-label="Navigation"` (oder passender Name)
- `<nav>`: `aria-label="…"` wenn mehrere `<nav>` auf der Seite
- `<header>`: `aria-label="…"` wenn mehrere `<header>` auf der Seite
- Hamburger-Button: `aria-expanded={bool}` + `aria-controls="sidebar-id"`

### Formulare mit Gruppen
- Zusammengehörige Felder (z.B. Datum + Uhrzeit einer Entität): `<fieldset>` + `<legend>` statt `<div>` + `<p>`

### SVGs
- Dekorative SVGs (rein visuell, kein Inhalt): `aria-hidden="true"`
- Informative SVGs (transportieren Inhalt): `<title>` innerhalb des SVG oder `aria-label` am Element

### Sprache & Internationalisierung
- `aria-label`-Werte dürfen **nicht** hardcoded in einer Sprache sein — immer über `$t('section').key` übersetzen
- Neue aria-Label-Keys in **beiden** Sprachdateien (`en.ts` und `de.ts`) eintragen

### Dynamische Inhalte
- Ergebnisse die nach einer Aktion erscheinen: `aria-live="polite"` auf dem Container
- Fehlermeldungen: `role="alert"` (impliziert `aria-live="assertive"`)

### Checkliste für neue Tools
- [ ] Alle Inputs/Textareas/Selects haben Label-Zuordnung
- [ ] Alle Icon-Buttons haben `aria-label`
- [ ] Toggle-Buttons haben `aria-pressed`
- [ ] Button-Gruppen haben `role="group"` + `aria-label`
- [ ] Dekorative SVGs haben `aria-hidden="true"`
- [ ] Fehlermeldungen haben `role="alert"`
- [ ] Fieldset/Legend für zusammengehörige Eingabegruppen

## Build & Deploy

Nach jeder Änderung — erst Docker neu bauen, dann committen:

```bash
cd /mnt/data/claude/BokuNoDevToys
docker compose down && docker compose build --no-cache && docker compose up -d

git add <dateien>
git commit -m "Beschreibung"
git push
```

> Der lokale `npm run dev` hat keinen Effekt auf die Produktivseite.
