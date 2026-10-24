# BokuNoDevToys

SvelteKit-Projekt mit Dev-Tools im Browser. Läuft produktiv via Docker unter https://devtoys.bokunocompany.at/

## Projektstruktur

- `src/lib/tools/` — Svelte-Komponenten für jedes Tool
- `src/lib/tools/config.ts` — Tool-Registry: hier neue Tools registrieren (id, name, description, Kategorie)
- `src/routes/tools/[tool]/+page.svelte` — Routing: hier neue Tool-Komponenten einbinden

- `src/lib/core/` — **framework-freie Tool-Logik** (kein DOM, kein `$lib/i18n`), geteilt von den Svelte-Tools und dem MCP-Server
- `mcp-server/` — Remote-MCP-Server (Streamable HTTP unter `/mcp`), siehe `mcp-server/README.md`
- `src/routes/mcp-connector/` — Anleitung zum Claude-Konnektor (de/en, Texte unter `mcpDocs` in den Übersetzungen)

## Neues Tool hinzufügen

1. Reine Logik in `src/lib/core/<bereich>.ts` ablegen (Text rein → Ergebnis raus; für HTML/XML einen `ParseDoc`-Parameter statt `DOMParser` nehmen)
2. Svelte-Komponente in `src/lib/tools/MeinTool.svelte` erstellen und die Logik aus `core` importieren
3. In `src/lib/tools/config.ts` unter der passenden Kategorie eintragen:
   ```ts
   { id: 'mein-tool', name: 'Mein Tool', description: '...' }
   ```
4. In `src/routes/tools/[tool]/+page.svelte` importieren und per `{:else if toolId === 'mein-tool'}` einbinden
5. Wenn das Tool sinnvoll ohne Browser nutzbar ist (reine Text-/Datenverarbeitung, kein Netzwerk, keine Geheimnisse): auch als MCP-Tool in `mcp-server/src/tools/*.ts` registrieren, in `mcpDocs.tools` (en + de) eintragen und einen Test in `mcp-server/test/server.test.mjs` ergänzen (`cd mcp-server && npm test`)

## Arbeitsweise

**Immer direkt im Projektverzeichnis `/mnt/data/claude/BokuNoDevToys/` auf `srv-ubuntu` (10.0.0.3) arbeiten** — nie in Worktrees oder anderen Verzeichnissen, da Docker von hier baut und ein `git pull` sonst nötig wäre. (Vormals lief das Projekt auf dem Raspberry Pi unter `/home/pi/BokuNoDevToys/` — dorthin nicht mehr deployen.)

## Barrierefreiheit (WCAG 2.1 AAA — Pflicht)

Die Seite muss zu 100% barrierefrei sein. Folgende Regeln gelten für **jede neue Komponente und jede Änderung**:

### Farbwelt (wie bokunocompany.at)
Definiert in `src/routes/layout.css` (`@theme`, Tailwind v4 — eine `tailwind.config.ts` wird ignoriert):
- **Grund** `bg-slate-950` = `#1A1C2E` (navy). Flächen darüber: `slate-900` `#1f2236` (Sidebar, Eingabefelder), `slate-800` `#262940` (Karten), `slate-700` `#363a58` (Rahmen). Die Stufen sind navy-getönt, die Reihenfolge ist unverändert.
- **Akzent** `#8B5CF6` = `violet-500` / `--color-accent`: für Rahmen, Fokus-Zustände, Slider/Checkboxen und große Flächen. **Nicht** als Hintergrund für Buttons mit Text (weiß darauf nur 4,23:1) und nicht als Text auf dem Grund (3,97:1) — dafür `bg-violet-700` bzw. `text-violet-300`.
- **Zweitakzent** `#F59E0B` = `amber-500` / `--color-accent-secondary`: globaler Tastatur-Fokusring (7,83:1 auf dem Grund); Textlinks in Fließtext-Seiten als `text-amber-400` (10,07:1).
- **Schrift**: Inter (selbst gehostet über `@fontsource-variable/inter`, die CSP erlaubt nur `font-src 'self'`).

### Farbkontrast (WCAG AAA — Pflicht)
- Normaler Text (< 18pt / < 14pt bold): Kontrastverhältnis **mindestens 7:1**
- Großer Text (≥ 18pt / ≥ 14pt bold): Kontrastverhältnis mindestens 4.5:1
- **Erlaubte Text-Farben** auf dunklem Hintergrund (bg-slate-800/900):
  - `text-slate-300` oder heller für Beschriftungen, Überschriften, Hinweistexte (8,75:1 auf slate-800, 9,62:1 auf slate-900)
  - `text-violet-300` für Code-Highlights, aktive Nav-Links (7,72:1 / 8,49:1)
  - `text-red-300` für Fehlermeldungen (7,51:1 / 8,25:1)
  - `text-emerald-400`, `text-amber-400`, `text-sky-400` (nur auf bg-slate-900/950: ≥ 7,3:1). Auf bg-slate-800 stattdessen die `-300`-Stufe nehmen.
- **Buttons aktiv**: `bg-violet-700 text-white` (7.10:1 ✓)
- **Buttons inaktiv auf bg-slate-700**: `text-slate-200` (8.40:1 ✓)
- **Buttons inaktiv auf bg-slate-900**: `text-slate-300` (9.62:1 ✓)
- **Hover** auf bg-slate-600: `text-white` (8.33:1 ✓)
- **Nie verwenden** für lesbaren Text: `text-slate-400` bis `text-slate-700` auf slate-800/900 Hintergründen
- Bei Farbänderungen immer alle Seiten messen, nicht nur Stichproben (Playwright: Textfarbe gegen effektiven Hintergrund je Element, vorher/nachher vergleichen).

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

**Dies ist eine Live-Seite** (https://devtoys.bokunocompany.at/) — Deploys dürfen die Seite
nicht unnötig offline nehmen. Der `devtoys`-Service mountet `./build` als
`:ro`-Volume nach `/usr/share/nginx/html` (siehe `docker-compose.yml`); nginx liest die
Dateien direkt vom Host, das Docker-Image selbst muss dafür nicht neu gebaut werden.

### Schneller Weg (Standardfall — reine Code-/Content-Änderungen, keine neuen Dependencies)

```bash
cd /mnt/data/claude/BokuNoDevToys
docker compose run --rm builder npm run build   # baut nur ./build neu, Seite bleibt online
docker compose restart devtoys                  # <1s Unterbrechung, kein Image-Rebuild
```

`npm run build` überschreibt `./build` komplett (rm + neu anlegen) — dadurch verliert der
schon laufende Container seinen Mount-Bezug auf das Verzeichnis (zeigt sonst 403 statt der
neuen Seite). Der `restart` behebt das, indem er den Mount neu aufsetzt; da kein Image
gebaut/neu gezogen wird, ist der Container in unter einer Sekunde wieder da.

### Voller Rebuild (nur nötig bei Änderungen an `package.json`, `Dockerfile` oder `nginx.conf`)

```bash
cd /mnt/data/claude/BokuNoDevToys
docker compose build --no-cache && docker compose up -d
```

### MCP-Server (Claude-Konnektor)

Eigener Service `mcp` (`Dockerfile.mcp`, Port 3000 nur intern); der nginx im `devtoys`-Container leitet
`POST /mcp` dorthin weiter. Nach Änderungen an `mcp-server/` oder `src/lib/core/`:

```bash
cd /mnt/data/claude/BokuNoDevToys
docker compose build mcp && docker compose up -d mcp      # Website bleibt online
```

Die **erste** Einrichtung (und jede Änderung an `nginx.conf`) braucht zusätzlich den vollen Rebuild des
`devtoys`-Images (siehe oben). Ist der `mcp`-Container down, antwortet nur `/mcp` mit 502, die Seite läuft weiter.
Prüfen: `curl -s -X POST https://devtoys.bokunocompany.at/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`.
Änderungen an `src/lib/core/` wirken sich auch auf die Web-Tools aus → zusätzlich den schnellen Weg (Build + restart) ausführen.

**Automatisch:** Die GitHub Action `.github/workflows/deploy.yml` deployt bei jedem Push auf `main` (Quick Build; voller Rebuild bei Änderungen an `package*.json`, `Dockerfile`, `nginx.conf`, `docker-compose.yml`; zusätzlich `mcp` neu bauen bei Änderungen in `mcp-server/`, `src/lib/core/`, `Dockerfile.mcp`). Manuelles Deployen ist nur nötig, wenn die Action nicht läuft.

Das baut das komplette Image neu (inkl. `npm ci`) und ist deutlich langsamer — für reine
Tool-/Übersetzungs-Änderungen nicht nötig.

### Danach committen

```bash
git add <dateien>
git commit -m "Beschreibung"
git push
```

> Der lokale `npm run dev` hat keinen Effekt auf die Produktivseite.
