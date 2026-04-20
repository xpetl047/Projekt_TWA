export const prerender = false;
import type { APIRoute } from 'astro';
import { authTrener } from '../../../lib/db';
export const POST: APIRoute = async ({ request }) => {
  const { email, password } = await request.json();
  const t = await authTrener(email, password);
  if (!t) return new Response('Unauthorized', { status: 401 });
  const { password_hash: _, ...safe } = t;
  return new Response(JSON.stringify(safe), { headers: { 'Content-Type': 'application/json' } });
};
