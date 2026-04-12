import fs from 'node:fs/promises'; // Node.js modul pro práci se soubory (čtení, zápis)
import path from 'node:path';      // Node.js modul pro sestavování cest k souborům

// Absolutní cesta k datovému souboru.
// process.cwd() vrátí kořenový adresář projektu (tam kde běží Node.js).
const DB_PATH = path.join(process.cwd(), 'src/data/tickets.json');

// --- Typy ---

// TypeScript union typy — proměnná smí obsahovat jen jednu z uvedených hodnot.
export type TicketStatus   = 'open' | 'in-progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

// Rozhraní popisuje tvar jednoho ticketu (jako "šablona" objektu).
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string;
  createdAt: string; // ISO datum, např. "2026-03-29T10:00:00Z"
}

// --- Interní pomocné funkce (neexportujeme — používají je jen funkce níže) ---

// Přečte soubor, převede JSON text na pole objektů a vrátí ho.
async function readAll(): Promise<Ticket[]> {
  const raw = await fs.readFile(DB_PATH, 'utf-8'); // přečte soubor jako text
  return JSON.parse(raw);                           // převede JSON string → JS pole
}

// Převede pole objektů na JSON text a zapíše ho do souboru.
async function writeAll(tickets: Ticket[]): Promise<void> {
  // JSON.stringify(data, null, 2) — třetí argument "2" znamená odsadit 2 mezerami
  await fs.writeFile(DB_PATH, JSON.stringify(tickets, null, 2));
}

// --- Pomocná funkce pro API routes ---

// Přečte data z HTML formuláře (FormData) a vrátí je jako objekt.
// Používají ji POST i PUT route — logika je na jednom místě.
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

// READ — vrátí všechny tickety.
export async function getTickets(): Promise<Ticket[]> {
  return readAll();
}

// READ — najde jeden ticket podle id. Vrátí undefined, pokud neexistuje.
export async function getTicket(id: string): Promise<Ticket | undefined> {
  const tickets = await readAll();
  return tickets.find(t => t.id === id); // Array.find vrátí první shodu, nebo undefined
}

// CREATE — přidá nový ticket, vygeneruje id a datum.
// Omit<Ticket, 'id' | 'createdAt'> = typ Ticket bez polí id a createdAt (ty doplníme sami).
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

// UPDATE — aktualizuje existující ticket. Vrátí undefined, pokud ticket nenajde.
export async function updateTicket(id: string, data: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket | undefined> {
  const tickets = await readAll();
  const index = tickets.findIndex(t => t.id === id); // findIndex vrátí pozici, nebo -1
  if (index === -1) return undefined;
  tickets[index] = { ...tickets[index], ...data };   // přepíše jen předaná pole, id a createdAt zůstanou
  await writeAll(tickets);
  return tickets[index];
}

// DELETE — odstraní ticket podle id. Vrátí true při úspěchu, false pokud ticket neexistoval.
export async function deleteTicket(id: string): Promise<boolean> {
  const tickets = await readAll();
  const filtered = tickets.filter(t => t.id !== id); // vytvoří nové pole bez smazaného ticketu
  if (filtered.length === tickets.length) return false; // délka stejná = nic se nesmazalo
  await writeAll(filtered);
  return true;
}
