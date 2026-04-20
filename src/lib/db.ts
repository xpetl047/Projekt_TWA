// src/lib/db.ts — datová vrstva, Netlify Blobs + JSON fallback
import { getStore } from '@netlify/blobs';

export type Kategorie = 'U8-U10'|'U11-U12'|'U13-U14'|'U15-U16'|'U17-U20';
export type Pozice = 'Útočník'|'Obránce'|'Brankář';

export interface Hrac {
  id: string; jmeno: string; prijmeni: string; narozeni: string;
  kategorie: Kategorie; pozice: Pozice; cislo: number; ruka: string;
  rodic_kontakt?: string; aktivni: boolean; vytvoreno: string;
}
export interface MereniTela {
  id: string; hrac_id: string; datum: string;
  vyska_cm: number; vaha_kg: number; poznamka?: string; trener: string;
}
export interface FyzickyTest {
  id: string; hrac_id: string; datum: string; trener: string;
  sprint_30m?: number; sprint_10m?: number; skok_dalka?: number;
  skok_vyska?: number; kliky?: number; drepy?: number; beep_test?: number;
  brusle_sprint?: number; brusle_obratky?: number; brusle_zpetne?: number;
  poznamka?: string;
}
export interface DochazkaZaznam {
  id: string; datum: string; typ: string; popis?: string;
  kategorie: Kategorie; trener: string; vytvoreno: string;
  zaznam: { hrac_id: string; stav: string; poznamka?: string }[];
}
export interface HodnoceniTrenera {
  id: string; hrac_id: string; datum: string; trener: string;
  technika: number; brusleni: number; hra_bez_puku: number;
  postoj: number; tymy_prace: number; celkove: number;
  silne_stranky: string; oblasti_zlepseni: string; cile: string; poznamka?: string;
}
export interface ZapasStat {
  id: string; zapas_id: string; hrac_id: string;
  goly: number; asistence: number; plusMinus: number; trestne: number; poznamka?: string;
}
export interface Zapas {
  id: string; datum: string; souper: string; skore_my: number; skore_souper: number;
  kategorie: Kategorie; domaci: boolean; trener: string; poznamka?: string; stats: ZapasStat[];
}
export interface Trener {
  id: string; jmeno: string; prijmeni: string; email: string;
  password_hash: string; kategorie: Kategorie[]; role: string;
}

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

async function read<T>(key: string, fallback: () => Promise<{default: T}>): Promise<T> {
  try {
    const store = getStore('hockeydb');
    const raw = await store.get(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      // Pokud jsou data prázdné pole a fallback má data, použij fallback
      if (Array.isArray(parsed) && parsed.length === 0) {
        const { default: data } = await fallback();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return parsed;
    }
  } catch {}
  const { default: data } = await fallback();
  return data;
}

async function write<T>(key: string, data: T): Promise<void> {
  try {
    const store = getStore('hockeydb');
    await store.set(key, JSON.stringify(data), { metadata: { updated: new Date().toISOString() } });
  } catch { console.warn(`[db] Nelze zapsat '${key}' — lokální vývoj`); }
}

// ── Hráči ──────────────────────────────────────────────
export const getHraci = () => read<Hrac[]>('hraci', () => import('../data/hraci.json'));
export const getHrac  = async (id: string) => (await getHraci()).find(h => h.id === id) ?? null;
export async function createHrac(data: Omit<Hrac,'id'|'vytvoreno'>): Promise<Hrac> {
  const hraci = await getHraci();
  const h: Hrac = { ...data, id: newId(), vytvoreno: new Date().toISOString() };
  hraci.push(h); await write('hraci', hraci); return h;
}
export async function updateHrac(id: string, data: Partial<Hrac>): Promise<Hrac|null> {
  const hraci = await getHraci();
  const i = hraci.findIndex(h => h.id === id);
  if (i === -1) return null;
  hraci[i] = { ...hraci[i], ...data }; await write('hraci', hraci); return hraci[i];
}
export async function deleteHrac(id: string): Promise<boolean> {
  const hraci = await getHraci();
  const f = hraci.filter(h => h.id !== id);
  if (f.length === hraci.length) return false;
  await write('hraci', f); return true;
}

// ── Měření ─────────────────────────────────────────────
export const getMereni = () => read<MereniTela[]>('mereni', () => import('../data/mereni.json'));
export const getMereniHrace = async (id: string) =>
  (await getMereni()).filter(m => m.hrac_id === id).sort((a,b) => a.datum.localeCompare(b.datum));
export async function addMereni(data: Omit<MereniTela,'id'>): Promise<MereniTela> {
  const all = await getMereni();
  const m: MereniTela = { ...data, id: newId() };
  all.push(m); await write('mereni', all); return m;
}

// ── Testy ──────────────────────────────────────────────
export const getTesty = () => read<FyzickyTest[]>('testy', () => import('../data/testy.json'));
export const getTestyHrace = async (id: string) =>
  (await getTesty()).filter(t => t.hrac_id === id).sort((a,b) => a.datum.localeCompare(b.datum));
export async function addTest(data: Omit<FyzickyTest,'id'>): Promise<FyzickyTest> {
  const all = await getTesty();
  const t: FyzickyTest = { ...data, id: newId() };
  all.push(t); await write('testy', all); return t;
}

// ── Docházka ───────────────────────────────────────────
export const getDochazka = () => read<DochazkaZaznam[]>('dochazka', () => import('../data/dochazka.json'));
export async function addDochazka(data: Omit<DochazkaZaznam,'id'|'vytvoreno'>): Promise<DochazkaZaznam> {
  const all = await getDochazka();
  const d: DochazkaZaznam = { ...data, id: newId(), vytvoreno: new Date().toISOString() };
  all.push(d); await write('dochazka', all); return d;
}
export async function getDochazkaHrace(hracId: string) {
  const all = await getDochazka();
  return all.flatMap(d => {
    const z = d.zaznam.find(z => z.hrac_id === hracId);
    return z ? [{ zaznam: d, stav: z.stav, poznamka: z.poznamka }] : [];
  }).sort((a,b) => b.zaznam.datum.localeCompare(a.zaznam.datum));
}

// ── Hodnocení ──────────────────────────────────────────
export const getHodnoceni = () => read<HodnoceniTrenera[]>('hodnoceni', () => import('../data/hodnoceni.json'));
export const getHodnoceniHrace = async (id: string) =>
  (await getHodnoceni()).filter(h => h.hrac_id === id).sort((a,b) => b.datum.localeCompare(a.datum));
export async function addHodnoceni(data: Omit<HodnoceniTrenera,'id'>): Promise<HodnoceniTrenera> {
  const all = await getHodnoceni();
  const h: HodnoceniTrenera = { ...data, id: newId() };
  all.push(h); await write('hodnoceni', all); return h;
}

// ── Zápasy ─────────────────────────────────────────────
export const getZapasy = () => read<Zapas[]>('zapasy', () => import('../data/zapasy.json'));
export async function addZapas(data: Omit<Zapas,'id'>): Promise<Zapas> {
  const all = await getZapasy();
  const z: Zapas = { ...data, id: newId() };
  all.push(z); await write('zapasy', all); return z;
}
export async function getStatHrace(hracId: string) {
  const all = await getZapasy();
  return all.flatMap(z => {
    const s = z.stats.find(s => s.hrac_id === hracId);
    return s ? [{ zapas: z, stat: s }] : [];
  }).sort((a,b) => b.zapas.datum.localeCompare(a.zapas.datum));
}

// ── Trenéři ────────────────────────────────────────────
export const getTreneri = () => read<Trener[]>('treneri', () => import('../data/treneri.json'));
export async function authTrener(email: string, password: string): Promise<Trener|null> {
  const treneri = await getTreneri();
  return treneri.find(t => t.email === email && t.password_hash === password) ?? null;
}
