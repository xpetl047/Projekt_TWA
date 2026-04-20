import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';
import hraciData from '../../data/hraci.json';
import treneriData from '../../data/treneri.json';
import mereniData from '../../data/mereni.json';
import testyData from '../../data/testy.json';
import hodnoceniData from '../../data/hodnoceni.json';
import zapasyData from '../../data/zapasy.json';
import dochazkaData from '../../data/dochazka.json';

export const prerender = false;

// POST /api/init-data
// Nahraje demo data do Netlify Blobs.
// Bezpečné volat opakovaně — přepíše prázdné/chybějící záznamy.
export const POST: APIRoute = async () => {
  const store = getStore('hockeydb');

  const datasets: Record<string, unknown> = {
    hraci: hraciData,
    treneri: treneriData,
    mereni: mereniData,
    testy: testyData,
    hodnoceni: hodnoceniData,
    zapasy: zapasyData,
    dochazka: dochazkaData,
  };

  const results: Record<string, string> = {};

  for (const [key, data] of Object.entries(datasets)) {
    const existing = await store.get(key);
    let existingParsed: unknown[] = [];
    try { existingParsed = existing ? JSON.parse(existing) : []; } catch {}
    if (!existing || existingParsed.length === 0) {
      await store.set(key, JSON.stringify(data), { metadata: { updated: new Date().toISOString() } });
      results[key] = `nahráno ${(data as unknown[]).length} záznamů`;
    } else {
      results[key] = `přeskočeno (${existingParsed.length} záznamů již existuje)`;
    }
  }

  return Response.json({ success: true, results });
};

// GET /api/init-data
// Vrátí info o stavu inicializace
export const GET: APIRoute = async () => {
  const store = getStore('hockeydb');
  const status: Record<string, number> = {};
  for (const key of ['hraci', 'treneri', 'mereni', 'testy', 'hodnoceni', 'zapasy', 'dochazka']) {
    const raw = await store.get(key);
    try { status[key] = raw ? JSON.parse(raw).length : 0; } catch { status[key] = 0; }
  }
  return Response.json({ status });
};
