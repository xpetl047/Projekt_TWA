import type { APIRoute } from 'astro';
import { getTickets, createTicket, parseTicketFormData } from '../../../lib/tickets';

// GET /api/tickets
// Vrátí všechny tickety jako JSON pole.
// Volají ho např. klienti, kteří chtějí data bez načtení celé stránky.
export const GET: APIRoute = async () => {
  const tickets = await getTickets();
  return Response.json(tickets); // Response.json() nastaví Content-Type: application/json
};

// POST /api/tickets
// Přijme data z HTML formuláře, vytvoří nový ticket a přesměruje uživatele na seznam.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData(); // přečte tělo requestu jako FormData
  await createTicket(parseTicketFormData(form));
  return redirect('/tickets', 302); // 302 = dočasné přesměrování
};
