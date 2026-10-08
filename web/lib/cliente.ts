import { useSyncExternalStore } from 'react';

const CHAVE = 'speedmilhas:agencia';
const EVENTO = 'speedmilhas:agencia';

export interface Agencia {
  id: string;
  name: string;
}

export function agenciaAtual(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function trocarAgencia(id: string): void {
  try {
    window.localStorage.setItem(CHAVE, id);
  } catch {
    return;
  }

  window.dispatchEvent(new Event(EVENTO));
}

function assinar(aviso: () => void): () => void {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener('storage', aviso);

  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener('storage', aviso);
  };
}

export function useAgencia(): string | null {
  return useSyncExternalStore(assinar, agenciaAtual, () => null);
}
