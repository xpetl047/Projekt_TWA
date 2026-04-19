# Netlify Deployment Guide

## Co je připraveno

Projekt je nakonfigurován pro deployment na Netlify s těmito změnami:

1. **Static + Server Routes** — `output: 'static'` s jednotlivými server-rendered API routes (Astro 6)
2. **Netlify Adapter** — `@astrojs/netlify` převádí API routes na Netlify Functions
3. **Client-side data loading** — Stránky načítají data pomocí Alpine.js a `fetch()` z API
4. **Netlify Blobs** — `@netlify/blobs` ukládá tickets do cloudového key-value storage
5. **JSON API** — Všechny API endpointy vrací JSON (žádné redirecty)
6. **Cache busting** — `netlify.toml` obsahuje no-cache headers pro API, `fetch()` používá timestamp querystring
7. **Auto-reload** — Stránky se automaticky obnoví při focus/pageshow events

## Výhody tohoto přístupu

- ✅ Stránky jsou statické HTML soubory (rychlé načtení z CDN)
- ✅ Netlify Functions se volají jen pro API operace (CRUD)
- ✅ Nižší spotřeba Function calls = levnější provoz
- ✅ Data vždy aktuální (načítají se z API, ne z build času)
- ✅ Žádné manuální refreshe — auto-reload při focus/visibility change
- ✅ JSON API — kompatibilní s fetch(), čisté error handling

## Server vs Static režim

### S `output: 'server'` (SSR):

Každý request na `/tickets`:
1. Netlify Function spustí celou stránku (SSR)
2. Server zavolá `const tickets = await getTickets()`
3. Vygeneruje HTML s daty natvrdo embedovanými v HTML
4. Odešle kompletní HTML → uživatel
5. **= 1 Function call na každé načtení stránky**

### S `output: 'static'` (JAMstack):

**Při buildu:**
- Vygeneruje se `/tickets/index.html` (prázdná šablona bez dat)

**Každý request na `/tickets`:**
1. Netlify servíruje statický HTML z CDN (**0 Function calls**)
2. Alpine.js v prohlížeči: `fetch('/api/tickets')` (**1 Function call jen pro data**)
3. Data se zobrazí v tabulce dynamicky

**Výsledek:**
- Server: **1 Function call = celá stránka**
- Static: **0 Function pro stránku + 1 Function jen pro data**
- → Rychlejší, levnější, lépe škáluje

## API Endpointy

Všechny API routes vrací **JSON** místo HTML redirectů:

### GET /api/tickets
```json
[
  { "id": "1", "title": "...", "status": "open", ... },
  ...
]
```
**Headers:** `Cache-Control: no-store`

### POST /api/tickets
**Request:** FormData z HTML formuláře  
**Response:** Nově vytvořený ticket (status 201)
```json
{ "id": "4", "title": "...", "createdAt": "...", ... }
```

### GET /api/tickets/:id
**Response:** Jeden ticket
```json
{ "id": "1", "title": "...", ... }
```

### PUT /api/tickets/:id
**Request:** FormData z HTML formuláře  
**Response:** Aktualizovaný ticket
```json
{ "id": "1", "title": "Nový název", ... }
```

### DELETE /api/tickets/:id
**Response:** 204 No Content (bez těla)

## Cache Strategy

### Server-side (netlify.toml)
```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-store, no-cache, must-revalidate, max-age=0"
    Pragma = "no-cache"
    Expires = "0"
```

### Client-side (fetch)
```js
fetch('/api/tickets?_=' + Date.now(), { 
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  }
})
```

### Auto-reload mechanismus
Stránka `/tickets` se automaticky reloaduje při:
- **focus** — návrat na stránku z jiné záložky/okna
- **pageshow** — pokud stránka přichází z bfcache (back button)
- **visibilitychange** — when stránka se stane viditelnou

```js
window.addEventListener('focus', () => this.loadTickets());
window.addEventListener('pageshow', (e) => {
  if (e.persisted) this.loadTickets();
});
```

**Výsledek:** Data jsou vždy aktuální bez manuálního F5.

## Netlify Blobs Storage

Data jsou uložena v Netlify Blobs store pod názvem `tickets`.

### Metadata tracking
Každý zápis obsahuje metadata pro lepší debugging:
```js
await store.set('all', JSON.stringify(tickets), {
  metadata: { 
    updated: new Date().toISOString(),
    count: tickets.length.toString()
  }
});
```

**Free tier limity:**
- 1 GB storage
- 1 GB bandwidth/měsíc

**Initial data:** První přístup vrátí prázdné pole. Pro nahrání dat:
- Vytvořit tickets ručně přes UI
- Zavolat `/api/init-data` (viz src/pages/api/init-data.ts)

## Lokální vývoj

```bash
# Docker (doporučeno)
docker compose up

# Nebo přímo
npm run dev
```

**⚠️ Poznámka:** V lokálním vývoji Netlify Blobs pracuje v in-memory režimu. Data se nezachovají po restartu. Pro plnou funkcionalitu testujte na Netlify preview.

## Deployment na Netlify

### Varianta 1: Automatický deploy z GitHubu

1. Pushněte projekt na GitHub
2. Přihlaste se na [netlify.com](https://netlify.com)
3. **Add new site** → **Import an existing project**
4. Připojte GitHub repository
5. Netlify automaticky detekuje `netlify.toml` a spustí build

### Varianta 2: Manuální deploy pomocí Netlify CLI

```bash
# Nainstalovat Netlify CLI
npm install -g netlify-cli

# Přihlásit se
netlify login

# Inicializovat projekt
netlify init

# Deploy
netlify deploy --prod
```

## Kontrola funkčnosti

Po deployi otestujte:
- ✅ Načtení stránky
- ✅ Přihlášení (admin/admin)
- ✅ Vytvoření nového ticketu
- ✅ Editace ticketu — změny se projeví okamžitě bez F5
- ✅ Smazání ticketu — zmizí okamžitě
- ✅ Návrat na stránku z jiné záložky — data se automaticky obnoví

## Submodule

**Důležité:** Před deployem zkontrolujte, že submodule `twa-styleguide-2026` je aktuální:

```bash
git submodule update --init --recursive
```

Netlify automaticky inicializuje submodules při buildu.

## Troubleshooting

### Build fails
Zkontrolujte Node verzi v `netlify.toml` (musí být >= 22.12.0)

### Data se neukládají
- Netlify Functions mají read-only filesystem
- Data MUSÍ být v Netlify Blobs, ne v `tickets.json`
- Zkontrolujte, že `src/lib/tickets.ts` používá `@netlify/blobs`

### Styly nefungují
Ujistěte se, že submodule je správně inicializován a `@sg-styles` alias funguje

## Environment Variables

Pokud byste v budoucnu potřebovali environment variables:

1. Netlify Dashboard → Site settings → Environment variables
2. Nebo lokálně v `.env` (již je v `.gitignore`)

## Náklady

S Free tier Netlify:
- ✅ 100 GB bandwidth/měsíc
- ✅ Netlify Functions: 125k požadavků/měsíc
- ✅ Netlify Blobs: 1 GB storage + 1 GB bandwidth
- ✅ SSR/SSG stránky bez limitu

Pro váš projekt je to zdarma.
