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

**Immer direkt im Projektverzeichnis `/home/pi/BokuNoDevToys/` arbeiten** — nie in Worktrees oder anderen Verzeichnissen, da Docker von hier baut und ein `git pull` sonst nötig wäre.

## Barrierefreiheit (WCAG 2.1 AA — Pflicht)

Die Seite muss zu 100% barrierefrei sein. Folgende Regeln gelten für **jede neue Komponente und jede Änderung**:

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
cd /home/pi/BokuNoDevToys
docker compose down && docker compose build --no-cache && docker compose up -d

git add <dateien>
git commit -m "Beschreibung"
git push
```

> Der lokale `npm run dev` hat keinen Effekt auf die Produktivseite.
