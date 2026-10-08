import { search } from './api';
import { registrarFalha } from './mensagens';
import { chaveDe, guardarCache, lerCache } from './search-cache';
import type { SearchQuery } from './types';

const aquecidas = new Set<string>();

let emVoo: AbortController | null = null;

export async function aquecer(query: SearchQuery): Promise<void> {
  const chave = chaveDe(query);

  if (aquecidas.has(chave) || lerCache(query)) {
    return;
  }

  aquecidas.add(chave);

  emVoo?.abort();

  const controller = new AbortController();

  emVoo = controller;

  try {
    const { response } = await search(query, controller.signal);

    if (!controller.signal.aborted) {
      guardarCache(query, response);
    }
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }

    aquecidas.delete(chave);
    registrarFalha('prefetch', error);
  }
}
