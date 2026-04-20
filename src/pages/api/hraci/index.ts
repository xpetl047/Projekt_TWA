export const prerender = false;
import type { APIRoute } from 'astro';
import { getHraci, createHrac } from '../../../lib/db';
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getHraci()), { headers: { 'Content-Type': 'application/json' } });
export const POST: APIRoute = async ({ request }) => {
  const h = await createHrac(await request.json());
  return new Response(JSON.stringify(h), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
