export const prerender = false;
import type { APIRoute } from 'astro';
import { getZapasy, addZapas } from '../../../lib/db';
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getZapasy()), { headers: { 'Content-Type': 'application/json' } });
export const POST: APIRoute = async ({ request }) => {
  const z = await addZapas(await request.json());
  return new Response(JSON.stringify(z), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
