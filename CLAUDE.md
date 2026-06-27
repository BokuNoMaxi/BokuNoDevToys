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

## Build & Deploy

Die Seite läuft in Docker (`/home/pi/BokuNoDevToys/`). Nach jeder Änderung:

```bash
cd /home/pi/BokuNoDevToys
docker compose down && docker compose build --no-cache && docker compose up -d
```

Danach Änderungen committen und auf main pushen:

```bash
git add <dateien>
git commit -m "Beschreibung"
git push origin <branch>:main
```

> Der lokale `npm run dev` hat keinen Effekt auf die Produktivseite.
