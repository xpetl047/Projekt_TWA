import type { APIRoute } from 'astro';
import { getPlayers, createPlayer, parsePlayerFormData } from '../../../lib/players';

export const prerender = false;
// GET /api/players
// Vrátí všechny hráče jako JSON pole.
// Volají ho např. klienti, kteří chtějí data bez načtení celé stránky.
export const GET: APIRoute = async () => {
  const players = await getPlayers();
    return Response.json(players, {
    headers: { 'Cache-Control': 'no-store' },
  }); // Response.json() nastaví Content-Type: application/json
};

// POST /api/players
// Přijme data z HTML formuláře, vytvoří nový hráče a vrátí ho jako JSON.
export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData(); // přečte tělo requestu jako FormData
  const player = await createPlayer(parsePlayerFormData(form));
  return Response.json(player, {
    status: 201,
    headers: { 'Cache-Control': 'no-store' },
  });
};
