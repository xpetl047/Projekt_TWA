# twa-ticketapp-2026

Ticket management app built with Astro + Alpine.js. Uses `twa-styleguide-2026` as a git submodule for all shared CSS.

## Stack

- **Astro 6** — static site framework (`output: 'static'`), pages in `src/pages/`
- **Netlify adapter** — `@astrojs/netlify` converts API routes to Functions
- **Netlify Blobs** — cloud key-value storage for tickets (replaces local JSON)
- **Alpine.js 3** — client-side reactivity (auth guard, data fetching)
- **Plain CSS** — app-specific overrides in `src/styles/app.css`; design system imported from submodule via `@sg-styles` alias
- **Docker** — preferred dev environment (Node 24 Alpine, port 4322)

## Architecture

- **Static pages** — served from Netlify CDN (fast, no Functions)
- **API routes** — server-rendered (`prerender: false`), run as Netlify Functions
- **Client-side data loading** — Alpine.js fetches data via `fetch('/api/tickets')`
- **JSON API** — all endpoints return JSON (no redirects)
- **Auto-reload** — pages refresh on focus/pageshow events (no manual F5 needed)

## Dev server

```bash
docker compose up
```

App is served at `http://localhost:4322`. File changes are watched via polling.

To run npm commands inside the container:

```bash
docker compose exec dev sh
npm install <package>
```

## Auth

Client-side only, stored in `localStorage`. Credentials: `admin` / `admin`.

Protected pages (e.g. `index.astro`) redirect to `/login` if not authenticated. The auth guard runs in an inline `<script>` at the top of the page.

## Submodule

Styleguide lives at `./twa-styleguide-2026`. After cloning:

```bash
git submodule update --init --recursive
```

The `@sg-styles` Vite alias (defined in `astro.config.mjs`) maps to `./twa-styleguide-2026/src/styles/`. Import styles like:

```css
@import "@sg-styles/tokens.css";
```

To update the submodule to its latest commit:

```bash
git submodule update --remote twa-styleguide-2026
```

## Project structure

```
src/
├── pages/
│   ├── index.astro     # Dashboard (auth-protected)
│   └── login.astro     # Login page
└── styles/
    └── app.css         # App-level CSS overrides
twa-styleguide-2026/    # Git submodule — design system
astro.config.mjs        # Astro + Alpine.js config, @sg-styles alias
docker-compose.yml      # Dev container (port 4322)
```
