# BokuNoDevToys

A collection of browser-based developer tools in one handy web application. Write, debug, format, and convert everything without installing extra software.

🌐 **Live:** https://devtoys.bokunocompany.at/

## Features

BokuNoDevToys currently provides **49 developer-friendly tools** organized into 9 categories:

| Category | Tools | Examples |
|----------|-------|----------|
| **Date & Time** | 3 | DateTime Converter, Timezone Converter, Date Calculator |
| **Text** | 5 | Regex Tester, Markdown Viewer, Diff Viewer, Text Prettier, Text Generator |
| **Format & Convert** | 7 | JSON Formatter, SQL Formatter, Base64 Encoder, HTML Viewer, XML to YAML |
| **Security** | 3 | Password Generator, Hash Generator, htpasswd Generator |
| **Generator** | 8 | QR Code, Favicon, cURL to Code, Linux Commands, MySQL Export, Cron Builder, Random Values |
| **Analyzer** | 5 | Error Log, Access Log, CSV Viewer, IP Info, SVG Viewer |
| **Frontend & Design** | 11 | CSS Grid Generator, Box Shadow, Gradient, Color Palette, Glassmorphism, Unit Converter, Contrast Checker |
| **SEO** | 6 | SEO Score Analyzer, SERP Preview, Social Card Preview, Schema Analyzer, Keyword Density, Robots/Sitemap |
| **Scraper** | 1 | YouTube Downloader (yt-dlp) |

## Tech Stack

- **Framework:** SvelteKit (TypeScript, Svelte 5)
- **Styling:** Tailwind CSS 4
- **Build:** Vite
- **Deployment:** Docker + nginx
- **Localization:** EN/DE (i18n)
- **Accessibility:** WCAG 2.1 AAA compliant

## Local Development

### Install dependencies
```bash
npm install
```

### Run dev server
```bash
npm run dev
```

Then open http://localhost:5173

### Build for production
```bash
npm run build
npm run preview
```

### Type checking
```bash
npm run check
```

## Self-Hosting with Docker

### Quick start

The project includes a Docker setup for easy deployment:

```bash
# Build and run (first time)
docker compose up -d

# After code changes, rebuild quickly (no image rebuild needed)
docker compose run --rm builder npm run build
docker compose restart devtoys
```

The service exposes port `34291` by default. Configure via `docker-compose.yml`.

### How it works

- **builder** service: Node 20 Alpine — runs `npm ci` and `npm run build`
- **devtoys** service: nginx Alpine — serves the static build from `./build` directory
- nginx reads from the mounted `./build` volume, so the container stays lightweight and updates are fast
- **No image rebuild needed** for code changes — just rebuild the `./build` folder and restart nginx

### Configuration

Edit `docker-compose.yml` to:
- Change exposed port (default: `34291:80`)
- Adjust container names
- Modify restart policy

Edit `nginx.conf` for HTTP headers, cache policies, or routing.

## Contributing

Contributions are welcome! To add a new tool:

1. Create a Svelte component in `src/lib/tools/MyTool.svelte`
2. Register it in `src/lib/tools/config.ts` under the appropriate category
3. Add i18n strings to `src/lib/translations/en.ts` and `de.ts`
4. Import and render the component in `src/routes/tools/[tool]/+page.svelte`

All new features must maintain **WCAG 2.1 AAA accessibility** standards.

## License

**AGPL-3.0-only**

This project is licensed under the GNU Affero General Public License v3.0. This license requires that:

- **If you run this application as a network service**, you must offer source code to all users of your service (AGPL § 13).
- Any modifications you make and distribute must be released under the same license.

For full license details, see the `LICENSE` file.

---

**Custom license terms?** Contact the author (Markus Ketterer) for alternative licensing arrangements.

<!-- SCREENSHOT -->
