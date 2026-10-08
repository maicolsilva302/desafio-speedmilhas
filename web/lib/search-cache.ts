import type { SearchQuery, SearchResponse } from './types';

const TTL_MS = 60_000;

const MAX_ENTRADAS = 20;

interface Entrada {
  result: SearchResponse;
  at: number;
}

const entradas = new Map<string, Entrada>();

export function chaveDe(query: SearchQuery): string {
  return `${query.origin}|${query.destination}|${query.date}`;
}

export function lerCache(query: SearchQuery): SearchResponse | null {
  const entrada = entradas.get(chaveDe(query));

  if (!entrada) {
    return null;
  }

  if (Date.now() - entrada.at > TTL_MS) {
    entradas.delete(chaveDe(query));

    return null;
  }

  return entrada.result;
}

export function guardarCache(query: SearchQuery, result: SearchResponse): void {
  const chave = chaveDe(query);

  if (result.quotes.length === 0) {
    entradas.delete(chave);

    return;
  }

  entradas.delete(chave);
  entradas.set(chave, { result, at: Date.now() });

  if (entradas.size > MAX_ENTRADAS) {
    const maisAntiga = entradas.keys().next().value;

    if (maisAntiga !== undefined) {
      entradas.delete(maisAntiga);
    }
  }
}

export function segundosAteExpirar(result: SearchResponse): number {
  const prazos = result.quotes.map((quote) => new Date(quote.expiresAt).getTime());

  if (prazos.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, Math.round((Math.min(...prazos) - Date.now()) / 1000));
}
