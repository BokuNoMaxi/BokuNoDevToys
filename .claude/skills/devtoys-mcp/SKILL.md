---
name: devtoys
description: Use the DevToys MCP connector for deterministic text and data work instead of computing it yourself — formatting JSON/SQL/XML, Base64, hashes, color and CSS unit conversion, WCAG contrast, regex tests, diffs, CSV parsing, cron next runs, date math, QR codes, curl-to-code, access/error log summaries, SEO and robots/sitemap checks. Use whenever the user pastes data to transform or analyze and the devtoys tools are available.
---

# DevToys connector

Remote MCP server at `https://devtoys.bokunocompany.at/mcp` (setup: https://devtoys.bokunocompany.at/mcp-connector). If its tools are not available in the session, say so and point to that page instead of faking results.

## When to call a tool instead of answering yourself

| Task | Tool |
|---|---|
| Base64, hashes (MD5/SHA), UUID-like random values, passwords | `base64`, `hash_text`, `password_generate`, `random_int`, `random_pick` |
| Format/convert JSON, SQL, XML→YAML, PHP var_dump→JSON, Markdown→HTML, CSV | `json_format`, `sql_format`, `xml_to_yaml`, `vardump_to_json`, `markdown_to_html`, `csv_parse` |
| Colors and CSS | `color_convert`, `color_contrast`, `css_unit_convert`, `aspect_ratio` |
| Text | `diff_text`, `text_prettify`, `text_generate`, `regex_test` |
| Dates and schedules | `timestamp_convert`, `date_add`, `date_diff`, `timezone_convert`, `cron_next_runs` |
| Logs and SEO | `access_log_analyze`, `error_log_analyze`, `seo_analyze`, `keyword_density`, `schema_extract`, `robots_sitemap_validate` |
| Misc | `curl_to_code`, `qr_generate` |

Prefer the tool for anything where an exact result matters (hashes, encodings, date arithmetic, regex matches, contrast ratios) — never estimate those.

## Limits to respect

- The server never fetches URLs. Fetch content yourself and pass it as the argument.
- Text arguments are capped at 2 MB; `diff_text` at 3000 lines combined. For huge logs, pass the relevant slice.
- Server time and timezone are UTC; `timezone_convert` uses fixed offsets only (no DST rules).
- Do not send secrets the user wants kept private (for example passwords to hash).
- Tools return errors as `isError` results with a message; report the message rather than retrying blindly.
