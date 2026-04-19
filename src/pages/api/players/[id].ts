import type { APIRoute } from 'astro';
import { getPlayer, updatePlayer, deletePlayer, parsePlayerFormData } from '../../../lib/players';

export const prerender = false;

// GET /api/players/:id
// Vrátí jednoho hráče podle ID jako JSON.
export const GET: APIRoute = async ({ params }) => {
  const player = await getPlayer(params.id!);

  if (!player) {
    return new Response('Hráč nenalezen', { status: 404 });
  }

  return Response.json(player, {
    headers: { 'Cache-Control': 'no-store' },
  });
};

// PUT /api/players/:id
// Přijme data z formuláře, aktualizuje ticket a vrátí ho jako JSON.
// Volán přes fetch() z editačního formuláře — HTML formuláře PUT nepodporují.
export const PUT: APIRoute = async ({ params, request}) => {
  const form = await request.formData();
  const updated = await updatePlayer(params.id!, parsePlayerFormData(form));

  if (!updated) {
    // params.id neodpovídá žádnému hráči
    return new Response('Hráč nenalezen', { status: 404 });
  }

   return Response.json(updated, {
    headers: { 'Cache-Control': 'no-store' },
  });
};

// DELETE /api/players/:id
// Smaže hráče a vrátí prázdnou odpověď 204 No Content.
// Volán přes fetch() — tlačítko Smazat nepoužívá HTML formulář.
export const DELETE: APIRoute = async ({ params }) => {
  const deleted = await deletePlayer(params.id!);

  if (!deleted) {
    return new Response(null, { 
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
  }

  // 204 = úspěch bez těla odpovědi (není co vracet po smazání)
  return new Response(null, { status: 204 });
};
