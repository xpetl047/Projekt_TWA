import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

// Inicializační demo data
const DEMO_PLAYERS = [
  {
    "id": "1",
    "name": "John Doe",
    "description": "Zkušený hráč s vysokým výkonem.",
    "status": "active",
    "role": "C",
    "assignee": "admin",
    "createdAt": "2026-03-20T09:00:00Z"
  },
  {
    "id": "2",
    "name": "Jane Smith",
    "description": "Nový hráč s potenciálem.",
    "status": "active",
    "role": "LW",
    "assignee": "admin",
    "createdAt": "2026-03-22T14:30:00Z"
  },
  {
    "id": "3",
    "name": "Bob Johnson",
    "description": "Zkušený obránce s vysokým výkonem.",
    "status": "active",
    "role": "D",
    "assignee": "dev-team",
    "createdAt": "2026-03-15T10:00:00Z"
  }
];

// POST /api/init-data
// Nahraje demo data do Netlify Blobs.
// ⚠️ Používejte pouze jednou po prvním deployi!
export const POST: APIRoute = async () => {
  const store = getStore('players');
  
  // Zkontrolovat, jestli už data existují
  const existing = await store.get('all', { type: 'text' });
  
  if (existing) {
    return Response.json({
      success: false,
      message: 'Data již existují. Pro reset smažte store přes Netlify Dashboard.'
    }, { status: 400 });
  }
  
  // Uložit demo data
  await store.set('all', JSON.stringify(DEMO_PLAYERS, null, 2));
  
  return Response.json({
    success: true,
    message: `Nahráno ${DEMO_PLAYERS.length} demo hráčů.`,
    count: DEMO_PLAYERS.length
  });
};

// GET /api/init-data
// Vrátí info o stavu inicializace
export const GET: APIRoute = async () => {
  const store = getStore('players');
  const existing = await store.get('all', { type: 'text' });
  
  return Response.json({
    initialized: !!existing,
    count: existing ? JSON.parse(existing).length : 0
  });
};