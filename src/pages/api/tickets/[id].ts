import type { APIRoute } from 'astro';
import { updateTicket, deleteTicket, parseTicketFormData } from '../../../lib/tickets';

// PUT /api/tickets/:id
// Přijme data z formuláře, aktualizuje ticket a přesměruje na seznam.
// Volán přes fetch() z editačního formuláře — HTML formuláře PUT nepodporují.
export const PUT: APIRoute = async ({ params, request, redirect }) => {
  const form = await request.formData();
  const updated = await updateTicket(params.id!, parseTicketFormData(form));

  if (!updated) {
    // params.id neodpovídá žádnému ticketu
    return new Response('Ticket nenalezen', { status: 404 });
  }

  return redirect('/tickets', 302);
};

// DELETE /api/tickets/:id
// Smaže ticket a vrátí prázdnou odpověď 204 No Content.
// Volán přes fetch() — tlačítko Smazat nepoužívá HTML formulář.
export const DELETE: APIRoute = async ({ params }) => {
  const deleted = await deleteTicket(params.id!);

  if (!deleted) {
    return new Response('Ticket nenalezen', { status: 404 });
  }

  // 204 = úspěch bez těla odpovědi (není co vracet po smazání)
  return new Response(null, { status: 204 });
};
