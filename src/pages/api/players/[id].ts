import type { APIRoute } from 'astro';
import { updatePlayer, deletePlayer, parsePlayerFormData } from '../../../lib/players';


// PUT /api/players/:id
// Přijme data z formuláře, aktualizuje hráče a přesměruje na seznam.
// Volán přes fetch() z editačního formuláře — HTML formuláře PUT nepodporují.
export const PUT: APIRoute = async ({ params, request, redirect }) => {
  const form = await request.formData();
  const updated = await updatePlayer(params.id!, parsePlayerFormData(form));

  if (!updated) {
    // params.id neodpovídá žádnému hráči
    return new Response('Hráč nenalezen', { status: 404 });
  }

  return redirect('/players', 302);
};

// DELETE /api/players/:id
// Smaže hráče a vrátí prázdnou odpověď 204 No Content.
// Volán přes fetch() — tlačítko Smazat nepoužívá HTML formulář.
export const DELETE: APIRoute = async ({ params }) => {
  const deleted = await deletePlayer(params.id!);

  if (!deleted) {
    return new Response('Hráč nenalezen', { status: 404 });
  }

  // 204 = úspěch bez těla odpovědi (není co vracet po smazání)
  return new Response(null, { status: 204 });
};
