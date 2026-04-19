import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

// Inicializační demo data
const DEMO_TICKETS = [
  {
    "id": "1",
    "title": "Opravit přihlašování na Safari",
    "description": "Tlačítko Přihlásit se nereaguje v Safari 17. Pravděpodobně problém s Alpine.js a localStorage.",
    "status": "open",
    "priority": "medium",
    "assignee": "admin",
    "createdAt": "2026-03-20T09:00:00Z"
  },
  {
    "id": "2",
    "title": "Přidat filtrování ticketů",
    "description": "Uživatelé chtějí filtrovat tickety podle stavu a priority.",
    "status": "in-progress",
    "priority": "medium",
    "assignee": "admin",
    "createdAt": "2026-03-22T14:30:00Z"
  },
  {
    "id": "3",
    "title": "Upgrade na Astro 6",
    "description": "Stávající verze Astro 5 dostává security update. Upgrade na v6.",
    "status": "closed",
    "priority": "high",
    "assignee": "dev-team",
    "createdAt": "2026-03-15T10:00:00Z"
  }
];

// POST /api/init-data
// Nahraje demo data do Netlify Blobs.
// ⚠️ Používejte pouze jednou po prvním deployi!
export const POST: APIRoute = async () => {
  const store = getStore('tickets');
  
  // Zkontrolovat, jestli už data existují
  const existing = await store.get('all', { type: 'text' });
  
  if (existing) {
    return Response.json({
      success: false,
      message: 'Data již existují. Pro reset smažte store přes Netlify Dashboard.'
    }, { status: 400 });
  }
  
  // Uložit demo data
  await store.set('all', JSON.stringify(DEMO_TICKETS, null, 2));
  
  return Response.json({
    success: true,
    message: `Nahráno ${DEMO_TICKETS.length} demo ticketů.`,
    count: DEMO_TICKETS.length
  });
};

// GET /api/init-data
// Vrátí info o stavu inicializace
export const GET: APIRoute = async () => {
  const store = getStore('tickets');
  const existing = await store.get('all', { type: 'text' });
  
  return Response.json({
    initialized: !!existing,
    count: existing ? JSON.parse(existing).length : 0
  });
};