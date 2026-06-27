# BokuNoDevToys

SvelteKit-Projekt mit Dev-Tools im Browser. Läuft produktiv via Docker unter https://devtoys.bokunocompany.at/

## Nach jeder Änderung

Docker neu bauen und starten, damit Änderungen auf der Produktivseite sichtbar werden:

```bash
cd /home/pi/BokuNoDevToys
docker compose down && docker compose build --no-cache && docker compose up -d
```
