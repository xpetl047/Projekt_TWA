# twa-ticketapp-2026

## Vzorová aplikace pro správu ticketů.

Minimální Astro projekt. Pracujeme z Docker kontejneru — není potřeba mít Node.js nainstalovaný lokálně.

*Předpoklad:* nainstalovaný Docker Desktop.

---

## 1) Spuštění dev serveru

```bash
docker compose up dev
```

Co se stane:
- Docker stáhne node:24-alpine (jen poprvé)
- Uvnitř kontejneru se automaticky spustí npm install a npm run dev
- Lokální soubory jsou propojené — změny v editoru se projeví okamžitě

Přístup v prohlížeči:
- http://localhost:4322/

---

## 2) Ruční vstup do kontejneru (volitelné)

Pokud potřebuješ spustit npm příkaz (např. instalace balíčku), otevři nový terminál a spusť:

```bash
docker compose exec dev sh
```

Teď jsi uvnitř kontejneru. Spouštěj npm příkazy normálně:

```bash
npm install <balicek>    # instalace balíčku
npm run build            # produkční build
npm run preview          # preview buildu
exit                     # opuštění kontejneru
```

*Všechny npm příkazy spouštěj uvnitř kontejneru, ne na hostitelském počítači.*

---

## 3) Zastavení

Ctrl+C v terminálu kde běží `docker compose up dev`, nebo:

```bash
docker compose down
```

---

## Struktura projektu

```
src/
  components/
    AuthGuard.astro       # auth guard — sdílená komponenta pro chráněné stránky
  data/
    tickets.json          # výchozí data pro lokální vývoj (Netlify používá Blobs)
  lib/
    tickets.ts            # datová vrstva — CRUD funkce nad Netlify Blobs
  pages/
    index.astro           # hlavní stránka (chráněná přihlášením)
    login.astro           # přihlašovací stránka
    api/
      init-data.ts        # inicializace Netlify Blobs s výchozími daty
      tickets/
        index.ts          # GET /api/tickets (JSON), POST /api/tickets (JSON)
        [id].ts           # GET/PUT/DELETE /api/tickets/:id (všechny JSON)
    tickets/
      index.astro         # seznam ticketů (statický + Alpine.js)
      new.astro           # formulář pro vytvoření ticketu (Alpine.js + fetch)
      [id]/edit.astro     # formulář pro editaci (Alpine.js + fetch)
  styles/
    app.css               # vlastní styly aplikace
astro.config.mjs          # konfigurace Astro (static + prerender: false pro API)
package.json              # závislosti
docker-compose.yml        # Docker konfigurace (dev)
netlify.toml              # Netlify build config + cache headers
twa-styleguide-2026/      # Git submodul — sdílený style guide
```

---

## Schéma aplikace

```
┌─────────────────────────────────────────────────────────────────┐
│  PROHLÍŽEČ                                                      │
│                                                                 │
│  localStorage: { auth: { user: "admin" } }                      │
│  Alpine.js — client-side reactivity + fetch() API calls         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP request
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  NETLIFY (JAMstack)                                             │
│                                                                 │
│  CDN → statické HTML (output: 'static')                         │
│  Functions → API routes (prerender: false)                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STRÁNKY  src/pages/  (statické HTML z CDN)             │   │
│  │                                                         │   │
│  │  /              index.astro      ── static, auth guard  │   │
│  │  /login         login.astro      ── static, Alpine form │   │
│  │  /tickets       tickets/         ── static + Alpine.js  │   │
│  │  /tickets/new   tickets/new      ── static + Alpine.js  │   │
│  │  /tickets/:id/edit  [id]/edit    ── SSR (prerender:false)│  │
│  │                                                         │   │
│  │  Auth guard: <AuthGuard />  ←  src/components/          │   │
│  │  Data loading: Alpine.js + fetch('/api/tickets')        │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ fetch() calls                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API ROUTES (Netlify Functions)  api/tickets/           │   │
│  │  prerender: false ─ server-rendered při každém requestu │   │
│  │                                                         │   │
│  │  GET    /api/tickets        index.ts  → JSON seznam     │   │
│  │  POST   /api/tickets        index.ts  → JSON (201)      │   │
│  │  GET    /api/tickets/:id    [id].ts   → JSON ticket     │   │
│  │  PUT    /api/tickets/:id    [id].ts   → JSON updated    │   │
│  │  DELETE /api/tickets/:id    [id].ts   → 204 No Content  │   │
│  │                                                         │   │
│  │  Cache-Control: no-store (viz netlify.toml)             │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ import                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DATOVÁ VRSTVA  src/lib/tickets.ts                      │   │
│  │                                                         │   │
│  │  parseTicketFormData()   getTickets()   getTicket(id)   │   │
│  │  createTicket()          updateTicket() deleteTicket()  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ @netlify/blobs                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STORAGE  Netlify Blobs (cloudový key-value store)      │   │
│  │                                                         │   │
│  │  Store: 'tickets'                                       │   │
│  │  Key: 'all'                                             │   │
│  │  Value: JSON.stringify([ { id, title, ... }, ... ])     │   │
│  │  Metadata: { updated: ISO timestamp, count: "3" }       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             │ CSS import (@sg-styles alias)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STYLEGUIDE  twa-styleguide-2026/  (git submodul)               │
│                                                                 │
│  tokens.css      proměnné (barvy, spacing, ...)                 │
│  typography.css  font Inter                                     │
│  components.css  .card  .btn  .input  .badge  .table  ...       │
└─────────────────────────────────────────────────────────────────┘

 ──────────────────────────────────────────────────────────────────
  TOK DAT — příklad: smazání ticketu
 ──────────────────────────────────────────────────────────────────

  [/tickets] kliknutí Smazat
      │
      │  Alpine.js: fetch('/api/tickets/1', { method: 'DELETE' })
      ▼
  DELETE /api/tickets/[id].ts
      │  deleteTicket('1')
      ▼
  tickets.ts  →  readAll()  →  filter  →  writeAll()
      │
      ▼
  tickets.json  (ticket odstraněn)
      │
      ▼  Response(null, 204)
  fetch callback: window.location.reload()
```

---

## Přihlášení

Aplikace používá jednoduchou clientside autentizaci s persistencí v `localStorage`.

| Uživatel | Heslo   |
|----------|---------|
| `admin`  | `admin` |

- Po přihlášení je session uložena v `localStorage` — přežije zavření prohlížeče
- Nepřihlášený uživatel je automaticky přesměrován na `/login`
- Odhlášení smaže session a přesměruje zpět na `/login`

---

## Submodul twa-styleguide-2026

Projekt používá Git submodul [twa-styleguide-2026](https://github.com/pacesmarek/twa-styleguide-2026) — sdílený style guide (CSS proměnné, komponenty, typografie).

Po naklonování repozitáře je potřeba submodul inicializovat:

```bash
git submodule update --init --recursive
```

Nebo při klonování rovnou:

```bash
git clone --recurse-submodules https://github.com/pacesmarek/twa-ticketapp-2026.git
```
