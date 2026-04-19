import type { APIRoute } from 'astro';
import { getPlayers, createPlayer, parsePlayerFormData } from '../../../lib/players';

// GET /api/players
// Vrátí všechny hráče jako JSON pole.
// Volají ho např. klienti, kteří chtějí data bez načtení celé stránky.
export const GET: APIRoute = async () => {
  const players = await getPlayers();
  return Response.json(players); // Response.json() nastaví Content-Type: application/json
};

// POST /api/players
// Přijme data z HTML formuláře, vytvoří nového hráče a přesměruje uživatele na seznam.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData(); // přečte tělo requestu jako FormData
  await createPlayer(parsePlayerFormData(form));
  return redirect('/players', 302); // 302 = dočasné přesměrování
};
