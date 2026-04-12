# Implementace CRUD ticketů — průvodce pro studenty

- Přepnutí Astro z statického režimu na **SSR server** pomocí `@astrojs/node`
- Vytvoření **REST API** (GET, POST, PUT, DELETE) jako Astro API routes
- Implementace **CRUD stránek** pro správu ticketů s Alpine.js
- Sdílení logiky přes **datovou vrstvu** (`tickets.ts`) a **Astro komponentu** (`AuthGuard`)

---

Budujeme správu ticketů: seznam, vytvoření, editace a smazání. Data ukládáme do JSON souboru na serveru přes REST API.

---

## Krok 1 — Nové CSS komponenty ve Styleguide

> Styleguide je sdílená knihovna komponent. Vše co může být znovu použito patří tam — ne do aplikace.

### 1a. Otevři `twa-styleguide-2026/src/styles/components.css`

Najdi `.card` a odstraň z něj řádky `width` a `margin`. Přidej je místo toho do `.login-box .card`:

```css
.card {
  padding: var(--card-padding);
  background: var(--card-background);
  border-radius: var(--border-radius);
  border: 0.1rem solid var(--card-border-color);
  box-shadow: var(--card-shadow);
}

.login-box .card {
  width: 45rem;
  margin-left: auto;
  margin-right: auto;
}
```

> Původní `.card` měla natvrdo `width: 45rem`. To bylo dobré pro login, ale tabulka ticketů potřebuje plnou šířku.

Do `.btn` přidej `text-decoration: none` — tlačítko budeme používat i na `<a>` tagu:

```css
.btn {
  padding: var(--btn-padding);
  border: 0;
  border-radius: var(--btn-border-radius);
  color: #fff;
  cursor: pointer;
  font-size: 1.6rem;
  text-decoration: none; /* ← přidej */
}
```

### 1b. Otevři `twa-styleguide-2026/src/styles/tokens.css`

Na konec `:root` přidej barevné proměnné pro badge:

```css
  --table-border-color: var(--card-border-color);
  --table-th-color:     #6b7280;
  --table-th-bg:        #f9fafb;

  --badge-open-bg:        #e0f2fe;
  --badge-open-color:     #0369a1;
  --badge-progress-bg:    #fef9c3;
  --badge-progress-color: #854d0e;
  --badge-closed-bg:      #dcfce7;
  --badge-closed-color:   #166534;

  --badge-low-bg:         #f1f5f9;
  --badge-low-color:      #475569;
  --badge-medium-bg:      #fff7ed;
  --badge-medium-color:   #c2410c;
  --badge-high-bg:        #fef2f2;
  --badge-high-color:     #b91c1c;
```

> Barvy patří do `tokens.css` — jsou to hodnoty designového systému. `components.css` je pak jen používá přes `var()`.

### 1c. Na konec `components.css` přidej `.badge`

```css
/* Badge */

.badge {
  display: inline-block;
  padding: 0.3rem 0.9rem;
  border-radius: 10rem;
  font-size: 1.2rem;
  font-weight: 500;
}

.badge-open        { background: var(--badge-open-bg);     color: var(--badge-open-color); }
.badge-in-progress { background: var(--badge-progress-bg); color: var(--badge-progress-color); }
.badge-closed      { background: var(--badge-closed-bg);   color: var(--badge-closed-color); }

.badge-low         { background: var(--badge-low-bg);      color: var(--badge-low-color); }
.badge-medium      { background: var(--badge-medium-bg);   color: var(--badge-medium-color); }
.badge-high        { background: var(--badge-high-bg);     color: var(--badge-high-color); }
```

### 1d. Na konec stejného souboru přidej `.table`

```css
/* Table */

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.4rem;
}

.table th,
.table td {
  padding: 1.2rem 1.6rem;
  text-align: left;
  border-bottom: 0.1rem solid var(--table-border-color);
}

.table th {
  font-weight: 600;
  color: var(--table-th-color);
  background: var(--table-th-bg);
}
```

### 1e. Otevři `twa-styleguide-2026/src/pages/index.astro`

Přidej ukázky nových komponent do showcase — za sekci Alert vlož:

```astro
<div class="component-item">
  <h3>Badge — status</h3>
  <div class="component-preview">
    <span class="badge badge-open">open</span>
    <span class="badge badge-in-progress">in-progress</span>
    <span class="badge badge-closed">closed</span>
  </div>
</div>

<div class="component-item">
  <h3>Badge — priorita</h3>
  <div class="component-preview">
    <span class="badge badge-low">low</span>
    <span class="badge badge-medium">medium</span>
    <span class="badge badge-high">high</span>
  </div>
</div>

<div class="component-item">
  <h3>Table</h3>
  <div class="component-preview">
    <table class="table">
      <thead>
        <tr><th>#</th><th>Název</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>Opravit login</td><td><span class="badge badge-open">open</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## Krok 2 — Přepnutí aplikace na server mode

Výchozí Astro generuje statické HTML soubory při buildu. My potřebujeme číst a zapisovat JSON při každém requestu — musíme přepnout na **server mode**.

### 2a. V terminálu (v adresáři aplikace) nainstaluj adapter

```bash
npm install @astrojs/node
npm install --save-dev @types/node
```

> `@astrojs/node` je server adapter. `@types/node` přidá TypeScript typy pro Node.js moduly (`fs`, `path`, `process`) — bez toho by editor hlásil chyby u importů `node:fs/promises` a `node:path`.

### 2b. Otevři `astro.config.mjs` a uprav ho

Přidej import `node` a dvě nové řádky do `defineConfig`:

```js
import { defineConfig } from 'astro/config';
import alpine from '@astrojs/alpinejs';
import node from '@astrojs/node';        // ← přidej
import path from 'path';

export default defineConfig({
  output: 'server',                       // ← přidej
  adapter: node({ mode: 'standalone' }), // ← přidej
  base: '/',
  integrations: [alpine()],
  // ... zbytek beze změny
});
```

> `output: 'server'` říká Astru: zpracovávej každý request za běhu (ne při buildu). `@astrojs/node` říká: použij Node.js jako HTTP server.

---

## Krok 3 — Datová vrstva

### 3a. Vytvoř složku `src/data/` a v ní soubor `tickets.json`

Zapiš do něj ukázková data:

```json
[
  {
    "id": "1",
    "title": "Opravit přihlašování na Safari",
    "description": "Tlačítko Přihlásit se nereaguje v Safari 17.",
    "status": "open",
    "priority": "high",
    "assignee": "admin",
    "createdAt": "2026-03-20T09:00:00Z"
  },
  {
    "id": "2",
    "title": "Přidat filtrování ticketů",
    "description": "Uživatelé chtějí filtrovat podle stavu a priority.",
    "status": "in-progress",
    "priority": "medium",
    "assignee": "admin",
    "createdAt": "2026-03-22T14:30:00Z"
  },
  {
    "id": "3",
    "title": "Aktualizovat závislosti",
    "description": "Astro 6.1 je dostupné, provést upgrade a otestovat.",
    "status": "closed",
    "priority": "low",
    "assignee": "admin",
    "createdAt": "2026-03-25T11:00:00Z"
  }
]
```

### 3b. Vytvoř složku `src/lib/` a v ní soubor `tickets.ts`

Tento soubor je **datová vrstva** — všechno čtení a zápis JSON je na jednom místě. Stránky a API routes ho pouze importují.

Zapiš do něj:

```ts
import fs from 'node:fs/promises'; // Node.js modul pro práci se soubory (read, write, ...)
import path from 'node:path';      // Node.js modul pro skládání cest (cross-platform)

// path.join sestaví absolutní cestu k souboru
// process.cwd() vrátí kořenový adresář projektu (tam kde běží node)
const DB_PATH = path.join(process.cwd(), 'src/data/tickets.json');

// --- Typy ---

// TypeScript union typy — proměnná smí obsahovat jen jednu z uvedených hodnot
export type TicketStatus   = 'open' | 'in-progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

// Rozhraní popisuje tvar jednoho ticketu
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string;
  createdAt: string; // ISO datum, např. "2026-03-29T10:00:00Z"
}

// --- Interní pomocné funkce ---

async function readAll(): Promise<Ticket[]> {
  const raw = await fs.readFile(DB_PATH, 'utf-8'); // přečte soubor jako text
  return JSON.parse(raw);                           // převede JSON string → JS pole
}

async function writeAll(tickets: Ticket[]): Promise<void> {
  // JSON.stringify(data, null, 2) — třetí argument "2" znamená odsadit 2 mezerami
  await fs.writeFile(DB_PATH, JSON.stringify(tickets, null, 2));
}

// --- Pomocná funkce pro API routes ---

// Přečte data z HTML formuláře a vrátí je jako objekt.
// Obě routes (POST i PUT) používají tuto funkci — logika je na jednom místě.
export function parseTicketFormData(form: FormData): Omit<Ticket, 'id' | 'createdAt'> {
  return {
    title:       String(form.get('title') ?? ''),
    description: String(form.get('description') ?? ''),
    status:      (form.get('status')   as TicketStatus)   ?? 'open',
    priority:    (form.get('priority') as TicketPriority) ?? 'medium',
    assignee:    String(form.get('assignee') ?? ''),
  };
}

// --- Veřejné CRUD funkce ---

// READ — vrátí všechny tickety
export async function getTickets(): Promise<Ticket[]> {
  return readAll();
}

// READ — najde jeden ticket podle id, vrátí undefined pokud neexistuje
export async function getTicket(id: string): Promise<Ticket | undefined> {
  const tickets = await readAll();
  return tickets.find(t => t.id === id); // Array.find vrátí první shodu, nebo undefined
}

// CREATE — přidá nový ticket, vygeneruje id a datum
// Omit<Ticket, 'id' | 'createdAt'> = typ Ticket bez polí id a createdAt
export async function createTicket(data: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket> {
  const tickets = await readAll();
  const ticket: Ticket = {
    ...data,                             // rozbalí všechna předaná pole
    id: Date.now().toString(),           // timestamp v ms jako unikátní id
    createdAt: new Date().toISOString(), // aktuální čas v ISO formátu
  };
  tickets.push(ticket);
  await writeAll(tickets);
  return ticket;
}

// UPDATE — aktualizuje existující ticket, vrátí undefined pokud ticket nenajde
export async function updateTicket(id: string, data: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket | undefined> {
  const tickets = await readAll();
  const index = tickets.findIndex(t => t.id === id); // findIndex vrátí pozici, nebo -1
  if (index === -1) return undefined;
  tickets[index] = { ...tickets[index], ...data };   // přepíše jen předaná pole
  await writeAll(tickets);
  return tickets[index];
}

// DELETE — odstraní ticket, vrátí true při úspěchu, false pokud ticket neexistoval
export async function deleteTicket(id: string): Promise<boolean> {
  const tickets = await readAll();
  const filtered = tickets.filter(t => t.id !== id); // nové pole bez smazaného ticketu
  if (filtered.length === tickets.length) return false; // délka stejná = nic se nesmazalo
  await writeAll(filtered);
  return true;
}
```

---

## Krok 4 — API routes

### Co jsou Astro endpointy?

Astro umožňuje vytvářet vlastní endpointy, které vrátí libovolná data — JSON, obrázky, RSS, nebo tvoří plnohodnotné REST API.

- V **statickém režimu** (`output: 'static'`) se endpointy zavolají při buildu a výstup se uloží jako soubor.
- V **SSR režimu** (`output: 'server'`), který používáme, se endpointy zavolají při každém requestu — chovají se jako klasické serverové API routes.

Endpoint je soubor v `src/pages/` (může být kdekoliv, konvencí je `src/pages/api/`). Každý exportovaný handler odpovídá HTTP metodě:

```ts
export const GET: APIRoute = async () => { ... };
export const POST: APIRoute = async ({ request }) => { ... };
export const PUT: APIRoute = async ({ params, request }) => { ... };
export const DELETE: APIRoute = async ({ params }) => { ... };
```

Soubory se jmenují podle URL, stejně jako stránky — `[id].ts` v názvu znamená dynamický parametr dostupný přes `params.id`.

---

Vytvoř složku `src/pages/api/tickets/`. V ní budou dva soubory.

### 4a. Vytvoř `src/pages/api/tickets/index.ts`

```ts
import type { APIRoute } from 'astro';
import { getTickets, createTicket, parseTicketFormData } from '../../../lib/tickets';

// GET /api/tickets — vrátí všechny tickety jako JSON
export const GET: APIRoute = async () => {
  const tickets = await getTickets();
  return Response.json(tickets); // Response.json() nastaví Content-Type: application/json
};

// POST /api/tickets — přijme data z formuláře, vytvoří ticket a přesměruje na seznam
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData(); // přečte tělo requestu jako FormData
  await createTicket(parseTicketFormData(form));
  return redirect('/tickets', 302); // 302 = dočasné přesměrování
};
```

> `parseTicketFormData` je pomocná funkce z `tickets.ts` — parsování formuláře je na jednom místě a POST i PUT ji sdílí.

### 4b. Vytvoř `src/pages/api/tickets/[id].ts`

Hranaté závorky v názvu souboru znamenají dynamický parametr — `[id]` zachytí libovolné id z URL.

```ts
import type { APIRoute } from 'astro';
import { updateTicket, deleteTicket, parseTicketFormData } from '../../../lib/tickets';

// PUT /api/tickets/:id — aktualizuje ticket a přesměruje na seznam
// Volán přes fetch() z editačního formuláře — HTML formuláře PUT nepodporují
export const PUT: APIRoute = async ({ params, request, redirect }) => {
  const form = await request.formData();
  const updated = await updateTicket(params.id!, parseTicketFormData(form));

  if (!updated) {
    return new Response('Ticket nenalezen', { status: 404 });
  }

  return redirect('/tickets', 302);
};

// DELETE /api/tickets/:id — smaže ticket a vrátí prázdnou odpověď 204 No Content
// Volán přes fetch() — tlačítko Smazat nepoužívá HTML formulář
export const DELETE: APIRoute = async ({ params }) => {
  const deleted = await deleteTicket(params.id!);

  if (!deleted) {
    return new Response('Ticket nenalezen', { status: 404 });
  }

  // 204 = úspěch bez těla odpovědi (není co vracet po smazání)
  return new Response(null, { status: 204 });
};
```

---

## Krok 5 — AuthGuard komponenta

Přihlašovací kontrola (auth guard) se opakuje na každé chráněné stránce. Místo kopírování scriptu vytvoříme Astro komponentu.

### Vytvoř složku `src/components/` a v ní soubor `AuthGuard.astro`

```astro
---
// Komponenta bez HTML výstupu — jen přidá auth guard script na stránku.
// Použití: <AuthGuard /> kdekoli v <body> chráněné stránky.
---

<script>
  // Pokud uživatel není přihlášen, přesměruj na login
  if (!localStorage.getItem('auth')) {
    window.location.href = '/login';
  }
</script>
```

> Astro komponenta může obsahovat jen `<script>` bez jakéhokoli HTML. Script se automaticky vloží do stránky, která komponentu importuje.

---

## Krok 6 — Stránky

Vytvoř složku `src/pages/tickets/`.

### 6a. Vytvoř `src/pages/tickets/index.astro`

```astro
---
import { getTickets } from '../../lib/tickets';
import AuthGuard from '../../components/AuthGuard.astro';
import '../../styles/app.css';
import '@sg-styles/tokens.css';
import '@sg-styles/typography.css';
import '@sg-styles/components.css';

const tickets = await getTickets();
---

<html lang="cs">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tickety</title>
  </head>
  <body>
    <AuthGuard />

    <div class="container" style="padding-top: 4rem; padding-bottom: 4rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.4rem;">
        <h1 style="font-size: 2.4rem; margin: 0;">Tickety</h1>
        <a href="/tickets/new" class="btn btn-primary">+ Nový ticket</a>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Název</th>
              <th>Status</th>
              <th>Priorita</th>
              <th>Přiřazeno</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr>
                <td style="color: #9ca3af;">{ticket.id}</td>
                <td>{ticket.title}</td>
                <td><span class={`badge badge-${ticket.status}`}>{ticket.status}</span></td>
                <td><span class={`badge badge-${ticket.priority}`}>{ticket.priority}</span></td>
                <td>{ticket.assignee}</td>
                <td style="white-space: nowrap;">
                  <a href={`/tickets/${ticket.id}/edit`} style="margin-right: 1.2rem;">Upravit</a>
                  <button
                    class="btn"
                    style="background: #fee2e2; color: #b91c1c; padding: 0.4rem 1rem; font-size: 1.3rem;"
                    x-data
                    @click={`fetch('/api/tickets/${ticket.id}', { method: 'DELETE' }).then(() => window.location.reload())`}
                  >
                    Smazat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style="margin-top: 2rem;"><a href="/">← Zpět</a></p>
    </div>
  </body>
</html>
```

> Tlačítko Smazat nemá `<form>`. Alpine.js při kliknutí zavolá `fetch` s metodou DELETE. Po úspěchu `window.location.reload()` stránku znovu načte.

### 6b. Vytvoř `src/pages/tickets/new.astro`

```astro
---
import AuthGuard from '../../components/AuthGuard.astro';
import '../../styles/app.css';
import '@sg-styles/tokens.css';
import '@sg-styles/typography.css';
import '@sg-styles/components.css';
---

<html lang="cs">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nový ticket</title>
  </head>
  <body>
    <AuthGuard />

    <div class="container" style="padding-top: 4rem; padding-bottom: 4rem; max-width: 64rem;">
      <h1 style="font-size: 2.4rem; margin-bottom: 2.4rem;">Nový ticket</h1>

      <div class="card">
        <form action="/api/tickets" method="POST">
          <div class="form-group">
            <label for="title">Název</label>
            <input class="input" type="text" id="title" name="title" required />
          </div>

          <div class="form-group">
            <label for="description">Popis</label>
            <textarea class="input" id="description" name="description" rows="4" style="resize: vertical;"></textarea>
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select class="input" id="status" name="status">
              <option value="open">open</option>
              <option value="in-progress">in-progress</option>
              <option value="closed">closed</option>
            </select>
          </div>

          <div class="form-group">
            <label for="priority">Priorita</label>
            <select class="input" id="priority" name="priority">
              <option value="low">low</option>
              <option value="medium" selected>medium</option>
              <option value="high">high</option>
            </select>
          </div>

          <div class="form-group">
            <label for="assignee">Přiřazeno</label>
            <input class="input" type="text" id="assignee" name="assignee" value="admin" />
          </div>

          <div style="display: flex; gap: 1.2rem; margin-top: 2.4rem;">
            <button type="submit" class="btn btn-primary">Vytvořit</button>
            <a href="/tickets" class="btn" style="background: #e5e7eb; color: #374151;">Zrušit</a>
          </div>
        </form>
      </div>
    </div>
  </body>
</html>
```

> Formulář má `action="/api/tickets" method="POST"`. Prohlížeč odešle data na API route, která ticket uloží a přesměruje zpět na `/tickets`.

### 6c. Vytvoř složku `src/pages/tickets/[id]/` a v ní soubor `edit.astro`

```astro
---
import { getTicket } from '../../../lib/tickets';
import AuthGuard from '../../../components/AuthGuard.astro';
import '../../../styles/app.css';
import '@sg-styles/tokens.css';
import '@sg-styles/typography.css';
import '@sg-styles/components.css';

const { id } = Astro.params;        // id z URL: /tickets/123/edit → id = "123"
const ticket = await getTicket(id!);

if (!ticket) {
  return Astro.redirect('/tickets'); // ticket neexistuje → přesměruj
}
---

<html lang="cs">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Upravit ticket</title>
  </head>
  <body>
    <AuthGuard />

    <div class="container" style="padding-top: 4rem; padding-bottom: 4rem; max-width: 64rem;">
      <h1 style="font-size: 2.4rem; margin-bottom: 2.4rem;">Upravit ticket</h1>

      <div class="card">
        <form
          x-data
          @submit.prevent={`
            fetch('/api/tickets/${ticket.id}', {
              method: 'PUT',
              body: new FormData($el)
            }).then(() => window.location.href = '/tickets')
          `}
        >
          <div class="form-group">
            <label for="title">Název</label>
            <input class="input" type="text" id="title" name="title" value={ticket.title} required />
          </div>

          <div class="form-group">
            <label for="description">Popis</label>
            <textarea class="input" id="description" name="description" rows="4" style="resize: vertical;">{ticket.description}</textarea>
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select class="input" id="status" name="status">
              <option value="open"        selected={ticket.status === 'open'}>open</option>
              <option value="in-progress" selected={ticket.status === 'in-progress'}>in-progress</option>
              <option value="closed"      selected={ticket.status === 'closed'}>closed</option>
            </select>
          </div>

          <div class="form-group">
            <label for="priority">Priorita</label>
            <select class="input" id="priority" name="priority">
              <option value="low"    selected={ticket.priority === 'low'}>low</option>
              <option value="medium" selected={ticket.priority === 'medium'}>medium</option>
              <option value="high"   selected={ticket.priority === 'high'}>high</option>
            </select>
          </div>

          <div class="form-group">
            <label for="assignee">Přiřazeno</label>
            <input class="input" type="text" id="assignee" name="assignee" value={ticket.assignee} />
          </div>

          <div style="display: flex; gap: 1.2rem; margin-top: 2.4rem;">
            <button type="submit" class="btn btn-primary">Uložit</button>
            <a href="/tickets" class="btn" style="background: #e5e7eb; color: #374151;">Zrušit</a>
          </div>
        </form>
      </div>
    </div>
  </body>
</html>
```

> Formulář nemá `action` ani `method`. HTML formuláře neumí odeslat `PUT` — musíme použít JavaScript. `@submit.prevent` zachytí odeslání, `new FormData($el)` vezme data z formuláře a `fetch` je pošle metodou PUT.

---

## Krok 7 — Navigace

### Otevři `src/pages/index.astro`

Přidej import styleguide CSS a za `<h1>` odkaz na tickety:

```astro
---
import '../styles/app.css';
import '@sg-styles/tokens.css';
import '@sg-styles/typography.css';
import '@sg-styles/components.css';
---
```

```html
<div class="container">
  <h1>Vítej!</h1>
  <p><a href="/tickets" class="btn btn-primary">Správa ticketů</a></p>
  <button id="logout">Odhlásit se</button>
</div>
```

---

## Ověření

Spusť dev server a projdi celý flow:

```bash
docker compose up
```

1. Otevři `http://localhost:4322` a přihlas se (`admin` / `admin`)
2. Klikni na „Správa ticketů" — zobrazí se tabulka se 3 tickety
3. Klikni „+ Nový ticket" — vyplň formulář — Vytvořit — ticket se objeví v seznamu
4. Klikni „Upravit" — změň status — Uložit — změna se projeví
5. Klikni „Smazat" — ticket zmizí
6. Otevři `src/data/tickets.json` — soubor odpovídá aktuálnímu stavu

---

## Přehled klíčových konceptů

| Koncept | Kde |
|---------|-----|
| SSR (server-side rendering) | `output: 'server'` v `astro.config.mjs` |
| REST API | `src/pages/api/tickets/` — GET, POST, PUT, DELETE |
| FormData | `parseTicketFormData()` v `tickets.ts` — čtení dat z formuláře |
| Alpine.js + fetch | Smazání a editace bez nativního formuláře |
| Datová vrstva | `src/lib/tickets.ts` — čtení/zápis odděleno od UI |
| Astro komponenta | `AuthGuard.astro` — sdílená logika bez HTML výstupu |
| Sdílené CSS | `.badge`, `.table`, `.btn` ve styleguide, ne v aplikaci |
