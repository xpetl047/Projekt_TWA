export const prerender = false;
import type { APIRoute } from 'astro';
import { getMereni, addMereni } from '../../../lib/db';
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getMereni()), { headers: { 'Content-Type': 'application/json' } });
export const POST: APIRoute = async ({ request }) => {
  const m = await addMereni(await request.json());
  return new Response(JSON.stringify(m), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
