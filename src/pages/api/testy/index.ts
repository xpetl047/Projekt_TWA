export const prerender = false;
import type { APIRoute } from 'astro';
import { getTesty, addTest } from '../../../lib/db';
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getTesty()), { headers: { 'Content-Type': 'application/json' } });
export const POST: APIRoute = async ({ request }) => {
  const t = await addTest(await request.json());
  return new Response(JSON.stringify(t), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
