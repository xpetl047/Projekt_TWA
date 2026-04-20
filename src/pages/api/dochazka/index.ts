export const prerender = false;
import type { APIRoute } from 'astro';
import { getDochazka, addDochazka } from '../../../lib/db';
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getDochazka()), { headers: { 'Content-Type': 'application/json' } });
export const POST: APIRoute = async ({ request }) => {
  const d = await addDochazka(await request.json());
  return new Response(JSON.stringify(d), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
