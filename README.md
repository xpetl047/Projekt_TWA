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
    tickets.json          # databáze ticketů (čtení i zápis za běhu)
  lib/
    tickets.ts            # datová vrstva — CRUD funkce nad tickets.json
  pages/
    index.astro           # hlavní stránka (chráněná přihlášením)
    login.astro           # přihlašovací stránka
    api/tickets/
      index.ts            # GET /api/tickets, POST /api/tickets
      [id].ts             # PUT /api/tickets/:id, DELETE /api/tickets/:id
    tickets/
      index.astro         # seznam ticketů
      new.astro           # formulář pro vytvoření ticketu
      [id]/edit.astro     # formulář pro editaci ticketu
  styles/
    app.css               # vlastní styly aplikace
astro.config.mjs          # konfigurace Astro (vč. aliasu @sg-styles)
package.json              # závislosti
docker-compose.yml        # Docker konfigurace (dev)
twa-styleguide-2026/      # Git submodul — sdílený style guide
```

---

## Schéma aplikace

```
┌─────────────────────────────────────────────────────────────────┐
│  PROHLÍŽEČ                                                      │
│                                                                 │
│  localStorage: { auth: { user: "admin" } }                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP request
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ASTRO SERVER  (output: 'server' + @astrojs/node)               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STRÁNKY  src/pages/                                    │   │
│  │                                                         │   │
│  │  /              index.astro      ── SSR, auth guard     │   │
│  │  /login         login.astro      ── SSR, Alpine.js form │   │
│  │  /tickets       tickets/         ── SSR, auth guard     │   │
│  │  /tickets/new   tickets/new      ── SSR, auth guard     │   │
│  │  /tickets/:id/edit  [id]/edit    ── SSR, auth guard     │   │
│  │                                                         │   │
│  │  Auth guard: <AuthGuard />  ←  src/components/          │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ import                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API ROUTES  src/pages/api/tickets/                     │   │
│  │                                                         │   │
│  │  GET    /api/tickets        index.ts  → JSON seznam     │   │
│  │  POST   /api/tickets        index.ts  → vytvoř + redirect│  │
│  │  PUT    /api/tickets/:id    [id].ts   → uprav + redirect │  │
│  │  DELETE /api/tickets/:id    [id].ts   → smaž, 204       │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ import                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DATOVÁ VRSTVA  src/lib/tickets.ts                      │   │
│  │                                                         │   │
│  │  parseTicketFormData()   getTickets()   getTicket(id)   │   │
│  │  createTicket()          updateTicket() deleteTicket()  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ node:fs/promises                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DATA  src/data/tickets.json                            │   │
│  │  [ { id, title, description, status,                   │   │
│  │      priority, assignee, createdAt }, ... ]             │   │
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
