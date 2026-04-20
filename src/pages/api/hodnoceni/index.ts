export const prerender = false;
import type { APIRoute } from 'astro';
import { getHodnoceni, addHodnoceni } from '../../../lib/db';
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getHodnoceni()), { headers: { 'Content-Type': 'application/json' } });
export const POST: APIRoute = async ({ request }) => {
  const h = await addHodnoceni(await request.json());
  return new Response(JSON.stringify(h), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
