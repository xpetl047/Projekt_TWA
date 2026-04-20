export const prerender = false;
import type { APIRoute } from 'astro';
import { getHrac, updateHrac, deleteHrac } from '../../../lib/db';
export const GET: APIRoute = async ({ params }) => {
  const h = await getHrac(params.id!);
  if (!h) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(h), { headers: { 'Content-Type': 'application/json' } });
};
export const PUT: APIRoute = async ({ params, request }) => {
  const h = await updateHrac(params.id!, await request.json());
  if (!h) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(h), { headers: { 'Content-Type': 'application/json' } });
};
export const DELETE: APIRoute = async ({ params }) => {
  const ok = await deleteHrac(params.id!);
  return ok ? new Response(null, { status: 204 }) : new Response('Not found', { status: 404 });
};
