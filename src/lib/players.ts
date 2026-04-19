import fs from 'node:fs/promises'; // Node.js modul pro práci se soubory (čtení, zápis)
import path from 'node:path';      // Node.js modul pro sestavování cest k souborům
import { TicketStatus } from './tickets';

// Absolutní cesta k datovému souboru.
// process.cwd() vrátí kořenový adresář projektu (tam kde běží Node.js).
const DB_PATH = path.join(process.cwd(), 'src/data/players.json');

// --- Typy ---

// TypeScript union typy — proměnná smí obsahovat jen jednu z uvedených hodnot.
export type PlayerStatus   = 'active' | 'inactive';
export type PlayerRole = 'C' | 'LW' | 'RW' | 'D' | 'G';

// Rozhraní popisuje tvar jednoho hráče (jako "šablona" objektu).
export interface Player {
  id: string;
  name: string;
  description: string;
  status: PlayerStatus;
  role: PlayerRole;
  assignee: string;
  createdAt: string; // ISO datum, např. "2026-03-29T10:00:00Z"
}

// --- Interní pomocné funkce (neexportujeme — používají je jen funkce níže) ---

// Přečte soubor, převede JSON text na pole objektů a vrátí ho.
async function readAll(): Promise<Player[]> {
  const raw = await fs.readFile(DB_PATH, 'utf-8'); // přečte soubor jako text
  return JSON.parse(raw);                           // převede JSON string → JS pole
}

// Převede pole objektů na JSON text a zapíše ho do souboru.
async function writeAll(players: Player[]): Promise<void> {
  // JSON.stringify(data, null, 2) — třetí argument "2" znamená odsadit 2 mezerami
  await fs.writeFile(DB_PATH, JSON.stringify(players, null, 2));
}

// --- Pomocná funkce pro API routes ---

// Přečte data z HTML formuláře (FormData) a vrátí je jako objekt.
// Používají ji POST i PUT route — logika je na jednom místě.
export function parsePlayerFormData(form: FormData): Omit<Player, 'id' | 'createdAt'> {
  return {
    name:       String(form.get('name') ?? ''),
    description: String(form.get('description') ?? ''),
    status:      (form.get('status')   as PlayerStatus)   ?? 'active',
    role:         (form.get('role')    as PlayerRole)    ?? 'C',
    assignee:     String(form.get('assignee') ?? ''),
  };
}

// --- Veřejné CRUD funkce ---

// READ — vrátí všechny hráče.
export async function getPlayers(): Promise<Player[]> {
  return readAll();
}

// READ — najde jeden hráče podle id. Vrátí undefined, pokud neexistuje.
export async function getPlayer(id: string): Promise<Player | undefined> {
  const players = await readAll();
  return players.find(p => p.id === id); // Array.find vrátí první shodu, nebo undefined
}

// CREATE — přidá nový hráč, vygeneruje id a datum.
// Omit<Player, 'id' | 'createdAt'> = typ Player bez polí id a createdAt (ty doplníme sami).
export async function createPlayer(data: Omit<Player, 'id' | 'createdAt'>): Promise<Player> {
  const players = await readAll();
  const player: Player = {
    ...data,                             // rozbalí všechna předaná pole
    id: Date.now().toString(),           // timestamp v ms jako unikátní id
    createdAt: new Date().toISOString(), // aktuální čas v ISO formátu
  };
  players.push(player);
  await writeAll(players);
  return player;
}

// UPDATE — aktualizuje existující hráče. Vrátí undefined, pokud hráč nenajde.
export async function updatePlayer(id: string, data: Omit<Player, 'id' | 'createdAt'>): Promise<Player | undefined> {
  const players = await readAll();
  const index = players.findIndex(p => p.id === id); // findIndex vrátí pozici, nebo -1
  if (index === -1) return undefined;
  players[index] = { ...players[index], ...data };   // přepíše jen předaná pole, id a createdAt zůstanou
  await writeAll(players);
  return players[index];
}

// DELETE — odstraní hráče podle id. Vrátí true při úspěchu, false pokud hráč neexistoval.
export async function deletePlayer(id: string): Promise<boolean> {
  const players = await readAll();
  const filtered = players.filter(p => p.id !== id); // vytvoří nové pole bez smazaného hráče
  if (filtered.length === players.length) return false; // délka stejná = nic se nesmazalo
  await writeAll(filtered);
  return true;
}
